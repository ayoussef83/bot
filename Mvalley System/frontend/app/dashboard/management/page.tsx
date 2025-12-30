'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import SummaryCard from '@/components/SummaryCard';
import { FiDollarSign, FiUsers, FiTrendingUp, FiUserCheck, FiBookOpen, FiArrowDown, FiArrowUp } from 'react-icons/fi';

export default function ManagementDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/dashboard/management');
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

  // Revenue Trend Chart (Simple Bar Chart)
  const revenueData = [100, 120, 90, 150, 130, 180, 160];
  const maxRevenue = Math.max(...revenueData);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Management Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of key metrics and performance indicators</p>
      </div>

      {/* Revenue Trend Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend (Last 7 Months)</h2>
        <div className="h-64 flex items-end justify-between space-x-2">
          {revenueData.map((value, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-indigo-500 rounded-t hover:bg-indigo-600 transition-colors cursor-pointer"
                style={{ height: `${(value / maxRevenue) * 100}%` }}
                title={`Month ${index + 1}: EGP ${value * 1000}`}
              />
              <span className="text-xs text-gray-500 mt-2">M{index + 1}</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-4 text-center">
          * Chart shows relative revenue trends. Connect to real data API for actual values.
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Monthly Revenue"
          value={`EGP ${(data.monthlyRevenue || 0).toLocaleString()}`}
          icon={<FiDollarSign className="w-5 h-5" />}
          trend={data.monthlyRevenueTrend}
        />
        <SummaryCard
          label="Active Students"
          value={(data.activeStudents || 0).toString()}
          icon={<FiUsers className="w-5 h-5" />}
          trend={data.activeStudentsTrend}
        />
        <SummaryCard
          label="Avg Students/Session"
          value={(data.avgStudentsPerSession || 0).toFixed(1)}
          icon={<FiTrendingUp className="w-5 h-5" />}
        />
        <SummaryCard
          label="Instructor Utilization"
          value={`${(data.instructorUtilization || 0).toFixed(1)}%`}
          icon={<FiUserCheck className="w-5 h-5" />}
        />
        <SummaryCard
          label="Class Fill Rate"
          value={`${(data.classFillRate || 0).toFixed(1)}%`}
          icon={<FiBookOpen className="w-5 h-5" />}
        />
        <SummaryCard
          label="Cash In"
          value={`EGP ${(data.cashIn || 0).toLocaleString()}`}
          icon={<FiArrowUp className="w-5 h-5" />}
          variant="success"
        />
        <SummaryCard
          label="Cash Out"
          value={`EGP ${(data.cashOut || 0).toLocaleString()}`}
          icon={<FiArrowDown className="w-5 h-5" />}
          variant="danger"
        />
        <SummaryCard
          label="Net"
          value={`EGP ${(data.net || 0).toLocaleString()}`}
          icon={<FiDollarSign className="w-5 h-5" />}
          variant={(data.net || 0) >= 0 ? 'success' : 'danger'}
        />
      </div>
    </div>
  );
}
