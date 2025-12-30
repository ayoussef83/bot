'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { classesService, Class } from '@/lib/services';
import StandardListView, { FilterConfig } from '@/components/StandardListView';
import { Column, ActionButton } from '@/components/DataTable';
import SummaryCard from '@/components/SummaryCard';
import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/settings/StatusBadge';
import { downloadExport } from '@/lib/export';
import { FiPlus, FiCheckCircle, FiCalendar, FiUsers } from 'react-icons/fi';

interface Session {
  id: string;
  classId: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: string;
  instructorConfirmed: boolean;
  class?: any;
  instructor?: any;
  attendances?: any[];
}

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    fetchSessions();
    fetchClasses();
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
            router.push(`/dashboard/sessions/details?id=${row.id}`);
          }}
        >
          {new Date(row.scheduledDate).toLocaleDateString()}
        </a>
      ),
    },
    {
      key: 'class',
      label: 'Class',
      sortable: true,
      render: (_, row) => (
        <a
          href={`/dashboard/classes/${row.classId}`}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
          onClick={(e) => {
            e.preventDefault();
            router.push(`/dashboard/classes/${row.classId}`);
          }}
        >
          {row.class?.name || '-'}
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
        <span className="text-sm text-gray-500">
          {row.instructor?.user?.firstName || ''} {row.instructor?.user?.lastName || ''}
        </span>
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

      {/* Standard List View */}
      <StandardListView
        title="Sessions"
        subtitle="Manage class sessions and track attendance"
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
          router.push(`/dashboard/sessions/${row.id}`);
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
