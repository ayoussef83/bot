'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { studentsService, Student } from '@/lib/services';
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [student, setStudent] = useState<Student | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchStudent(id);
      fetchPayments(id);
      fetchSessions(id);
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
      setError(err.response?.data?.message || 'Failed to load student');
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async (studentId: string) => {
    try {
      const response = await financeService.getPayments({ studentId });
      setPayments(response.data);
    } catch (err: any) {
      // Failed to load payments
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

  const handleDelete = async () => {
    if (!student || !confirm('Are you sure you want to delete this student?')) return;
    try {
      await studentsService.delete(student.id);
      router.push('/dashboard/students');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete student');
    }
  };

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
        // Navigate to edit page or open edit modal
        router.push(`/dashboard/students/edit?id=${id}`);
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
      key: 'type',
      label: 'Type',
      render: (value) => (
        <span className="text-sm text-gray-500 capitalize">{value}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => {
        const statusMap: { [key: string]: 'active' | 'inactive' | 'warning' } = {
          completed: 'active',
          pending: 'warning',
          overdue: 'inactive',
        };
        return <StatusBadge status={statusMap[value] || 'inactive'} label={value} />;
      },
    },
    {
      key: 'paymentDate',
      label: 'Payment Date',
      render: (value) => (
        <span className="text-sm text-gray-500">
          {value ? new Date(value).toLocaleDateString() : '-'}
        </span>
      ),
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      render: (value) => (
        <span className="text-sm text-gray-500">
          {value ? new Date(value).toLocaleDateString() : '-'}
        </span>
      ),
    },
  ];

  // Session columns
  const sessionColumns: Column<Session>[] = [
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
        const attendance = row.attendances?.find((a: any) => a.studentId === student.id);
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
              <h3 className="text-sm font-medium text-gray-500 mb-1">Learning Track</h3>
              <p className="text-lg text-gray-900 capitalize">{student.learningTrack}</p>
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
                  Class
                </h3>
                <a
                  href={`/dashboard/classes/${student.classId}`}
                  className="text-lg text-indigo-600 hover:text-indigo-900"
                  onClick={(e) => {
                    e.preventDefault();
                    router.push(`/dashboard/classes/${student.classId}`);
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
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'classes',
      label: 'Classes',
      count: student.class ? 1 : 0,
      icon: <FiBookOpen className="w-4 h-4" />,
      content: (
        <div>
          {student.class ? (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{student.class.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {student.class.location} • Capacity: {student.class.capacity}
                  </p>
                </div>
                <button
                  onClick={() => router.push(`/dashboard/classes/${student.classId}`)}
                  className="text-sm text-indigo-600 hover:text-indigo-900"
                >
                  View Class →
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No classes enrolled</p>
            </div>
          )}
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
                router.push(`/dashboard/finance?payment=${row.id}`);
              }}
            />
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No payments recorded</p>
              <button
                onClick={() => router.push('/dashboard/finance')}
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
                router.push(`/dashboard/sessions/${row.id}`);
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

  // Sidebar with quick actions
  const sidebar = (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
        <div className="space-y-2">
          <button
            onClick={() => {
              // Send SMS functionality
              alert('Send SMS functionality coming soon');
            }}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            📱 Send SMS
          </button>
          <button
            onClick={() => {
              // Send Email functionality
              alert('Send Email functionality coming soon');
            }}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            ✉️ Send Email
          </button>
          <button
            onClick={() => router.push(`/dashboard/finance?student=${student.id}`)}
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
    <StandardDetailView
      title={`${student.firstName} ${student.lastName}`}
      subtitle={student.email || student.phone || 'Student Profile'}
      actions={actions}
      tabs={tabs}
      breadcrumbs={breadcrumbs}
      sidebar={sidebar}
    />
  );
}
