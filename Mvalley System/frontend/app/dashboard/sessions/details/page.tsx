'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import StandardDetailView, { Tab, ActionButton, Breadcrumb } from '@/components/StandardDetailView';
import StatusBadge from '@/components/settings/StatusBadge';
import { Column } from '@/components/DataTable';
import DataTable from '@/components/DataTable';
import { FiEdit, FiTrash2, FiCalendar, FiUsers, FiCheckCircle, FiXCircle, FiBookOpen, FiUserCheck, FiClock, FiSave } from 'react-icons/fi';

interface Session {
  id: string;
  classId: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: string;
  instructorConfirmed: boolean;
  room?: string;
  notes?: string;
  class?: {
    id: string;
    name: string;
    location: string;
    instructor?: {
      user?: {
        firstName: string;
        lastName: string;
      };
    };
  };
  instructor?: any;
  attendances?: Attendance[];
}

interface Attendance {
  id: string;
  studentId: string;
  attended: boolean;
  notes?: string;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
}

export default function SessionDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  const [attendanceDraft, setAttendanceDraft] = useState<Record<string, { attended: boolean; notes: string }>>({});
  const [savingAttendance, setSavingAttendance] = useState(false);

  useEffect(() => {
    if (id) {
      fetchSession(id);
    } else {
      setError('Missing session id');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchSession = async (sessionId: string) => {
    try {
      const response = await api.get(`/sessions/${sessionId}`);
      setSession(response.data);
      setNotesDraft(String(response.data?.notes || ''));
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load session');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!session?.attendances) return;
    const next: Record<string, { attended: boolean; notes: string }> = {};
    for (const a of session.attendances) {
      next[a.id] = { attended: !!a.attended, notes: a.notes || '' };
    }
    setAttendanceDraft(next);
  }, [session?.attendances]);

  const saveNotes = async () => {
    if (!session) return;
    setSavingNotes(true);
    setError('');
    try {
      await api.patch(`/sessions/${session.id}`, { notes: notesDraft });
      await fetchSession(session.id);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save session notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const saveAttendance = async () => {
    if (!session?.attendances?.length) return;
    setSavingAttendance(true);
    setError('');
    try {
      // Save each attendance row (does NOT complete the session)
      await Promise.all(
        session.attendances.map((a) =>
          api.patch(`/attendance/${a.id}`, {
            attended: attendanceDraft[a.id]?.attended ?? false,
            notes: attendanceDraft[a.id]?.notes ?? '',
          }),
        ),
      );
      await fetchSession(session.id);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save attendance');
    } finally {
      setSavingAttendance(false);
    }
  };

  const handleDelete = async () => {
    if (!session || !confirm('Are you sure you want to delete this session?')) return;
    try {
      await api.delete(`/sessions/${session.id}`);
      router.push('/dashboard/sessions');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete session');
    }
  };

  const handleConfirmSession = async () => {
    if (!session) return;
    try {
      await api.patch(`/sessions/${session.id}`, { instructorConfirmed: true });
      fetchSession(session.id);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to confirm session');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading session details...</div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error || 'Session not found'}
        </div>
        <button
          onClick={() => router.push('/dashboard/sessions')}
          className="text-indigo-600 hover:text-indigo-900"
        >
          ← Back to Sessions
        </button>
      </div>
    );
  }

  // Breadcrumbs
  const breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard', href: '/dashboard/management' },
    { label: 'Sessions', href: '/dashboard/sessions' },
    {
      label: `${session.class?.name || 'Session'} - ${new Date(session.scheduledDate).toLocaleDateString()}`,
      href: `/dashboard/sessions/details?id=${id}`,
    },
  ];

  // Action buttons
  const actions: ActionButton[] = [
    {
      label: session.instructorConfirmed ? 'Confirmed' : 'Confirm',
      onClick: handleConfirmSession,
      variant: session.instructorConfirmed ? 'secondary' : 'primary',
      icon: session.instructorConfirmed ? (
        <FiCheckCircle className="w-4 h-4" />
      ) : (
        <FiCheckCircle className="w-4 h-4" />
      ),
    },
    {
      label: 'Edit',
      onClick: () => {
        router.push(`/dashboard/sessions?editId=${id}`);
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

  // Attendance columns
  const attendanceColumns: Column<Attendance>[] = [
    {
      key: 'student',
      label: 'Student',
      render: (_, row) => (
        <a
          href={`/dashboard/students/details?id=${row.studentId}`}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
          onClick={(e) => {
            e.preventDefault();
            router.push(`/dashboard/students/details?id=${row.studentId}`);
          }}
        >
          {row.student ? `${row.student.firstName} ${row.student.lastName}` : 'Unknown'}
        </a>
      ),
    },
    {
      key: 'attended',
      label: 'Status',
      render: (value) => (
        <div className="flex items-center gap-2">
          {value ? (
            <>
              <FiCheckCircle className="w-4 h-4 text-green-600" />
              <StatusBadge status="active" label="Present" />
            </>
          ) : (
            <>
              <FiXCircle className="w-4 h-4 text-red-600" />
              <StatusBadge status="inactive" label="Absent" />
            </>
          )}
        </div>
      ),
    },
    {
      key: 'notes',
      label: 'Notes',
      render: (value) => (
        <span className="text-sm text-gray-500">{value || '-'}</span>
      ),
    },
  ];

  const attendances = session.attendances || [];
  const presentCount = attendances.filter((a) => a.attended).length;
  const absentCount = attendances.filter((a) => !a.attended).length;
  const totalCount = attendances.length;

  const editableAttendanceRows = useMemo(() => {
    return attendances.map((a) => ({
      ...a,
      _draft: attendanceDraft[a.id] || { attended: a.attended, notes: a.notes || '' },
    }));
  }, [attendances, attendanceDraft]);

  // Tabs
  const tabs: Tab[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <FiCalendar className="w-4 h-4" />,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                <FiCalendar className="w-4 h-4" />
                Date
              </h3>
              <p className="text-lg text-gray-900">
                {new Date(session.scheduledDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                <FiClock className="w-4 h-4" />
                Time
              </h3>
              <p className="text-lg text-gray-900">
                {new Date(session.startTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                -{' '}
                {new Date(session.endTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            {session.class && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                  <FiBookOpen className="w-4 h-4" />
                  Course
                </h3>
                <a
                  href={`/dashboard/courses/details?id=${session.classId}`}
                  className="text-lg text-indigo-600 hover:text-indigo-900"
                  onClick={(e) => {
                    e.preventDefault();
                    router.push(`/dashboard/courses/details?id=${session.classId}`);
                  }}
                >
                  {session.class.name}
                </a>
              </div>
            )}
            {session.class?.location && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Location</h3>
                <p className="text-lg text-gray-900">{session.class.location}</p>
              </div>
            )}
            {session.class?.instructor && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                  <FiUserCheck className="w-4 h-4" />
                  Instructor
                </h3>
                <p className="text-lg text-gray-900">
                  {session.class.instructor.user?.firstName}{' '}
                  {session.class.instructor.user?.lastName}
                </p>
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
              <div className="mt-1">
                <StatusBadge
                  status={
                    session.status === 'completed'
                      ? 'active'
                      : session.status === 'scheduled'
                      ? 'warning'
                      : 'inactive'
                  }
                  label={session.status}
                />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Instructor Confirmed</h3>
              <div className="mt-1">
                {session.instructorConfirmed ? (
                  <StatusBadge status="active" label="Confirmed" />
                ) : (
                  <StatusBadge status="warning" label="Pending" />
                )}
              </div>
            </div>
            <div className="col-span-2">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Instructor Notes</h3>
              <textarea
                rows={4}
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-3 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Session notes (what was covered, homework, behavior, etc.)"
              />
              <div className="mt-2 flex justify-end">
                <button
                  onClick={saveNotes}
                  disabled={savingNotes}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium disabled:opacity-50"
                >
                  <FiSave className="w-4 h-4" />
                  {savingNotes ? 'Saving…' : 'Save Notes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'attendance',
      label: 'Attendance',
      count: totalCount,
      icon: <FiUsers className="w-4 h-4" />,
      content: (
        <div>
          {attendances.length > 0 ? (
            <>
              <div className="mb-4 grid grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-green-800">Present</div>
                  <div className="text-2xl font-bold text-green-900 mt-1">{presentCount}</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-red-800">Absent</div>
                  <div className="text-2xl font-bold text-red-900 mt-1">{absentCount}</div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-800">Total</div>
                  <div className="text-2xl font-bold text-gray-900 mt-1">{totalCount}</div>
                </div>
              </div>
              <div className="mb-3 flex justify-end">
                <button
                  onClick={saveAttendance}
                  disabled={savingAttendance}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium disabled:opacity-50"
                >
                  <FiSave className="w-4 h-4" />
                  {savingAttendance ? 'Saving…' : 'Save Attendance'}
                </button>
              </div>

              <DataTable
                columns={[
                  attendanceColumns[0],
                  {
                    key: 'attended',
                    label: 'Present',
                    render: (_, row: any) => (
                      <input
                        type="checkbox"
                        checked={!!attendanceDraft[row.id]?.attended}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setAttendanceDraft((d) => ({
                            ...d,
                            [row.id]: {
                              attended: checked,
                              notes: d[row.id]?.notes ?? row.notes ?? '',
                            },
                          }));
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ),
                  },
                  {
                    key: 'notes',
                    label: 'Notes',
                    render: (_, row: any) => (
                      <input
                        type="text"
                        value={attendanceDraft[row.id]?.notes ?? ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          setAttendanceDraft((d) => ({
                            ...d,
                            [row.id]: { attended: d[row.id]?.attended ?? false, notes: v },
                          }));
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                        placeholder="Notes…"
                      />
                    ),
                  },
                ]}
                data={editableAttendanceRows as any}
                emptyMessage="No attendance records"
                onRowClick={(row: any) => {
                  router.push(`/dashboard/students/details?id=${row.studentId}`);
                }}
              />
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No attendance records</p>
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
          {!session.instructorConfirmed && (
            <button
              onClick={handleConfirmSession}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              ✓ Confirm Session
            </button>
          )}
          <button
            onClick={() => router.push(`/dashboard/courses/details?id=${session.classId}`)}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            📚 View Course
          </button>
        </div>
      </div>
      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Total Students:</span>
            <span className="font-medium text-gray-900">{totalCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Present:</span>
            <span className="font-medium text-green-600">{presentCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Absent:</span>
            <span className="font-medium text-red-600">{absentCount}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-200">
            <span className="text-gray-500">Attendance Rate:</span>
            <span className="font-medium text-gray-900">
              {totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <StandardDetailView
      title={`${session.class?.name || 'Session'} - ${new Date(session.scheduledDate).toLocaleDateString()}`}
      subtitle={`${new Date(session.startTime).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })} - ${new Date(session.endTime).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })}`}
      actions={actions}
      tabs={tabs}
      breadcrumbs={breadcrumbs}
      sidebar={sidebar}
    />
  );
}

