'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { financeService, Payment, Expense, studentsService, Student } from '@/lib/services';
import { instructorsService, Instructor } from '@/lib/services';
import StandardListView, { FilterConfig } from '@/components/StandardListView';
import { Column, ActionButton } from '@/components/DataTable';
import SummaryCard from '@/components/SummaryCard';
import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/settings/StatusBadge';
import TabNavigation from '@/components/TabNavigation';
import { downloadExport } from '@/lib/export';
import { FiPlus, FiEdit, FiTrash2, FiDollarSign, FiTrendingDown } from 'react-icons/fi';

export default function FinancePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'payments' | 'expenses'>('payments');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [studentFilter, setStudentFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [paymentFormData, setPaymentFormData] = useState({
    studentId: '',
    amount: '',
    type: 'subscription',
    status: 'pending',
    paymentDate: '',
    dueDate: '',
    notes: '',
  });
  const [expenseFormData, setExpenseFormData] = useState({
    category: 'operations',
    amount: '',
    description: '',
    expenseDate: new Date().toISOString().split('T')[0],
    instructorId: '',
  });

  useEffect(() => {
    fetchPayments();
    fetchExpenses();
    fetchStudents();
    fetchInstructors();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await financeService.getPayments();
      setPayments(response.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenses = async () => {
    try {
      const response = await financeService.getExpenses();
      setExpenses(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load expenses');
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await studentsService.getAll();
      setStudents(response.data);
    } catch (err: any) {
      console.error('Failed to load students', err);
    }
  };

  const fetchInstructors = async () => {
    try {
      const response = await instructorsService.getAll();
      setInstructors(response.data);
    } catch (err: any) {
      console.error('Failed to load instructors', err);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await financeService.createPayment({
        ...paymentFormData,
        amount: parseFloat(paymentFormData.amount),
        paymentDate: paymentFormData.paymentDate || undefined,
        dueDate: paymentFormData.dueDate || undefined,
      });
      setShowPaymentForm(false);
      setPaymentFormData({
        studentId: '',
        amount: '',
        type: 'subscription',
        status: 'pending',
        paymentDate: '',
        dueDate: '',
        notes: '',
      });
      fetchPayments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create payment');
    }
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await financeService.createExpense({
        ...expenseFormData,
        amount: parseFloat(expenseFormData.amount),
      });
      setShowExpenseForm(false);
      setExpenseFormData({
        category: 'operations',
        amount: '',
        description: '',
        expenseDate: new Date().toISOString().split('T')[0],
        instructorId: '',
      });
      fetchExpenses();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create expense');
    }
  };

  const handleDeletePayment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment?')) return;
    try {
      await financeService.deletePayment(id);
      fetchPayments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete payment');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      await financeService.deleteExpense(id);
      fetchExpenses();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete expense');
    }
  };

  // Filter payments
  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const matchesSearch =
        searchTerm === '' ||
        payment.student?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.student?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.type?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === '' || payment.status === statusFilter;
      const matchesStudent = studentFilter === '' || payment.studentId === studentFilter;

      return matchesSearch && matchesStatus && matchesStudent;
    });
  }, [payments, searchTerm, statusFilter, studentFilter]);

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const matchesSearch =
        searchTerm === '' ||
        expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = categoryFilter === '' || expense.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [expenses, searchTerm, categoryFilter]);

  // Summary calculations
  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const net = totalPayments - totalExpenses;
  const pendingPayments = payments.filter((p) => p.status === 'pending').length;
  const completedPayments = payments.filter((p) => p.status === 'completed').length;

  // Payment columns
  const paymentColumns: Column<Payment>[] = [
    {
      key: 'student',
      label: 'Student',
      sortable: true,
      render: (_, row) => (
        <span className="text-sm text-gray-900">
          {row.student
            ? `${row.student.firstName} ${row.student.lastName}`
            : 'No Student'}
        </span>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      align: 'right',
      render: (value, row) => (
        <a
          href={`/dashboard/finance/payments/details?id=${row.id}`}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
          onClick={(e) => {
            e.preventDefault();
            router.push(`/dashboard/finance/payments/details?id=${row.id}`);
          }}
        >
          EGP {value.toLocaleString()}
        </a>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-500 capitalize">{value}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => {
        const statusMap: { [key: string]: 'active' | 'inactive' | 'warning' } = {
          completed: 'active',
          pending: 'warning',
          overdue: 'inactive',
        };
        return <StatusBadge status={statusMap[value] || 'inactive'} label={value} />;
      },
    },
    {
      key: 'paymentDate',
      label: 'Payment Date',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-500">
          {value ? new Date(value).toLocaleDateString() : '-'}
        </span>
      ),
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-500">
          {value ? new Date(value).toLocaleDateString() : '-'}
        </span>
      ),
    },
  ];

  // Expense columns
  const expenseColumns: Column<Expense>[] = [
    {
      key: 'description',
      label: 'Description',
      sortable: true,
      render: (value) => <span className="text-sm text-gray-900">{value}</span>,
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-500 capitalize">{value}</span>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      align: 'right',
      render: (value) => (
        <span className="text-sm font-medium text-red-600">
          EGP {value.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'expenseDate',
      label: 'Date',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-500">
          {value ? new Date(value).toLocaleDateString() : '-'}
        </span>
      ),
    },
    {
      key: 'instructor',
      label: 'Instructor',
      render: (_, row) => (
        <span className="text-sm text-gray-500">
          {row.instructor
            ? `${row.instructor.user?.firstName || ''} ${row.instructor.user?.lastName || ''}`
            : '-'}
        </span>
      ),
    },
  ];

  // Payment actions
  const paymentActions = (row: Payment): ActionButton[] => [
    {
      label: 'Edit',
      onClick: () => {
        setPaymentFormData({
          studentId: row.studentId || '',
          amount: row.amount.toString(),
          type: row.type,
          status: row.status,
          paymentDate: row.paymentDate ? row.paymentDate.split('T')[0] : '',
          dueDate: row.dueDate ? row.dueDate.split('T')[0] : '',
          notes: row.notes || '',
        });
        setShowPaymentForm(true);
      },
      icon: <FiEdit className="w-4 h-4" />,
    },
    {
      label: 'Delete',
      onClick: () => handleDeletePayment(row.id),
      variant: 'danger',
      icon: <FiTrash2 className="w-4 h-4" />,
    },
  ];

  // Expense actions
  const expenseActions = (row: Expense): ActionButton[] => [
    {
      label: 'Edit',
      onClick: () => {
        setExpenseFormData({
          category: row.category,
          amount: row.amount.toString(),
          description: row.description,
          expenseDate: row.expenseDate.split('T')[0],
          instructorId: row.instructorId || '',
        });
        setShowExpenseForm(true);
      },
      icon: <FiEdit className="w-4 h-4" />,
    },
    {
      label: 'Delete',
      onClick: () => handleDeleteExpense(row.id),
      variant: 'danger',
      icon: <FiTrash2 className="w-4 h-4" />,
    },
  ];

  // Payment filters
  const paymentFilters: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'completed', label: 'Completed' },
        { value: 'overdue', label: 'Overdue' },
      ],
      value: statusFilter,
      onChange: setStatusFilter,
    },
    {
      key: 'student',
      label: 'Student',
      type: 'select',
      options: students.map((s) => ({
        value: s.id,
        label: `${s.firstName} ${s.lastName}`,
      })),
      value: studentFilter,
      onChange: setStudentFilter,
    },
  ];

  // Expense filters
  const expenseFilters: FilterConfig[] = [
    {
      key: 'category',
      label: 'Category',
      type: 'select',
      options: [
        { value: 'operations', label: 'Operations' },
        { value: 'instructor', label: 'Instructor' },
        { value: 'facilities', label: 'Facilities' },
        { value: 'marketing', label: 'Marketing' },
        { value: 'other', label: 'Other' },
      ],
      value: categoryFilter,
      onChange: setCategoryFilter,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Finance</h1>
        <p className="text-sm text-gray-500 mt-1">Manage payments and expenses</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Payments"
          value={`EGP ${totalPayments.toLocaleString()}`}
          variant="success"
          icon={<FiDollarSign className="w-8 h-8" />}
        />
        <SummaryCard
          title="Total Expenses"
          value={`EGP ${totalExpenses.toLocaleString()}`}
          variant="danger"
          icon={<FiTrendingDown className="w-8 h-8" />}
        />
        <SummaryCard
          title="Net"
          value={`EGP ${net.toLocaleString()}`}
          variant={net >= 0 ? 'success' : 'danger'}
          icon={<FiDollarSign className="w-8 h-8" />}
        />
        <SummaryCard
          title="Pending Payments"
          value={pendingPayments}
          variant="warning"
          icon={<FiDollarSign className="w-8 h-8" />}
        />
      </div>

      {/* Tab Navigation */}
      <TabNavigation
        tabs={[
          { id: 'payments', label: 'Payments', count: payments.length },
          { id: 'expenses', label: 'Expenses', count: expenses.length },
        ]}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as 'payments' | 'expenses')}
      />

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <>
          {/* Payment Form Modal */}
          {showPaymentForm && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div
                  className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                  onClick={() => setShowPaymentForm(false)}
                ></div>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <h2 className="text-xl font-semibold mb-4">Add Payment</h2>
                    <form onSubmit={handlePaymentSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Student *</label>
                        <select
                          required
                          value={paymentFormData.studentId}
                          onChange={(e) =>
                            setPaymentFormData({ ...paymentFormData, studentId: e.target.value })
                          }
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                          <option value="">Select a student...</option>
                          {students.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.firstName} {s.lastName}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Amount *</label>
                          <input
                            type="number"
                            required
                            step="0.01"
                            value={paymentFormData.amount}
                            onChange={(e) =>
                              setPaymentFormData({ ...paymentFormData, amount: e.target.value })
                            }
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Type</label>
                          <select
                            value={paymentFormData.type}
                            onChange={(e) =>
                              setPaymentFormData({ ...paymentFormData, type: e.target.value })
                            }
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          >
                            <option value="subscription">Subscription</option>
                            <option value="camp">Camp</option>
                            <option value="workshop">Workshop</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Status</label>
                          <select
                            value={paymentFormData.status}
                            onChange={(e) =>
                              setPaymentFormData({ ...paymentFormData, status: e.target.value })
                            }
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          >
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                            <option value="overdue">Overdue</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Payment Date
                          </label>
                          <input
                            type="date"
                            value={paymentFormData.paymentDate}
                            onChange={(e) =>
                              setPaymentFormData({ ...paymentFormData, paymentDate: e.target.value })
                            }
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Due Date</label>
                        <input
                          type="date"
                          value={paymentFormData.dueDate}
                          onChange={(e) =>
                            setPaymentFormData({ ...paymentFormData, dueDate: e.target.value })
                          }
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Notes</label>
                        <textarea
                          value={paymentFormData.notes}
                          onChange={(e) =>
                            setPaymentFormData({ ...paymentFormData, notes: e.target.value })
                          }
                          rows={3}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="flex gap-2 pt-4">
                        <button
                          type="submit"
                          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                        >
                          Create Payment
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowPaymentForm(false)}
                          className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}

          <StandardListView
            title="Payments"
            subtitle="Track student payments and outstanding balances"
            primaryAction={{
              label: 'Add Payment',
              onClick: () => {
                setShowPaymentForm(true);
                setPaymentFormData({
                  studentId: '',
                  amount: '',
                  type: 'subscription',
                  status: 'pending',
                  paymentDate: '',
                  dueDate: '',
                  notes: '',
                });
              },
              icon: <FiPlus className="w-4 h-4" />,
            }}
            searchPlaceholder="Search by student name or type..."
            onSearch={setSearchTerm}
            searchValue={searchTerm}
            filters={paymentFilters}
            columns={paymentColumns}
            data={filteredPayments}
            loading={loading}
            actions={paymentActions}
            emptyMessage="No payments found"
            emptyState={
              <EmptyState
                title="No payments found"
                message="Get started by recording your first payment"
                action={{
                  label: 'Add Payment',
                  onClick: () => setShowPaymentForm(true),
                }}
              />
            }
            getRowId={(row) => row.id}
          />

          {/* Export Buttons */}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => downloadExport('payments', 'xlsx')}
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 text-sm font-medium"
            >
              Export Excel
            </button>
            <button
              onClick={() => downloadExport('payments', 'pdf')}
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 text-sm font-medium"
            >
              Export PDF
            </button>
          </div>
        </>
      )}

      {/* Expenses Tab */}
      {activeTab === 'expenses' && (
        <>
          {/* Expense Form Modal */}
          {showExpenseForm && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div
                  className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                  onClick={() => setShowExpenseForm(false)}
                ></div>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <h2 className="text-xl font-semibold mb-4">Add Expense</h2>
                    <form onSubmit={handleExpenseSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Description *
                        </label>
                        <input
                          type="text"
                          required
                          value={expenseFormData.description}
                          onChange={(e) =>
                            setExpenseFormData({ ...expenseFormData, description: e.target.value })
                          }
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Category</label>
                          <select
                            value={expenseFormData.category}
                            onChange={(e) =>
                              setExpenseFormData({ ...expenseFormData, category: e.target.value })
                            }
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          >
                            <option value="operations">Operations</option>
                            <option value="instructor">Instructor</option>
                            <option value="facilities">Facilities</option>
                            <option value="marketing">Marketing</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Amount *</label>
                          <input
                            type="number"
                            required
                            step="0.01"
                            value={expenseFormData.amount}
                            onChange={(e) =>
                              setExpenseFormData({ ...expenseFormData, amount: e.target.value })
                            }
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Date *</label>
                          <input
                            type="date"
                            required
                            value={expenseFormData.expenseDate}
                            onChange={(e) =>
                              setExpenseFormData({ ...expenseFormData, expenseDate: e.target.value })
                            }
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Instructor</label>
                          <select
                            value={expenseFormData.instructorId}
                            onChange={(e) =>
                              setExpenseFormData({ ...expenseFormData, instructorId: e.target.value })
                            }
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          >
                            <option value="">Select Instructor</option>
                            {instructors.map((instructor) => (
                              <option key={instructor.id} value={instructor.id}>
                                {instructor.user?.firstName || ''} {instructor.user?.lastName || ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-4">
                        <button
                          type="submit"
                          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                        >
                          Create Expense
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowExpenseForm(false)}
                          className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}

          <StandardListView
            title="Expenses"
            subtitle="Track operational expenses and costs"
            primaryAction={{
              label: 'Add Expense',
              onClick: () => {
                setShowExpenseForm(true);
                setExpenseFormData({
                  category: 'operations',
                  amount: '',
                  description: '',
                  expenseDate: new Date().toISOString().split('T')[0],
                  instructorId: '',
                });
              },
              icon: <FiPlus className="w-4 h-4" />,
            }}
            searchPlaceholder="Search by description or category..."
            onSearch={setSearchTerm}
            searchValue={searchTerm}
            filters={expenseFilters}
            columns={expenseColumns}
            data={filteredExpenses}
            loading={false}
            actions={expenseActions}
            emptyMessage="No expenses found"
            emptyState={
              <EmptyState
                title="No expenses found"
                message="Get started by recording your first expense"
                action={{
                  label: 'Add Expense',
                  onClick: () => setShowExpenseForm(true),
                }}
              />
            }
            getRowId={(row) => row.id}
          />

          {/* Export Buttons */}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => downloadExport('expenses', 'xlsx')}
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 text-sm font-medium"
            >
              Export Excel
            </button>
            <button
              onClick={() => downloadExport('expenses', 'pdf')}
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 text-sm font-medium"
            >
              Export PDF
            </button>
          </div>
        </>
      )}
    </div>
  );
}
