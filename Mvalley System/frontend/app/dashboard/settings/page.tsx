'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  settingsService,
  CustomFieldDefinition,
  CustomFieldEntity,
  CustomFieldType,
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
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Add Custom Field
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {typeof error === 'string' ? error : 'Error'}
        </div>
      )}

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

      {showForm && (
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{f.label}</td>
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
    </div>
  );
}


