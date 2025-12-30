'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { financeService, Expense } from '@/lib/services';
import StandardListView, { FilterConfig } from '@/components/StandardListView';
import { Column, ActionButton } from '@/components/DataTable';
import SummaryCard from '@/components/SummaryCard';
import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/settings/StatusBadge';
import { FiFileText, FiPlus, FiEye, FiDollarSign, FiCheckCircle, FiClock, FiAlertCircle } from 'react-icons/fi';

export default function ExpensesPage() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await financeService.getExpenses();
      setExpenses(response.data);
    } catch (err: any) {
      console.error('Error fetching expenses:', err);
      setError(err.response?.data?.message || 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch =
      searchTerm === '' ||
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.expenseNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === '' || expense.status === statusFilter;
    const matchesCategory = categoryFilter === '' || expense.categoryId === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Calculate metrics
  const totalExpenses = expenses.length;
  const paidCount = expenses.filter((e) => e.status === 'paid').length;
  const pendingCount = expenses.filter((e) => e.status === 'pending_approval').length;
  const totalPaid = expenses
    .filter((e) => e.status === 'paid')
    .reduce((sum, e) => sum + e.amount, 0);
  const totalUnpaid = expenses
    .filter((e) => e.status === 'approved' || e.status === 'pending_approval')
    .reduce((sum, e) => sum + e.amount, 0);

  // Get unique categories for filter
  const categories = Array.from(new Set(expenses.map((e) => e.category?.name).filter(Boolean)));

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; status: 'active' | 'warning' | 'inactive' | 'error' }> = {
      paid: { label: 'Paid', status: 'active' },
      approved: { label: 'Approved', status: 'inactive' },
      pending_approval: { label: 'Pending Approval', status: 'warning' },
      draft: { label: 'Draft', status: 'warning' },
      reversed: { label: 'Reversed', status: 'error' },
    };
    const config = statusMap[status] || { label: status, status: 'active' };
    return <StatusBadge status={config.status} label={config.label} />;
  };

  const columns: Column<Expense>[] = [
    {
      key: 'expenseNumber',
      label: 'Expense #',
      sortable: true,
      render: (value) => <span className="text-sm font-medium text-gray-900">{String(value)}</span>,
    },
    {
      key: 'expenseDate',
      label: 'Date',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-600">
          {new Date(String(value)).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (value) => (
        <span className="text-sm font-semibold text-red-600">
          {Number(value).toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
        </span>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (_, row) => (
        <span className="text-sm text-gray-700">{row.category?.name || '-'}</span>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (value) => (
        <span className="text-sm text-gray-600">{String(value).substring(0, 50)}</span>
      ),
    },
    {
      key: 'vendor',
      label: 'Vendor',
      render: (value) => (
        <span className="text-sm text-gray-600">{value ? String(value) : '-'}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => getStatusBadge(String(value)),
    },
    {
      key: 'paidDate',
      label: 'Paid Date',
      render: (value) => (
        <span className="text-sm text-gray-600">
          {value ? new Date(String(value)).toLocaleDateString() : '-'}
        </span>
      ),
    },
  ];

  const filters: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: '', label: 'All Statuses' },
        { value: 'paid', label: `Paid (${paidCount})` },
        { value: 'approved', label: 'Approved' },
        { value: 'pending_approval', label: `Pending Approval (${pendingCount})` },
        { value: 'draft', label: 'Draft' },
      ],
      value: statusFilter,
      onChange: setStatusFilter,
    },
    {
      key: 'category',
      label: 'Category',
      type: 'select',
      options: [
        { value: '', label: 'All Categories' },
        ...categories.map((cat) => ({ value: cat || '', label: cat || '' })),
      ],
      value: categoryFilter,
      onChange: setCategoryFilter,
    },
  ];

  const actions = (row: Expense): ActionButton[] => [
    {
      label: 'View',
      onClick: () => {
        // TODO: Navigate to expense details
        alert('Expense details coming soon');
      },
      icon: <FiEye className="w-4 h-4" />,
    },
  ];

  return (
    <StandardListView
      title="Expenses"
      subtitle="Manage outgoing expenses and approvals"
      primaryAction={{
        label: 'Record Expense',
        onClick: () => {
          // TODO: Open record expense modal
          alert('Record expense functionality coming soon');
        },
        icon: <FiPlus className="w-4 h-4" />,
      }}
      searchPlaceholder="Search by description, vendor, or expense number..."
      onSearch={setSearchTerm}
      searchValue={searchTerm}
      filters={filters}
      columns={columns}
      data={filteredExpenses}
      loading={loading}
      actions={actions}
      emptyMessage="No expenses found"
      emptyState={
        <EmptyState
          icon={<FiFileText className="w-12 h-12 text-gray-400" />}
          title="No expenses"
          message="Record expenses to track outgoing cash"
          action={{
            label: 'Record Expense',
            onClick: () => {
              alert('Record expense functionality coming soon');
            },
          }}
        />
      }
      summaryCards={
        <>
          <SummaryCard
            title="Total Expenses"
            value={totalExpenses}
            icon={<FiFileText className="w-5 h-5" />}
          />
          <SummaryCard
            title="Total Paid"
            value={totalPaid.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
            variant="success"
            icon={<FiCheckCircle className="w-5 h-5" />}
          />
          <SummaryCard
            title="Unpaid"
            value={totalUnpaid.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
            variant={totalUnpaid > 0 ? 'warning' : 'default'}
            icon={<FiAlertCircle className="w-5 h-5" />}
          />
          <SummaryCard
            title="Pending Approval"
            value={pendingCount}
            variant={pendingCount > 0 ? 'warning' : 'default'}
            icon={<FiClock className="w-5 h-5" />}
          />
        </>
      }
      getRowId={(row) => row.id}
    />
  );
}

