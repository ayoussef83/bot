'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { classesService, Class, instructorsService, Instructor, studentsService, Student } from '@/lib/services';
import StandardListView, { FilterConfig } from '@/components/StandardListView';
import { Column, ActionButton } from '@/components/DataTable';
import SummaryCard from '@/components/SummaryCard';
import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/settings/StatusBadge';
import { downloadExport } from '@/lib/export';
import { FiPlus, FiCheckCircle, FiCalendar, FiUsers, FiEdit, FiX } from 'react-icons/fi';
import HighlightedText from '@/components/HighlightedText';

interface Session {
  id: string;
  classId: string;
  instructorId?: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  room?: string;
  status: string;
  instructorConfirmed: boolean;
  class?: any;
  instructor?: any;
  attendances?: any[];
}

export default function SessionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Session | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    classId: '',
    instructorId: '',
    scheduledDate: '',
    startTime: '',
    endTime: '',
    room: '',
    status: 'scheduled',
  });
  const [rosterIds, setRosterIds] = useState<string[]>([]);

  useEffect(() => {
    fetchSessions();
    fetchClasses();
    fetchInstructors();
    fetchStudents();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await api.get('/sessions');
      setSessions(response.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await classesService.getAll();
      setClasses(response.data);
    } catch (err: any) {
      console.error('Failed to load classes', err);
    }
  };

  const fetchInstructors = async () => {
    try {
      const response = await instructorsService.getAll();
      setInstructors(response.data);
    } catch (err) {
      // non-blocking
      console.error('Failed to load instructors', err);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await studentsService.getAll();
      setStudents(response.data);
    } catch (err) {
      console.error('Failed to load students', err);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      classId: classes?.[0]?.id || '',
      instructorId: '',
      scheduledDate: new Date().toISOString().slice(0, 10),
      startTime: '',
      endTime: '',
      room: '',
      status: 'scheduled',
    });
    setRosterIds([]);
    setShowForm(true);
  };

  const openEdit = (s: Session) => {
    setEditing(s);
    setForm({
      classId: s.classId,
      instructorId: s.instructorId || '',
      scheduledDate: new Date(s.scheduledDate).toISOString().slice(0, 10),
      startTime: s.startTime ? new Date(s.startTime).toISOString().slice(0, 16) : '',
      endTime: s.endTime ? new Date(s.endTime).toISOString().slice(0, 16) : '',
      room: s.room || '',
      status: s.status || 'scheduled',
    });
    const currentRoster = Array.isArray(s.attendances)
      ? s.attendances.map((a: any) => a.studentId).filter(Boolean)
      : [];
    setRosterIds(currentRoster);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setSaving(false);
  };

  // If navigated from details page with ?editId=..., open edit modal
  useEffect(() => {
    const editId = searchParams?.get('editId');
    if (!editId) return;
    const s = sessions.find((x) => x.id === editId);
    if (s) {
      openEdit(s);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, sessions]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const scheduledDateIso = new Date(form.scheduledDate).toISOString();
      const startTimeIso = form.startTime ? new Date(form.startTime).toISOString() : scheduledDateIso;
      const endTimeIso = form.endTime ? new Date(form.endTime).toISOString() : scheduledDateIso;

      if (!form.classId) {
        setError('Class is required');
        return;
      }

      let sessionId = editing?.id;
      if (editing) {
        await api.patch(`/sessions/${editing.id}`, {
          classId: form.classId,
          instructorId: form.instructorId || undefined,
          scheduledDate: scheduledDateIso,
          startTime: startTimeIso,
          endTime: endTimeIso,
          room: form.room || undefined,
          status: form.status,
        });
      } else {
        const created = await api.post('/sessions', {
          classId: form.classId,
          instructorId: form.instructorId || undefined,
          scheduledDate: scheduledDateIso,
          startTime: startTimeIso,
          endTime: endTimeIso,
          room: form.room || undefined,
          status: form.status,
        });
        sessionId = created?.data?.id;
      }

      if (sessionId && rosterIds.length > 0) {
        await api.post('/attendance/roster', { sessionId, studentIds: rosterIds });
      }

      await fetchSessions();
      closeForm();
      // clear query param if present
      if (searchParams?.get('editId')) {
        router.replace('/dashboard/sessions');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save session');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async (sessionId: string) => {
    try {
      await api.post(`/sessions/${sessionId}/confirm`);
      fetchSessions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to confirm session');
    }
  };

  // Filter sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      const matchesSearch =
        searchTerm === '' ||
        session.class?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${session.instructor?.user?.firstName || ''} ${session.instructor?.user?.lastName || ''}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === '' || session.status === statusFilter;
      const matchesClass = classFilter === '' || session.classId === classFilter;
      const matchesDate =
        dateFilter === '' ||
        new Date(session.scheduledDate).toISOString().split('T')[0] === dateFilter;

      return matchesSearch && matchesStatus && matchesClass && matchesDate;
    });
  }, [sessions, searchTerm, statusFilter, classFilter, dateFilter]);

  // Column definitions
  const columns: Column<Session>[] = [
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (_, row) => (
        <a
          href={`/dashboard/sessions/details?id=${row.id}`}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            router.push(`/dashboard/sessions/details?id=${row.id}`);
          }}
        >
          <HighlightedText
            text={new Date(row.scheduledDate).toLocaleDateString()}
            query={searchTerm}
          />
        </a>
      ),
    },
    {
      key: 'class',
      label: 'Class',
      sortable: true,
      render: (_, row) => (
        <a
          href={`/dashboard/classes/details?id=${row.classId}`}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            router.push(`/dashboard/classes/details?id=${row.classId}`);
          }}
        >
          <HighlightedText text={row.class?.name || '-'} query={searchTerm} />
        </a>
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
      key: 'instructor',
      label: 'Instructor',
      render: (_, row) => (
        row.instructorId ? (
          <a
            href={`/dashboard/instructors/details?id=${row.instructorId}`}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              router.push(`/dashboard/instructors/details?id=${row.instructorId}`);
            }}
          >
            <HighlightedText
              text={`${row.instructor?.user?.firstName || ''} ${row.instructor?.user?.lastName || ''}`.trim() || '-'}
              query={searchTerm}
            />
          </a>
        ) : (
          <span className="text-sm text-gray-500">
            <HighlightedText text="-" query={searchTerm} />
          </span>
        )
      ),
    },
    {
      key: 'attendance',
      label: 'Attendance',
      render: (_, row) => {
        const attended = row.attendances?.filter((a) => a.attended).length || 0;
        const total = row.attendances?.length || 0;
        return (
          <span className="text-sm text-gray-500">
            {attended} / {total}
          </span>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
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

  // Action buttons
  const actions = (row: Session): ActionButton[] => {
    const actionButtons: ActionButton[] = [];

    actionButtons.push({
      label: 'Edit',
      onClick: () => openEdit(row),
      icon: <FiEdit className="w-4 h-4" />,
    });
    
    if (!row.instructorConfirmed && row.status !== 'completed') {
      actionButtons.push({
        label: 'Confirm',
        onClick: () => handleConfirm(row.id),
        variant: 'primary',
        icon: <FiCheckCircle className="w-4 h-4" />,
      });
    }

    return actionButtons;
  };

  // Filters
  const filters: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'scheduled', label: 'Scheduled' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
      ],
      value: statusFilter,
      onChange: setStatusFilter,
    },
    {
      key: 'class',
      label: 'Class',
      type: 'select',
      options: classes.map((c) => ({
        value: c.id,
        label: c.name,
      })),
      value: classFilter,
      onChange: setClassFilter,
    },
    {
      key: 'date',
      label: 'Date',
      type: 'date',
      value: dateFilter,
      onChange: setDateFilter,
    },
  ];

  // Summary statistics
  const totalSessions = filteredSessions.length;
  const completedSessions = filteredSessions.filter((s) => s.status === 'completed').length;
  const upcomingSessions = filteredSessions.filter(
    (s) => s.status === 'scheduled' && new Date(s.scheduledDate) >= new Date(),
  ).length;
  const totalAttendance = filteredSessions.reduce(
    (sum, s) => sum + (s.attendances?.filter((a) => a.attended).length || 0),
    0,
  );

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Schedule / Edit Session Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={closeForm}
            ></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">
                    {editing ? 'Edit Session' : 'Schedule Session'}
                  </h2>
                  <button onClick={closeForm} className="text-gray-400 hover:text-gray-600">
                    <FiX className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Class *</label>
                      <select
                        value={form.classId}
                        onChange={(e) => setForm((f) => ({ ...f, classId: e.target.value }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        required
                      >
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.location})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Instructor</label>
                      <select
                        value={form.instructorId}
                        onChange={(e) => setForm((f) => ({ ...f, instructorId: e.target.value }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value="">— None —</option>
                        {instructors.map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.user?.firstName} {i.user?.lastName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date</label>
                      <input
                        type="date"
                        value={form.scheduledDate}
                        onChange={(e) => setForm((f) => ({ ...f, scheduledDate: e.target.value }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Start</label>
                      <input
                        type="datetime-local"
                        value={form.startTime}
                        onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">End</label>
                      <input
                        type="datetime-local"
                        value={form.endTime}
                        onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Room</label>
                      <input
                        type="text"
                        value={form.room}
                        onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="e.g., Room 2 / Lab A / Online"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <select
                        value={form.status}
                        onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value="scheduled">Scheduled</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Students (roster)</label>
                    <div className="max-h-56 overflow-y-auto border border-gray-200 rounded-md p-3 space-y-2">
                      {students
                        .filter((s) => !form.classId || s.classId === form.classId)
                        .map((s) => {
                          const checked = rosterIds.includes(s.id);
                          return (
                            <label key={s.id} className="flex items-center gap-2 text-sm text-gray-700">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  const next = e.target.checked
                                    ? [...rosterIds, s.id]
                                    : rosterIds.filter((id) => id !== s.id);
                                  setRosterIds(next);
                                }}
                              />
                              <span>
                                {s.firstName} {s.lastName}
                              </span>
                            </label>
                          );
                        })}
                      {students.filter((s) => !form.classId || s.classId === form.classId).length === 0 && (
                        <div className="text-sm text-gray-500">No students found for this class.</div>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      For attendance marking, use the session details page.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={closeForm}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium"
                      disabled={saving}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium disabled:opacity-50"
                      disabled={saving}
                    >
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Standard List View */}
      <StandardListView
        title="Sessions"
        subtitle="Manage class sessions and track attendance"
        primaryAction={{
          label: 'Schedule Session',
          onClick: openCreate,
          icon: <FiPlus className="w-4 h-4" />,
        }}
        searchPlaceholder="Search by class name or instructor..."
        onSearch={setSearchTerm}
        searchValue={searchTerm}
        filters={filters}
        columns={columns}
        data={filteredSessions}
        loading={loading}
        actions={actions}
        emptyMessage="No sessions found"
        emptyState={
          <EmptyState
            title="No sessions found"
            message="Sessions will appear here once classes are scheduled"
          />
        }
        summaryCards={
          <>
            <SummaryCard
              title="Total Sessions"
              value={totalSessions}
              icon={<FiCalendar className="w-8 h-8" />}
            />
            <SummaryCard
              title="Completed"
              value={completedSessions}
              variant="success"
              icon={<FiCheckCircle className="w-8 h-8" />}
            />
            <SummaryCard
              title="Upcoming"
              value={upcomingSessions}
              variant="info"
              icon={<FiCalendar className="w-8 h-8" />}
            />
            <SummaryCard
              title="Total Attendance"
              value={totalAttendance}
              icon={<FiUsers className="w-8 h-8" />}
            />
          </>
        }
        getRowId={(row) => row.id}
        onRowClick={(row) => {
          router.push(`/dashboard/sessions/details?id=${row.id}`);
        }}
      />

      {/* Export Buttons */}
      <div className="flex justify-end gap-2">
        <button
          onClick={() => downloadExport('sessions', 'xlsx')}
          className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 text-sm font-medium"
        >
          Export Excel
        </button>
        <button
          onClick={() => downloadExport('sessions', 'pdf')}
          className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 text-sm font-medium"
        >
          Export PDF
        </button>
      </div>
    </div>
  );
}
