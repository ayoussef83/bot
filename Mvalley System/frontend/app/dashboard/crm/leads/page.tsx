'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { salesService, Lead, LeadFollowUp } from '@/lib/services';
import StandardListView, { FilterConfig } from '@/components/StandardListView';
import { Column, ActionButton } from '@/components/DataTable';
import SummaryCard from '@/components/SummaryCard';
import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/settings/StatusBadge';
import { downloadExport } from '@/lib/export';
import { FiPlus, FiEdit, FiTrash2, FiUserPlus, FiCheckCircle } from 'react-icons/fi';

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    source: 'website',
    status: 'new',
    notes: '',
    interestedIn: '',
  });
  const [followUpData, setFollowUpData] = useState({
    notes: '',
    nextAction: '',
    nextActionDate: '',
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await salesService.createLead(formData);
      setShowForm(false);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        source: 'website',
        status: 'new',
        notes: '',
        interestedIn: '',
      });
      fetchLeads();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create lead');
    }
  };

  const handleFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    try {
      await salesService.createFollowUp({
        leadId: selectedLead.id,
        ...followUpData,
      });
      setShowFollowUpForm(false);
      setSelectedLead(null);
      setFollowUpData({ notes: '', nextAction: '', nextActionDate: '' });
      fetchLeads();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create follow-up');
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      await salesService.updateLead(leadId, { status: newStatus });
      fetchLeads();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    try {
      await salesService.deleteLead(id);
      fetchLeads();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete lead');
    }
  };

  const handleConvert = async (lead: Lead) => {
    if (!confirm(`Convert ${lead.firstName} ${lead.lastName} to a student?`)) return;
    try {
      await salesService.convertToStudent(lead.id, {
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone,
      });
      fetchLeads();
      router.push('/dashboard/students');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to convert lead');
    }
  };

  // Filter and search leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        searchTerm === '' ||
        `${lead.firstName} ${lead.lastName}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone?.includes(searchTerm);

      const matchesStatus = statusFilter === '' || lead.status === statusFilter;
      const matchesSource = sourceFilter === '' || lead.source === sourceFilter;

      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [leads, searchTerm, statusFilter, sourceFilter]);

  // Status badge mapping
  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: 'active' | 'inactive' | 'warning' | 'error' } = {
      new: 'active',
      contacted: 'warning',
      qualified: 'active',
      converted: 'active',
      lost: 'inactive',
    };
    return <StatusBadge status={statusMap[status] || 'inactive'} label={status} />;
  };

  // Column definitions
  const columns: Column<Lead>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (_, row) => (
        <a
          href={`/dashboard/crm/leads/${row.id}`}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
          onClick={(e) => {
            e.preventDefault();
            router.push(`/dashboard/crm/leads/${row.id}`);
          }}
        >
          {row.firstName} {row.lastName}
        </a>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-500">{value || '-'}</span>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      sortable: true,
      render: (value) => <span className="text-sm text-gray-500">{value}</span>,
    },
    {
      key: 'source',
      label: 'Source',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-500 capitalize">{value}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => getStatusBadge(value),
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (_, row) => {
        // Assuming createdAt exists on Lead, if not, remove this column
        const date = (row as any).createdAt;
        return (
          <span className="text-sm text-gray-500">
            {date ? new Date(date).toLocaleDateString() : '-'}
          </span>
        );
      },
    },
  ];

  // Action buttons
  const actions = (row: Lead): ActionButton[] => [
    {
      label: 'Convert',
      onClick: () => handleConvert(row),
      variant: 'primary',
      icon: <FiCheckCircle className="w-4 h-4" />,
    },
    {
      label: 'Edit',
      onClick: () => {
        setSelectedLead(row);
        setFormData({
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.email || '',
          phone: row.phone,
          source: row.source,
          status: row.status,
          notes: row.notes || '',
          interestedIn: row.interestedIn || '',
        });
        setShowForm(true);
      },
      icon: <FiEdit className="w-4 h-4" />,
    },
    {
      label: 'Delete',
      onClick: () => handleDelete(row.id),
      variant: 'danger',
      icon: <FiTrash2 className="w-4 h-4" />,
    },
  ];

  // Filters
  const filters: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'new', label: 'New' },
        { value: 'contacted', label: 'Contacted' },
        { value: 'qualified', label: 'Qualified' },
        { value: 'converted', label: 'Converted' },
        { value: 'lost', label: 'Lost' },
      ],
      value: statusFilter,
      onChange: setStatusFilter,
    },
    {
      key: 'source',
      label: 'Source',
      type: 'select',
      options: [
        { value: 'website', label: 'Website' },
        { value: 'referral', label: 'Referral' },
        { value: 'social', label: 'Social Media' },
        { value: 'other', label: 'Other' },
      ],
      value: sourceFilter,
      onChange: setSourceFilter,
    },
  ];

  // Summary statistics
  const newLeads = filteredLeads.filter((l) => l.status === 'new').length;
  const qualifiedLeads = filteredLeads.filter((l) => l.status === 'qualified').length;
  const convertedLeads = filteredLeads.filter((l) => l.status === 'converted').length;
  const totalLeads = filteredLeads.length;

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Lead Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => {
                setShowForm(false);
                setSelectedLead(null);
              }}
            ></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h2 className="text-xl font-semibold mb-4">
                  {selectedLead ? 'Edit Lead' : 'New Lead'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">First Name</label>
                      <input
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Last Name</label>
                      <input
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Source</label>
                      <select
                        value={formData.source}
                        onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value="website">Website</option>
                        <option value="referral">Referral</option>
                        <option value="social">Social Media</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="qualified">Qualified</option>
                        <option value="converted">Converted</option>
                        <option value="lost">Lost</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Interested In</label>
                    <input
                      type="text"
                      value={formData.interestedIn}
                      onChange={(e) => setFormData({ ...formData, interestedIn: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <button
                      type="submit"
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                    >
                      {selectedLead ? 'Update' : 'Create'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setSelectedLead(null);
                      }}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Follow-up Form Modal */}
      {showFollowUpForm && selectedLead && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => {
                setShowFollowUpForm(false);
                setSelectedLead(null);
              }}
            ></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h2 className="text-xl font-semibold mb-4">Add Follow-up</h2>
                <form onSubmit={handleFollowUp} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea
                      required
                      value={followUpData.notes}
                      onChange={(e) => setFollowUpData({ ...followUpData, notes: e.target.value })}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Next Action</label>
                    <input
                      type="text"
                      value={followUpData.nextAction}
                      onChange={(e) =>
                        setFollowUpData({ ...followUpData, nextAction: e.target.value })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Next Action Date</label>
                    <input
                      type="date"
                      value={followUpData.nextActionDate}
                      onChange={(e) =>
                        setFollowUpData({ ...followUpData, nextActionDate: e.target.value })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <button
                      type="submit"
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                    >
                      Save Follow-up
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowFollowUpForm(false);
                        setSelectedLead(null);
                      }}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Standard List View */}
      <StandardListView
        title="Leads"
        subtitle="Manage sales leads and track conversion pipeline"
        primaryAction={{
          label: 'Add Lead',
          onClick: () => {
            setShowForm(true);
            setSelectedLead(null);
            setFormData({
              firstName: '',
              lastName: '',
              email: '',
              phone: '',
              source: 'website',
              status: 'new',
              notes: '',
              interestedIn: '',
            });
          },
          icon: <FiPlus className="w-4 h-4" />,
        }}
        searchPlaceholder="Search by name, email, or phone..."
        onSearch={setSearchTerm}
        searchValue={searchTerm}
        filters={filters}
        columns={columns}
        data={filteredLeads}
        loading={loading}
        actions={actions}
        emptyMessage="No leads found"
        emptyState={
          <EmptyState
            title="No leads found"
            message="Get started by adding your first lead"
            action={{
              label: 'Add Lead',
              onClick: () => {
                setShowForm(true);
                setSelectedLead(null);
              },
            }}
          />
        }
        summaryCards={
          <>
            <SummaryCard
              title="Total Leads"
              value={totalLeads}
              icon={<FiUserPlus className="w-8 h-8" />}
            />
            <SummaryCard
              title="New Leads"
              value={newLeads}
              variant="info"
              icon={<FiUserPlus className="w-8 h-8" />}
            />
            <SummaryCard
              title="Qualified"
              value={qualifiedLeads}
              variant="warning"
              icon={<FiCheckCircle className="w-8 h-8" />}
            />
            <SummaryCard
              title="Converted"
              value={convertedLeads}
              variant="success"
              icon={<FiCheckCircle className="w-8 h-8" />}
            />
          </>
        }
        getRowId={(row) => row.id}
        onRowClick={(row) => {
          router.push(`/dashboard/crm/leads/${row.id}`);
        }}
      />

      {/* Export Buttons */}
      <div className="flex justify-end gap-2">
        <button
          onClick={() => downloadExport('leads', 'xlsx')}
          className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 text-sm font-medium"
        >
          Export Excel
        </button>
        <button
          onClick={() => downloadExport('leads', 'pdf')}
          className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 text-sm font-medium"
        >
          Export PDF
        </button>
      </div>
    </div>
  );
}
