'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { marketingService, Campaign } from '@/lib/services';
import StandardListView, { FilterConfig } from '@/components/StandardListView';
import { Column, ActionButton } from '@/components/DataTable';
import SummaryCard from '@/components/SummaryCard';
import EmptyState from '@/components/EmptyState';
import { FiTrendingUp, FiPlus, FiEdit, FiTrash2, FiCheckCircle, FiPause, FiXCircle, FiMessageCircle } from 'react-icons/fi';
import StatusBadge from '@/components/settings/StatusBadge';

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await marketingService.getCampaigns();
      setCampaigns(response.data);
    } catch (err: any) {
      console.error('Error fetching campaigns:', err);
      setError(err.response?.data?.message || 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => {
      const matchesSearch =
        searchTerm === '' ||
        campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === '' || campaign.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [campaigns, searchTerm, statusFilter]);

  // Calculate metrics
  const totalCampaigns = campaigns.length;
  const activeCount = campaigns.filter((c) => c.status === 'active').length;
  const pausedCount = campaigns.filter((c) => c.status === 'paused').length;
  const completedCount = campaigns.filter((c) => c.status === 'completed').length;
  const totalConversations = campaigns.reduce((sum, c) => sum + (c._count?.conversations || 0), 0);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; status: 'active' | 'warning' | 'inactive' | 'error' }> = {
      active: { label: 'Active', status: 'active' },
      paused: { label: 'Paused', status: 'warning' },
      completed: { label: 'Completed', status: 'inactive' },
    };
    const config = statusMap[status] || { label: status, status: 'active' };
    return <StatusBadge status={config.status} label={config.label} />;
  };

  const columns: Column<Campaign>[] = [
    {
      key: 'name',
      label: 'Campaign',
      sortable: true,
      render: (value, row) => (
        <div>
          <p className="text-sm font-medium text-gray-900">{String(value)}</p>
          {row.description && (
            <p className="text-xs text-gray-500 mt-1">{row.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-700 capitalize">
          {String(value).replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => getStatusBadge(String(value)),
    },
    {
      key: 'startDate',
      label: 'Start Date',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-600">
          {new Date(String(value)).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'endDate',
      label: 'End Date',
      render: (value) => (
        <span className="text-sm text-gray-600">
          {value ? new Date(String(value)).toLocaleDateString() : '-'}
        </span>
      ),
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
      key: 'budget',
      label: 'Budget',
      render: (value, row) => (
        <span className="text-sm text-gray-600">
          {row.budget ? `$${row.budget.toLocaleString()}` : '-'}
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
        { value: 'active', label: `Active (${activeCount})` },
        { value: 'paused', label: `Paused (${pausedCount})` },
        { value: 'completed', label: `Completed (${completedCount})` },
      ],
      value: statusFilter,
      onChange: setStatusFilter,
    },
  ];

  const actions = (row: Campaign): ActionButton[] => [
    {
      label: 'View',
      onClick: () => {
        router.push(`/dashboard/marketing/campaigns/details?id=${row.id}`);
      },
      icon: <FiTrendingUp className="w-4 h-4" />,
    },
  ];

  return (
    <StandardListView
      title="Campaigns"
      subtitle="Track marketing campaigns and their performance"
      primaryAction={{
        label: 'Create Campaign',
        onClick: () => {
          // TODO: Open create campaign modal
          alert('Create campaign functionality coming soon');
        },
        icon: <FiPlus className="w-4 h-4" />,
      }}
      searchPlaceholder="Search by campaign name or description..."
      onSearch={setSearchTerm}
      searchValue={searchTerm}
      filters={filters}
      columns={columns}
      data={filteredCampaigns}
      loading={loading}
      actions={actions}
      emptyMessage="No campaigns found"
      emptyState={
        <EmptyState
          icon={<FiTrendingUp className="w-12 h-12 text-gray-400" />}
          title="No campaigns"
          description="Create your first marketing campaign to start tracking performance"
          action={{
            label: 'Create Campaign',
            onClick: () => {
              alert('Create campaign functionality coming soon');
            },
          }}
        />
      }
      summaryCards={
        <>
          <SummaryCard
            title="Total Campaigns"
            value={totalCampaigns}
            icon={<FiTrendingUp className="w-5 h-5" />}
          />
          <SummaryCard
            title="Active"
            value={activeCount}
            variant="success"
            icon={<FiCheckCircle className="w-5 h-5" />}
          />
          <SummaryCard
            title="Paused"
            value={pausedCount}
            variant="warning"
            icon={<FiPause className="w-5 h-5" />}
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
      onRowClick={(row) => {
        router.push(`/dashboard/marketing/campaigns/details?id=${row.id}`);
      }}
    />
  );
}

