'use client';

import { useEffect, useState } from 'react';
import { settingsService, MessageTemplate, MessageChannel } from '@/lib/services';
import StandardListView from '@/components/StandardListView';
import DataTable, { Column } from '@/components/DataTable';
import SummaryCard from '@/components/SummaryCard';
import StatusBadge from '@/components/settings/StatusBadge';
import ConfirmModal from '@/components/settings/ConfirmModal';
import { FiPlus, FiEdit2, FiTrash2, FiMail, FiMessageSquare, FiEye } from 'react-icons/fi';

export default function CommunicationsTemplatesPage() {
  const [channel, setChannel] = useState<MessageChannel>('email');
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MessageTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<MessageTemplate | null>(null);
  const [form, setForm] = useState({
    channel: 'email' as MessageChannel,
    key: '',
    name: '',
    subject: '',
    body: '',
    isActive: true,
  });
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; template: MessageTemplate | null }>({
    isOpen: false,
    template: null,
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, [channel]);

  const fetchTemplates = async () => {
    setError('');
    setLoading(true);
    try {
      const resp = await settingsService.listTemplates(channel);
      setTemplates(resp.data);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditing(null);
    setForm({
      channel,
      key: '',
      name: '',
      subject: '',
      body: '',
      isActive: true,
    });
    setShowForm(false);
  };

  const openEdit = (template: MessageTemplate) => {
    setEditing(template);
    setForm({
      channel: template.channel,
      key: template.key,
      name: template.name,
      subject: template.subject || '',
      body: template.body,
      isActive: template.isActive,
    });
    setShowForm(true);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      channel,
      key: '',
      name: '',
      subject: '',
      body: '',
      isActive: true,
    });
    setShowForm(true);
  };

  const saveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name || !form.body) {
      setError('Name and body are required');
      return;
    }

    if (form.channel === 'email' && !form.subject) {
      setError('Subject is required for email templates');
      return;
    }

    try {
      if (editing) {
        await settingsService.updateTemplate(editing.id, {
          name: form.name,
          subject: form.channel === 'email' ? form.subject : undefined,
          body: form.body,
          isActive: form.isActive,
        });
      } else {
        await settingsService.createTemplate({
          channel: form.channel,
          key: form.key,
          name: form.name,
          subject: form.channel === 'email' ? form.subject : undefined,
          body: form.body,
          isActive: form.isActive,
        });
      }
      resetForm();
      await fetchTemplates();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to save template');
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.template) return;

    try {
      await settingsService.deleteTemplate(deleteModal.template.id);
      setDeleteModal({ isOpen: false, template: null });
      await fetchTemplates();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to delete template');
    }
  };

  // Table columns
  const columns: Column<MessageTemplate>[] = [
    {
      key: 'name',
      label: 'Template Name',
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-xs text-gray-500 mt-0.5">Key: {row.key}</div>
        </div>
      ),
    },
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
      label: 'Body Preview',
      render: (value) => (
        <span className="text-sm text-gray-600 line-clamp-2">
          {value.substring(0, 100)}
          {value.length > 100 ? '...' : ''}
        </span>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (value) => (
        <StatusBadge status={value ? 'active' : 'inactive'} label={value ? 'Active' : 'Inactive'} />
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => setPreviewTemplate(row)}
            className="p-1.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
            title="Preview"
          >
            <FiEye className="w-4 h-4" />
          </button>
          <button
            onClick={() => openEdit(row)}
            className="p-1.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
            title="Edit"
          >
            <FiEdit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteModal({ isOpen: true, template: row })}
            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  // Summary cards
  const summaryCards = [
    {
      title: 'Total Templates',
      value: templates.length,
      icon: <FiMail className="w-5 h-5" />,
    },
    {
      title: 'Active',
      value: templates.filter((t) => t.isActive).length,
      icon: <FiMessageSquare className="w-5 h-5" />,
    },
    {
      title: 'Inactive',
      value: templates.filter((t) => !t.isActive).length,
      icon: <FiMessageSquare className="w-5 h-5" />,
    },
  ];

  // Primary action
  const primaryAction = showForm
    ? undefined
    : {
        label: 'Add Template',
        onClick: openCreate,
        icon: <FiPlus className="w-4 h-4" />,
      };

  return (
    <div className="space-y-6">
      {/* Channel Selector */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">Select Channel</h3>
            <p className="text-xs text-gray-500">Choose which channel to manage templates for</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setChannel('email');
                resetForm();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                channel === 'email'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FiMail className="w-4 h-4" />
              Email
            </button>
            <button
              onClick={() => {
                setChannel('sms');
                resetForm();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                channel === 'sms'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FiMessageSquare className="w-4 h-4" />
              SMS
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {editing ? 'Edit Template' : 'Add Template'}
            </h2>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FiTrash2 className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={saveTemplate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Key <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.key}
                  onChange={(e) => setForm({ ...form, key: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm text-gray-900"
                  required
                  disabled={!!editing}
                  placeholder="e.g. payment_due_reminder"
                />
                <p className="text-xs text-gray-500 mt-1">Unique identifier (cannot be changed)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm text-gray-900"
                  required
                  placeholder="e.g. Payment Due Reminder"
                />
              </div>
            </div>
            {form.channel === 'email' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm text-gray-900"
                  required
                  placeholder="Email subject line"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Body <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm text-gray-900"
                rows={8}
                required
                placeholder="Template body. Use {{variable}} for dynamic content."
              />
              <p className="text-xs text-gray-500 mt-1">
                Use double curly braces for variables, e.g., {'{{name}}'}, {'{{amount}}'}
              </p>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="template-active"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="template-active" className="ml-2 text-sm text-gray-700">
                Active
              </label>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                {editing ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Templates List */}
      {!showForm && (
        <StandardListView
          title="Message Templates"
          subtitle={`Manage ${channel} templates for system notifications`}
          primaryAction={primaryAction}
          summaryCards={
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {summaryCards.map((card, idx) => (
                <SummaryCard key={idx} {...card} />
              ))}
            </div>
          }
          columns={columns}
          data={templates}
          searchValue={searchTerm}
          onSearch={setSearchTerm}
          loading={loading}
          emptyMessage={`No ${channel} templates found. Click "Add Template" to create one.`}
        />
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      {previewTemplate.name}
                    </h3>
                    <div className="mt-4 space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Channel</p>
                        <p className="text-sm text-gray-900 capitalize">{previewTemplate.channel}</p>
                      </div>
                      {previewTemplate.channel === 'email' && previewTemplate.subject && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Subject</p>
                          <p className="text-sm text-gray-900">{previewTemplate.subject}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-500">Body</p>
                        <div className="mt-1 p-3 bg-gray-50 rounded-md">
                          <p className="text-sm text-gray-900 whitespace-pre-wrap">{previewTemplate.body}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Status</p>
                        <div className="mt-1">
                          <StatusBadge
                            status={previewTemplate.isActive ? 'active' : 'inactive'}
                            label={previewTemplate.isActive ? 'Active' : 'Inactive'}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setPreviewTemplate(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, template: null })}
        onConfirm={handleDelete}
        title="Delete Template"
        message={`Are you sure you want to delete "${deleteModal.template?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  );
}
