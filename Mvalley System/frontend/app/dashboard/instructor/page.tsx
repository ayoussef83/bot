'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import DataTable, { Column } from '@/components/DataTable';
import { FiBookOpen, FiCalendar, FiUsers } from 'react-icons/fi';

interface ClassItem {
  id: string;
  name: string;
  location: string;
  capacity: number;
  students?: any[];
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface Session {
  id: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  class?: { name: string };
}

export default function InstructorDashboard() {
  const [data, setData] = useState<{
    instructor?: { firstName: string; lastName: string };
    assignedClasses?: ClassItem[];
    upcomingSessions?: Session[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/dashboard/instructor');
      setData(response.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="text-gray-500">No data available</div>
      </div>
    );
  }

  // Assigned Classes columns
  const classColumns: Column<ClassItem>[] = [
    {
      key: 'name',
      label: 'Class Name',
      render: (value) => <span className="text-sm font-semibold text-gray-900">{value}</span>,
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
  ];

  // Upcoming Sessions columns
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
        <span className="text-sm font-medium text-gray-900">{row.class?.name || '-'}</span>
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
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {data.instructor?.firstName} {data.instructor?.lastName}
        </h1>
        <p className="text-sm text-gray-500 mt-1">Your classes and upcoming sessions</p>
      </div>

      {/* Assigned Classes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <FiBookOpen className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Assigned Classes</h2>
        </div>
        {data.assignedClasses && data.assignedClasses.length > 0 ? (
          <DataTable
            columns={classColumns}
            data={data.assignedClasses}
            emptyMessage="No classes assigned"
            loading={loading}
          />
        ) : (
          <div className="text-center py-8 text-gray-500">No classes assigned</div>
        )}
      </div>

      {/* Upcoming Sessions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <FiCalendar className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Sessions</h2>
        </div>
        {data.upcomingSessions && data.upcomingSessions.length > 0 ? (
          <DataTable
            columns={sessionColumns}
            data={data.upcomingSessions}
            emptyMessage="No upcoming sessions"
            loading={loading}
          />
        ) : (
          <div className="text-center py-8 text-gray-500">No upcoming sessions</div>
        )}
      </div>
    </div>
  );
}
