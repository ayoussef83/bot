'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { financeService, Invoice } from '@/lib/services';
import StandardListView, { FilterConfig } from '@/components/StandardListView';
import { Column, ActionButton } from '@/components/DataTable';
import SummaryCard from '@/components/SummaryCard';
import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/settings/StatusBadge';
import { FiFileText, FiPlus, FiEye, FiDollarSign, FiCheckCircle, FiAlertCircle, FiClock } from 'react-icons/fi';

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await financeService.getInvoices();
      setInvoices(response.data);
    } catch (err: any) {
      console.error('Error fetching invoices:', err);
      setError(err.response?.data?.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      searchTerm === '' ||
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.student?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.student?.lastName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === '' || invoice.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate metrics
  const totalInvoices = invoices.length;
  const issuedCount = invoices.filter((i) => i.status === 'issued').length;
  const paidCount = invoices.filter((i) => i.status === 'paid').length;
  const overdueCount = invoices.filter((i) => i.status === 'overdue').length;
  const totalExpected = invoices
    .filter((i) => i.status !== 'cancelled')
    .reduce((sum, i) => sum + i.totalAmount, 0);
  const totalPaid = invoices
    .filter((i) => i.status === 'paid' || i.status === 'partially_paid')
    .reduce((sum, i) => {
      // Calculate paid amount (for partially paid, use totalAmount as approximation)
      return sum + i.totalAmount;
    }, 0);
  const totalOutstanding = totalExpected - totalPaid;

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; status: 'active' | 'warning' | 'inactive' | 'error' }> = {
      issued: { label: 'Issued', status: 'active' },
      partially_paid: { label: 'Partially Paid', status: 'warning' },
      paid: { label: 'Paid', status: 'inactive' },
      overdue: { label: 'Overdue', status: 'error' },
      draft: { label: 'Draft', status: 'warning' },
      cancelled: { label: 'Cancelled', status: 'error' },
    };
    const config = statusMap[status] || { label: status, status: 'active' };
    return <StatusBadge status={config.status} label={config.label} />;
  };

  const columns: Column<Invoice>[] = [
    {
      key: 'invoiceNumber',
      label: 'Invoice #',
      sortable: true,
      render: (value) => <span className="text-sm font-medium text-gray-900">{String(value)}</span>,
    },
    {
      key: 'student',
      label: 'Student',
      render: (_, row) => (
        <span className="text-sm text-gray-900">
          {row.student ? `${row.student.firstName} ${row.student.lastName}` : '-'}
        </span>
      ),
    },
    {
      key: 'issueDate',
      label: 'Issue Date',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-600">
          {new Date(String(value)).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      sortable: true,
      render: (value) => {
        const dueDate = new Date(String(value));
        const isOverdue = dueDate < new Date();
        return (
          <span className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
            {dueDate.toLocaleDateString()}
          </span>
        );
      },
    },
    {
      key: 'totalAmount',
      label: 'Amount',
      sortable: true,
      render: (value) => (
        <span className="text-sm font-semibold text-gray-900">
          {Number(value).toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => getStatusBadge(String(value)),
    },
  ];

  const filters: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: '', label: 'All Statuses' },
        { value: 'issued', label: `Issued (${issuedCount})` },
        { value: 'paid', label: `Paid (${paidCount})` },
        { value: 'overdue', label: `Overdue (${overdueCount})` },
        { value: 'partially_paid', label: 'Partially Paid' },
        { value: 'draft', label: 'Draft' },
      ],
      value: statusFilter,
      onChange: setStatusFilter,
    },
  ];

  const actions = (row: Invoice): ActionButton[] => [
    {
      label: 'View',
      onClick: () => {
        // TODO: Navigate to invoice details
        alert('Invoice details coming soon');
      },
      icon: <FiEye className="w-4 h-4" />,
    },
  ];

  return (
    <StandardListView
      title="Invoices"
      subtitle="Manage expected revenue from student enrollments and subscriptions"
      primaryAction={{
        label: 'Create Invoice',
        onClick: () => {
          // TODO: Open create invoice modal
          alert('Create invoice functionality coming soon');
        },
        icon: <FiPlus className="w-4 h-4" />,
      }}
      searchPlaceholder="Search by invoice number or student name..."
      onSearch={setSearchTerm}
      searchValue={searchTerm}
      filters={filters}
      columns={columns}
      data={filteredInvoices}
      loading={loading}
      actions={actions}
      emptyMessage="No invoices found"
      emptyState={
        <EmptyState
          icon={<FiFileText className="w-12 h-12 text-gray-400" />}
          title="No invoices"
          message="Create invoices to track expected revenue"
          action={{
            label: 'Create Invoice',
            onClick: () => {
              alert('Create invoice functionality coming soon');
            },
          }}
        />
      }
      summaryCards={
        <>
          <SummaryCard
            title="Total Invoices"
            value={totalInvoices}
            icon={<FiFileText className="w-5 h-5" />}
          />
          <SummaryCard
            title="Total Expected"
            value={totalExpected.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
            variant="info"
            icon={<FiDollarSign className="w-5 h-5" />}
          />
          <SummaryCard
            title="Outstanding"
            value={totalOutstanding.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
            variant={totalOutstanding > 0 ? 'warning' : 'default'}
            icon={<FiAlertCircle className="w-5 h-5" />}
          />
          <SummaryCard
            title="Overdue"
            value={overdueCount}
            variant={overdueCount > 0 ? 'warning' : 'default'}
            icon={<FiClock className="w-5 h-5" />}
          />
        </>
      }
      getRowId={(row) => row.id}
    />
  );
}

