'use client';

import { useEffect, useState } from 'react';
import { settingsService, MessageTemplate, MessageChannel } from '@/lib/services';
import SettingsCard from '@/components/settings/SettingsCard';
import StatusBadge from '@/components/settings/StatusBadge';
import ConfirmModal from '@/components/settings/ConfirmModal';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiCheck, FiMail, FiMessageSquare } from 'react-icons/fi';

export default function CommunicationsTemplatesPage() {
  const [channel, setChannel] = useState<MessageChannel>('email');
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MessageTemplate | null>(null);
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

  const activeTemplates = templates.filter((t) => t.isActive);
  const inactiveTemplates = templates.filter((t) => !t.isActive);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Message Templates</h1>
        <p className="text-sm text-gray-500 mt-1">
          Create and manage email and SMS templates for system notifications
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Channel Selector */}
      <SettingsCard
        title="Select Channel"
        description="Choose which channel to manage templates for"
      >
        <div className="flex gap-2">
          <button
            onClick={() => setChannel('email')}
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
            onClick={() => setChannel('sms')}
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
      </SettingsCard>

      {/* Add Template Button */}
      {!showForm && (
        <div className="flex justify-end">
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            <FiPlus className="w-4 h-4" />
            Add Template
          </button>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <SettingsCard
          title={editing ? 'Edit Template' : 'Add Template'}
          footer={
            <div className="flex justify-end gap-3">
              <button
                onClick={resetForm}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <FiX className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={saveTemplate}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                <FiCheck className="w-4 h-4" />
                {editing ? 'Update' : 'Create'}
              </button>
            </div>
          }
        >
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
                  className="w-full rounded-md border-gray-300 shadow-sm"
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
                  className="w-full rounded-md border-gray-300 shadow-sm"
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
                  className="w-full rounded-md border-gray-300 shadow-sm"
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
                className="w-full rounded-md border-gray-300 shadow-sm"
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
          </form>
        </SettingsCard>
      )}

      {/* Active Templates */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : (
        <>
          {activeTemplates.length > 0 && (
            <SettingsCard title={`Active Templates (${activeTemplates.length})`}>
              <div className="space-y-3">
                {activeTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-start justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-900">{template.name}</span>
                        <span className="text-xs text-gray-500">({template.key})</span>
                        <StatusBadge status="active" label="Active" />
                        {template.channel === 'email' && (
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                            Email
                          </span>
                        )}
                        {template.channel === 'sms' && (
                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                            SMS
                          </span>
                        )}
                      </div>
                      {template.channel === 'email' && template.subject && (
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Subject:</strong> {template.subject}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 line-clamp-2">{template.body}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => openEdit(template)}
                        className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteModal({ isOpen: true, template })}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </SettingsCard>
          )}

          {/* Inactive Templates */}
          {inactiveTemplates.length > 0 && (
            <SettingsCard title={`Inactive Templates (${inactiveTemplates.length})`}>
              <div className="space-y-3">
                {inactiveTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-start justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 opacity-60"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-900">{template.name}</span>
                        <span className="text-xs text-gray-500">({template.key})</span>
                        <StatusBadge status="inactive" label="Inactive" />
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{template.body}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => openEdit(template)}
                        className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteModal({ isOpen: true, template })}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </SettingsCard>
          )}

          {templates.length === 0 && !showForm && (
            <SettingsCard title="No Templates">
              <p className="text-sm text-gray-500">
                No {channel} templates defined. Click "Add Template" to create one.
              </p>
            </SettingsCard>
          )}
        </>
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

