'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { instructorsService, Instructor } from '@/lib/services';
import api from '@/lib/api';
import StandardDetailView, { Tab, ActionButton, Breadcrumb } from '@/components/StandardDetailView';
import StatusBadge from '@/components/settings/StatusBadge';
import { Column } from '@/components/DataTable';
import DataTable from '@/components/DataTable';
import { FiEdit, FiTrash2, FiUserCheck, FiBookOpen, FiCalendar, FiDollarSign, FiUsers, FiClock } from 'react-icons/fi';

interface Class {
  id: string;
  name: string;
  location: string;
  capacity: number;
  students?: any[];
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  utilizationPercentage?: number;
}

interface Session {
  id: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: string;
  class?: {
    id: string;
    name: string;
  };
}

export default function InstructorDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchInstructor(id);
      fetchClasses(id);
      fetchSessions(id);
    } else {
      setError('Missing instructor id');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchInstructor = async (instructorId: string) => {
    try {
      const response = await instructorsService.getById(instructorId);
      setInstructor(response.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load instructor');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async (instructorId: string) => {
    try {
      const response = await api.get(`/instructors/${instructorId}/classes`);
      setClasses(response.data);
    } catch (err: any) {
      console.error('Failed to load classes', err);
      // If endpoint doesn't exist, try to get from instructor data
      if (instructor?.classes) {
        setClasses(instructor.classes);
      }
    }
  };

  const fetchSessions = async (instructorId: string) => {
    try {
      const response = await api.get(`/instructors/${instructorId}/sessions`);
      setSessions(response.data);
    } catch (err: any) {
      console.error('Failed to load sessions', err);
      // If endpoint doesn't exist, try to get from instructor data
      if (instructor?.sessions) {
        setSessions(instructor.sessions);
      }
    }
  };

  const handleDelete = async () => {
    if (!instructor || !confirm('Are you sure you want to delete this instructor?')) return;
    try {
      await instructorsService.delete(instructor.id);
      router.push('/dashboard/instructors');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete instructor');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading instructor details...</div>
      </div>
    );
  }

  if (error || !instructor) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error || 'Instructor not found'}
        </div>
        <button
          onClick={() => router.push('/dashboard/instructors')}
          className="text-indigo-600 hover:text-indigo-900"
        >
          ← Back to Instructors
        </button>
      </div>
    );
  }

  const instructorName = instructor.user
    ? `${instructor.user.firstName} ${instructor.user.lastName}`
    : 'Unknown Instructor';

  // Breadcrumbs
  const breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard', href: '/dashboard/management' },
    { label: 'Instructors', href: '/dashboard/instructors' },
    { label: instructorName, href: `/dashboard/instructors/details?id=${id}` },
  ];

  // Action buttons
  const actions: ActionButton[] = [
    {
      label: 'Edit',
      onClick: () => {
        router.push(`/dashboard/instructors/edit?id=${id}`);
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

  // Class columns
  const classColumns: Column<Class>[] = [
    {
      key: 'name',
      label: 'Class Name',
      render: (value, row) => (
        <a
          href={`/dashboard/courses/details?id=${row.id}`}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
          onClick={(e) => {
            e.preventDefault();
            router.push(`/dashboard/courses/details?id=${row.id}`);
          }}
        >
          {value}
        </a>
      ),
    },
    {
      key: 'location',
      label: 'Location',
      render: (value) => <span className="text-sm text-gray-500">{value}</span>,
    },
    {
      key: 'capacity',
      label: 'Capacity',
      render: (_, row) => (
        <span className="text-sm text-gray-500">
          {row.students?.length || 0} / {row.capacity}
        </span>
      ),
    },
    {
      key: 'schedule',
      label: 'Schedule',
      render: (_, row) => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return (
          <span className="text-sm text-gray-500">
            {days[row.dayOfWeek]} {row.startTime} - {row.endTime}
          </span>
        );
      },
    },
    {
      key: 'utilization',
      label: 'Utilization',
      render: (_, row) => (
        <span className="text-sm text-gray-500">
          {(row.utilizationPercentage || 0).toFixed(1)}%
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
        <a
          href={`/dashboard/courses/details?id=${row.class?.id}`}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
          onClick={(e) => {
            e.preventDefault();
            if (row.class?.id) {
              router.push(`/dashboard/courses/details?id=${row.class.id}`);
            }
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
      icon: <FiUserCheck className="w-4 h-4" />,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {instructor.user && (
              <>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Name</h3>
                  <p className="text-lg text-gray-900">
                    {instructor.user.firstName} {instructor.user.lastName}
                  </p>
                </div>
                {instructor.user.email && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
                    <p className="text-lg text-gray-900">{instructor.user.email}</p>
                  </div>
                )}
                {instructor.user.phone && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Phone</h3>
                    <p className="text-lg text-gray-900">{instructor.user.phone}</p>
                  </div>
                )}
              </>
            )}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                <FiDollarSign className="w-4 h-4" />
                Cost Type
              </h3>
              <p className="text-lg text-gray-900 capitalize">{instructor.costType}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                <FiDollarSign className="w-4 h-4" />
                Cost Amount
              </h3>
              <p className="text-lg text-gray-900">
                EGP {instructor.costAmount.toLocaleString()}
                {instructor.costType === 'hourly' && ' / hour'}
                {instructor.costType === 'session' && ' / session'}
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'classes',
      label: 'Courses',
      count: classes.length,
      icon: <FiBookOpen className="w-4 h-4" />,
      content: (
        <div>
          {classes.length > 0 ? (
            <DataTable
              columns={classColumns}
              data={classes}
              emptyMessage="No courses assigned"
              onRowClick={(row) => {
                router.push(`/dashboard/courses/details?id=${row.id}`);
              }}
            />
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No courses assigned</p>
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

  // Sidebar with quick actions
  const sidebar = (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
        <div className="space-y-2">
          <button
            onClick={() => router.push(`/dashboard/instructors/${instructor.id}/assign-class`)}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            📚 Assign Class
          </button>
          <button
            onClick={() => router.push(`/dashboard/sessions?instructor=${instructor.id}`)}
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
            <span className="text-gray-500">Assigned Classes:</span>
            <span className="font-medium text-gray-900">{classes.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Total Sessions:</span>
            <span className="font-medium text-gray-900">{sessions.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Total Students:</span>
            <span className="font-medium text-gray-900">
              {classes.reduce((sum, c) => sum + (c.students?.length || 0), 0)}
            </span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-200">
            <span className="text-gray-500">Cost Type:</span>
            <span className="font-medium text-gray-900 capitalize">{instructor.costType}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <StandardDetailView
      title={instructorName}
      subtitle={instructor.user?.email || 'Instructor Profile'}
      actions={actions}
      tabs={tabs}
      breadcrumbs={breadcrumbs}
      sidebar={sidebar}
    />
  );
}

