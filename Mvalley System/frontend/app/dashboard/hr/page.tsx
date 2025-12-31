'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { instructorsService, Instructor } from '@/lib/services';
import SummaryCard from '@/components/SummaryCard';
import { FiUsers, FiUserCheck, FiTrendingUp, FiClock, FiDollarSign, FiBriefcase } from 'react-icons/fi';

export default function HRDashboard() {
  const router = useRouter();
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInstructors();
  }, []);

  const fetchInstructors = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await instructorsService.getAll();
      const instructorsData = Array.isArray(response.data) ? response.data : (response.data as any)?.data || [];
      setInstructors(instructorsData);
    } catch (err: any) {
      console.error('Error fetching instructors:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to load people';
      setError(errorMessage);
      setInstructors([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate metrics
  const totalPeople = instructors.length;
  const hourlyInstructors = instructors.filter((i) => i.costType === 'hourly').length;
  const monthlyInstructors = instructors.filter((i) => i.costType === 'monthly').length;
  
  // Calculate total classes assigned
  const totalClasses = instructors.reduce((sum, instructor) => {
    return sum + (instructor.classes?.length || 0);
  }, 0);

  // Calculate average utilization (simplified - would need session data)
  const avgUtilization = totalPeople > 0 ? (totalClasses / totalPeople).toFixed(1) : '0';

  // Calculate total fees (read-only from Finance)
  const totalHourlyFees = instructors
    .filter((i) => i.costType === 'hourly')
    .reduce((sum, i) => sum + (i.costAmount || 0), 0);
  const totalMonthlyFees = instructors
    .filter((i) => i.costType === 'monthly')
    .reduce((sum, i) => sum + (i.costAmount || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading HR dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <FiBriefcase className="w-8 h-8 text-indigo-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">HR Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Manage people, track availability, and monitor performance</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          title="Total People"
          value={totalPeople}
          icon={<FiUsers className="w-5 h-5" />}
        />
        <SummaryCard
          title="Hourly"
          value={hourlyInstructors}
          variant="info"
          icon={<FiClock className="w-5 h-5" />}
        />
        <SummaryCard
          title="Monthly"
          value={monthlyInstructors}
          variant="warning"
          icon={<FiDollarSign className="w-5 h-5" />}
        />
        <SummaryCard
          title="Avg Utilization"
          value={`${avgUtilization} classes`}
          variant="success"
          icon={<FiTrendingUp className="w-5 h-5" />}
        />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Classes Assigned</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{totalClasses}</p>
              <p className="text-xs text-gray-500 mt-1">Across all instructors</p>
            </div>
            <FiUserCheck className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Fees Overview</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {hourlyInstructors > 0 ? `${hourlyInstructors} hourly` : 'N/A'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {monthlyInstructors > 0 ? `${monthlyInstructors} monthly` : ''}
              </p>
            </div>
            <FiDollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-3">Fee Model Distribution</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Hourly Rate</span>
                <span className="text-sm font-medium text-gray-900">{hourlyInstructors}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Monthly Salary</span>
                <span className="text-sm font-medium text-gray-900">{monthlyInstructors}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/dashboard/hr/people')}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700"
          >
            Manage People
          </button>
          <button
            onClick={() => router.push('/dashboard/hr/availability')}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50"
          >
            View Availability
          </button>
        </div>
      </div>
    </div>
  );
}

