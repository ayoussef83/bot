'use client';

import { useEffect, useState } from 'react';
import { FiCheckCircle, FiAlertCircle, FiTrendingUp, FiTrendingDown, FiLock, FiUnlock, FiDollarSign, FiPlus, FiX } from 'react-icons/fi';
import { financeReportsService, type FinancialPeriod } from '@/lib/services';

interface ReconciliationItem {
  invoiceId: string;
  invoiceNumber: string;
  invoiceAmount: number;
  allocatedAmount: number;
  unallocatedAmount: number;
  status: 'matched' | 'partial' | 'missing' | 'overpaid';
  dueDate: string;
  payments: Array<{
    paymentId: string;
    paymentNumber: string;
    amount: number;
    receivedDate: string;
  }>;
}

interface ReconciliationData {
  period: {
    code: string;
    startDate: string;
    endDate: string;
    status: string;
  };
  summary: {
    expectedRevenue: number;
    actualRevenue: number;
    paidAmount: number;
    variance: number;
    variancePercent: number;
    totalAdjustments: number;
  };
  reconciliationItems: ReconciliationItem[];
  unallocatedPayments: Array<{
    paymentId: string;
    paymentNumber: string;
    amount: number;
    receivedDate: string;
    status: 'unallocated';
  }>;
  reconciliationRecords: any[];
}

