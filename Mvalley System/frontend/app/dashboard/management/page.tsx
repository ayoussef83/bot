'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

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
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">Error: {error}</div>;
  }

  if (!data) {
    return <div className="p-6">No data available</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Management Dashboard</h1>

      {/* Simple Chart Representation */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Revenue Trend (Last 7 Months)</h2>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="h-64 flex items-end justify-between space-x-2">
            {[100, 120, 90, 150, 130, 180, 160].map((value, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-indigo-500 rounded-t hover:bg-indigo-600 transition-colors cursor-pointer"
                  style={{ height: `${(value / 200) * 100}%` }}
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Monthly Revenue</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            EGP {data.monthlyRevenue?.toLocaleString() || 0}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Active Students</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {data.activeStudents || 0}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Avg Students/Session</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {data.avgStudentsPerSession?.toFixed(1) || 0}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Instructor Utilization</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {data.instructorUtilization?.toFixed(1) || 0}%
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Class Fill Rate</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {data.classFillRate?.toFixed(1) || 0}%
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Cash In</h3>
          <p className="text-2xl font-bold text-green-600 mt-2">
            EGP {data.cashIn?.toLocaleString() || 0}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Cash Out</h3>
          <p className="text-2xl font-bold text-red-600 mt-2">
            EGP {data.cashOut?.toLocaleString() || 0}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Net</h3>
          <p className={`text-2xl font-bold mt-2 ${
            (data.net || 0) >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            EGP {data.net?.toLocaleString() || 0}
          </p>
        </div>
      </div>
    </div>
  );
}

