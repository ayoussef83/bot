'use client';

import { useEffect, useState } from 'react';
import { financeService, ExpenseCategory } from '@/lib/services';
import StandardListView, { FilterConfig } from '@/components/StandardListView';
import { Column, ActionButton } from '@/components/DataTable';
import SummaryCard from '@/components/SummaryCard';
import EmptyState from '@/components/EmptyState';
import { FiSliders, FiPlus, FiEdit, FiEye, FiCheckCircle, FiX } from 'react-icons/fi';

interface CreateExpenseCategoryDto {
  name: string;
  code: string;
  description?: string;
  isActive?: boolean;
}

export default function ExpenseCategoriesPage() {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [formData, setFormData] = useState<CreateExpenseCategoryDto>({
    name: '',
    code: '',
    description: '',
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await financeService.getExpenseCategories();
      setCategories(response.data);
    } catch (err: any) {
      console.error('Error fetching expense categories:', err);
      setError(err.response?.data?.message || 'Failed to load expense categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    // Validation
    const errors: Record<string, string> = {};
    if (!formData.name || formData.name.trim() === '') {
      errors.name = 'Category name is required';
    }
    if (!formData.code || formData.code.trim() === '') {
      errors.code = 'Category code is required';
    } else if (!/^[A-Z0-9_]{2,10}$/.test(formData.code.trim().toUpperCase())) {
      errors.code = 'Code must be 2-10 uppercase letters, numbers, or underscores';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const categoryData = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        description: formData.description?.trim() || undefined,
        isActive: formData.isActive,
      };

      if (editingCategory) {
        await financeService.updateExpenseCategory(editingCategory.id, categoryData);
      } else {
        await financeService.createExpenseCategory(categoryData);
      }
      setShowForm(false);
      setEditingCategory(null);
      setFormData({
        name: '',
        code: '',
        description: '',
        isActive: true,
      });
      setFormErrors({});
      await fetchCategories();
    } catch (err: any) {
      console.error('Error saving expense category:', err);
      setFormErrors({ submit: err.response?.data?.message || 'Failed to save expense category' });
    }
  };

  const handleEdit = (category: ExpenseCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      code: category.code,
      description: category.description || '',
      isActive: category.isActive,
    });
    setShowForm(true);
    setFormErrors({});
  };

  const filteredCategories = categories.filter((category) => {
    const matchesSearch =
      searchTerm === '' ||
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.code.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const activeCount = categories.filter((c) => c.isActive).length;

  const columns: Column<ExpenseCategory>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (value) => <span className="text-sm font-medium text-gray-900">{String(value)}</span>,
    },
    {
      key: 'code',
      label: 'Code',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-600 font-mono">{String(value)}</span>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (value) => (
        <span className="text-sm text-gray-600">{value ? String(value) : '-'}</span>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (value) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            value
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {value ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  const actions = (row: ExpenseCategory): ActionButton[] => [
    {
      label: 'Edit',
      onClick: () => handleEdit(row),
      icon: <FiEdit className="w-4 h-4" />,
    },
  ];

  return (
    <StandardListView
      title="Expense Categories"
      subtitle="Manage expense categories for reporting and budgeting"
      primaryAction={{
        label: 'Add Category',
        onClick: () => {
          setEditingCategory(null);
          setFormData({
            name: '',
            code: '',
            description: '',
            isActive: true,
          });
          setFormErrors({});
          setShowForm(true);
        },
        icon: <FiPlus className="w-4 h-4" />,
      }}
      searchPlaceholder="Search by name or code..."
      onSearch={setSearchTerm}
      searchValue={searchTerm}
      columns={columns}
      data={filteredCategories}
      loading={loading}
      actions={actions}
      emptyMessage="No expense categories found"
      emptyState={
        <EmptyState
          icon={<FiSliders className="w-12 h-12 text-gray-400" />}
          title="No expense categories"
          message="Create expense categories to organize expenses"
          action={{
            label: 'Add Category',
            onClick: () => {
              setEditingCategory(null);
              setFormData({
                name: '',
                code: '',
                description: '',
                isActive: true,
              });
              setFormErrors({});
              setShowForm(true);
            },
          }}
        />
      }
      summaryCards={
        <>
          <SummaryCard
            title="Total Categories"
            value={categories.length}
            icon={<FiSliders className="w-5 h-5" />}
          />
          <SummaryCard
            title="Active"
            value={activeCount}
            variant="success"
            icon={<FiCheckCircle className="w-5 h-5" />}
          />
        </>
      }
      getRowId={(row) => row.id}
    />

      {/* Add/Edit Category Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => {
                setShowForm(false);
                setEditingCategory(null);
                setFormData({
                  name: '',
                  code: '',
                  description: '',
                  isActive: true,
                });
                setFormErrors({});
              }}
            ></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">
                    {editingCategory ? 'Edit Expense Category' : 'Add Expense Category'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setEditingCategory(null);
                      setFormData({
                        name: '',
                        code: '',
                        description: '',
                        isActive: true,
                      });
                      setFormErrors({});
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {formErrors.submit && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                      {formErrors.submit}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                        formErrors.name ? 'border-red-300' : ''
                      }`}
                      placeholder="e.g., Instructor Payouts"
                      required
                    />
                    {formErrors.name && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category Code *</label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => {
                        // Auto-uppercase and remove spaces
                        const value = e.target.value.toUpperCase().replace(/\s/g, '');
                        setFormData({ ...formData, code: value });
                      }}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono ${
                        formErrors.code ? 'border-red-300' : ''
                      }`}
                      placeholder="e.g., INSTR"
                      maxLength={10}
                      required
                      disabled={!!editingCategory}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {editingCategory
                        ? 'Code cannot be changed after creation'
                        : '2-10 uppercase letters, numbers, or underscores (e.g., INSTR, RENT, MKTG)'}
                    </p>
                    {formErrors.code && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.code}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description (Optional)</label>
                    <textarea
                      rows={3}
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Brief description of what this category is used for"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      value={formData.isActive ? 'active' : 'inactive'}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      Inactive categories cannot be selected when creating new expenses
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingCategory(null);
                        setFormData({
                          name: '',
                          code: '',
                          description: '',
                          isActive: true,
                        });
                        setFormErrors({});
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
                    >
                      {editingCategory ? 'Update Category' : 'Create Category'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