export default function ReconciliationPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ReconciliationData | null>(null);
  const [periods, setPeriods] = useState<FinancialPeriod[]>([]);
  const [error, setError] = useState('');
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjustmentForm, setAdjustmentForm] = useState({
    type: 'adjustment',
    amount: '',
    description: '',
    notes: '',
  });

  useEffect(() => {
    fetchPeriods();
  }, []);

  useEffect(() => {
    if (selectedPeriod) {
      fetchReconciliation();
    }
  }, [selectedPeriod]);

  const fetchPeriods = async () => {
    try {
      const periodsData = await financeReportsService.getFinancialPeriods();
      setPeriods(periodsData);
      if (periodsData.length > 0 && !selectedPeriod) {
        setSelectedPeriod(periodsData[0].periodCode);
      }
    } catch (err: any) {
      console.error('Error fetching periods:', err);
      setPeriods([]);
    }
  };

  const fetchReconciliation = async () => {
    if (!selectedPeriod) return;
    setLoading(true);
    setError('');
    try {
      const reconciliationData = await financeReportsService.getReconciliation(selectedPeriod);
      setData(reconciliationData);
    } catch (err: any) {
      console.error('Error fetching reconciliation:', err);
      setError(err.response?.data?.message || 'Failed to load reconciliation data');
    } finally {
      setLoading(false);
    }
  };

  const handleClosePeriod = async () => {
    if (!selectedPeriod) return;
    if (!confirm('Are you sure you want to close this period? This action cannot be undone.')) return;
    try {
      await financeReportsService.closePeriod(selectedPeriod);
      await fetchReconciliation();
      await fetchPeriods();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to close period');
    }
  };

  const handleLockPeriod = async () => {
    if (!selectedPeriod) return;
    if (!confirm('Are you sure you want to lock this period? Locked periods cannot be modified.')) return;
    try {
      await financeReportsService.lockPeriod(selectedPeriod);
      await fetchReconciliation();
      await fetchPeriods();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to lock period');
    }
  };

  const handleCreateAdjustment = async () => {
    if (!selectedPeriod || !adjustmentForm.description || !adjustmentForm.amount) {
      alert('Please fill in all required fields');
      return;
    }
    try {
      await financeReportsService.createReconciliationRecord({
        periodCode: selectedPeriod,
        type: adjustmentForm.type,
        amount: parseFloat(adjustmentForm.amount),
        description: adjustmentForm.description,
        notes: adjustmentForm.notes,
      });
      setShowAdjustmentModal(false);
      setAdjustmentForm({ type: 'adjustment', amount: '', description: '', notes: '' });
      await fetchReconciliation();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create adjustment');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      matched: { color: 'bg-green-100 text-green-800', label: 'Matched' },
      partial: { color: 'bg-yellow-100 text-yellow-800', label: 'Partial' },
      missing: { color: 'bg-red-100 text-red-800', label: 'Missing' },
      overpaid: { color: 'bg-blue-100 text-blue-800', label: 'Overpaid' },
      open: { color: 'bg-gray-100 text-gray-800', label: 'Open' },
      closed: { color: 'bg-blue-100 text-blue-800', label: 'Closed' },
      locked: { color: 'bg-red-100 text-red-800', label: 'Locked' },
    };
    const badge = badges[status as keyof typeof badges] || badges.open;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const currentPeriod = periods.find((p) => p.periodCode === selectedPeriod);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FiCheckCircle className="w-8 h-8 text-indigo-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reconciliation</h1>
            <p className="text-sm text-gray-500 mt-1">Reconcile expected revenue with actual cash received</p>
          </div>
        </div>
        {data && data.period.status === 'open' && (
          <button
            onClick={() => setShowAdjustmentModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium flex items-center gap-2"
          >
            <FiPlus className="w-4 h-4" />
            Create Adjustment
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Period Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Period</label>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          disabled={loading}
        >
          {periods.map((period) => (
            <option key={period.periodCode} value={period.periodCode}>
              {new Date(period.startDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} ({period.status})
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-gray-500">Loading reconciliation data...</div>
        </div>
      ) : data ? (
        <>
          {/* Expected vs Actual Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Expected Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {data.summary.expectedRevenue.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                  </p>
                </div>
                <FiTrendingUp className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Actual Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {data.summary.actualRevenue.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                  </p>
                </div>
                <FiDollarSign className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Variance</p>
                  <p className={`text-2xl font-bold mt-2 ${data.summary.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {data.summary.variance.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                  </p>
                  <p className={`text-xs mt-1 ${data.summary.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {data.summary.variancePercent >= 0 ? '+' : ''}{data.summary.variancePercent.toFixed(2)}% variance
                  </p>
                </div>
                {data.summary.variance === 0 ? (
                  <FiCheckCircle className="w-8 h-8 text-green-600" />
                ) : (
                  <FiAlertCircle className="w-8 h-8 text-yellow-600" />
                )}
              </div>
            </div>
          </div>

          {/* Reconciliation Table */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Reconciliation</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice Amount</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Allocated</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unallocated</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payments</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.reconciliationItems.map((item) => (
                    <tr key={item.invoiceId}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.invoiceNumber}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                        {item.invoiceAmount.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-green-600">
                        {item.allocatedAmount.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-red-600">
                        {item.unallocatedAmount.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">{getStatusBadge(item.status)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {item.payments.length > 0 ? (
                          <div className="space-y-1">
                            {item.payments.map((pay) => (
                              <div key={pay.paymentId} className="text-xs">
                                {pay.paymentNumber}: {pay.amount.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">No payments</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Unallocated Payments */}
          {data.unallocatedPayments.length > 0 && (
            <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-6">
              <h2 className="text-lg font-semibold text-yellow-900 mb-4">Unallocated Payments</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-yellow-200">
                  <thead className="bg-yellow-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-yellow-800 uppercase tracking-wider">Payment Number</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-yellow-800 uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-yellow-800 uppercase tracking-wider">Received Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-yellow-50 divide-y divide-yellow-200">
                    {data.unallocatedPayments.map((pay) => (
                      <tr key={pay.paymentId}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-yellow-900">{pay.paymentNumber}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-yellow-900">
                          {pay.amount.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-yellow-700">
                          {new Date(pay.receivedDate).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Period Actions */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Period Status: {getStatusBadge(data.period.status)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {data.period.status === 'locked' && 'Locked periods cannot be modified'}
                {data.period.status === 'closed' && 'Closed periods can be locked to prevent further changes'}
                {data.period.status === 'open' && 'Open periods can be reconciled and adjusted'}
              </p>
            </div>
            <div className="flex gap-3">
              {data.period.status === 'open' && (
                <button
                  onClick={handleClosePeriod}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
                >
                  Close Period
                </button>
              )}
              {data.period.status === 'closed' && (
                <button
                  onClick={handleLockPeriod}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm font-medium"
                >
                  Lock Period
                </button>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <FiCheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-sm font-medium text-gray-900 mb-2">No Data Available</h3>
          <p className="text-sm text-gray-500">Select a period to view reconciliation data</p>
        </div>
      )}

      {/* Adjustment Modal */}
      {showAdjustmentModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowAdjustmentModal(false)}></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Create Adjustment</h2>
                  <button onClick={() => setShowAdjustmentModal(false)} className="text-gray-400 hover:text-gray-600">
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleCreateAdjustment();
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <select
                      value={adjustmentForm.type}
                      onChange={(e) => setAdjustmentForm({ ...adjustmentForm, type: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      required
                    >
                      <option value="adjustment">Adjustment</option>
                      <option value="correction">Correction</option>
                      <option value="write_off">Write Off</option>
                      <option value="reversal">Reversal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Amount (EGP)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={adjustmentForm.amount}
                      onChange={(e) => setAdjustmentForm({ ...adjustmentForm, amount: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description *</label>
                    <textarea
                      required
                      rows={3}
                      value={adjustmentForm.description}
                      onChange={(e) => setAdjustmentForm({ ...adjustmentForm, description: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Reason for adjustment (required for audit)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                    <textarea
                      rows={2}
                      value={adjustmentForm.notes}
                      onChange={(e) => setAdjustmentForm({ ...adjustmentForm, notes: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAdjustmentModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
                    >
                      Create Adjustment
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
