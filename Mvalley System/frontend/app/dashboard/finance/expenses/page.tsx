'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { financeService, Expense, ExpenseCategory, CashAccount } from '@/lib/services';
import { instructorsService, Instructor } from '@/lib/services';
import StandardListView, { FilterConfig } from '@/components/StandardListView';
import { Column, ActionButton } from '@/components/DataTable';
import SummaryCard from '@/components/SummaryCard';
import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/settings/StatusBadge';
import { FiFileText, FiPlus, FiEye, FiDollarSign, FiCheckCircle, FiClock, FiAlertCircle, FiX } from 'react-icons/fi';

interface CreateExpenseDto {
  expenseDate: string;
  amount: number;
  categoryId: string;
  description: string;
  vendor?: string;
  paymentMethod?: string;
  cashAccountId?: string;
  status?: string;
  instructorId?: string;
  paidDate?: string;
  notes?: string;
}

export default function ExpensesPage() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [formData, setFormData] = useState<CreateExpenseDto>({
    expenseDate: new Date().toISOString().split('T')[0],
    amount: 0,
    categoryId: '',
    description: '',
    vendor: '',
    paymentMethod: '',
    cashAccountId: '',
    status: 'pending_approval',
    instructorId: '',
    paidDate: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    if (showCreateModal) {
      fetchExpenseCategories();
      fetchCashAccounts();
      fetchInstructors();
    }
  }, [showCreateModal]);

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

  const fetchExpenseCategories = async () => {
    try {
      const response = await financeService.getExpenseCategories();
      const activeCategories = response.data.filter((cat) => cat.isActive);
      setExpenseCategories(activeCategories);
      if (activeCategories.length > 0 && !formData.categoryId) {
        setFormData({ ...formData, categoryId: activeCategories[0].id });
      }
    } catch (err: any) {
      console.error('Error fetching expense categories:', err);
    }
  };

  const fetchCashAccounts = async () => {
    try {
      const response = await financeService.getCashAccounts();
      const activeAccounts = response.data.filter((acc) => acc.isActive);
      setCashAccounts(activeAccounts);
    } catch (err: any) {
      console.error('Error fetching cash accounts:', err);
    }
  };

  const fetchInstructors = async () => {
    try {
      const response = await instructorsService.getAll();
      setInstructors(response.data);
    } catch (err: any) {
      console.error('Error fetching instructors:', err);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    // Validation
    const errors: Record<string, string> = {};
    if (!formData.amount || formData.amount <= 0) {
      errors.amount = 'Amount must be greater than 0';
    }
    if (!formData.categoryId) {
      errors.categoryId = 'Category is required';
    }
    if (!formData.description || formData.description.trim() === '') {
      errors.description = 'Description is required';
    }
    if (formData.status === 'paid' && !formData.cashAccountId) {
      errors.cashAccountId = 'Cash account is required for paid expenses';
    }
    if (formData.status === 'paid' && !formData.paidDate) {
      errors.paidDate = 'Paid date is required for paid expenses';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const expenseData: any = {
        expenseDate: formData.expenseDate,
        amount: parseFloat(String(formData.amount)),
        categoryId: formData.categoryId,
        description: formData.description.trim(),
        vendor: formData.vendor?.trim() || undefined,
        paymentMethod: formData.paymentMethod || undefined,
        cashAccountId: formData.cashAccountId || undefined,
        status: formData.status || 'pending_approval',
        instructorId: formData.instructorId || undefined,
        paidDate: formData.paidDate || undefined,
        notes: formData.notes?.trim() || undefined,
      };

      await financeService.createExpense(expenseData);

      setShowCreateModal(false);
      setFormData({
        expenseDate: new Date().toISOString().split('T')[0],
        amount: 0,
        categoryId: '',
        description: '',
        vendor: '',
        paymentMethod: '',
        cashAccountId: '',
        status: 'pending_approval',
        instructorId: '',
        paidDate: '',
        notes: '',
      });
      setFormErrors({});
      await fetchExpenses();
    } catch (err: any) {
      console.error('Error creating expense:', err);
      setFormErrors({ submit: err.response?.data?.message || 'Failed to record expense' });
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
        router.push(`/dashboard/finance/expenses/details?id=${row.id}`);
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
          setShowCreateModal(true);
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
              setShowCreateModal(true);
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

      {/* Create Expense Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => {
                setShowCreateModal(false);
                setFormData({
                  expenseDate: new Date().toISOString().split('T')[0],
                  amount: 0,
                  categoryId: '',
                  description: '',
                  vendor: '',
                  paymentMethod: '',
                  cashAccountId: '',
                  status: 'pending_approval',
                  instructorId: '',
                  paidDate: '',
                  notes: '',
                });
                setFormErrors({});
              }}
            ></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Record Expense</h2>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setFormData({
                        expenseDate: new Date().toISOString().split('T')[0],
                        amount: 0,
                        categoryId: '',
                        description: '',
                        vendor: '',
                        paymentMethod: '',
                        cashAccountId: '',
                        status: 'pending_approval',
                        instructorId: '',
                        paidDate: '',
                        notes: '',
                      });
                      setFormErrors({});
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleCreateExpense} className="space-y-4">
                  {formErrors.submit && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                      {formErrors.submit}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Expense Date *</label>
                      <input
                        type="date"
                        value={formData.expenseDate}
                        onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        required
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Amount (EGP) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.amount || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
                        }
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                          formErrors.amount ? 'border-red-300' : ''
                        }`}
                        required
                      />
                      {formErrors.amount && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.amount}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category *</label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                        formErrors.categoryId ? 'border-red-300' : ''
                      }`}
                      required
                    >
                      <option value="">Select Category</option>
                      {expenseCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {formErrors.categoryId && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.categoryId}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description *</label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                        formErrors.description ? 'border-red-300' : ''
                      }`}
                      placeholder="Describe the expense..."
                      required
                    />
                    {formErrors.description && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.description}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Vendor (Optional)</label>
                      <input
                        type="text"
                        value={formData.vendor || ''}
                        onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="Vendor/payee name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Payment Method (Optional)</label>
                      <select
                        value={formData.paymentMethod || ''}
                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value="">No Method</option>
                        <option value="cash">Cash</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="vodafone_cash">Vodafone Cash</option>
                        <option value="instapay">Instapay</option>
                        <option value="pos">POS</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => {
                        const newStatus = e.target.value;
                        setFormData({
                          ...formData,
                          status: newStatus,
                          paidDate: newStatus === 'paid' && !formData.paidDate ? new Date().toISOString().split('T')[0] : formData.paidDate,
                        });
                      }}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="draft">Draft</option>
                      <option value="pending_approval">Pending Approval</option>
                      <option value="approved">Approved</option>
                      <option value="paid">Paid</option>
                    </select>
                  </div>

                  {formData.status === 'paid' && (
                    <div className="grid grid-cols-2 gap-4 bg-yellow-50 p-4 rounded-md border border-yellow-200">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Cash Account *</label>
                        <select
                          value={formData.cashAccountId || ''}
                          onChange={(e) => setFormData({ ...formData, cashAccountId: e.target.value })}
                          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                            formErrors.cashAccountId ? 'border-red-300' : ''
                          }`}
                          required={formData.status === 'paid'}
                        >
                          <option value="">Select Account</option>
                          {cashAccounts.map((account) => (
                            <option key={account.id} value={account.id}>
                              {account.name} ({account.type}) - {account.balance.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                            </option>
                          ))}
                        </select>
                        {formErrors.cashAccountId && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.cashAccountId}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Paid Date *</label>
                        <input
                          type="date"
                          value={formData.paidDate || ''}
                          onChange={(e) => setFormData({ ...formData, paidDate: e.target.value })}
                          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                            formErrors.paidDate ? 'border-red-300' : ''
                          }`}
                          required={formData.status === 'paid'}
                          max={new Date().toISOString().split('T')[0]}
                        />
                        {formErrors.paidDate && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.paidDate}</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Optional: Link to Instructor</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Instructor (Optional)</label>
                      <select
                        value={formData.instructorId || ''}
                        onChange={(e) => setFormData({ ...formData, instructorId: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value="">No Instructor</option>
                        {instructors.map((instructor) => (
                          <option key={instructor.id} value={instructor.id}>
                            {instructor.user?.firstName} {instructor.user?.lastName}
                            {instructor.user?.email ? ` (${instructor.user.email})` : ''}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-xs text-gray-500">
                        Link this expense to an instructor (e.g., for instructor payouts)
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                    <textarea
                      rows={3}
                      value={formData.notes || ''}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Additional notes about this expense"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false);
                        setFormData({
                          expenseDate: new Date().toISOString().split('T')[0],
                          amount: 0,
                          categoryId: '',
                          description: '',
                          vendor: '',
                          paymentMethod: '',
                          cashAccountId: '',
                          status: 'pending_approval',
                          instructorId: '',
                          paidDate: '',
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
                      Record Expense
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

