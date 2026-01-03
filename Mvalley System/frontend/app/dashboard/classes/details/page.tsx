'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { classesService, Class } from '@/lib/services';
import { studentsService, Student } from '@/lib/services';
import api from '@/lib/api';
import StandardDetailView, { Tab, ActionButton, Breadcrumb } from '@/components/StandardDetailView';
import StatusBadge from '@/components/settings/StatusBadge';
import { Column } from '@/components/DataTable';
import DataTable from '@/components/DataTable';
import { FiEdit, FiTrash2, FiBookOpen, FiUsers, FiCalendar, FiUserCheck, FiMapPin, FiClock } from 'react-icons/fi';

interface Session {
  id: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: string;
  attendances?: any[];
}

export default function ClassDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [classItem, setClassItem] = useState<Class | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchClass(id);
      fetchStudents(id);
      fetchSessions(id);
    } else {
      setError('Missing class id');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchClass = async (classId: string) => {
    try {
      const response = await classesService.getById(classId);
      setClassItem(response.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load class');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (classId: string) => {
    try {
      // Assuming there's an endpoint to get students for a class
      const response = await api.get(`/classes/${classId}/students`);
      setStudents(response.data);
    } catch (err: any) {
      console.error('Failed to load students', err);
      // If endpoint doesn't exist, try to get from class data
      if (classItem?.students) {
        setStudents(classItem.students);
      }
    }
  };

  const fetchSessions = async (classId: string) => {
    try {
      const response = await api.get(`/classes/${classId}/sessions`);
      setSessions(response.data);
    } catch (err: any) {
      console.error('Failed to load sessions', err);
    }
  };

  const handleDelete = async () => {
    if (!classItem || !confirm('Are you sure you want to delete this class?')) return;
    try {
      await classesService.delete(classItem.id);
      router.push('/dashboard/classes');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete class');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading class details...</div>
      </div>
    );
  }

  if (error || !classItem) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error || 'Class not found'}
        </div>
        <button
          onClick={() => router.push('/dashboard/classes')}
          className="text-indigo-600 hover:text-indigo-900"
        >
          ← Back to Classes
        </button>
      </div>
    );
  }

  // Breadcrumbs
  const breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard', href: '/dashboard/management' },
    { label: 'Classes', href: '/dashboard/classes' },
    { label: classItem.name, href: `/dashboard/classes/details?id=${id}` },
  ];

  // Action buttons
  const actions: ActionButton[] = [
    {
      label: 'Edit',
      onClick: () => {
        router.push(`/dashboard/classes/edit?id=${id}`);
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

  // Student columns
  const studentColumns: Column<Student>[] = [
    {
      key: 'name',
      label: 'Name',
      render: (_, row) => (
        <a
          href={`/dashboard/students/details?id=${row.id}`}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
          onClick={(e) => {
            e.preventDefault();
            router.push(`/dashboard/students/details?id=${row.id}`);
          }}
        >
          {row.firstName} {row.lastName}
        </a>
      ),
    },
    {
      key: 'age',
      label: 'Age',
      render: (value) => <span className="text-sm text-gray-500">{value}</span>,
    },
    {
      key: 'learningTrack',
      label: 'Learning Track',
      render: (value) => (
        <span className="text-sm text-gray-500 capitalize">{value}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => {
        const statusMap: { [key: string]: 'active' | 'inactive' | 'warning' } = {
          active: 'active',
          paused: 'warning',
          finished: 'inactive',
        };
        return <StatusBadge status={statusMap[value] || 'inactive'} label={value} />;
      },
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
        const attended = row.attendances?.filter((a: any) => a.attended).length || 0;
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

  // Get day name
  const getDayName = (dayOfWeek: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek] || 'Unknown';
  };

  // Tabs
  const tabs: Tab[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <FiBookOpen className="w-4 h-4" />,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                <FiMapPin className="w-4 h-4" />
                Location
              </h3>
              <p className="text-lg text-gray-900">{classItem.location}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                <FiUsers className="w-4 h-4" />
                Capacity
              </h3>
              <p className="text-lg text-gray-900">
                {students.length} / {classItem.capacity}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                <FiClock className="w-4 h-4" />
                Schedule
              </h3>
              <p className="text-lg text-gray-900">
                {getDayName(classItem.dayOfWeek)} • {classItem.startTime} - {classItem.endTime}
              </p>
            </div>
            {classItem.instructor && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                  <FiUserCheck className="w-4 h-4" />
                  Instructor
                </h3>
                <a
                  href={`/dashboard/instructors/${classItem.instructorId}`}
                  className="text-lg text-indigo-600 hover:text-indigo-900"
                  onClick={(e) => {
                    e.preventDefault();
                    router.push(`/dashboard/instructors/${classItem.instructorId}`);
                  }}
                >
                  {classItem.instructor.user?.firstName} {classItem.instructor.user?.lastName}
                </a>
              </div>
            )}
            {classItem.startDate && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Start Date</h3>
                <p className="text-lg text-gray-900">
                  {new Date(classItem.startDate).toLocaleDateString()}
                </p>
              </div>
            )}
            {classItem.endDate && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">End Date</h3>
                <p className="text-lg text-gray-900">
                  {new Date(classItem.endDate).toLocaleDateString()}
                </p>
              </div>
            )}
            {classItem.utilizationPercentage !== undefined && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Utilization</h3>
                <p className="text-lg text-gray-900">
                  {classItem.utilizationPercentage.toFixed(1)}%
                </p>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'students',
      label: 'Students',
      count: students.length,
      icon: <FiUsers className="w-4 h-4" />,
      content: (
        <div>
          {students.length > 0 ? (
            <DataTable
              columns={studentColumns}
              data={students}
              emptyMessage="No students enrolled"
              onRowClick={(row) => {
                router.push(`/dashboard/students/details?id=${row.id}`);
              }}
            />
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No students enrolled</p>
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
            onClick={() => router.push(`/dashboard/academics/allocations?classId=${encodeURIComponent(classItem.id)}`)}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            👥 Add Student
          </button>
          <button
            onClick={() => router.push(`/dashboard/sessions?classId=${encodeURIComponent(classItem.id)}`)}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            📅 View Sessions
          </button>
        </div>
      </div>
      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Enrolled Students:</span>
            <span className="font-medium text-gray-900">{students.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Total Sessions:</span>
            <span className="font-medium text-gray-900">{sessions.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Capacity:</span>
            <span className="font-medium text-gray-900">
              {((students.length / classItem.capacity) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <StandardDetailView
      title={classItem.name}
      subtitle={`${classItem.location} • ${getDayName(classItem.dayOfWeek)} ${classItem.startTime} - ${classItem.endTime}`}
      actions={actions}
      tabs={tabs}
      breadcrumbs={breadcrumbs}
      sidebar={sidebar}
    />
  );
}



