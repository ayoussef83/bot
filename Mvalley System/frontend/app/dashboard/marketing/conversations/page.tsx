'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { marketingService, Conversation } from '@/lib/services';
import StandardListView, { FilterConfig } from '@/components/StandardListView';
import { Column, ActionButton } from '@/components/DataTable';
import SummaryCard from '@/components/SummaryCard';
import EmptyState from '@/components/EmptyState';
import { FiMessageCircle, FiClock, FiUsers, FiCheckCircle, FiShare2 } from 'react-icons/fi';
import StatusBadge from '@/components/settings/StatusBadge';

export default function ConversationsPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await marketingService.getConversations();
      setConversations(response.data);
    } catch (err: any) {
      console.error('Error fetching conversations:', err);
      setError(err.response?.data?.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) => {
      const matchesSearch =
        searchTerm === '' ||
        conv.participant?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.participant?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.participant?.phone?.includes(searchTerm);
      
      const matchesStatus = statusFilter === '' || conv.status === statusFilter;
      const matchesPlatform = platformFilter === '' || conv.platform === platformFilter;

      return matchesSearch && matchesStatus && matchesPlatform;
    });
  }, [conversations, searchTerm, statusFilter, platformFilter]);

  // Calculate metrics
  const totalConversations = conversations.length;
  const newCount = conversations.filter((c) => c.status === 'new').length;
  const inProgressCount = conversations.filter((c) => c.status === 'in_progress').length;
  const waitingReplyCount = conversations.filter((c) => c.status === 'waiting_reply').length;
  const convertedCount = conversations.filter((c) => c.status === 'converted').length;

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; status: 'active' | 'warning' | 'inactive' | 'error' }> = {
      new: { label: 'New', status: 'active' },
      in_progress: { label: 'In Progress', status: 'warning' },
      waiting_reply: { label: 'Waiting Reply', status: 'warning' },
      converted: { label: 'Converted', status: 'inactive' },
      archived: { label: 'Archived', status: 'error' },
    };
    const config = statusMap[status] || { label: status, status: 'active' };
    return <StatusBadge status={config.status} label={config.label} />;
  };

  const columns: Column<Conversation>[] = [
    {
      key: 'participant',
      label: 'Participant',
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
            {row.participant?.profilePictureUrl ? (
              <img
                src={row.participant.profilePictureUrl}
                alt={row.participant.name || 'Participant'}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <span className="text-indigo-600 font-medium text-xs">
                {row.participant?.name?.charAt(0).toUpperCase() || '?'}
              </span>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {row.participant?.name || 'Unknown Participant'}
            </p>
            <p className="text-xs text-gray-500">
              {row.participant?.email || row.participant?.phone || 'No contact info'}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'platform',
      label: 'Platform',
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
      key: 'campaign',
      label: 'Campaign',
      render: (_, row) => (
        <span className="text-sm text-gray-700">
          {row.campaign?.name || '-'}
        </span>
      ),
    },
    {
      key: 'lastMessageAt',
      label: 'Last Message',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-600">
          {new Date(String(value)).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'messages',
      label: 'Messages',
      render: (_, row) => (
        <span className="text-sm text-gray-600">
          {row._count?.messages || 0}
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
        { value: 'new', label: `New (${newCount})` },
        { value: 'in_progress', label: `In Progress (${inProgressCount})` },
        { value: 'waiting_reply', label: `Waiting Reply (${waitingReplyCount})` },
        { value: 'converted', label: `Converted (${convertedCount})` },
      ],
      value: statusFilter,
      onChange: setStatusFilter,
    },
    {
      key: 'platform',
      label: 'Platform',
      type: 'select',
      options: [
        { value: '', label: 'All Platforms' },
        { value: 'facebook_page', label: 'Facebook' },
        { value: 'instagram_business', label: 'Instagram' },
        { value: 'whatsapp_business', label: 'WhatsApp' },
      ],
      value: platformFilter,
      onChange: setPlatformFilter,
    },
  ];

  const actions: ActionButton[] = [
    {
      label: 'View',
      onClick: (row: Conversation) => {
        router.push(`/dashboard/marketing/conversations/details?id=${row.id}`);
      },
      icon: <FiMessageCircle className="w-4 h-4" />,
    },
  ];

  return (
    <StandardListView
      title="Conversations"
      subtitle="Manage social media conversations from all channels"
      searchPlaceholder="Search by participant name, email, or phone..."
      onSearch={setSearchTerm}
      searchValue={searchTerm}
      filters={filters}
      columns={columns}
      data={filteredConversations}
      loading={loading}
      actions={actions}
      emptyMessage="No conversations found"
      emptyState={
        <EmptyState
          icon={<FiMessageCircle className="w-12 h-12 text-gray-400" />}
          title="No conversations"
          description="Connect your social media channels to start receiving conversations"
          action={{
            label: 'Connect Channels',
            onClick: () => router.push('/dashboard/marketing/channels'),
          }}
        />
      }
      summaryCards={
        <>
          <SummaryCard
            title="Total Conversations"
            value={totalConversations}
            icon={<FiMessageCircle className="w-5 h-5" />}
          />
          <SummaryCard
            title="New"
            value={newCount}
            variant="info"
            icon={<FiClock className="w-5 h-5" />}
          />
          <SummaryCard
            title="In Progress"
            value={inProgressCount}
            variant="warning"
            icon={<FiUsers className="w-5 h-5" />}
          />
          <SummaryCard
            title="Converted"
            value={convertedCount}
            variant="success"
            icon={<FiCheckCircle className="w-5 h-5" />}
          />
        </>
      }
      getRowId={(row) => row.id}
      onRowClick={(row) => {
        router.push(`/dashboard/marketing/conversations/details?id=${row.id}`);
      }}
    />
  );
}

