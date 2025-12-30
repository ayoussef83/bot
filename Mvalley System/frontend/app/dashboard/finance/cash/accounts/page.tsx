'use client';

import { useEffect, useState } from 'react';
import { financeService, CashAccount } from '@/lib/services';
import StandardListView, { FilterConfig } from '@/components/StandardListView';
import { Column, ActionButton } from '@/components/DataTable';
import SummaryCard from '@/components/SummaryCard';
import EmptyState from '@/components/EmptyState';
import { FiDollarSign, FiPlus, FiEdit, FiEye, FiCreditCard, FiTrendingUp } from 'react-icons/fi';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<CashAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await financeService.getCashAccounts();
      setAccounts(response.data);
    } catch (err: any) {
      console.error('Error fetching cash accounts:', err);
      setError(err.response?.data?.message || 'Failed to load cash accounts');
    } finally {
      setLoading(false);
    }
  };

  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch =
      searchTerm === '' ||
      account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.accountNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.bankName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === '' || account.type === typeFilter;

    return matchesSearch && matchesType;
  });

  // Calculate metrics
  const totalAccounts = accounts.length;
  const activeAccounts = accounts.filter((a) => a.isActive).length;
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const bankBalance = accounts
    .filter((a) => a.type === 'bank')
    .reduce((sum, a) => sum + a.balance, 0);
  const cashBalance = accounts
    .filter((a) => a.type === 'cash')
    .reduce((sum, a) => sum + a.balance, 0);
  const walletBalance = accounts
    .filter((a) => a.type === 'wallet')
    .reduce((sum, a) => sum + a.balance, 0);

  const getTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const columns: Column<CashAccount>[] = [
    {
      key: 'name',
      label: 'Account Name',
      sortable: true,
      render: (value) => <span className="text-sm font-medium text-gray-900">{String(value)}</span>,
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-700 capitalize">{getTypeLabel(String(value))}</span>
      ),
    },
    {
      key: 'accountNumber',
      label: 'Account Number',
      render: (value) => (
        <span className="text-sm text-gray-600">{value ? String(value) : '-'}</span>
      ),
    },
    {
      key: 'bankName',
      label: 'Bank',
      render: (value) => (
        <span className="text-sm text-gray-600">{value ? String(value) : '-'}</span>
      ),
    },
    {
      key: 'balance',
      label: 'Balance',
      sortable: true,
      render: (value) => (
        <span className="text-sm font-semibold text-gray-900">
          {Number(value).toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
        </span>
      ),
    },
    {
      key: 'currency',
      label: 'Currency',
      render: (value) => <span className="text-sm text-gray-600">{String(value)}</span>,
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

  const filters: FilterConfig[] = [
    {
      key: 'type',
      label: 'Type',
      type: 'select',
      options: [
        { value: '', label: 'All Types' },
        { value: 'bank', label: 'Bank' },
        { value: 'cash', label: 'Cash' },
        { value: 'wallet', label: 'Wallet' },
      ],
      value: typeFilter,
      onChange: setTypeFilter,
    },
  ];

  const actions = (row: CashAccount): ActionButton[] => [
    {
      label: 'View',
      onClick: () => {
        // TODO: Navigate to account details
        alert('Account details coming soon');
      },
      icon: <FiEye className="w-4 h-4" />,
    },
    {
      label: 'Edit',
      onClick: () => {
        // TODO: Open edit modal
        alert('Edit account functionality coming soon');
      },
      icon: <FiEdit className="w-4 h-4" />,
    },
  ];

  return (
    <StandardListView
      title="Cash Accounts"
      subtitle="Manage bank accounts, cash registers, and digital wallets"
      primaryAction={{
        label: 'Add Account',
        onClick: () => {
          // TODO: Open add account modal
          alert('Add account functionality coming soon');
        },
        icon: <FiPlus className="w-4 h-4" />,
      }}
      searchPlaceholder="Search by account name, number, or bank..."
      onSearch={setSearchTerm}
      searchValue={searchTerm}
      filters={filters}
      columns={columns}
      data={filteredAccounts}
      loading={loading}
      actions={actions}
      emptyMessage="No cash accounts found"
      emptyState={
        <EmptyState
          icon={<FiDollarSign className="w-12 h-12 text-gray-400" />}
          title="No cash accounts"
          message="Add cash accounts to track where money is stored"
          action={{
            label: 'Add Account',
            onClick: () => {
              alert('Add account functionality coming soon');
            },
          }}
        />
      }
      summaryCards={
        <>
          <SummaryCard
            title="Total Accounts"
            value={totalAccounts}
            icon={<FiCreditCard className="w-5 h-5" />}
          />
          <SummaryCard
            title="Total Balance"
            value={totalBalance.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
            variant="success"
            icon={<FiDollarSign className="w-5 h-5" />}
          />
          <SummaryCard
            title="Bank Balance"
            value={bankBalance.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
            variant="info"
            icon={<FiTrendingUp className="w-5 h-5" />}
          />
          <SummaryCard
            title="Active Accounts"
            value={activeAccounts}
            icon={<FiCreditCard className="w-5 h-5" />}
          />
        </>
      }
      getRowId={(row) => row.id}
    />
  );
}

