'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/settings/StatusBadge';
import { FiCalendar, FiBookOpen } from 'react-icons/fi';

interface Session {
  id: string;
  class?: { name: string };
  startTime: string;
  instructor?: { user?: { firstName: string; lastName: string } };
  status: string;
}

interface ClassItem {
  id: string;
  name: string;
  capacity: number;
  students?: any[];
  utilizationPercentage?: number;
}

export default function OpsDashboard() {
  const [data, setData] = useState<{ dailySessions?: Session[]; underfilledClasses?: ClassItem[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/dashboard/ops');
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

  // Today's Sessions columns
  const sessionColumns: Column<Session>[] = [
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
          })}
        </span>
      ),
    },
    {
      key: 'instructor',
      label: 'Instructor',
      render: (_, row) => (
        <span className="text-sm text-gray-500">
          {row.instructor?.user
            ? `${row.instructor.user.firstName} ${row.instructor.user.lastName}`
            : '-'}
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

  // Underfilled Classes columns
  const classColumns: Column<ClassItem>[] = [
    {
      key: 'name',
      label: 'Class Name',
      render: (value) => <span className="text-sm font-medium text-gray-900">{value}</span>,
    },
    {
      key: 'capacity',
      label: 'Capacity',
      render: (value) => <span className="text-sm text-gray-500">{value}</span>,
    },
    {
      key: 'students',
      label: 'Students',
      render: (_, row) => (
        <span className="text-sm text-gray-500">{row.students?.length || 0}</span>
      ),
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Operations Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Daily operations overview and class management</p>
      </div>

      {/* Today's Sessions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <FiCalendar className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Today's Sessions</h2>
        </div>
        {data?.dailySessions && data.dailySessions.length > 0 ? (
          <DataTable
            columns={sessionColumns}
            data={data.dailySessions}
            emptyMessage="No sessions scheduled for today"
            loading={loading}
          />
        ) : (
          <div className="text-center py-8 text-gray-500">No sessions scheduled for today</div>
        )}
      </div>

      {/* Underfilled Classes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <FiBookOpen className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Underfilled Classes</h2>
        </div>
        {data?.underfilledClasses && data.underfilledClasses.length > 0 ? (
          <DataTable
            columns={classColumns}
            data={data.underfilledClasses}
            emptyMessage="All classes are at capacity"
            loading={loading}
          />
        ) : (
          <div className="text-center py-8 text-gray-500">All classes are at capacity</div>
        )}
      </div>
    </div>
  );
}
