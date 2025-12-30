'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { financeService, Invoice, CreateInvoiceDto } from '@/lib/services';
import { studentsService, Student } from '@/lib/services';
import StandardListView, { FilterConfig } from '@/components/StandardListView';
import { Column, ActionButton } from '@/components/DataTable';
import SummaryCard from '@/components/SummaryCard';
import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/settings/StatusBadge';
import { FiFileText, FiPlus, FiEye, FiDollarSign, FiCheckCircle, FiAlertCircle, FiClock, FiX } from 'react-icons/fi';

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [formData, setFormData] = useState<CreateInvoiceDto>({
    studentId: '',
    dueDate: '',
    subtotal: 0,
    discountAmount: 0,
    taxAmount: 0,
    notes: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchInvoices();
    fetchStudents();
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

  const fetchStudents = async () => {
    try {
      const response = await studentsService.getAll();
      setStudents(response.data);
    } catch (err: any) {
      console.error('Error fetching students:', err);
    }
  };

  const calculateTotal = () => {
    const subtotal = parseFloat(String(formData.subtotal || 0));
    const discount = parseFloat(String(formData.discountAmount || 0));
    const tax = parseFloat(String(formData.taxAmount || 0));
    return subtotal - discount + tax;
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    // Validation
    const errors: Record<string, string> = {};
    if (!formData.studentId) {
      errors.studentId = 'Student is required';
    }
    if (!formData.dueDate) {
      errors.dueDate = 'Due date is required';
    }
    if (!formData.subtotal || formData.subtotal <= 0) {
      errors.subtotal = 'Subtotal must be greater than 0';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const totalAmount = calculateTotal();
      await financeService.createInvoice({
        ...formData,
        totalAmount,
        subtotal: parseFloat(String(formData.subtotal)),
        discountAmount: formData.discountAmount ? parseFloat(String(formData.discountAmount)) : 0,
        taxAmount: formData.taxAmount ? parseFloat(String(formData.taxAmount)) : 0,
      });
      setShowCreateModal(false);
      setFormData({
        studentId: '',
        dueDate: '',
        subtotal: 0,
        discountAmount: 0,
        taxAmount: 0,
        notes: '',
      });
      await fetchInvoices();
    } catch (err: any) {
      console.error('Error creating invoice:', err);
      setFormErrors({ submit: err.response?.data?.message || 'Failed to create invoice' });
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
        router.push(`/dashboard/finance/revenue/invoices/details?id=${row.id}`);
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
          setShowCreateModal(true);
          fetchStudents();
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
              setShowCreateModal(true);
              fetchStudents();
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

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => {
                setShowCreateModal(false);
                setFormData({
                  studentId: '',
                  dueDate: '',
                  subtotal: 0,
                  discountAmount: 0,
                  taxAmount: 0,
                  notes: '',
                });
                setFormErrors({});
              }}
            ></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Create Invoice</h2>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setFormData({
                        studentId: '',
                        dueDate: '',
                        subtotal: 0,
                        discountAmount: 0,
                        taxAmount: 0,
                        notes: '',
                      });
                      setFormErrors({});
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleCreateInvoice} className="space-y-4">
                  {formErrors.submit && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                      {formErrors.submit}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Student *</label>
                    <select
                      value={formData.studentId}
                      onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                        formErrors.studentId ? 'border-red-300' : ''
                      }`}
                      required
                    >
                      <option value="">Select Student</option>
                      {students.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.firstName} {student.lastName}
                          {student.email ? ` (${student.email})` : ''}
                        </option>
                      ))}
                    </select>
                    {formErrors.studentId && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.studentId}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Due Date *</label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                        formErrors.dueDate ? 'border-red-300' : ''
                      }`}
                      required
                      min={new Date().toISOString().split('T')[0]}
                    />
                    {formErrors.dueDate && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.dueDate}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Subtotal (EGP) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.subtotal || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, subtotal: parseFloat(e.target.value) || 0 })
                        }
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                          formErrors.subtotal ? 'border-red-300' : ''
                        }`}
                        required
                      />
                      {formErrors.subtotal && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.subtotal}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Discount (EGP)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.discountAmount || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            discountAmount: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Tax (EGP)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.taxAmount || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, taxAmount: parseFloat(e.target.value) || 0 })
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Total Amount</span>
                      <span className="text-lg font-bold text-gray-900">
                        {calculateTotal().toLocaleString('en-US', {
                          style: 'currency',
                          currency: 'EGP',
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                    <textarea
                      rows={3}
                      value={formData.notes || ''}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Additional notes about this invoice"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false);
                        setFormData({
                          studentId: '',
                          dueDate: '',
                          subtotal: 0,
                          discountAmount: 0,
                          taxAmount: 0,
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
                      Create Invoice
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

