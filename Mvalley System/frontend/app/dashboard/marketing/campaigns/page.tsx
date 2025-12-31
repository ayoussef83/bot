'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { marketingService, Campaign, ChannelAccount } from '@/lib/services';
import StandardListView, { FilterConfig } from '@/components/StandardListView';
import { Column, ActionButton } from '@/components/DataTable';
import SummaryCard from '@/components/SummaryCard';
import EmptyState from '@/components/EmptyState';
import { FiTrendingUp, FiPlus, FiEdit, FiTrash2, FiCheckCircle, FiPause, FiXCircle, FiMessageCircle, FiX } from 'react-icons/fi';
import StatusBadge from '@/components/settings/StatusBadge';

interface CreateCampaignDto {
  name: string;
  description?: string;
  type: string;
  status?: string;
  startDate: string;
  endDate?: string;
  budget?: number;
  channelAccountId: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
}

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [channelAccounts, setChannelAccounts] = useState<ChannelAccount[]>([]);
  const [formData, setFormData] = useState<CreateCampaignDto>({
    name: '',
    description: '',
    type: 'organic_post',
    status: 'active',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    budget: undefined,
    channelAccountId: '',
    utmSource: '',
    utmMedium: '',
    utmCampaign: '',
    utmContent: '',
    utmTerm: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    if (showCreateModal) {
      fetchChannelAccounts();
    }
  }, [showCreateModal]);

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

  const fetchChannelAccounts = async () => {
    try {
      const response = await marketingService.getChannelAccounts();
      const activeAccounts = response.data.filter((acc) => acc.status === 'active');
      setChannelAccounts(activeAccounts);
      if (activeAccounts.length > 0 && !formData.channelAccountId) {
        setFormData({ ...formData, channelAccountId: activeAccounts[0].id });
      }
    } catch (err: any) {
      console.error('Error fetching channel accounts:', err);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    // Validation
    const errors: Record<string, string> = {};
    if (!formData.name || formData.name.trim() === '') {
      errors.name = 'Campaign name is required';
    }
    if (!formData.channelAccountId) {
      errors.channelAccountId = 'Channel account is required';
    }
    if (!formData.startDate) {
      errors.startDate = 'Start date is required';
    }
    if (formData.endDate && new Date(formData.endDate) < new Date(formData.startDate)) {
      errors.endDate = 'End date must be after start date';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const campaignData: any = {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        type: formData.type,
        status: formData.status || 'active',
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        budget: formData.budget ? parseFloat(String(formData.budget)) : undefined,
        channelAccountId: formData.channelAccountId,
        utmSource: formData.utmSource?.trim() || undefined,
        utmMedium: formData.utmMedium?.trim() || undefined,
        utmCampaign: formData.utmCampaign?.trim() || undefined,
        utmContent: formData.utmContent?.trim() || undefined,
        utmTerm: formData.utmTerm?.trim() || undefined,
      };

      await marketingService.createCampaign(campaignData);

      setShowCreateModal(false);
      setFormData({
        name: '',
        description: '',
        type: 'organic_post',
        status: 'active',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        budget: undefined,
        channelAccountId: '',
        utmSource: '',
        utmMedium: '',
        utmCampaign: '',
        utmContent: '',
        utmTerm: '',
      });
      setFormErrors({});
      await fetchCampaigns();
    } catch (err: any) {
      console.error('Error creating campaign:', err);
      setFormErrors({ submit: err.response?.data?.message || 'Failed to create campaign' });
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
    <>
      <StandardListView
        title="Campaigns"
        subtitle="Track marketing campaigns and their performance"
        primaryAction={{
          label: 'Create Campaign',
          onClick: () => {
            setShowCreateModal(true);
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
            message="Create your first marketing campaign to start tracking performance"
            action={{
              label: 'Create Campaign',
              onClick: () => {
                setShowCreateModal(true);
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

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => {
                setShowCreateModal(false);
                setFormData({
                  name: '',
                  description: '',
                  type: 'organic_post',
                  status: 'active',
                  startDate: new Date().toISOString().split('T')[0],
                  endDate: '',
                  budget: undefined,
                  channelAccountId: '',
                  utmSource: '',
                  utmMedium: '',
                  utmCampaign: '',
                  utmContent: '',
                  utmTerm: '',
                });
                setFormErrors({});
              }}
            ></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Create Campaign</h2>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setFormData({
                        name: '',
                        description: '',
                        type: 'organic_post',
                        status: 'active',
                        startDate: new Date().toISOString().split('T')[0],
                        endDate: '',
                        budget: undefined,
                        channelAccountId: '',
                        utmSource: '',
                        utmMedium: '',
                        utmCampaign: '',
                        utmContent: '',
                        utmTerm: '',
                      });
                      setFormErrors({});
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleCreateCampaign} className="space-y-4">
                  {formErrors.submit && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                      {formErrors.submit}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Campaign Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                        formErrors.name ? 'border-red-300' : ''
                      }`}
                      placeholder="e.g., Summer 2024 Promotion"
                      required
                    />
                    {formErrors.name && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      rows={3}
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Brief description of the campaign"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Campaign Type *</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        required
                      >
                        <option value="organic_post">Organic Post</option>
                        <option value="paid_ad">Paid Ad</option>
                        <option value="story">Story</option>
                        <option value="reel">Reel</option>
                        <option value="whatsapp_broadcast">WhatsApp Broadcast</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Channel Account *</label>
                    <select
                      value={formData.channelAccountId}
                      onChange={(e) => setFormData({ ...formData, channelAccountId: e.target.value })}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                        formErrors.channelAccountId ? 'border-red-300' : ''
                      }`}
                      required
                    >
                      <option value="">Select Channel Account</option>
                      {channelAccounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name} ({account.platform})
                        </option>
                      ))}
                    </select>
                    {formErrors.channelAccountId && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.channelAccountId}</p>
                    )}
                    {channelAccounts.length === 0 && (
                      <p className="mt-1 text-xs text-gray-500">
                        No active channel accounts. Create one in Channels first.
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Start Date *</label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                          formErrors.startDate ? 'border-red-300' : ''
                        }`}
                        required
                      />
                      {formErrors.startDate && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.startDate}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">End Date (Optional)</label>
                      <input
                        type="date"
                        value={formData.endDate || ''}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                          formErrors.endDate ? 'border-red-300' : ''
                        }`}
                        min={formData.startDate}
                      />
                      {formErrors.endDate && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.endDate}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Budget (Optional)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.budget || ''}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value ? parseFloat(e.target.value) : undefined })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">UTM Parameters (Optional)</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">UTM Source</label>
                        <input
                          type="text"
                          value={formData.utmSource || ''}
                          onChange={(e) => setFormData({ ...formData, utmSource: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          placeholder="e.g., facebook"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">UTM Medium</label>
                        <input
                          type="text"
                          value={formData.utmMedium || ''}
                          onChange={(e) => setFormData({ ...formData, utmMedium: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          placeholder="e.g., social"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">UTM Campaign</label>
                        <input
                          type="text"
                          value={formData.utmCampaign || ''}
                          onChange={(e) => setFormData({ ...formData, utmCampaign: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          placeholder="e.g., summer2024"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">UTM Content</label>
                        <input
                          type="text"
                          value={formData.utmContent || ''}
                          onChange={(e) => setFormData({ ...formData, utmContent: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          placeholder="e.g., ad_variant_1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">UTM Term</label>
                        <input
                          type="text"
                          value={formData.utmTerm || ''}
                          onChange={(e) => setFormData({ ...formData, utmTerm: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          placeholder="e.g., keyword"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false);
                        setFormData({
                          name: '',
                          description: '',
                          type: 'organic_post',
                          status: 'active',
                          startDate: new Date().toISOString().split('T')[0],
                          endDate: '',
                          budget: undefined,
                          channelAccountId: '',
                          utmSource: '',
                          utmMedium: '',
                          utmCampaign: '',
                          utmContent: '',
                          utmTerm: '',
                        });
                        setFormErrors({});
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
                    >
                      Create Campaign
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

