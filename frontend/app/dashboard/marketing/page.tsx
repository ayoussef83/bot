'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { marketingService, MarketingOverview } from '@/lib/services';
import SummaryCard from '@/components/SummaryCard';
import { FiShare2, FiMessageCircle, FiTrendingUp, FiCheckCircle, FiClock, FiUsers, FiLink } from 'react-icons/fi';

export default function MarketingDashboard() {
  const router = useRouter();
  const [overview, setOverview] = useState<MarketingOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await marketingService.getOverview();
      setOverview(response.data);
    } catch (err: any) {
      console.error('Error fetching marketing overview:', err);
      setError(err.response?.data?.message || 'Failed to load marketing overview');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading marketing dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">No data available</div>
      </div>
    );
  }

  const { metrics, channelBreakdown, topCampaigns, recentConversations } = overview;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <FiShare2 className="w-8 h-8 text-indigo-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketing Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Overview of conversations, campaigns, and channel performance</p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Conversations"
          value={metrics.totalConversations}
          icon={<FiMessageCircle className="w-5 h-5" />}
        />
        <SummaryCard
          title="New"
          value={metrics.newConversations}
          variant="info"
          icon={<FiClock className="w-5 h-5" />}
        />
        <SummaryCard
          title="In Progress"
          value={metrics.inProgressConversations}
          variant="warning"
          icon={<FiUsers className="w-5 h-5" />}
        />
        <SummaryCard
          title="Converted"
          value={metrics.convertedConversations}
          variant="success"
          icon={<FiCheckCircle className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          title="Active Channels"
          value={metrics.totalChannels}
          icon={<FiLink className="w-5 h-5" />}
        />
        <SummaryCard
          title="Active Campaigns"
          value={metrics.activeCampaigns}
          icon={<FiTrendingUp className="w-5 h-5" />}
        />
        <SummaryCard
          title="Waiting Reply"
          value={metrics.waitingReplyConversations}
          variant="warning"
          icon={<FiClock className="w-5 h-5" />}
        />
      </div>

      {/* Channel Breakdown */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Channel Breakdown</h2>
        <div className="space-y-3">
          {channelBreakdown.map((channel) => (
            <div key={channel.platform} className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 capitalize">
                {channel.platform.replace('_', ' ')}
              </span>
              <span className="text-sm text-gray-900 font-semibold">
                {channel._count.id} conversations
              </span>
            </div>
          ))}
          {channelBreakdown.length === 0 && (
            <p className="text-sm text-gray-500">No channels connected yet</p>
          )}
        </div>
      </div>

      {/* Top Campaigns */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Top Campaigns</h2>
          <button
            onClick={() => router.push('/dashboard/marketing/campaigns')}
            className="text-sm text-indigo-600 hover:text-indigo-900"
          >
            View All
          </button>
        </div>
        <div className="space-y-3">
          {topCampaigns.map((campaign) => (
            <div key={campaign.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">{campaign.name}</p>
                <p className="text-xs text-gray-500 mt-1 capitalize">
                  {campaign.type.replace('_', ' ')} • {campaign.status}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {campaign._count?.conversations || 0}
                </p>
                <p className="text-xs text-gray-500">conversations</p>
              </div>
            </div>
          ))}
          {topCampaigns.length === 0 && (
            <p className="text-sm text-gray-500">No active campaigns</p>
          )}
        </div>
      </div>

      {/* Recent Conversations */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Conversations</h2>
          <button
            onClick={() => router.push('/dashboard/marketing/conversations')}
            className="text-sm text-indigo-600 hover:text-indigo-900"
          >
            View All
          </button>
        </div>
        <div className="space-y-3">
          {recentConversations.map((conversation) => (
            <div
              key={conversation.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
              onClick={() => router.push(`/dashboard/marketing/conversations/details?id=${conversation.id}`)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  {conversation.participant?.profilePictureUrl ? (
                    <img
                      src={conversation.participant.profilePictureUrl}
                      alt={conversation.participant.name || 'Participant'}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <span className="text-indigo-600 font-medium text-sm">
                      {conversation.participant?.name?.charAt(0).toUpperCase() || '?'}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {conversation.participant?.name || 'Unknown Participant'}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {conversation.platform.replace('_', ' ')} • {conversation.status.replace('_', ' ')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">
                  {new Date(conversation.lastMessageAt).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-400">
                  {conversation._count?.messages || 0} messages
                </p>
              </div>
            </div>
          ))}
          {recentConversations.length === 0 && (
            <p className="text-sm text-gray-500">No recent conversations</p>
          )}
        </div>
      </div>
    </div>
  );
}






