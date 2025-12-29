'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  settingsService,
  CustomFieldDefinition,
  CustomFieldEntity,
  CustomFieldType,
  IntegrationConfig,
  MessageTemplate,
  MessageChannel,
} from '@/lib/services';

const entityOptions: { value: CustomFieldEntity; label: string }[] = [
  { value: 'student', label: 'Students' },
  { value: 'class', label: 'Classes' },
  { value: 'payment', label: 'Payments' },
  { value: 'lead', label: 'Leads' },
];

const typeOptions: { value: CustomFieldType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Select' },
];

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'custom_fields' | 'communications'>('custom_fields');
  const [entity, setEntity] = useState<CustomFieldEntity>('student');
  const [fields, setFields] = useState<CustomFieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CustomFieldDefinition | null>(null);
  const [form, setForm] = useState({
    key: '',
    label: '',
    type: 'text' as CustomFieldType,
    required: false,
    isActive: true,
    order: 0,
    choicesCsv: '',
  });

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) setUser(JSON.parse(userStr));
  }, []);

  const canAccess = user?.role === 'super_admin';

  const fetchFields = async () => {
    setError('');
    setLoading(true);
    try {
      const resp = await settingsService.listCustomFields(entity);
      setFields(resp.data);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load custom fields');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canAccess) fetchFields();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity, canAccess]);

  // Communications state
  const [emailCfg, setEmailCfg] = useState<IntegrationConfig | null>(null);
  const [smsCfg, setSmsCfg] = useState<IntegrationConfig | null>(null);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [templatesChannel, setTemplatesChannel] = useState<MessageChannel>('email');
  const [commLoading, setCommLoading] = useState(false);

  const [emailForm, setEmailForm] = useState({
    host: 'smtp.zoho.com',
    port: 587,
    secure: false,
    username: '',
    fromEmail: '',
    fromName: 'MV-OS',
    password: '', // write-only
    isActive: true,
  });
  const [smsForm, setSmsForm] = useState({
    username: '',
    senderId: '',
    apiUrl: 'https://smsmisr.com/api/SMS/',
    password: '', // write-only
    isActive: true,
  });

  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    channel: 'email' as MessageChannel,
    key: '',
    name: '',
    subject: '',
    body: '',
    isActive: true,
  });

  const fetchCommunications = async () => {
    setError('');
    setCommLoading(true);
    try {
      const [emailResp, smsResp, templatesResp] = await Promise.all([
        settingsService.getIntegration('zoho_email'),
        settingsService.getIntegration('smsmisr'),
        settingsService.listTemplates(templatesChannel),
      ]);

      setEmailCfg(emailResp.data);
      setSmsCfg(smsResp.data);
      setTemplates(templatesResp.data);

      setEmailForm((prev) => ({
        ...prev,
        ...(emailResp.data.config || {}),
        isActive: !!emailResp.data.isActive,
        password: '',
      }));
      setSmsForm((prev) => ({
        ...prev,
        ...(smsResp.data.config || {}),
        isActive: !!smsResp.data.isActive,
        password: '',
      }));
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load communications settings');
    } finally {
      setCommLoading(false);
    }
  };

  useEffect(() => {
    if (canAccess && activeTab === 'communications') fetchCommunications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, templatesChannel, canAccess]);

  const saveEmail = async () => {
    setError('');
    try {
      await settingsService.upsertIntegration({
        provider: 'zoho_email',
        isActive: emailForm.isActive,
        config: {
          host: emailForm.host,
          port: Number(emailForm.port),
          secure: !!emailForm.secure,
          username: emailForm.username,
          fromEmail: emailForm.fromEmail,
          fromName: emailForm.fromName,
        },
        secrets: emailForm.password ? { password: emailForm.password } : undefined,
      });
      await fetchCommunications();
      alert('Email settings saved');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to save email settings');
    }
  };

  const saveSms = async () => {
    setError('');
    try {
      await settingsService.upsertIntegration({
        provider: 'smsmisr',
        isActive: smsForm.isActive,
        config: {
          username: smsForm.username,
          senderId: smsForm.senderId,
          apiUrl: smsForm.apiUrl,
        },
        secrets: smsForm.password ? { password: smsForm.password } : undefined,
      });
      await fetchCommunications();
      alert('SMS settings saved');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to save SMS settings');
    }
  };

  const openTemplateCreate = () => {
    setEditingTemplate(null);
    setTemplateForm({
      channel: templatesChannel,
      key: '',
      name: '',
      subject: '',
      body: '',
      isActive: true,
    });
    setShowTemplateForm(true);
  };

  const openTemplateEdit = (t: MessageTemplate) => {
    setEditingTemplate(t);
    setTemplateForm({
      channel: t.channel,
      key: t.key,
      name: t.name,
      subject: t.subject || '',
      body: t.body,
      isActive: t.isActive,
    });
    setShowTemplateForm(true);
  };

  const saveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editingTemplate) {
        await settingsService.updateTemplate(editingTemplate.id, {
          name: templateForm.name,
          subject: templateForm.channel === 'email' ? templateForm.subject : undefined,
          body: templateForm.body,
          isActive: templateForm.isActive,
        });
      } else {
        await settingsService.createTemplate({
          channel: templateForm.channel,
          key: templateForm.key,
          name: templateForm.name,
          subject: templateForm.channel === 'email' ? templateForm.subject : undefined,
          body: templateForm.body,
          isActive: templateForm.isActive,
        });
      }
      setShowTemplateForm(false);
      setEditingTemplate(null);
      await fetchCommunications();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to save template');
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    setError('');
    try {
      await settingsService.deleteTemplate(id);
      await fetchCommunications();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to delete template');
    }
  };

  const resetForm = () => {
    setEditing(null);
    setForm({
      key: '',
      label: '',
      type: 'text',
      required: false,
      isActive: true,
      order: 0,
      choicesCsv: '',
    });
  };

  const normalizedChoices = useMemo(() => {
    const parts = form.choicesCsv
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    return parts;
  }, [form.choicesCsv]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const payload: any = {
        entity,
        key: form.key.trim(),
        label: form.label.trim(),
        type: form.type,
        required: form.required,
        isActive: form.isActive,
        order: Number(form.order) || 0,
      };
      if (form.type === 'select') {
        payload.options = { choices: normalizedChoices };
      }

      if (editing) {
        // key is immutable per v1 (db unique index). We only allow editing label/type/options/etc.
        const { key: _k, entity: _e, ...rest } = payload;
        await settingsService.updateCustomField(editing.id, rest);
      } else {
        await settingsService.createCustomField(payload);
      }

      setShowForm(false);
      resetForm();
      fetchFields();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to save custom field');
    }
  };

  const startEdit = (f: CustomFieldDefinition) => {
    setEditing(f);
    setShowForm(true);
    setForm({
      key: f.key,
      label: f.label,
      type: f.type,
      required: !!f.required,
      isActive: !!f.isActive,
      order: f.order ?? 0,
      choicesCsv: Array.isArray(f.options?.choices) ? f.options.choices.join(', ') : '',
    });
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this custom field?')) return;
    setError('');
    try {
      await settingsService.deleteCustomField(id);
      fetchFields();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to delete custom field');
    }
  };

  if (!user) return <div className="p-6">Loading...</div>;

  if (!canAccess) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-2">Settings</h1>
        <div className="text-red-600">Access denied.</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        {activeTab === 'custom_fields' ? (
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Add Custom Field
          </button>
        ) : (
          <button
            onClick={openTemplateCreate}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Add Template
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {typeof error === 'string' ? error : 'Error'}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('custom_fields')}
            className={`${
              activeTab === 'custom_fields'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Custom Fields
          </button>
          <button
            onClick={() => setActiveTab('communications')}
            className={`${
              activeTab === 'communications'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Communications
          </button>
        </nav>
      </div>

      {activeTab === 'custom_fields' && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Entity</label>
          <select
            value={entity}
            onChange={(e) => setEntity(e.target.value as CustomFieldEntity)}
            className="block w-full max-w-sm rounded-md border-gray-300 shadow-sm"
          >
            {entityOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {activeTab === 'custom_fields' && showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editing ? `Edit Field: ${editing.key}` : 'Add Custom Field'}
          </h2>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Key</label>
                <input
                  type="text"
                  required
                  disabled={!!editing}
                  value={form.key}
                  onChange={(e) => setForm({ ...form, key: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-100"
                  placeholder="e.g. sourceChannel"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Machine key. No spaces. Can’t be changed after creation.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Label</label>
                <input
                  type="text"
                  required
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  placeholder="e.g. Source Channel"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as CustomFieldType })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                >
                  {typeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Order</label>
                <input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
            </div>

            {form.type === 'select' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Choices (comma separated)
                </label>
                <input
                  type="text"
                  value={form.choicesCsv}
                  onChange={(e) => setForm({ ...form, choicesCsv: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  placeholder="e.g. WhatsApp, Facebook, Referral"
                />
              </div>
            )}

            <div className="flex items-center gap-6">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.required}
                  onChange={(e) => setForm({ ...form, required: e.target.checked })}
                />
                Required
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                Active
              </label>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                {editing ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'custom_fields' ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Custom Fields</h2>
            <span className="text-sm text-gray-500">{fields.length} fields</span>
          </div>

          {loading ? (
            <div className="p-6">Loading fields...</div>
          ) : fields.length === 0 ? (
            <div className="p-6 text-gray-500">No custom fields yet.</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Key
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Label
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Required
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Active
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {fields.map((f) => (
                  <tr key={f.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{f.key}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {f.label}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{f.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {f.required ? 'Yes' : 'No'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {f.isActive ? 'Yes' : 'No'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => startEdit(f)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => remove(f.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Email (Zoho) */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-semibold">Email (Zoho SMTP)</h2>
                <p className="text-sm text-gray-500">
                  Configure SMTP + From address. Password is write-only.
                </p>
              </div>
              <span className="text-sm text-gray-500">
                Secrets set: {emailCfg?.hasSecrets ? 'Yes' : 'No'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Host</label>
                <input
                  value={emailForm.host}
                  onChange={(e) => setEmailForm({ ...emailForm, host: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Port</label>
                <input
                  type="number"
                  value={emailForm.port}
                  onChange={(e) => setEmailForm({ ...emailForm, port: Number(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <input
                  value={emailForm.username}
                  onChange={(e) => setEmailForm({ ...emailForm, username: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  value={emailForm.password}
                  onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">From Email</label>
                <input
                  value={emailForm.fromEmail}
                  onChange={(e) => setEmailForm({ ...emailForm, fromEmail: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">From Name</label>
                <input
                  value={emailForm.fromName}
                  onChange={(e) => setEmailForm({ ...emailForm, fromName: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-6 mt-4">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={emailForm.isActive}
                  onChange={(e) => setEmailForm({ ...emailForm, isActive: e.target.checked })}
                />
                Active
              </label>
              <button
                onClick={saveEmail}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Save Email Settings
              </button>
            </div>
          </div>

          {/* SMSMisr */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-semibold">SMS (SMSMisr)</h2>
                <p className="text-sm text-gray-500">
                  Configure API username/senderId. Password is write-only.
                </p>
              </div>
              <span className="text-sm text-gray-500">
                Secrets set: {smsCfg?.hasSecrets ? 'Yes' : 'No'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <input
                  value={smsForm.username}
                  onChange={(e) => setSmsForm({ ...smsForm, username: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  value={smsForm.password}
                  onChange={(e) => setSmsForm({ ...smsForm, password: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Sender ID</label>
                <input
                  value={smsForm.senderId}
                  onChange={(e) => setSmsForm({ ...smsForm, senderId: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">API URL</label>
                <input
                  value={smsForm.apiUrl}
                  onChange={(e) => setSmsForm({ ...smsForm, apiUrl: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-6 mt-4">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={smsForm.isActive}
                  onChange={(e) => setSmsForm({ ...smsForm, isActive: e.target.checked })}
                />
                Active
              </label>
              <button
                onClick={saveSms}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Save SMS Settings
              </button>
            </div>
          </div>

          {/* Templates */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold">Templates</h2>
                <p className="text-sm text-gray-500">Email + SMS templates for system messages</p>
              </div>
              <div className="flex gap-2 items-center">
                <select
                  value={templatesChannel}
                  onChange={(e) => setTemplatesChannel(e.target.value as MessageChannel)}
                  className="rounded-md border-gray-300 shadow-sm"
                >
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                </select>
                <button
                  onClick={openTemplateCreate}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                  Add Template
                </button>
              </div>
            </div>

            {commLoading ? (
              <div className="p-6">Loading communications...</div>
            ) : templates.length === 0 ? (
              <div className="p-6 text-gray-500">No templates yet.</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Key
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Active
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {templates.map((t) => (
                    <tr key={t.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{t.key}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {t.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {t.isActive ? 'Yes' : 'No'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => openTemplateEdit(t)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteTemplate(t.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {showTemplateForm && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">
                {editingTemplate ? `Edit Template: ${editingTemplate.key}` : 'New Template'}
              </h3>
              <form onSubmit={saveTemplate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Channel</label>
                    <select
                      value={templateForm.channel}
                      disabled={!!editingTemplate}
                      onChange={(e) =>
                        setTemplateForm({ ...templateForm, channel: e.target.value as MessageChannel })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-100"
                    >
                      <option value="email">Email</option>
                      <option value="sms">SMS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Key</label>
                    <input
                      required
                      disabled={!!editingTemplate}
                      value={templateForm.key}
                      onChange={(e) => setTemplateForm({ ...templateForm, key: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-100"
                      placeholder="e.g. payment_due_reminder"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      required
                      value={templateForm.name}
                      onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    />
                  </div>
                  {templateForm.channel === 'email' && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Subject</label>
                      <input
                        value={templateForm.subject}
                        onChange={(e) =>
                          setTemplateForm({ ...templateForm, subject: e.target.value })
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                      />
                    </div>
                  )}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Body</label>
                    <textarea
                      required
                      value={templateForm.body}
                      onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                      rows={6}
                      placeholder="You can use variables like {{firstName}}"
                    />
                  </div>
                </div>
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={templateForm.isActive}
                    onChange={(e) => setTemplateForm({ ...templateForm, isActive: e.target.checked })}
                  />
                  Active
                </label>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                  >
                    {editingTemplate ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTemplateForm(false);
                      setEditingTemplate(null);
                    }}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


