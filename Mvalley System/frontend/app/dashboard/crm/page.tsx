'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { salesService, Lead } from '@/lib/services';
import SummaryCard from '@/components/SummaryCard';
import { FiTrendingUp, FiUsers, FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';

export default function CRMDashboard() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const response = await salesService.getLeads();
      setLeads(response.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  // Calculate metrics
  const totalLeads = leads.length;
  const newLeads = leads.filter((l) => l.status === 'new').length;
  const contactedLeads = leads.filter((l) => l.status === 'contacted').length;
  const qualifiedLeads = leads.filter((l) => l.status === 'qualified').length;
  const convertedLeads = leads.filter((l) => l.status === 'converted').length;
  const lostLeads = leads.filter((l) => l.status === 'lost').length;
  
  // Conversion rate (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentLeads = leads.filter((l) => new Date(l.createdAt) >= thirtyDaysAgo);
  const recentConverted = recentLeads.filter((l) => l.status === 'converted').length;
  const conversionRate = recentLeads.length > 0 
    ? ((recentConverted / recentLeads.length) * 100).toFixed(1) 
    : '0';

  // Source breakdown
  const sourceCounts = leads.reduce((acc, lead) => {
    acc[lead.source] = (acc[lead.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Recent activities (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentActivity = leads.filter((l) => {
    const updated = l.updatedAt ? new Date(l.updatedAt) : new Date(l.createdAt);
    return updated >= sevenDaysAgo;
  }).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading CRM dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">CRM Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your sales pipeline and conversion metrics</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Pipeline Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <SummaryCard
          title="Total Leads"
          value={totalLeads}
          icon={<FiUsers className="w-5 h-5" />}
        />
        <SummaryCard
          title="New"
          value={newLeads}
          icon={<FiClock className="w-5 h-5" />}
          variant="info"
        />
        <SummaryCard
          title="Contacted"
          value={contactedLeads}
          icon={<FiUsers className="w-5 h-5" />}
          variant="warning"
        />
        <SummaryCard
          title="Qualified"
          value={qualifiedLeads}
          icon={<FiCheckCircle className="w-5 h-5" />}
          variant="warning"
        />
        <SummaryCard
          title="Converted"
          value={convertedLeads}
          icon={<FiCheckCircle className="w-5 h-5" />}
          variant="success"
        />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{conversionRate}%</p>
              <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
            </div>
            <FiTrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Recent Activity</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{recentActivity}</p>
              <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
            </div>
            <FiClock className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-3">Top Sources</p>
            <div className="space-y-2">
              {Object.entries(sourceCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([source, count]) => (
                  <div key={source} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 capitalize">{source}</span>
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/dashboard/crm/pipeline')}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700"
          >
            View Pipeline
          </button>
          <button
            onClick={() => router.push('/dashboard/crm/leads')}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50"
          >
            Manage Leads
          </button>
        </div>
      </div>
    </div>
  );
}

