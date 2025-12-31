'use client';

import { useEffect, useState, useMemo } from 'react';
import { settingsService, CustomFieldDefinition, CustomFieldEntity, CustomFieldType } from '@/lib/services';
import SettingsCard from '@/components/settings/SettingsCard';
import ConfirmModal from '@/components/settings/ConfirmModal';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiCheck } from 'react-icons/fi';

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

export default function CustomFieldsPage() {
  const [entity, setEntity] = useState<CustomFieldEntity>('student');
  const [fields, setFields] = useState<CustomFieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
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
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; field: CustomFieldDefinition | null }>({
    isOpen: false,
    field: null,
  });

  useEffect(() => {
    fetchFields();
  }, [entity]);

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
    setShowForm(false);
  };

  const openEdit = (field: CustomFieldDefinition) => {
    setEditing(field);
    setForm({
      key: field.key,
      label: field.label,
      type: field.type,
      required: field.required,
      isActive: field.isActive,
      order: field.order,
      choicesCsv: (field as any).choices?.join(', ') || '',
    });
    setShowForm(true);
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

    if (form.type === 'select' && normalizedChoices.length === 0) {
      setError('Select fields require at least one choice');
      return;
    }

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
        payload.choices = normalizedChoices;
      }

      if (editing) {
        await settingsService.updateCustomField(editing.id, payload);
      } else {
        await settingsService.createCustomField(payload);
      }

      resetForm();
      await fetchFields();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to save custom field');
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.field) return;

    try {
      await settingsService.deleteCustomField(deleteModal.field.id);
      setDeleteModal({ isOpen: false, field: null });
      await fetchFields();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to delete custom field');
    }
  };

  const activeFields = fields.filter((f) => f.isActive);
  const inactiveFields = fields.filter((f) => !f.isActive);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Custom Fields</h1>
        <p className="text-sm text-gray-500 mt-1">
          Define custom attributes for students, classes, payments, and leads
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Entity Selector */}
      <SettingsCard
        title="Select Entity"
        description="Choose which entity to manage custom fields for"
      >
        <div className="flex gap-2 flex-wrap">
          {entityOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setEntity(opt.value)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                entity === opt.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </SettingsCard>

      {/* Add Field Button */}
      {!showForm && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            <FiPlus className="w-4 h-4" />
            Add Custom Field
          </button>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <SettingsCard
          title={editing ? 'Edit Custom Field' : 'Add Custom Field'}
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
                onClick={submit}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                <FiCheck className="w-4 h-4" />
                {editing ? 'Update' : 'Create'}
              </button>
            </div>
          }
        >
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field Key <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.key}
                  onChange={(e) => setForm({ ...form, key: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm"
                  required
                  disabled={!!editing}
                  placeholder="e.g. emergency_contact"
                />
                <p className="text-xs text-gray-500 mt-1">Unique identifier (cannot be changed)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field Label <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm"
                  required
                  placeholder="e.g. Emergency Contact"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as CustomFieldType })}
                  className="w-full rounded-md border-gray-300 shadow-sm"
                  required
                >
                  {typeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                <input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: Number(e.target.value) || 0 })}
                  className="w-full rounded-md border-gray-300 shadow-sm"
                  min="0"
                />
              </div>
            </div>
            {form.type === 'select' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Choices <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.choicesCsv}
                  onChange={(e) => setForm({ ...form, choicesCsv: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm"
                  placeholder="Comma-separated values, e.g. Option 1, Option 2, Option 3"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separate multiple choices with commas
                </p>
              </div>
            )}
            <div className="flex items-center gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={form.required}
                  onChange={(e) => setForm({ ...form, required: e.target.checked })}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">Required field</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">Active</span>
              </label>
            </div>
          </form>
        </SettingsCard>
      )}

      {/* Active Fields */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : (
        <>
          {activeFields.length > 0 && (
            <SettingsCard title={`Active Fields (${activeFields.length})`}>
              <div className="space-y-3">
                {activeFields.map((field) => (
                  <div
                    key={field.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{field.label}</span>
                        <span className="text-xs text-gray-500">({field.key})</span>
                        <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded">
                          {field.type}
                        </span>
                        {field.required && (
                          <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">
                            Required
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(field)}
                        className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteModal({ isOpen: true, field })}
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

          {/* Inactive Fields */}
          {inactiveFields.length > 0 && (
            <SettingsCard title={`Inactive Fields (${inactiveFields.length})`}>
              <div className="space-y-3">
                {inactiveFields.map((field) => (
                  <div
                    key={field.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg opacity-60"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{field.label}</span>
                        <span className="text-xs text-gray-500">({field.key})</span>
                        <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-700 rounded">
                          {field.type}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(field)}
                        className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteModal({ isOpen: true, field })}
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

          {fields.length === 0 && !showForm && (
            <SettingsCard title="No Custom Fields">
              <p className="text-sm text-gray-500">
                No custom fields defined for {entityOptions.find((e) => e.value === entity)?.label.toLowerCase()}.
                Click "Add Custom Field" to create one.
              </p>
            </SettingsCard>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, field: null })}
        onConfirm={handleDelete}
        title="Delete Custom Field"
        message={`Are you sure you want to delete "${deleteModal.field?.label}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  );
}

