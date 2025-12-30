'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import StandardListView, { FilterConfig } from '@/components/StandardListView';
import { Column } from '@/components/DataTable';
import DataTable from '@/components/DataTable';
import SummaryCard from '@/components/SummaryCard';
import StatusBadge from '@/components/settings/StatusBadge';
import { FiMail, FiMessageSquare, FiCheckCircle, FiXCircle, FiClock, FiUser } from 'react-icons/fi';

interface Notification {
  id: string;
  channel: 'email' | 'sms';
  status: 'pending' | 'sent' | 'failed' | 'delivered';
  recipient: string;
  subject?: string;
  body: string;
  studentId?: string;
  leadId?: string;
  student?: any;
  lead?: any;
  createdAt: string;
  sentAt?: string;
  errorMessage?: string;
}

export default function CommunicationsLogsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Read URL params on mount (client-side only)
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const channel = params.get('channel');
        const status = params.get('status');
        if (channel) setChannelFilter(channel);
        if (status) setStatusFilter(status);
      }
    } catch (e) {
      console.error('Error reading URL params:', e);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [channelFilter, statusFilter]);

  const fetchNotifications = async () => {
    setError('');
    setLoading(true);
    try {
      const params: any = {};
      if (channelFilter) params.channel = channelFilter;
      if (statusFilter) params.status = statusFilter;
      const response = await api.get('/notifications', { params });
      setNotifications(response.data);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load message logs');
    } finally {
      setLoading(false);
    }
  };

  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch =
      searchTerm === '' ||
      notification.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.body.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (notification.subject || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Table columns
  const columns: Column<Notification>[] = [
    {
      key: 'channel',
      label: 'Channel',
      render: (value) => (
        <div className="flex items-center gap-2">
          {value === 'email' ? (
            <FiMail className="w-4 h-4 text-blue-600" />
          ) : (
            <FiMessageSquare className="w-4 h-4 text-green-600" />
          )}
          <span className="text-sm text-gray-700 capitalize">{value}</span>
        </div>
      ),
    },
    {
      key: 'recipient',
      label: 'Recipient',
      render: (value, row) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{value}</div>
          {row.student && (
            <div className="text-xs text-gray-500">
              Student: {row.student.firstName} {row.student.lastName}
            </div>
          )}
          {row.lead && (
            <div className="text-xs text-gray-500">
              Lead: {row.lead.firstName} {row.lead.lastName}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'subject',
      label: 'Subject',
      render: (value, row) => (
        <span className="text-sm text-gray-600">
          {row.channel === 'email' ? (value || '-') : '-'}
        </span>
      ),
    },
    {
      key: 'body',
      label: 'Message',
      render: (value) => {
        try {
          if (value === null || value === undefined) {
            return <span className="text-sm text-gray-400">-</span>;
          }
          const text = String(value || '');
          if (!text || text.length === 0) {
            return <span className="text-sm text-gray-400">-</span>;
          }
          return (
            <span className="text-sm text-gray-600 line-clamp-2">
              {text.substring(0, 100)}
              {text.length > 100 ? '...' : ''}
            </span>
          );
        } catch (e) {
          return <span className="text-sm text-gray-400">-</span>;
        }
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => {
        const statusMap: { [key: string]: 'active' | 'inactive' | 'warning' | 'error' } = {
          sent: 'active',
          delivered: 'active',
          pending: 'warning',
          failed: 'inactive',
        };
        return <StatusBadge status={statusMap[value] || 'inactive'} label={value} />;
      },
    },
    {
      key: 'createdAt',
      label: 'Sent At',
      render: (value, row) => (
        <div className="text-sm text-gray-500">
          <div>{new Date(value).toLocaleDateString()}</div>
          <div className="text-xs">{new Date(value).toLocaleTimeString()}</div>
        </div>
      ),
    },
  ];

  // Summary cards
  const totalMessages = filteredNotifications.length;
  const emailCount = filteredNotifications.filter((n) => n.channel === 'email').length;
  const smsCount = filteredNotifications.filter((n) => n.channel === 'sms').length;
  const sentCount = filteredNotifications.filter((n) => n.status === 'sent' || n.status === 'delivered').length;
  const failedCount = filteredNotifications.filter((n) => n.status === 'failed').length;

  const summaryCards = [
    {
      title: 'Total Messages',
      value: totalMessages,
      icon: <FiMessageSquare className="w-5 h-5" />,
    },
    {
      title: 'Email',
      value: emailCount,
      icon: <FiMail className="w-5 h-5" />,
    },
    {
      title: 'SMS',
      value: smsCount,
      icon: <FiMessageSquare className="w-5 h-5" />,
    },
    {
      title: 'Sent',
      value: sentCount,
      icon: <FiCheckCircle className="w-5 h-5" />,
    },
    {
      title: 'Failed',
      value: failedCount,
      icon: <FiXCircle className="w-5 h-5" />,
    },
  ];

  // Filters
  const filters: FilterConfig[] = [
    {
      key: 'channel',
      label: 'Channel',
      type: 'select',
      options: [
        { value: '', label: 'All Channels' },
        { value: 'email', label: 'Email' },
        { value: 'sms', label: 'SMS' },
      ],
      value: channelFilter,
      onChange: setChannelFilter,
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: '', label: 'All Statuses' },
        { value: 'sent', label: 'Sent' },
        { value: 'delivered', label: 'Delivered' },
        { value: 'pending', label: 'Pending' },
        { value: 'failed', label: 'Failed' },
      ],
      value: statusFilter,
      onChange: setStatusFilter,
    },
  ];

  // Don't render until mounted (prevents hydration errors)
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <StandardListView
      title="Message Logs"
      subtitle="View all sent emails and SMS messages"
      summaryCards={
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {summaryCards.map((card, idx) => (
            <SummaryCard key={idx} {...card} />
          ))}
        </div>
      }
      filters={filters}
      columns={columns}
      data={filteredNotifications}
      searchValue={searchTerm}
      onSearch={setSearchTerm}
      loading={loading}
      emptyMessage="No messages found"
    />
  );
}

