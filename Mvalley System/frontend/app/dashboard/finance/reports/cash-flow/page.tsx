'use client';

import { useEffect, useState } from 'react';
import { FiDollarSign, FiDownload, FiFileText, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import { financeReportsService, type CashFlowReport, type FinancialPeriod } from '@/lib/services';

export default function CashFlowReportPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedCashAccount, setSelectedCashAccount] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<CashFlowReport | null>(null);
  const [periods, setPeriods] = useState<FinancialPeriod[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPeriods();
  }, []);

  useEffect(() => {
    if (selectedPeriod) {
      fetchReport();
    }
  }, [selectedPeriod, selectedCashAccount]);

  const fetchPeriods = async () => {
    try {
      const data = await financeReportsService.getFinancialPeriods();
      setPeriods(data);
      if (data.length > 0 && !selectedPeriod) {
        setSelectedPeriod(data[0].periodCode);
      }
    } catch (err: any) {
      console.error('Error fetching periods:', err);
      setPeriods([
        { id: '1', periodCode: '2025-01', startDate: new Date('2025-01-01').toISOString(), endDate: new Date('2025-01-31').toISOString(), status: 'open' },
      ]);
      if (!selectedPeriod) {
        setSelectedPeriod('2025-01');
      }
    }
  };

  const fetchReport = async () => {
    if (!selectedPeriod) return;
    setLoading(true);
    setError('');
    try {
      const data = await financeReportsService.getCashFlow(
        selectedPeriod,
        selectedCashAccount || undefined
      );
      setReport(data);
    } catch (err: any) {
      console.error('Error fetching report:', err);
      setError(err.response?.data?.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FiDollarSign className="w-8 h-8 text-indigo-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cash Flow Statement</h1>
            <p className="text-sm text-gray-500 mt-1">Cash inflows and outflows for a selected period</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium flex items-center gap-2">
            <FiDownload className="w-4 h-4" />
            Export PDF
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium flex items-center gap-2">
            <FiFileText className="w-4 h-4" />
            Export Excel
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Period Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              disabled={loading}
            >
              {periods.map((period) => (
                <option key={period.periodCode} value={period.periodCode}>
                  {new Date(period.startDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cash Account (Optional)</label>
            <select
              value={selectedCashAccount}
              onChange={(e) => setSelectedCashAccount(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              disabled={loading}
            >
              <option value="">All Accounts</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-gray-500">Loading report...</div>
        </div>
      ) : report ? (
        <>
          {/* Inflows Breakdown */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Cash Inflows</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Cash Payments</span>
                <span className="text-sm font-medium text-gray-900">
                  {report.inflows.breakdown.cash.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Bank Transfers</span>
                <span className="text-sm font-medium text-gray-900">
                  {report.inflows.breakdown.bankTransfer.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Wallet Payments</span>
                <span className="text-sm font-medium text-gray-900">
                  {report.inflows.breakdown.wallet.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 pt-3 border-t-2 border-gray-300">
                <span className="text-base font-semibold text-gray-900">Total Inflows</span>
                <span className="text-base font-bold text-green-600">
                  {report.inflows.total.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </div>

          {/* Outflows Breakdown */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Cash Outflows</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Instructor Payouts</span>
                <span className="text-sm font-medium text-gray-900">
                  {report.outflows.breakdown.instructorPayouts.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Other Outflows</span>
                <span className="text-sm font-medium text-gray-900">
                  {report.outflows.breakdown.other.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 pt-3 border-t-2 border-gray-300">
                <span className="text-base font-semibold text-gray-900">Total Outflows</span>
                <span className="text-base font-bold text-red-600">
                  {report.outflows.total.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </div>

          {/* Summary Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Opening Balance</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {report.openingBalance.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Cash Inflows</p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  {report.inflows.total.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Cash Outflows</p>
                <p className="text-2xl font-bold text-red-600 mt-2">
                  {report.outflows.total.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Net Cash Flow</p>
                <p className={`text-2xl font-bold mt-2 ${report.netCashFlow >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                  {report.netCashFlow.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <p className="text-base font-semibold text-gray-900">Closing Balance</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {report.closingBalance.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <FiDollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-sm font-medium text-gray-900 mb-2">No Data Available</h3>
          <p className="text-sm text-gray-500">
            Select a period to view the Cash Flow report
          </p>
        </div>
      )}
    </div>
  );
}

