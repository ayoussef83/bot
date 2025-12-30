'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { salesService, Lead, LeadFollowUp } from '@/lib/services';
import StandardDetailView, { Tab, ActionButton, Breadcrumb } from '@/components/StandardDetailView';
import StatusBadge from '@/components/settings/StatusBadge';
import { Column } from '@/components/DataTable';
import DataTable from '@/components/DataTable';
import { FiEdit, FiTrash2, FiUserPlus, FiMail, FiPhone, FiCheckCircle, FiCalendar, FiMessageSquare, FiPlus } from 'react-icons/fi';

export default function LeadDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [lead, setLead] = useState<Lead | null>(null);
  const [followUps, setFollowUps] = useState<LeadFollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [followUpData, setFollowUpData] = useState({
    notes: '',
    nextAction: '',
    nextActionDate: '',
  });

  useEffect(() => {
    if (id) {
      fetchLead(id);
      fetchFollowUps(id);
    } else {
      setError('Missing lead id');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchLead = async (leadId: string) => {
    try {
      const response = await salesService.getLeadById(leadId);
      setLead(response.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load lead');
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowUps = async (leadId: string) => {
    try {
      const response = await salesService.getFollowUpsByLead(leadId);
      setFollowUps(response.data);
    } catch (err: any) {
      console.error('Failed to load follow-ups', err);
      // If endpoint doesn't exist, try to get from lead data
      if (lead?.followUps) {
        setFollowUps(lead.followUps);
      }
    }
  };

  const handleDelete = async () => {
    if (!lead || !confirm('Are you sure you want to delete this lead?')) return;
    try {
      await salesService.deleteLead(lead.id);
      router.push('/dashboard/leads');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete lead');
    }
  };

  const handleConvertToStudent = async () => {
    if (!lead || !confirm('Convert this lead to a student?')) return;
    try {
      await salesService.convertToStudent(lead.id, {
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone,
      });
      router.push('/dashboard/students');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to convert lead');
    }
  };

  const handleFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;
    try {
      await salesService.createFollowUp({
        leadId: lead.id,
        ...followUpData,
      });
      setShowFollowUpForm(false);
      setFollowUpData({ notes: '', nextAction: '', nextActionDate: '' });
      fetchFollowUps(lead.id);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create follow-up');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!lead) return;
    try {
      await salesService.updateLead(lead.id, { status: newStatus });
      fetchLead(lead.id);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading lead details...</div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error || 'Lead not found'}
        </div>
        <button
          onClick={() => router.push('/dashboard/leads')}
          className="text-indigo-600 hover:text-indigo-900"
        >
          ← Back to Leads
        </button>
      </div>
    );
  }

  // Breadcrumbs
  const breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard', href: '/dashboard/management' },
    { label: 'Leads', href: '/dashboard/leads' },
    { label: `${lead.firstName} ${lead.lastName}`, href: `/dashboard/leads/details?id=${id}` },
  ];

  // Action buttons
  const actions: ActionButton[] = [
    {
      label: 'Convert to Student',
      onClick: handleConvertToStudent,
      variant: 'primary',
      icon: <FiUserPlus className="w-4 h-4" />,
    },
    {
      label: 'Edit',
      onClick: () => {
        router.push(`/dashboard/leads/edit?id=${id}`);
      },
      icon: <FiEdit className="w-4 h-4" />,
    },
    {
      label: 'Delete',
      onClick: handleDelete,
      variant: 'danger',
      icon: <FiTrash2 className="w-4 h-4" />,
    },
  ];

  // Follow-up columns
  const followUpColumns: Column<LeadFollowUp>[] = [
    {
      key: 'date',
      label: 'Date',
      render: (_, row) => (
        <span className="text-sm text-gray-900">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'notes',
      label: 'Notes',
      render: (value) => (
        <span className="text-sm text-gray-600">{value || '-'}</span>
      ),
    },
    {
      key: 'nextAction',
      label: 'Next Action',
      render: (value) => (
        <span className="text-sm text-gray-600">{value || '-'}</span>
      ),
    },
    {
      key: 'nextActionDate',
      label: 'Next Action Date',
      render: (value) => (
        <span className="text-sm text-gray-500">
          {value ? new Date(value).toLocaleDateString() : '-'}
        </span>
      ),
    },
  ];

  // Tabs
  const tabs: Tab[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <FiUserPlus className="w-4 h-4" />,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">First Name</h3>
              <p className="text-lg text-gray-900">{lead.firstName}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Last Name</h3>
              <p className="text-lg text-gray-900">{lead.lastName}</p>
            </div>
            {lead.email && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                  <FiMail className="w-4 h-4" />
                  Email
                </h3>
                <p className="text-lg text-gray-900">{lead.email}</p>
              </div>
            )}
            {lead.phone && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                  <FiPhone className="w-4 h-4" />
                  Phone
                </h3>
                <p className="text-lg text-gray-900">{lead.phone}</p>
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Source</h3>
              <p className="text-lg text-gray-900 capitalize">{lead.source}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
              <div className="mt-1">
                <select
                  value={lead.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="rounded-md border-gray-300 shadow-sm text-gray-900"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="converted">Converted</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
            </div>
            {lead.interestedIn && (
              <div className="col-span-2">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Interested In</h3>
                <p className="text-lg text-gray-900">{lead.interestedIn}</p>
              </div>
            )}
            {lead.notes && (
              <div className="col-span-2">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Notes</h3>
                <p className="text-lg text-gray-900 whitespace-pre-wrap">{lead.notes}</p>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'follow-ups',
      label: 'Follow-ups',
      count: followUps.length,
      icon: <FiMessageSquare className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          {!showFollowUpForm && (
            <div className="flex justify-end">
              <button
                onClick={() => setShowFollowUpForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                <FiPlus className="w-4 h-4" />
                Add Follow-up
              </button>
            </div>
          )}

          {showFollowUpForm && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Follow-up</h3>
              <form onSubmit={handleFollowUpSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={followUpData.notes}
                    onChange={(e) => setFollowUpData({ ...followUpData, notes: e.target.value })}
                    className="w-full rounded-md border-gray-300 shadow-sm text-gray-900"
                    rows={4}
                    required
                    placeholder="Enter follow-up notes..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Next Action
                    </label>
                    <input
                      type="text"
                      value={followUpData.nextAction}
                      onChange={(e) =>
                        setFollowUpData({ ...followUpData, nextAction: e.target.value })
                      }
                      className="w-full rounded-md border-gray-300 shadow-sm text-gray-900"
                      placeholder="e.g. Call back, Send email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Next Action Date
                    </label>
                    <input
                      type="date"
                      value={followUpData.nextActionDate}
                      onChange={(e) =>
                        setFollowUpData({ ...followUpData, nextActionDate: e.target.value })
                      }
                      className="w-full rounded-md border-gray-300 shadow-sm text-gray-900"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowFollowUpForm(false);
                      setFollowUpData({ notes: '', nextAction: '', nextActionDate: '' });
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                  >
                    Add Follow-up
                  </button>
                </div>
              </form>
            </div>
          )}

          {followUps.length > 0 ? (
            <DataTable
              columns={followUpColumns}
              data={followUps}
              emptyMessage="No follow-ups found"
            />
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No follow-ups recorded</p>
            </div>
          )}
        </div>
      ),
    },
  ];

  // Sidebar with quick actions
  const sidebar = (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
        <div className="space-y-2">
          <button
            onClick={handleConvertToStudent}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            👤 Convert to Student
          </button>
          <button
            onClick={() => setShowFollowUpForm(true)}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            📝 Add Follow-up
          </button>
          {lead.email && (
            <button
              onClick={() => {
                window.location.href = `mailto:${lead.email}`;
              }}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              ✉️ Send Email
            </button>
          )}
          {lead.phone && (
            <button
              onClick={() => {
                window.location.href = `tel:${lead.phone}`;
              }}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              📞 Call
            </button>
          )}
        </div>
      </div>
      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Status:</span>
            <StatusBadge
              status={
                lead.status === 'converted'
                  ? 'active'
                  : lead.status === 'qualified'
                  ? 'active'
                  : lead.status === 'lost'
                  ? 'inactive'
                  : 'warning'
              }
              label={lead.status}
            />
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Source:</span>
            <span className="font-medium text-gray-900 capitalize">{lead.source}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Follow-ups:</span>
            <span className="font-medium text-gray-900">{followUps.length}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <StandardDetailView
      title={`${lead.firstName} ${lead.lastName}`}
      subtitle={lead.email || lead.phone || 'Lead Profile'}
      actions={actions}
      tabs={tabs}
      breadcrumbs={breadcrumbs}
      sidebar={sidebar}
    />
  );
}

