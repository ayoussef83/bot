'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { salesService, Lead } from '@/lib/services';
import { FiPhone, FiMessageSquare, FiUser, FiClock } from 'react-icons/fi';

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';

interface PipelineColumn {
  status: LeadStatus;
  label: string;
  color: string;
}

const pipelineColumns: PipelineColumn[] = [
  { status: 'new', label: 'New', color: 'bg-blue-50 border-blue-200' },
  { status: 'contacted', label: 'Contacted', color: 'bg-yellow-50 border-yellow-200' },
  { status: 'qualified', label: 'Qualified', color: 'bg-purple-50 border-purple-200' },
  { status: 'converted', label: 'Converted', color: 'bg-green-50 border-green-200' },
  { status: 'lost', label: 'Lost', color: 'bg-gray-50 border-gray-200' },
];

export default function PipelinePage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
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

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    try {
      await salesService.updateLead(leadId, { status: newStatus });
      fetchLeads();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update lead status');
    }
  };

  const getLeadsByStatus = (status: LeadStatus) => {
    return leads.filter((lead) => lead.status === status);
  };

  const handleDragStart = (lead: Lead) => {
    setDraggedLead(lead);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: LeadStatus) => {
    e.preventDefault();
    if (draggedLead && draggedLead.status !== targetStatus) {
      handleStatusChange(draggedLead.id, targetStatus);
    }
    setDraggedLead(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading pipeline...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pipeline</h1>
          <p className="text-sm text-gray-500 mt-1">Manage leads through the sales pipeline</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/crm/leads')}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          List View
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Pipeline Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {pipelineColumns.map((column) => {
          const columnLeads = getLeadsByStatus(column.status);
          
          return (
            <div
              key={column.status}
              className={`flex-shrink-0 w-80 border-2 rounded-lg ${column.color} p-4`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.status)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{column.label}</h3>
                  <p className="text-xs text-gray-500 mt-1">{columnLeads.length} leads</p>
                </div>
              </div>

              {/* Lead Cards */}
              <div className="space-y-3 min-h-[200px]">
                {columnLeads.map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={() => handleDragStart(lead)}
                    onClick={() => router.push(`/dashboard/crm/leads/${lead.id}`)}
                    className="bg-white rounded-lg border border-gray-200 p-4 cursor-move hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {lead.firstName} {lead.lastName}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1 capitalize">{lead.source}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mt-3">
                      {lead.phone && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <FiPhone className="w-3 h-3" />
                          <span>{lead.phone}</span>
                        </div>
                      )}
                      {lead.email && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <FiMessageSquare className="w-3 h-3" />
                          <span className="truncate">{lead.email}</span>
                        </div>
                      )}
                      {lead.interestedIn && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <FiUser className="w-3 h-3" />
                          <span className="capitalize">{lead.interestedIn}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <FiClock className="w-3 h-3" />
                        <span>{formatDate(lead.createdAt)}</span>
                      </div>
                    </div>

                    {lead.notes && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-600 line-clamp-2">{lead.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
                
                {columnLeads.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    No leads in this stage
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

