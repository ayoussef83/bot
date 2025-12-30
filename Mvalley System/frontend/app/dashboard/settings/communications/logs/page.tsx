'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import StandardListView, { FilterConfig } from '@/components/StandardListView';
import { Column } from '@/components/DataTable';
import DataTable from '@/components/DataTable';
import SummaryCard from '@/components/SummaryCard';
import StatusBadge from '@/components/settings/StatusBadge';
import SearchBar from '@/components/SearchBar';
import { FiMail, FiMessageSquare, FiCheckCircle, FiXCircle, FiClock, FiUser, FiAlertCircle, FiTrendingUp, FiTrendingDown, FiEye, FiChevronDown, FiChevronUp } from 'react-icons/fi';

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
  const [timeRange, setTimeRange] = useState('7d'); // 'today', '7d', '30d', 'custom'
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [selectedMessage, setSelectedMessage] = useState<Notification | null>(null);
  const [groupByDate, setGroupByDate] = useState(true);
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
  }, [channelFilter, statusFilter, timeRange]);

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

  // Filter by time range
  const getTimeRangeFilter = () => {
    if (timeRange === 'all') return () => true;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (timeRange) {
      case 'today':
        return (n: Notification) => new Date(n.createdAt) >= today;
      case '7d':
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return (n: Notification) => new Date(n.createdAt) >= sevenDaysAgo;
      case '30d':
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return (n: Notification) => new Date(n.createdAt) >= thirtyDaysAgo;
      default:
        return () => true;
    }
  };

  const filteredNotifications = notifications
    .filter(getTimeRangeFilter())
    .filter((notification) => {
      // Apply channel filter
      if (channelFilter && notification.channel !== channelFilter) return false;
      
      // Apply status filter
      if (statusFilter && notification.status !== statusFilter) return false;
      
      // Apply search filter
      const matchesSearch =
        searchTerm === '' ||
        notification.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.body.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (notification.subject || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => {
      // Prioritize: failed → pending → sent/delivered
      const statusPriority: { [key: string]: number } = {
        failed: 0,
        pending: 1,
        sent: 2,
        delivered: 2,
      };
      const aPriority = statusPriority[a.status] ?? 3;
      const bPriority = statusPriority[b.status] ?? 3;
      if (aPriority !== bPriority) return aPriority - bPriority;
      // Then sort by time (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // Group notifications by date
  const groupedByDate = filteredNotifications.reduce((acc, notification) => {
    const dateKey = new Date(notification.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(notification);
    return acc;
  }, {} as Record<string, Notification[]>);

  const dateGroups = Object.entries(groupedByDate).sort((a, b) => {
    // Sort by actual date, not string
    const dateA = new Date(a[1][0]?.createdAt || 0);
    const dateB = new Date(b[1][0]?.createdAt || 0);
    return dateB.getTime() - dateA.getTime();
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
      render: (value, row) => {
        try {
          if (value === null || value === undefined) {
            return <span className="text-sm text-gray-400">-</span>;
          }
          const text = String(value || '');
          if (!text || text.length === 0) {
            return <span className="text-sm text-gray-400">-</span>;
          }
          const isExpanded = expandedMessages.has(row.id);
          const preview = text.substring(0, 100);
          const hasMore = text.length > 100;
          
          return (
            <div className="text-sm text-gray-600">
              {isExpanded ? (
                <div>
                  <div className="whitespace-pre-wrap">{text}</div>
                  {hasMore && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedMessages((prev) => {
                          const next = new Set(prev);
                          next.delete(row.id);
                          return next;
                        });
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-700 mt-1"
                    >
                      Show less
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  <span className="line-clamp-2">{preview}{hasMore ? '...' : ''}</span>
                  {hasMore && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedMessages((prev) => new Set(prev).add(row.id));
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-700 mt-1"
                    >
                      Show more
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        } catch (e) {
          return <span className="text-sm text-gray-400">-</span>;
        }
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (value, row) => {
        const statusMap: { [key: string]: 'active' | 'inactive' | 'warning' | 'error' } = {
          sent: 'active',
          delivered: 'active',
          pending: 'warning',
          failed: 'error',
        };
        return (
          <div>
            <StatusBadge status={statusMap[value] || 'inactive'} label={value} />
            {row.errorMessage && (
              <div className="mt-1 text-xs text-red-600 max-w-xs truncate" title={row.errorMessage}>
                {row.errorMessage}
              </div>
            )}
          </div>
        );
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

  // Calculate health metrics from time-filtered data (before channel/status filters)
  const timeFilteredNotifications = notifications.filter(getTimeRangeFilter());
  const totalMessages = timeFilteredNotifications.length;
  const emailCount = timeFilteredNotifications.filter((n) => n.channel === 'email').length;
  const smsCount = timeFilteredNotifications.filter((n) => n.channel === 'sms').length;
  const sentCount = timeFilteredNotifications.filter((n) => n.status === 'sent' || n.status === 'delivered').length;
  const pendingCount = timeFilteredNotifications.filter((n) => n.status === 'pending').length;
  const failedCount = timeFilteredNotifications.filter((n) => n.status === 'failed').length;
  const successRate = totalMessages > 0 ? ((sentCount / totalMessages) * 100).toFixed(1) : '0';
  const hasFailures = failedCount > 0;
  const hasPending = pendingCount > 0;
  
  // Channel breakdown with failure counts
  const channelBreakdown = [
    { channel: 'email', count: emailCount, failures: timeFilteredNotifications.filter((n) => n.channel === 'email' && n.status === 'failed').length },
    { channel: 'sms', count: smsCount, failures: timeFilteredNotifications.filter((n) => n.channel === 'sms' && n.status === 'failed').length },
  ];

  // Filters with proper hierarchy: Time → Channel → Status
  const filters: FilterConfig[] = [
    {
      key: 'timeRange',
      label: 'Time Range',
      type: 'select',
      options: [
        { value: 'today', label: 'Today' },
        { value: '7d', label: 'Last 7 days' },
        { value: '30d', label: 'Last 30 days' },
        { value: 'all', label: 'All time' },
      ],
      value: timeRange,
      onChange: setTimeRange,
    },
    {
      key: 'channel',
      label: 'Channel',
      type: 'select',
      options: [
        { value: '', label: 'All Channels' },
        { value: 'email', label: `Email (${emailCount})` },
        { value: 'sms', label: `SMS (${smsCount})` },
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
        { value: 'failed', label: `Failed (${failedCount})` },
        { value: 'pending', label: `Pending (${pendingCount})` },
        { value: 'sent', label: `Sent (${sentCount})` },
        { value: 'delivered', label: 'Delivered' },
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
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Message Logs</h1>
        <p className="text-sm text-gray-500 mt-1">Monitor and investigate all sent messages</p>
      </div>

      {/* Health Dashboard Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Health Status Card */}
          <div
            className={`border rounded-lg p-6 ${
              hasFailures
                ? 'border-red-200 bg-red-50'
                : hasPending
                ? 'border-yellow-200 bg-yellow-50'
                : 'border-green-200 bg-green-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Status</p>
                <p className={`text-2xl font-bold mt-2 ${
                  hasFailures ? 'text-red-600' : hasPending ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {hasFailures ? `${failedCount} Failure${failedCount > 1 ? 's' : ''} Need Attention` : 
                   hasPending ? `${pendingCount} Pending` : 
                   'Healthy'}
                </p>
                {hasFailures && (
                  <button
                    onClick={() => setStatusFilter('failed')}
                    className="text-xs text-red-600 hover:text-red-700 mt-2 underline"
                  >
                    View failures →
                  </button>
                )}
              </div>
              {hasFailures ? (
                <FiAlertCircle className="w-8 h-8 text-red-600" />
              ) : (
                <FiCheckCircle className="w-8 h-8 text-green-600" />
              )}
            </div>
          </div>

          {/* Success Rate Card */}
          <div className="border border-gray-200 rounded-lg p-6 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{successRate}%</p>
                <p className="text-xs text-gray-500 mt-1">
                  {sentCount} of {totalMessages} messages
                </p>
              </div>
              {parseFloat(successRate) >= 95 ? (
                <FiTrendingUp className="w-8 h-8 text-green-600" />
              ) : (
                <FiTrendingDown className="w-8 h-8 text-yellow-600" />
              )}
            </div>
          </div>

          {/* Channel Breakdown Card */}
          <div className="border border-gray-200 rounded-lg p-6 bg-white">
            <p className="text-sm font-medium text-gray-600 mb-3">Channel Breakdown</p>
            <div className="space-y-2">
              {channelBreakdown.map((ch) => (
                <div key={ch.channel} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {ch.channel === 'email' ? (
                      <FiMail className="w-4 h-4 text-blue-600" />
                    ) : (
                      <FiMessageSquare className="w-4 h-4 text-green-600" />
                    )}
                    <span className="text-sm font-medium text-gray-700 capitalize">{ch.channel}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-900">{ch.count}</span>
                    {ch.failures > 0 && (
                      <span className="text-xs text-red-600">({ch.failures} failed)</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Investigation Tools Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="max-w-md flex-1">
            <SearchBar
              placeholder="Search recipient, message, or subject..."
              value={searchTerm}
              onChange={setSearchTerm}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={groupByDate}
                onChange={(e) => setGroupByDate(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              Group by date
            </label>
          </div>
        </div>
        {filters && filters.length > 0 && (
          <div className="flex gap-4">
            {filters.map((filter) => (
              <div key={filter.key} className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {filter.label}
                </label>
                {filter.type === 'select' && filter.options ? (
                  <select
                    value={filter.value}
                    onChange={(e) => filter.onChange(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="">All</option>
                    {filter.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grouped Table View */}
      {loading ? (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-gray-500">Loading messages...</div>
        </div>
      ) : groupByDate && dateGroups.length > 0 ? (
        <div className="space-y-4">
          {dateGroups.map(([date, messages]) => {
            const isExpanded = expandedDates.has(date);
            const statusCounts = {
              failed: messages.filter((m) => m.status === 'failed').length,
              pending: messages.filter((m) => m.status === 'pending').length,
              sent: messages.filter((m) => m.status === 'sent' || m.status === 'delivered').length,
            };
            
            return (
              <div key={date} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <button
                  onClick={() => {
                    setExpandedDates((prev) => {
                      const next = new Set(prev);
                      if (next.has(date)) {
                        next.delete(date);
                      } else {
                        next.add(date);
                      }
                      return next;
                    });
                  }}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {isExpanded ? (
                      <FiChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <FiChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                    <div className="text-left">
                      <div className="text-sm font-semibold text-gray-900">{date}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {messages.length} message{messages.length !== 1 ? 's' : ''}
                        {statusCounts.failed > 0 && (
                          <span className="ml-2 text-red-600">
                            • {statusCounts.failed} failed
                          </span>
                        )}
                        {statusCounts.pending > 0 && (
                          <span className="ml-2 text-yellow-600">
                            • {statusCounts.pending} pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
                {isExpanded && (
                  <div className="border-t border-gray-200">
                    <DataTable
                      columns={columns}
                      data={messages}
                      actions={(row) => [
                        {
                          label: 'View Details',
                          onClick: () => setSelectedMessage(row),
                          variant: 'primary' as const,
                          icon: <FiEye className="w-4 h-4" />,
                        },
                      ]}
                      emptyMessage="No messages"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : filteredNotifications.length > 0 ? (
        <DataTable
          columns={columns}
          data={filteredNotifications}
          actions={(row) => [
            {
              label: 'View Details',
              onClick: () => setSelectedMessage(row),
              variant: 'primary' as const,
              icon: <FiEye className="w-4 h-4" />,
            },
          ]}
          emptyMessage="No messages found"
        />
      ) : (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No messages found</p>
        </div>
      )}

      {/* Message Details Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setSelectedMessage(null)}
            ></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Message Details</h3>
                  <button
                    onClick={() => setSelectedMessage(null)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <FiXCircle className="w-6 h-6" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Channel</label>
                      <div className="mt-1 flex items-center gap-2">
                        {selectedMessage.channel === 'email' ? (
                          <FiMail className="w-4 h-4 text-blue-600" />
                        ) : (
                          <FiMessageSquare className="w-4 h-4 text-green-600" />
                        )}
                        <span className="text-sm text-gray-900 capitalize">{selectedMessage.channel}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Status</label>
                      <div className="mt-1">
                        <StatusBadge
                          status={
                            selectedMessage.status === 'failed'
                              ? 'error'
                              : selectedMessage.status === 'pending'
                              ? 'warning'
                              : 'active'
                          }
                          label={selectedMessage.status}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Recipient</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedMessage.recipient}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Sent At</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {new Date(selectedMessage.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {selectedMessage.subject && (
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-500">Subject</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedMessage.subject}</p>
                      </div>
                    )}
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-500">Message</label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">
                          {selectedMessage.body || '-'}
                        </p>
                      </div>
                    </div>
                    {selectedMessage.errorMessage && (
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-red-600">Error Message</label>
                        <div className="mt-1 p-3 bg-red-50 rounded-md border border-red-200">
                          <p className="text-sm text-red-800">{selectedMessage.errorMessage}</p>
                        </div>
                      </div>
                    )}
                    {(selectedMessage.student || selectedMessage.lead) && (
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-500">Associated</label>
                        <div className="mt-1">
                          {selectedMessage.student && (
                            <p className="text-sm text-gray-900">
                              Student: {selectedMessage.student.firstName} {selectedMessage.student.lastName}
                            </p>
                          )}
                          {selectedMessage.lead && (
                            <p className="text-sm text-gray-900">
                              Lead: {selectedMessage.lead.firstName} {selectedMessage.lead.lastName}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setSelectedMessage(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

