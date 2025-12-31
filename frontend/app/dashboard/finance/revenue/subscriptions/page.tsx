'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { financeService, type Invoice, type CreateInvoiceDto, studentsService, type Student } from '@/lib/services';
import StandardListView from '@/components/StandardListView';
import { type Column } from '@/components/DataTable';
import SummaryCard from '@/components/SummaryCard';
import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/settings/StatusBadge';
import { FiRepeat, FiPlus, FiFileText, FiClock } from 'react-icons/fi';

type SubscriptionRow = {
  subscriptionId: string;
  studentId: string | null;
  studentName: string;
  invoiceCount: number;
  totalBilled: number;
  lastInvoiceDate?: string;
  status: 'active' | 'inactive' | 'warning';
};

export default function SubscriptionsPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
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
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [invResp, studentsResp] = await Promise.all([
        financeService.getInvoices(),
        studentsService.getAll().catch(() => ({ data: [] as Student[] } as any)),
      ]);
      setInvoices(invResp.data || []);
      setStudents(studentsResp.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const subscriptionRows: SubscriptionRow[] = useMemo(() => {
    const groups: Record<string, Invoice[]> = {};
    for (const inv of invoices) {
      if (!inv.subscriptionId) continue;
      if (!groups[inv.subscriptionId]) groups[inv.subscriptionId] = [];
      groups[inv.subscriptionId].push(inv);
    }

    const rows: SubscriptionRow[] = [];
    for (const [subscriptionId, subsInvoices] of Object.entries(groups)) {
      const sorted = [...subsInvoices].sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
      const lastInvoiceDate = sorted[0]?.issueDate;
      const totalBilled = subsInvoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
      const studentId = sorted.find((i) => i.studentId)?.studentId ?? null;
      const studentName =
        sorted.find((i) => i.student)?.student
          ? `${sorted.find((i) => i.student)!.student!.firstName} ${sorted.find((i) => i.student)!.student!.lastName}`
          : studentId
            ? (students.find((s) => s.id === studentId)
                ? `${students.find((s) => s.id === studentId)!.firstName} ${students.find((s) => s.id === studentId)!.lastName}`
                : 'Student')
            : 'B2B / No Student';

      // Heuristic: "active" if the latest invoice was issued in last 60 days and not all cancelled.
      const allCancelled = subsInvoices.every((i) => i.status === 'cancelled');
      const daysSinceLast = lastInvoiceDate ? (Date.now() - new Date(lastInvoiceDate).getTime()) / (1000 * 60 * 60 * 24) : 9999;
      const status: SubscriptionRow['status'] =
        allCancelled ? 'inactive' : daysSinceLast <= 60 ? 'active' : 'warning';

      rows.push({
        subscriptionId,
        studentId,
        studentName,
        invoiceCount: subsInvoices.length,
        totalBilled,
        lastInvoiceDate,
        status,
      });
    }

    return rows.sort((a, b) => (b.lastInvoiceDate || '').localeCompare(a.lastInvoiceDate || ''));
  }, [invoices, students]);

  const filteredRows = useMemo(() => {
    if (!searchTerm) return subscriptionRows;
    const q = searchTerm.toLowerCase();
    return subscriptionRows.filter(
      (r) =>
        r.subscriptionId.toLowerCase().includes(q) ||
        r.studentName.toLowerCase().includes(q),
    );
  }, [subscriptionRows, searchTerm]);

  const totalSubscriptions = subscriptionRows.length;
  const totalBilled = subscriptionRows.reduce((sum, r) => sum + r.totalBilled, 0);

  const columns: Column<SubscriptionRow>[] = [
    {
      key: 'studentName',
      label: 'Student',
      render: (value, row) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-gray-500">{row.subscriptionId.slice(0, 8)}…</div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={value} label={value} />,
    },
    {
      key: 'invoiceCount',
      label: 'Invoices',
      align: 'right',
      render: (value) => <span className="text-sm text-gray-900">{value}</span>,
    },
    {
      key: 'totalBilled',
      label: 'Total Billed',
      align: 'right',
      render: (value) => <span className="text-sm font-medium text-gray-900">EGP {Number(value || 0).toLocaleString()}</span>,
    },
    {
      key: 'lastInvoiceDate',
      label: 'Last Invoice',
      render: (value) => (
        <span className="text-sm text-gray-500">{value ? new Date(value).toLocaleDateString() : '-'}</span>
      ),
    },
  ];

  const summaryCards = (
    <>
      <SummaryCard
        title="Subscriptions"
        value={String(totalSubscriptions)}
        icon={<FiRepeat className="w-5 h-5" />}
        variant="info"
      />
      <SummaryCard
        title="Total billed (all time)"
        value={`EGP ${totalBilled.toLocaleString()}`}
        icon={<FiFileText className="w-5 h-5" />}
        variant="success"
      />
      <SummaryCard
        title="Last refresh"
        value={new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        icon={<FiClock className="w-5 h-5" />}
        variant="default"
      />
    </>
  );

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!formData.studentId) errors.studentId = 'Student is required';
    if (!formData.dueDate) errors.dueDate = 'First due date is required';
    if (!formData.subtotal || formData.subtotal <= 0) errors.subtotal = 'Amount must be greater than 0';
    return errors;
  };

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    const errors = validate();
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }

    try {
      const subscriptionId =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `sub_${Date.now()}`;
      await financeService.createInvoice({
        ...formData,
        subscriptionId,
        discountAmount: formData.discountAmount || 0,
        taxAmount: formData.taxAmount || 0,
        totalAmount:
          (Number(formData.subtotal || 0) - Number(formData.discountAmount || 0) + Number(formData.taxAmount || 0)) || undefined,
        status: 'issued',
        notes: formData.notes || 'Subscription initial invoice',
      });
      setShowCreateModal(false);
      setFormData({ studentId: '', dueDate: '', subtotal: 0, discountAmount: 0, taxAmount: 0, notes: '' });
      await fetchAll();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create subscription invoice');
    }
  };

  return (
    <>
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <StandardListView
          title="Subscriptions"
          subtitle="Subscriptions are derived from invoices that have a subscriptionId."
          primaryAction={{
            label: 'Create Subscription',
            onClick: () => setShowCreateModal(true),
            icon: <FiPlus className="w-4 h-4" />,
          }}
          onSearch={setSearchTerm}
          searchValue={searchTerm}
          searchPlaceholder="Search by student or subscription id..."
          columns={columns}
          data={filteredRows}
          loading={loading}
          actions={(row) => [
            {
              label: 'Open invoices',
              icon: <FiFileText className="w-4 h-4" />,
              onClick: () => router.push('/dashboard/finance/revenue/invoices'),
            },
          ]}
          emptyMessage="No subscriptions match your search"
          emptyState={
            <EmptyState
              icon={<FiRepeat className="w-12 h-12 text-gray-400" />}
              title="No subscriptions yet"
              message="Create a subscription to start generating recurring invoices."
            />
          }
          getRowId={(row) => row.subscriptionId}
          summaryCards={summaryCards}
        />
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowCreateModal(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75" />
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900">Create Subscription</h3>
                <p className="text-sm text-gray-500 mt-1">
                  This creates an initial invoice with a generated <code className="text-gray-700">subscriptionId</code>.
                </p>
              </div>

              <form onSubmit={handleCreateSubscription} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                  <select
                    value={formData.studentId || ''}
                    onChange={(e) => setFormData((p) => ({ ...p, studentId: e.target.value }))}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="">Select a student...</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.firstName} {s.lastName}
                      </option>
                    ))}
                  </select>
                  {formErrors.studentId && <p className="text-sm text-red-600 mt-1">{formErrors.studentId}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Due Date</label>
                    <input
                      type="date"
                      value={formData.dueDate || ''}
                      onChange={(e) => setFormData((p) => ({ ...p, dueDate: e.target.value }))}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                    {formErrors.dueDate && <p className="text-sm text-red-600 mt-1">{formErrors.dueDate}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (EGP)</label>
                    <input
                      type="number"
                      value={String(formData.subtotal ?? '')}
                      onChange={(e) => setFormData((p) => ({ ...p, subtotal: Number(e.target.value) }))}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      min={0}
                      step="0.01"
                    />
                    {formErrors.subtotal && <p className="text-sm text-red-600 mt-1">{formErrors.subtotal}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                  <textarea
                    value={String(formData.notes || '')}
                    onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                    rows={3}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="e.g., Monthly subscription"
                  />
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}






