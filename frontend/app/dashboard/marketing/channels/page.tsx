'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { marketingService, ChannelAccount } from '@/lib/services';
import StandardListView, { FilterConfig } from '@/components/StandardListView';
import { Column, ActionButton } from '@/components/DataTable';
import SummaryCard from '@/components/SummaryCard';
import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/settings/StatusBadge';
import { FiLink, FiPlus, FiEdit, FiTrash2, FiCheckCircle, FiXCircle, FiAlertCircle, FiFacebook, FiInstagram, FiMessageCircle } from 'react-icons/fi';

export default function ChannelsPage() {
  const router = useRouter();
  const [channels, setChannels] = useState<ChannelAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await marketingService.getChannelAccounts();
      setChannels(response.data);
    } catch (err: any) {
      console.error('Error fetching channels:', err);
      setError(err.response?.data?.message || 'Failed to load channels');
    } finally {
      setLoading(false);
    }
  };

  const filteredChannels = channels.filter((channel) => {
    const matchesSearch =
      searchTerm === '' ||
      channel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      channel.platform.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === '' || channel.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate metrics
  const totalChannels = channels.length;
  const connectedCount = channels.filter((c) => c.status === 'connected').length;
  const disconnectedCount = channels.filter((c) => c.status === 'disconnected').length;
  const errorCount = channels.filter((c) => c.status === 'error').length;
  const totalConversations = channels.reduce((sum, c) => sum + (c._count?.conversations || 0), 0);

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook_page':
        return <FiFacebook className="w-5 h-5 text-blue-600" />;
      case 'instagram_business':
        return <FiInstagram className="w-5 h-5 text-pink-600" />;
      case 'whatsapp_business':
        return <FiMessageCircle className="w-5 h-5 text-green-600" />;
      default:
        return <FiLink className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; status: 'active' | 'warning' | 'inactive' | 'error' }> = {
      connected: { label: 'Connected', status: 'active' },
      disconnected: { label: 'Disconnected', status: 'inactive' },
      error: { label: 'Error', status: 'error' },
    };
    const config = statusMap[status] || { label: status, status: 'active' };
    return <StatusBadge status={config.status} label={config.label} />;
  };

  const columns: Column<ChannelAccount>[] = [
    {
      key: 'name',
      label: 'Channel',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-3">
          {getPlatformIcon(row.platform)}
          <div>
            <p className="text-sm font-medium text-gray-900">{String(value)}</p>
            <p className="text-xs text-gray-500 capitalize">
              {row.platform.replace('_', ' ')}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => getStatusBadge(String(value)),
    },
    {
      key: 'conversations',
      label: 'Conversations',
      render: (_, row) => (
        <span className="text-sm font-medium text-gray-900">
          {row._count?.conversations || 0}
        </span>
      ),
    },
    {
      key: 'campaigns',
      label: 'Campaigns',
      render: (_, row) => (
        <span className="text-sm text-gray-600">
          {row._count?.campaigns || 0}
        </span>
      ),
    },
    {
      key: 'lastSyncAt',
      label: 'Last Sync',
      render: (value) => (
        <span className="text-sm text-gray-600">
          {value ? new Date(String(value)).toLocaleDateString() : 'Never'}
        </span>
      ),
    },
    {
      key: 'connectedAt',
      label: 'Connected',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-600">
          {new Date(String(value)).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const filters: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: '', label: 'All Statuses' },
        { value: 'connected', label: `Connected (${connectedCount})` },
        { value: 'disconnected', label: `Disconnected (${disconnectedCount})` },
        { value: 'error', label: `Error (${errorCount})` },
      ],
      value: statusFilter,
      onChange: setStatusFilter,
    },
  ];

  const actions = (row: ChannelAccount): ActionButton[] => [
    {
      label: 'View',
      onClick: () => {
        // TODO: Navigate to channel details
        alert('Channel details coming soon');
      },
      icon: <FiLink className="w-4 h-4" />,
    },
    {
      label: 'Edit',
      onClick: () => {
        // TODO: Open edit modal
        alert('Edit channel coming soon');
      },
      icon: <FiEdit className="w-4 h-4" />,
    },
  ];

  return (
    <StandardListView
      title="Channels"
      subtitle="Manage connected social media accounts"
      primaryAction={{
        label: 'Connect Channel',
        onClick: () => {
          // TODO: Open connect channel modal/OAuth flow
          alert('Connect channel functionality coming soon');
        },
        icon: <FiPlus className="w-4 h-4" />,
      }}
      searchPlaceholder="Search by channel name or platform..."
      onSearch={setSearchTerm}
      searchValue={searchTerm}
      filters={filters}
      columns={columns}
      data={filteredChannels}
      loading={loading}
      actions={actions}
      emptyMessage="No channels found"
      emptyState={
        <EmptyState
          icon={<FiLink className="w-12 h-12 text-gray-400" />}
          title="No channels connected"
          message="Connect your social media accounts to start receiving conversations"
          action={{
            label: 'Connect Channel',
            onClick: () => {
              alert('Connect channel functionality coming soon');
            },
          }}
        />
      }
      summaryCards={
        <>
          <SummaryCard
            title="Total Channels"
            value={totalChannels}
            icon={<FiLink className="w-5 h-5" />}
          />
          <SummaryCard
            title="Connected"
            value={connectedCount}
            icon={<FiCheckCircle className="w-5 h-5" />}
          />
          <SummaryCard
            title="Disconnected"
            value={disconnectedCount}
            variant="warning"
            icon={<FiXCircle className="w-5 h-5" />}
          />
          <SummaryCard
            title="Total Conversations"
            value={totalConversations}
            variant="info"
            icon={<FiMessageCircle className="w-5 h-5" />}
          />
        </>
      }
      getRowId={(row) => row.id}
    />
  );
}

