'use client';

import { useEffect, useState } from 'react';
import { financeService, ExpenseCategory } from '@/lib/services';
import StandardListView, { FilterConfig } from '@/components/StandardListView';
import { Column, ActionButton } from '@/components/DataTable';
import SummaryCard from '@/components/SummaryCard';
import EmptyState from '@/components/EmptyState';
import { FiSliders, FiPlus, FiEdit, FiEye, FiCheckCircle } from 'react-icons/fi';

export default function ExpenseCategoriesPage() {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

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
      onClick: () => {
        // TODO: Open edit modal
        alert('Edit category functionality coming soon');
      },
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
          // TODO: Open add category modal
          alert('Add category functionality coming soon');
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
              alert('Add category functionality coming soon');
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
  );
}

