'use client';

import { useEffect, useState } from 'react';
import { financeService, CashAccount } from '@/lib/services';
import StandardListView, { FilterConfig } from '@/components/StandardListView';
import { Column, ActionButton } from '@/components/DataTable';
import SummaryCard from '@/components/SummaryCard';
import EmptyState from '@/components/EmptyState';
import { FiDollarSign, FiPlus, FiEdit, FiEye, FiCreditCard, FiTrendingUp, FiX } from 'react-icons/fi';

interface CreateCashAccountDto {
  name: string;
  type: string;
  accountNumber?: string;
  bankName?: string;
  balance?: number;
  currency?: string;
  isActive?: boolean;
  notes?: string;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<CashAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<CashAccount | null>(null);
  const [formData, setFormData] = useState<CreateCashAccountDto>({
    name: '',
    type: 'bank',
    accountNumber: '',
    bankName: '',
    balance: 0,
    currency: 'EGP',
    isActive: true,
    notes: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    // Validation
    const errors: Record<string, string> = {};
    if (!formData.name || formData.name.trim() === '') {
      errors.name = 'Account name is required';
    }
    if (!formData.type) {
      errors.type = 'Account type is required';
    }
    if (formData.balance === undefined || formData.balance < 0) {
      errors.balance = 'Balance must be 0 or greater';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      if (editingAccount) {
        await financeService.updateCashAccount(editingAccount.id, formData);
      } else {
        await financeService.createCashAccount(formData);
      }
      setShowForm(false);
      setEditingAccount(null);
      setFormData({
        name: '',
        type: 'bank',
        accountNumber: '',
        bankName: '',
        balance: 0,
        currency: 'EGP',
        isActive: true,
        notes: '',
      });
      setFormErrors({});
      await fetchAccounts();
    } catch (err: any) {
      console.error('Error saving cash account:', err);
      setFormErrors({ submit: err.response?.data?.message || 'Failed to save cash account' });
    }
  };

  const handleEdit = (account: CashAccount) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      type: account.type,
      accountNumber: account.accountNumber || '',
      bankName: account.bankName || '',
      balance: account.balance,
      currency: account.currency || 'EGP',
      isActive: account.isActive,
      notes: account.notes || '',
    });
    setShowForm(true);
    setFormErrors({});
  };

  const handleDelete = async (account: CashAccount) => {
    if (!confirm(`Are you sure you want to delete "${account.name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      // Note: Delete endpoint might not exist, check backend
      await fetchAccounts();
    } catch (err: any) {
      console.error('Error deleting cash account:', err);
      alert(err.response?.data?.message || 'Failed to delete cash account');
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
      label: 'Edit',
      onClick: () => handleEdit(row),
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
          setEditingAccount(null);
          setFormData({
            name: '',
            type: 'bank',
            accountNumber: '',
            bankName: '',
            balance: 0,
            currency: 'EGP',
            isActive: true,
            notes: '',
          });
          setFormErrors({});
          setShowForm(true);
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
              setEditingAccount(null);
              setFormData({
                name: '',
                type: 'bank',
                accountNumber: '',
                bankName: '',
                balance: 0,
                currency: 'EGP',
                isActive: true,
                notes: '',
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

      {/* Add/Edit Account Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => {
                setShowForm(false);
                setEditingAccount(null);
                setFormData({
                  name: '',
                  type: 'bank',
                  accountNumber: '',
                  bankName: '',
                  balance: 0,
                  currency: 'EGP',
                  isActive: true,
                  notes: '',
                });
                setFormErrors({});
              }}
            ></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">
                    {editingAccount ? 'Edit Cash Account' : 'Add Cash Account'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setEditingAccount(null);
                      setFormData({
                        name: '',
                        type: 'bank',
                        accountNumber: '',
                        bankName: '',
                        balance: 0,
                        currency: 'EGP',
                        isActive: true,
                        notes: '',
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
                    <label className="block text-sm font-medium text-gray-700">Account Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                        formErrors.name ? 'border-red-300' : ''
                      }`}
                      placeholder="e.g., Main Bank Account"
                      required
                    />
                    {formErrors.name && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Account Type *</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                          formErrors.type ? 'border-red-300' : ''
                        }`}
                        required
                      >
                        <option value="bank">Bank</option>
                        <option value="cash">Cash</option>
                        <option value="wallet">Wallet</option>
                      </select>
                      {formErrors.type && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.type}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Currency</label>
                      <select
                        value={formData.currency}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value="EGP">EGP</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                      </select>
                    </div>
                  </div>

                  {formData.type === 'bank' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Account Number</label>
                        <input
                          type="text"
                          value={formData.accountNumber || ''}
                          onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          placeholder="Bank account number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                        <input
                          type="text"
                          value={formData.bankName || ''}
                          onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          placeholder="e.g., National Bank of Egypt"
                        />
                      </div>
                    </>
                  )}

                  {formData.type === 'wallet' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Wallet Number</label>
                      <input
                        type="text"
                        value={formData.accountNumber || ''}
                        onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="Wallet phone number or ID"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Initial Balance {editingAccount ? '(Current: ' + editingAccount.balance.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }) + ')' : '*'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.balance || 0}
                      onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                        formErrors.balance ? 'border-red-300' : ''
                      }`}
                      required={!editingAccount}
                      disabled={editingAccount ? true : false}
                    />
                    {editingAccount && (
                      <p className="mt-1 text-xs text-gray-500">
                        Balance is automatically updated by payments and expenses. Cannot be manually edited.
                      </p>
                    )}
                    {formErrors.balance && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.balance}</p>
                    )}
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
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                    <textarea
                      rows={3}
                      value={formData.notes || ''}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Additional notes about this account"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingAccount(null);
                        setFormData({
                          name: '',
                          type: 'bank',
                          accountNumber: '',
                          bankName: '',
                          balance: 0,
                          currency: 'EGP',
                          isActive: true,
                          notes: '',
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
                      {editingAccount ? 'Update Account' : 'Create Account'}
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

