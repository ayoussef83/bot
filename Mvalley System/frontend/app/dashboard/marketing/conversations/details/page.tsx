'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { marketingService, Conversation, Message } from '@/lib/services';
import StandardDetailView from '@/components/StandardDetailView';
import StatusBadge from '@/components/settings/StatusBadge';
import { FiMessageCircle, FiUser, FiShare2, FiTrendingUp, FiCheckCircle, FiClock, FiSend, FiArrowLeft } from 'react-icons/fi';

interface Breadcrumb {
  label: string;
  href: string;
}

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export default function ConversationDetailPage() {
  const router = useRouter();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertData, setConvertData] = useState({
    existingLeadId: '',
    createNewLead: true,
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: '',
  });

  // Get conversation ID from URL query params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      if (id) {
        fetchConversation(id);
        fetchMessages(id);
      } else {
        setError('Conversation ID not found');
        setLoading(false);
      }
    }
  }, []);

  const fetchConversation = async (id: string) => {
    try {
      const response = await marketingService.getConversation(id);
      setConversation(response.data);
    } catch (err: any) {
      console.error('Error fetching conversation:', err);
      setError(err.response?.data?.message || 'Failed to load conversation');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await marketingService.getMessages(conversationId);
      setMessages(response.data);
    } catch (err: any) {
      console.error('Error fetching messages:', err);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conversation || !replyText.trim()) return;

    setSending(true);
    try {
      // TODO: Implement send message API call
      // For now, just show alert
      alert('Send message functionality coming soon');
      setReplyText('');
    } catch (err: any) {
      console.error('Error sending message:', err);
      alert(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleConvertToLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conversation) return;

    try {
      await marketingService.convertToLead(conversation.id, convertData);
      setShowConvertModal(false);
      // Refresh conversation to show lead link
      fetchConversation(conversation.id);
      router.push(`/dashboard/crm/leads/details?id=${convertData.existingLeadId || 'new'}`);
    } catch (err: any) {
      console.error('Error converting to lead:', err);
      alert(err.response?.data?.message || 'Failed to convert to lead');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading conversation...</div>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Conversation not found'}
        </div>
        <button
          onClick={() => router.push('/dashboard/marketing/conversations')}
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-900"
        >
          <FiArrowLeft className="w-4 h-4" />
          Back to Conversations
        </button>
      </div>
    );
  }

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

  const breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard', href: '/dashboard/management' },
    { label: 'Marketing', href: '/dashboard/marketing' },
    { label: 'Conversations', href: '/dashboard/marketing/conversations' },
    { label: conversation.participant?.name || 'Conversation', href: '#' },
  ];

  const actions = [
    {
      label: 'Convert to Lead',
      onClick: () => {
        setConvertData({
          existingLeadId: '',
          createNewLead: true,
          firstName: conversation.participant?.name?.split(' ')[0] || '',
          lastName: conversation.participant?.name?.split(' ').slice(1).join(' ') || '',
          email: conversation.participant?.email || '',
          phone: conversation.participant?.phone || '',
          notes: `Converted from ${conversation.platform} conversation`,
        });
        setShowConvertModal(true);
      },
      variant: 'primary' as const,
      icon: <FiCheckCircle className="w-4 h-4" />,
      disabled: conversation.status === 'converted',
    },
    {
      label: 'Back',
      onClick: () => router.push('/dashboard/marketing/conversations'),
      variant: 'secondary' as const,
      icon: <FiArrowLeft className="w-4 h-4" />,
    },
  ];

  const tabs: Tab[] = [
    {
      id: 'messages',
      label: 'Messages',
      icon: <FiMessageCircle className="w-4 h-4" />,
      content: (
        <div className="space-y-6">
          {/* Message Thread */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.direction === 'inbound' ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-md rounded-lg p-3 ${
                      message.direction === 'inbound'
                        ? 'bg-gray-100 text-gray-900'
                        : 'bg-indigo-600 text-white'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content || 'Media message'}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.direction === 'inbound' ? 'text-gray-500' : 'text-indigo-100'
                      }`}
                    >
                      {new Date(message.sentAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              {messages.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-8">No messages yet</p>
              )}
            </div>
          </div>

          {/* Reply Box */}
          {conversation.status !== 'converted' && (
            <form onSubmit={handleSendReply} className="bg-white border border-gray-200 rounded-lg p-4">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply..."
                rows={4}
                className="w-full border border-gray-300 rounded-md p-3 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={!replyText.trim() || sending}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiSend className="w-4 h-4" />
                  {sending ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </form>
          )}
        </div>
      ),
    },
    {
      id: 'details',
      label: 'Details',
      icon: <FiUser className="w-4 h-4" />,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Participant</h3>
              <p className="text-lg text-gray-900">
                {conversation.participant?.name || 'Unknown'}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Platform</h3>
              <p className="text-lg text-gray-900 capitalize">
                {conversation.platform.replace('_', ' ')}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
              <div className="mt-1">{getStatusBadge(conversation.status)}</div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Channel</h3>
              <p className="text-lg text-gray-900">
                {conversation.channelAccount?.name || '-'}
              </p>
            </div>
            {conversation.campaign && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Campaign</h3>
                <p className="text-lg text-gray-900">{conversation.campaign.name}</p>
              </div>
            )}
            {conversation.lead && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Linked Lead</h3>
                <button
                  onClick={() => router.push(`/dashboard/crm/leads/details?id=${conversation.leadId}`)}
                  className="text-indigo-600 hover:text-indigo-900 text-lg"
                >
                  {conversation.lead.firstName} {conversation.lead.lastName}
                </button>
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">First Message</h3>
              <p className="text-lg text-gray-900">
                {new Date(conversation.firstMessageAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Last Message</h3>
              <p className="text-lg text-gray-900">
                {new Date(conversation.lastMessageAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const sidebar = (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Participant</h3>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
            {conversation.participant?.profilePictureUrl ? (
              <img
                src={conversation.participant.profilePictureUrl}
                alt={conversation.participant.name || 'Participant'}
                className="w-12 h-12 rounded-full"
              />
            ) : (
              <span className="text-indigo-600 font-medium">
                {conversation.participant?.name?.charAt(0).toUpperCase() || '?'}
              </span>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {conversation.participant?.name || 'Unknown'}
            </p>
            <p className="text-xs text-gray-500">
              {conversation.participant?.email || conversation.participant?.phone || 'No contact info'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Status:</span>
            <div>{getStatusBadge(conversation.status)}</div>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Platform:</span>
            <span className="font-medium text-gray-900 capitalize">
              {conversation.platform.replace('_', ' ')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Messages:</span>
            <span className="font-medium text-gray-900">{messages.length}</span>
          </div>
          {conversation.campaign && (
            <div className="flex justify-between">
              <span className="text-gray-500">Campaign:</span>
              <span className="font-medium text-gray-900">{conversation.campaign.name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Convert to Lead Modal */}
      {showConvertModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowConvertModal(false)}
            />
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h2 className="text-xl font-semibold mb-4">Convert to Lead</h2>
                <form onSubmit={handleConvertToLead} className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> This will create a new lead in CRM with attribution from this conversation.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">First Name</label>
                      <input
                        type="text"
                        required
                        value={convertData.firstName}
                        onChange={(e) => setConvertData({ ...convertData, firstName: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Last Name</label>
                      <input
                        type="text"
                        required
                        value={convertData.lastName}
                        onChange={(e) => setConvertData({ ...convertData, lastName: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      value={convertData.email}
                      onChange={(e) => setConvertData({ ...convertData, email: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input
                      type="tel"
                      required
                      value={convertData.phone}
                      onChange={(e) => setConvertData({ ...convertData, phone: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea
                      value={convertData.notes}
                      onChange={(e) => setConvertData({ ...convertData, notes: e.target.value })}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowConvertModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                      Convert to Lead
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      <StandardDetailView
        title={conversation.participant?.name || 'Conversation'}
        subtitle={`${conversation.platform.replace('_', ' ')} • ${conversation.status.replace('_', ' ')}`}
        actions={actions}
        tabs={tabs}
        breadcrumbs={breadcrumbs}
        sidebar={sidebar}
      />
    </>
  );
}

