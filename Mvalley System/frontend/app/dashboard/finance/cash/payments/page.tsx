'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { financeService, Payment, CashAccount, Invoice } from '@/lib/services';
import { studentsService, Student } from '@/lib/services';
import StandardListView, { FilterConfig } from '@/components/StandardListView';
import { Column, ActionButton } from '@/components/DataTable';
import SummaryCard from '@/components/SummaryCard';
import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/settings/StatusBadge';
import { FiCreditCard, FiPlus, FiEye, FiDollarSign, FiCheckCircle, FiXCircle, FiClock, FiX } from 'react-icons/fi';

interface CreatePaymentDto {
  amount: number;
  method: string;
  cashAccountId: string;
  receivedDate?: string;
  referenceNumber?: string;
  status?: string;
  notes?: string;
  studentId?: string;
  invoiceId?: string; // For immediate allocation
}

export default function PaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [formData, setFormData] = useState<CreatePaymentDto>({
    amount: 0,
    method: 'cash',
    cashAccountId: '',
    receivedDate: new Date().toISOString().split('T')[0],
    status: 'received',
    studentId: '',
    invoiceId: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    if (showCreateModal) {
      fetchCashAccounts();
      fetchStudents();
      fetchInvoices();
    }
  }, [showCreateModal]);

  useEffect(() => {
    if (formData.studentId) {
      // Filter invoices for selected student
      const studentInvoices = invoices.filter((inv) => inv.studentId === formData.studentId);
      setInvoices(studentInvoices);
    } else {
      fetchInvoices();
    }
  }, [formData.studentId]);

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

  const fetchCashAccounts = async () => {
    try {
      const response = await financeService.getCashAccounts();
      const activeAccounts = response.data.filter((acc) => acc.isActive);
      setCashAccounts(activeAccounts);
      if (activeAccounts.length > 0 && !formData.cashAccountId) {
        setFormData({ ...formData, cashAccountId: activeAccounts[0].id });
      }
    } catch (err: any) {
      console.error('Error fetching cash accounts:', err);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await studentsService.getAll();
      setStudents(response.data);
    } catch (err: any) {
      console.error('Error fetching students:', err);
    }
  };

  const fetchInvoices = async () => {
    try {
      const response = await financeService.getInvoices();
      // Filter to only unpaid/partially paid invoices
      const unpaidInvoices = response.data.filter(
        (inv) => inv.status === 'issued' || inv.status === 'partially_paid' || inv.status === 'overdue'
      );
      setInvoices(unpaidInvoices);
    } catch (err: any) {
      console.error('Error fetching invoices:', err);
    }
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    // Validation
    const errors: Record<string, string> = {};
    if (!formData.amount || formData.amount <= 0) {
      errors.amount = 'Amount must be greater than 0';
    }
    if (!formData.cashAccountId) {
      errors.cashAccountId = 'Cash account is required';
    }
    if (!formData.method) {
      errors.method = 'Payment method is required';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const paymentData: any = {
        amount: parseFloat(String(formData.amount)),
        method: formData.method,
        cashAccountId: formData.cashAccountId,
        receivedDate: formData.receivedDate || new Date().toISOString(),
        status: formData.status || 'received',
        referenceNumber: formData.referenceNumber || undefined,
        notes: formData.notes || undefined,
        studentId: formData.studentId || undefined,
      };

      const response = await financeService.createPayment(paymentData);

      // If invoice is selected, create allocation
      if (formData.invoiceId) {
        try {
          await financeService.createPaymentAllocation({
            paymentId: response.data.id,
            invoiceId: formData.invoiceId,
            amount: parseFloat(String(formData.amount)),
          });
        } catch (allocErr: any) {
          console.error('Error creating allocation:', allocErr);
          // Payment was created but allocation failed - show warning but don't fail
          alert('Payment recorded but allocation failed: ' + (allocErr.response?.data?.message || 'Unknown error'));
        }
      }

      setShowCreateModal(false);
      setFormData({
        amount: 0,
        method: 'cash',
        cashAccountId: '',
        receivedDate: new Date().toISOString().split('T')[0],
        status: 'received',
        studentId: '',
        invoiceId: '',
      });
      setFormErrors({});
      await fetchPayments();
    } catch (err: any) {
      console.error('Error creating payment:', err);
      setFormErrors({ submit: err.response?.data?.message || 'Failed to record payment' });
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
        router.push(`/dashboard/finance/cash/payments/details?id=${row.id}`);
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
          setShowCreateModal(true);
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
              setShowCreateModal(true);
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

      {/* Create Payment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => {
                setShowCreateModal(false);
                setFormData({
                  amount: 0,
                  method: 'cash',
                  cashAccountId: '',
                  receivedDate: new Date().toISOString().split('T')[0],
                  status: 'received',
                  studentId: '',
                  invoiceId: '',
                });
                setFormErrors({});
              }}
            ></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Record Payment</h2>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setFormData({
                        amount: 0,
                        method: 'cash',
                        cashAccountId: '',
                        receivedDate: new Date().toISOString().split('T')[0],
                        status: 'received',
                        studentId: '',
                        invoiceId: '',
                      });
                      setFormErrors({});
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleCreatePayment} className="space-y-4">
                  {formErrors.submit && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                      {formErrors.submit}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Payment Method *</label>
                      <select
                        value={formData.method}
                        onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                          formErrors.method ? 'border-red-300' : ''
                        }`}
                        required
                      >
                        <option value="cash">Cash</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="vodafone_cash">Vodafone Cash</option>
                        <option value="instapay">Instapay</option>
                        <option value="pos">POS</option>
                      </select>
                      {formErrors.method && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.method}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cash Account *</label>
                    <select
                      value={formData.cashAccountId}
                      onChange={(e) => setFormData({ ...formData, cashAccountId: e.target.value })}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                        formErrors.cashAccountId ? 'border-red-300' : ''
                      }`}
                      required
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Received Date</label>
                      <input
                        type="date"
                        value={formData.receivedDate}
                        onChange={(e) => setFormData({ ...formData, receivedDate: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value="received">Received</option>
                        <option value="pending">Pending</option>
                        <option value="failed">Failed</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Reference Number (Optional)</label>
                    <input
                      type="text"
                      value={formData.referenceNumber || ''}
                      onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Bank reference, transaction ID, receipt number"
                    />
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Optional: Link to Student/Invoice</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Student (Optional)</label>
                        <select
                          value={formData.studentId || ''}
                          onChange={(e) => setFormData({ ...formData, studentId: e.target.value, invoiceId: '' })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                          <option value="">No Student</option>
                          {students.map((student) => (
                            <option key={student.id} value={student.id}>
                              {student.firstName} {student.lastName}
                              {student.email ? ` (${student.email})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      {formData.studentId && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Allocate to Invoice (Optional)</label>
                          <select
                            value={formData.invoiceId || ''}
                            onChange={(e) => setFormData({ ...formData, invoiceId: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          >
                            <option value="">No Invoice (Unallocated)</option>
                            {invoices
                              .filter((inv) => inv.studentId === formData.studentId)
                              .map((invoice) => {
                                const allocated = invoice.paymentAllocations?.reduce((sum, alloc) => sum + alloc.amount, 0) || 0;
                                const remaining = invoice.totalAmount - allocated;
                                return (
                                  <option key={invoice.id} value={invoice.id}>
                                    {invoice.invoiceNumber} - {invoice.totalAmount.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })} (Remaining: {remaining.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })})
                                  </option>
                                );
                              })}
                          </select>
                          <p className="mt-1 text-xs text-gray-500">
                            Select an invoice to automatically allocate this payment
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                    <textarea
                      rows={3}
                      value={formData.notes || ''}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Additional notes about this payment"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false);
                        setFormData({
                          amount: 0,
                          method: 'cash',
                          cashAccountId: '',
                          receivedDate: new Date().toISOString().split('T')[0],
                          status: 'received',
                          studentId: '',
                          invoiceId: '',
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
                      Record Payment
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

