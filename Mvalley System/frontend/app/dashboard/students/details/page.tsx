'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { coursesService, studentsService, Student, type StudentEnrollment, notificationsService, type NotificationChannel } from '@/lib/services';
import { financeService, Payment } from '@/lib/services';
import api from '@/lib/api';
import StandardDetailView, { Tab, ActionButton, Breadcrumb } from '@/components/StandardDetailView';
import StatusBadge from '@/components/settings/StatusBadge';
import { Column } from '@/components/DataTable';
import DataTable from '@/components/DataTable';
import { FiEdit, FiTrash2, FiMail, FiPhone, FiUser, FiBookOpen, FiDollarSign, FiCalendar } from 'react-icons/fi';

interface Session {
  id: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: string;
  class?: any;
  attendances?: any[];
}

export default function StudentDetailPage() {
  const toErrorString = (err: any, fallback: string) => {
    const msg = err?.response?.data?.message ?? err?.message ?? err;
    if (typeof msg === 'string') return msg;
    if (Array.isArray(msg)) return msg.filter(Boolean).join(', ') || fallback;
    if (msg && typeof msg === 'object') {
      const nested = (msg as any).message;
      if (typeof nested === 'string') return nested;
      if (Array.isArray(nested)) return nested.filter(Boolean).join(', ') || fallback;
      try {
        return JSON.stringify(msg);
      } catch {
        return fallback;
      }
    }
    return fallback;
  };
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [student, setStudent] = useState<Student | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
  const [levels, setLevels] = useState<any[]>([]);
  const [newLevelId, setNewLevelId] = useState('');
  const [addingEnrollment, setAddingEnrollment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageChannel, setMessageChannel] = useState<NotificationChannel>('sms');
  const [messageRecipient, setMessageRecipient] = useState('');
  const [messageSubject, setMessageSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageError, setMessageError] = useState('');

  useEffect(() => {
    if (id) {
      fetchStudent(id);
      fetchPayments(id);
      fetchSessions(id);
      fetchEnrollments(id);
      fetchLevels();
    } else {
      setError('Missing student id');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchStudent = async (studentId: string) => {
    try {
      const response = await studentsService.getById(studentId);
      setStudent(response.data);
      setError('');
    } catch (err: any) {
      setError(toErrorString(err, 'Failed to load student'));
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async (studentId: string) => {
    try {
      const response = await financeService.getPayments({ studentId });
      const rows = (response.data || []).filter((p: any) => String(p?.studentId || '') === String(studentId));
      setPayments(rows);
    } catch (err: any) {
      // Failed to load payments
    }
  };

  const formatDateCairo = (value: any) => {
    if (!value) return '-';
    try {
      return new Date(value).toLocaleDateString('en-GB', { timeZone: 'Africa/Cairo' });
    } catch {
      return '-';
    }
  };

  const fetchSessions = async (studentId: string) => {
    try {
      // Assuming there's an endpoint to get sessions for a student
      const response = await api.get(`/students/${studentId}/sessions`);
      setSessions(response.data);
    } catch (err: any) {
      console.error('Failed to load sessions', err);
    }
  };

  const fetchLevels = async () => {
    try {
      const res = await coursesService.listLevels();
      setLevels(res.data || []);
    } catch {
      setLevels([]);
    }
  };

  const fetchEnrollments = async (studentId: string) => {
    try {
      const res = await studentsService.listEnrollments(studentId);
      setEnrollments(res.data || []);
    } catch {
      setEnrollments([]);
    }
  };

  const handleDelete = async () => {
    if (!student || !confirm('Are you sure you want to delete this student?')) return;
    try {
      await studentsService.delete(student.id);
      router.push('/dashboard/students');
    } catch (err: any) {
      setError(toErrorString(err, 'Failed to delete student'));
    }
  };

  // Session columns (memoized - MUST be before early returns to avoid React error #310)
  const sessionColumns: Column<Session>[] = useMemo(() => {
    if (!student) return [];
    return [
      {
        key: 'date',
        label: 'Date',
        render: (_, row) => (
          <span className="text-sm text-gray-900">
            {new Date(row.scheduledDate).toLocaleDateString()}
          </span>
        ),
      },
      {
        key: 'class',
        label: 'Class',
        render: (_, row) => (
          <span className="text-sm text-gray-900">{row.class?.name || '-'}</span>
        ),
      },
      {
        key: 'time',
        label: 'Time',
        render: (_, row) => (
          <span className="text-sm text-gray-500">
            {new Date(row.startTime).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}{' '}
            -{' '}
            {new Date(row.endTime).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        ),
      },
      {
        key: 'attendance',
        label: 'Attendance',
        render: (_, row) => {
          const attendance = row.attendances?.find((a: any) => a.studentId === student?.id);
          return (
            <span className="text-sm text-gray-500">
              {attendance?.attended ? (
                <span className="text-green-600">Present</span>
              ) : (
                <span className="text-red-600">Absent</span>
              )}
            </span>
          );
        },
      },
      {
        key: 'status',
        label: 'Status',
        render: (value) => {
          const statusMap: { [key: string]: 'active' | 'inactive' | 'warning' } = {
            completed: 'active',
            scheduled: 'warning',
            cancelled: 'inactive',
          };
          return <StatusBadge status={statusMap[value] || 'inactive'} label={value} />;
        },
      },
    ];
  }, [student]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading student details...</div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error || 'Student not found'}
        </div>
        <button
          onClick={() => router.push('/dashboard/students')}
          className="text-indigo-600 hover:text-indigo-900"
        >
          ← Back to Students
        </button>
      </div>
    );
  }

  // Breadcrumbs
  const breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard', href: '/dashboard/management' },
    { label: 'Students', href: '/dashboard/students' },
    { label: `${student.firstName} ${student.lastName}`, href: `/dashboard/students/details?id=${id}` },
  ];

  // Action buttons
  const actions: ActionButton[] = [
    {
      label: 'Edit',
      onClick: () => {
        // Open edit modal on Students list
        router.push(`/dashboard/students?editId=${id}`);
      },
      icon: <FiEdit className="w-4 h-4" />,
    },
    {
      label: 'Delete',
      onClick: handleDelete,
      variant: 'danger',
      icon: <FiTrash2 className="w-4 h-4" />,
    },
  ];

  // Payment columns
  const paymentColumns: Column<Payment>[] = [
    {
      key: 'amount',
      label: 'Amount',
      align: 'right',
      render: (value) => (
        <span className="text-sm font-medium text-gray-900">
          EGP {value.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'method',
      label: 'Method',
      render: (value) => <span className="text-sm text-gray-500 capitalize">{String(value || '-')}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => {
        const statusMap: { [key: string]: 'active' | 'inactive' | 'warning' } = {
          received: 'active',
          sent: 'active',
          pending: 'warning',
          overdue: 'inactive',
          reversed: 'inactive',
          failed: 'inactive',
        };
        return <StatusBadge status={statusMap[value] || 'inactive'} label={value} />;
      },
    },
    {
      key: 'receivedDate',
      label: 'Received Date',
      render: (value) => (
        <span className="text-sm text-gray-500">
          {formatDateCairo(value)}
        </span>
      ),
    },
  ];

  // Tabs
  const tabs: Tab[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <FiUser className="w-4 h-4" />,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Age</h3>
              <p className="text-lg text-gray-900">{student.age}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Courses</h3>
              <p className="text-lg text-gray-900">
                {(student.enrollments || []).length}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
              <div className="mt-1">
                <StatusBadge
                  status={
                    student.status === 'active'
                      ? 'active'
                      : student.status === 'paused'
                      ? 'warning'
                      : 'inactive'
                  }
                  label={student.status}
                />
              </div>
            </div>
            {student.email && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                  <FiMail className="w-4 h-4" />
                  Email
                </h3>
                <p className="text-lg text-gray-900">{student.email}</p>
              </div>
            )}
            {student.phone && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                  <FiPhone className="w-4 h-4" />
                  Phone
                </h3>
                <p className="text-lg text-gray-900">{student.phone}</p>
              </div>
            )}
            {student.class && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                  <FiBookOpen className="w-4 h-4" />
                  Course
                </h3>
                <a
                  href={`/dashboard/courses/details?id=${student.classId}`}
                  className="text-lg text-indigo-600 hover:text-indigo-900"
                  onClick={(e) => {
                    e.preventDefault();
                    router.push(`/dashboard/courses/details?id=${student.classId}`);
                  }}
                >
                  {student.class.name}
                </a>
              </div>
            )}
            {student.parent && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Parent</h3>
                <p className="text-lg text-gray-900">
                  {student.parent.firstName} {student.parent.lastName}
                </p>
                <div className="mt-1 text-sm text-gray-600">
                  {student.parent.phone ? <div>Phone: {student.parent.phone}</div> : null}
                  {student.parent.email ? <div>Email: {student.parent.email}</div> : null}
                </div>
              </div>
            )}
          </div>
        </div>
      ),
    },
    // Removed legacy "Courses" tab (was duplicating the new multi-course enrollments tab).
    {
      id: 'courses',
      label: 'Courses',
      count: enrollments.length,
      icon: <FiBookOpen className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-3 gap-4 items-end">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Add Course Level</label>
                <select
                  value={newLevelId}
                  onChange={(e) => setNewLevelId(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">— Select —</option>
                  {levels.map((l: any) => (
                    <option key={l.id} value={l.id}>
                      {l.course?.name} — {l.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                disabled={!newLevelId || addingEnrollment}
                onClick={async () => {
                  if (!id || !newLevelId) return;
                  setAddingEnrollment(true);
                  try {
                    await studentsService.addEnrollment(id, { courseLevelId: newLevelId });
                    setNewLevelId('');
                    await fetchEnrollments(id);
                  } catch (err: any) {
                    setError(toErrorString(err, 'Failed to add enrollment'));
                  } finally {
                    setAddingEnrollment(false);
                  }
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium disabled:opacity-50"
              >
                {addingEnrollment ? 'Adding…' : 'Add'}
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="divide-y divide-gray-200">
              {enrollments.map((enr) => (
                <div key={enr.id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {enr.courseLevel?.course?.name || 'Course'} — {enr.courseLevel?.name || 'Level'}
                    </div>
                    <div className="text-xs text-gray-500">
                      Status: {enr.status} • Group: {enr.class?.name || 'Unassigned'}
                    </div>
                  </div>
                  <button
                    className="text-sm text-red-600 hover:text-red-800"
                    onClick={async () => {
                      if (!confirm('Remove this course enrollment from the student?')) return;
                      try {
                        await studentsService.removeEnrollment(enr.id);
                        if (id) await fetchEnrollments(id);
                      } catch (err: any) {
                        setError(toErrorString(err, 'Failed to remove enrollment'));
                      }
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
              {enrollments.length === 0 && (
                <div className="p-8 text-center text-gray-500 text-sm">No course enrollments yet.</div>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'payments',
      label: 'Payments',
      count: payments.length,
      icon: <FiDollarSign className="w-4 h-4" />,
      content: (
        <div>
          {payments.length > 0 ? (
            <DataTable
              columns={paymentColumns}
              data={payments}
              emptyMessage="No payments found"
              onRowClick={(row) => {
                router.push(`/dashboard/finance/cash/payments/details?id=${row.id}`);
              }}
            />
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No payments recorded</p>
              <button
                onClick={() => router.push(`/dashboard/finance/cash/payments?openModal=true&payerType=student&studentId=${encodeURIComponent(student.id)}`)}
                className="mt-4 text-sm text-indigo-600 hover:text-indigo-900"
              >
                Add Payment →
              </button>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'sessions',
      label: 'Sessions',
      count: sessions.length,
      icon: <FiCalendar className="w-4 h-4" />,
      content: (
        <div>
          {sessions.length > 0 ? (
            <DataTable
              columns={sessionColumns}
              data={sessions}
              emptyMessage="No sessions found"
              onRowClick={(row) => {
                router.push(`/dashboard/sessions/details?id=${row.id}`);
              }}
            />
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No sessions found</p>
            </div>
          )}
        </div>
      ),
    },
  ];

  const candidateRecipients = [
    ...(student.phone ? [{ label: `Student Phone (${student.phone})`, value: student.phone, channel: 'sms' as const }] : []),
    ...(student.parent?.phone ? [{ label: `Parent Phone (${student.parent.phone})`, value: student.parent.phone, channel: 'sms' as const }] : []),
    ...(student.email ? [{ label: `Student Email (${student.email})`, value: student.email, channel: 'email' as const }] : []),
    ...(student.parent?.email ? [{ label: `Parent Email (${student.parent.email})`, value: student.parent.email, channel: 'email' as const }] : []),
  ];

  const openMessageModal = (channel: NotificationChannel) => {
    setMessageError('');
    setMessageChannel(channel);
    const defaultRecipient =
      candidateRecipients.find((r) => r.channel === channel)?.value ||
      (channel === 'sms' ? student.phone || student.parent?.phone || '' : student.email || student.parent?.email || '');
    setMessageRecipient(defaultRecipient);
    setMessageSubject('');
    setMessageBody('');
    setShowMessageModal(true);
  };

  const handleSendMessage = async () => {
    setMessageError('');
    if (!messageRecipient) {
      setMessageError('Recipient is required');
      return;
    }
    if (!messageBody.trim()) {
      setMessageError('Message is required');
      return;
    }
    if (messageChannel === 'email' && !messageSubject.trim()) {
      setMessageError('Subject is required for email');
      return;
    }

    setSendingMessage(true);
    try {
      await notificationsService.sendMessage({
        channel: messageChannel,
        recipient: messageRecipient,
        subject: messageChannel === 'email' ? messageSubject : undefined,
        message: messageBody,
        studentId: student.id,
        parentId: student.parentId || undefined,
      });
      setShowMessageModal(false);
    } catch (err: any) {
        setMessageError(toErrorString(err, 'Failed to send message'));
    } finally {
      setSendingMessage(false);
    }
  };

  // Sidebar with quick actions
  const sidebar = (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
        <div className="space-y-2">
          <button
            onClick={() => {
              openMessageModal('sms');
            }}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            📱 Send SMS
          </button>
          <button
            onClick={() => {
              openMessageModal('email');
            }}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            ✉️ Send Email
          </button>
          <button
            onClick={() =>
              router.push(
                `/dashboard/finance/cash/payments?openModal=true&payerType=student&studentId=${encodeURIComponent(student.id)}`,
              )
            }
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            💳 Add Payment
          </button>
        </div>
      </div>
      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Total Payments:</span>
            <span className="font-medium text-gray-900">
              EGP {payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Sessions Attended:</span>
            <span className="font-medium text-gray-900">
              {sessions.filter((s) => {
                const att = s.attendances?.find((a: any) => a.studentId === student.id);
                return att?.attended;
              }).length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <StandardDetailView
        title={`${student.firstName} ${student.lastName}`}
        subtitle={student.email || student.phone || 'Student Profile'}
        actions={actions}
        tabs={tabs}
        breadcrumbs={breadcrumbs}
        sidebar={sidebar}
      />

      {showMessageModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowMessageModal(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75" />
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Send {messageChannel === 'sms' ? 'SMS' : 'Email'}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  This will send immediately using your configured provider.
                </p>
              </div>

              {messageError && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                  {messageError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recipient</label>
                  {candidateRecipients.filter((r) => r.channel === messageChannel).length > 1 ? (
                    <select
                      value={messageRecipient}
                      onChange={(e) => setMessageRecipient(e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      {candidateRecipients
                        .filter((r) => r.channel === messageChannel)
                        .map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={messageRecipient}
                      onChange={(e) => setMessageRecipient(e.target.value)}
                      placeholder={messageChannel === 'sms' ? 'e.g., +2010...' : 'e.g., name@domain.com'}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  )}
                </div>

                {messageChannel === 'email' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                    <input
                      type="text"
                      value={messageSubject}
                      onChange={(e) => setMessageSubject(e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="Subject"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                    rows={5}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Write your message..."
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowMessageModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  disabled={sendingMessage}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendMessage}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  disabled={sendingMessage}
                >
                  {sendingMessage ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
