'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { financeService, Payment } from '@/lib/services';
import StandardListView, { FilterConfig } from '@/components/StandardListView';
import { Column, ActionButton } from '@/components/DataTable';
import SummaryCard from '@/components/SummaryCard';
import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/settings/StatusBadge';
import { FiCreditCard, FiPlus, FiEye, FiDollarSign, FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';

export default function PaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await financeService.getPayments();
      setPayments(response.data);
    } catch (err: any) {
      console.error('Error fetching payments:', err);
      setError(err.response?.data?.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      searchTerm === '' ||
      payment.paymentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === '' || payment.status === statusFilter;
    const matchesMethod = methodFilter === '' || payment.method === methodFilter;

    return matchesSearch && matchesStatus && matchesMethod;
  });

  // Calculate metrics
  const totalPayments = payments.length;
  const receivedCount = payments.filter((p) => p.status === 'received').length;
  const pendingCount = payments.filter((p) => p.status === 'pending').length;
  const totalAmount = payments
    .filter((p) => p.status === 'received')
    .reduce((sum, p) => sum + p.amount, 0);
  const allocatedAmount = payments.reduce((sum, payment) => {
    const allocated = payment.allocations?.reduce((allocSum, alloc) => allocSum + alloc.amount, 0) || 0;
    return sum + allocated;
  }, 0);
  const unallocatedAmount = totalAmount - allocatedAmount;

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; status: 'active' | 'warning' | 'inactive' | 'error' }> = {
      received: { label: 'Received', status: 'active' },
      pending: { label: 'Pending', status: 'warning' },
      reversed: { label: 'Reversed', status: 'error' },
      failed: { label: 'Failed', status: 'error' },
    };
    const config = statusMap[status] || { label: status, status: 'active' };
    return <StatusBadge status={config.status} label={config.label} />;
  };

  const getMethodLabel = (method: string) => {
    return method.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const columns: Column<Payment>[] = [
    {
      key: 'paymentNumber',
      label: 'Payment #',
      sortable: true,
      render: (value) => <span className="text-sm font-medium text-gray-900">{String(value)}</span>,
    },
    {
      key: 'receivedDate',
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
        <span className="text-sm font-semibold text-green-600">
          {Number(value).toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
        </span>
      ),
    },
    {
      key: 'method',
      label: 'Method',
      render: (value) => (
        <span className="text-sm text-gray-700 capitalize">{getMethodLabel(String(value))}</span>
      ),
    },
    {
      key: 'cashAccount',
      label: 'Account',
      render: (_, row) => (
        <span className="text-sm text-gray-600">{row.cashAccount?.name || '-'}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => getStatusBadge(String(value)),
    },
    {
      key: 'allocations',
      label: 'Allocated',
      render: (_, row) => {
        const allocated = row.allocations?.reduce((sum, alloc) => sum + alloc.amount, 0) || 0;
        const unallocated = row.amount - allocated;
        return (
          <div className="text-sm">
            <span className="text-gray-900 font-medium">
              {allocated.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
            </span>
            {unallocated > 0 && (
              <span className="text-gray-500 ml-1">
                ({unallocated.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })} unallocated)
              </span>
            )}
          </div>
        );
      },
    },
  ];

  const filters: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: '', label: 'All Statuses' },
        { value: 'received', label: `Received (${receivedCount})` },
        { value: 'pending', label: `Pending (${pendingCount})` },
        { value: 'reversed', label: 'Reversed' },
        { value: 'failed', label: 'Failed' },
      ],
      value: statusFilter,
      onChange: setStatusFilter,
    },
    {
      key: 'method',
      label: 'Method',
      type: 'select',
      options: [
        { value: '', label: 'All Methods' },
        { value: 'cash', label: 'Cash' },
        { value: 'bank_transfer', label: 'Bank Transfer' },
        { value: 'vodafone_cash', label: 'Vodafone Cash' },
        { value: 'instapay', label: 'Instapay' },
        { value: 'pos', label: 'POS' },
      ],
      value: methodFilter,
      onChange: setMethodFilter,
    },
  ];

  const actions = (row: Payment): ActionButton[] => [
    {
      label: 'View',
      onClick: () => {
        // TODO: Navigate to payment details
        alert('Payment details coming soon');
      },
      icon: <FiEye className="w-4 h-4" />,
    },
  ];

  return (
    <StandardListView
      title="Payments"
      subtitle="Manage incoming payments and allocations"
      primaryAction={{
        label: 'Record Payment',
        onClick: () => {
          // TODO: Open record payment modal
          alert('Record payment functionality coming soon');
        },
        icon: <FiPlus className="w-4 h-4" />,
      }}
      searchPlaceholder="Search by payment number or reference..."
      onSearch={setSearchTerm}
      searchValue={searchTerm}
      filters={filters}
      columns={columns}
      data={filteredPayments}
      loading={loading}
      actions={actions}
      emptyMessage="No payments found"
      emptyState={
        <EmptyState
          icon={<FiCreditCard className="w-12 h-12 text-gray-400" />}
          title="No payments"
          message="Record payments to track incoming cash"
          action={{
            label: 'Record Payment',
            onClick: () => {
              alert('Record payment functionality coming soon');
            },
          }}
        />
      }
      summaryCards={
        <>
          <SummaryCard
            title="Total Payments"
            value={totalPayments}
            icon={<FiCreditCard className="w-5 h-5" />}
          />
          <SummaryCard
            title="Total Received"
            value={totalAmount.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
            variant="success"
            icon={<FiCheckCircle className="w-5 h-5" />}
          />
          <SummaryCard
            title="Allocated"
            value={allocatedAmount.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
            variant="info"
            icon={<FiDollarSign className="w-5 h-5" />}
          />
          <SummaryCard
            title="Unallocated"
            value={unallocatedAmount.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
            variant={unallocatedAmount > 0 ? 'warning' : 'default'}
            icon={<FiClock className="w-5 h-5" />}
          />
        </>
      }
      getRowId={(row) => row.id}
    />
  );
}

