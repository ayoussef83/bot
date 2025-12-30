'use client';

import { useEffect, useState } from 'react';
import { FiTrendingUp, FiDownload, FiFileText } from 'react-icons/fi';
import { financeReportsService, type ProfitAndLossReport, type FinancialPeriod } from '@/lib/services';

export default function ProfitLossReportPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ProfitAndLossReport | null>(null);
  const [periods, setPeriods] = useState<FinancialPeriod[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPeriods();
  }, []);

  useEffect(() => {
    if (selectedPeriod) {
      fetchReport();
    }
  }, [selectedPeriod, selectedLocation, selectedProgram]);

  const fetchPeriods = async () => {
    try {
      const data = await financeReportsService.getFinancialPeriods();
      setPeriods(data);
      if (data.length > 0 && !selectedPeriod) {
        setSelectedPeriod(data[0].periodCode);
      }
    } catch (err: any) {
      console.error('Error fetching periods:', err);
      // If periods endpoint doesn't exist yet, use mock data
      setPeriods([
        { id: '1', periodCode: '2025-01', startDate: new Date('2025-01-01').toISOString(), endDate: new Date('2025-01-31').toISOString(), status: 'open' },
        { id: '2', periodCode: '2024-12', startDate: new Date('2024-12-01').toISOString(), endDate: new Date('2024-12-31').toISOString(), status: 'open' },
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
      const data = await financeReportsService.getProfitAndLoss(
        selectedPeriod,
        selectedLocation || undefined,
        selectedProgram || undefined
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
          <FiTrendingUp className="w-8 h-8 text-indigo-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Profit & Loss Statement</h1>
            <p className="text-sm text-gray-500 mt-1">Revenue, expenses, and profit for a selected period</p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Location (Optional)</label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              disabled={loading}
            >
              <option value="">All Locations</option>
              <option value="MOA">MOA</option>
              <option value="Espace">Espace</option>
              <option value="SODIC">SODIC</option>
              <option value="PalmHills">PalmHills</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Program (Optional)</label>
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              disabled={loading}
            >
              <option value="">All Programs</option>
              <option value="AI">AI</option>
              <option value="robotics">Robotics</option>
              <option value="coding">Coding</option>
              <option value="general">General</option>
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
          {/* Revenue Breakdown */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Breakdown</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Class Fees</span>
                <span className="text-sm font-medium text-gray-900">
                  {report.revenue.breakdown.classFees.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Subscriptions</span>
                <span className="text-sm font-medium text-gray-900">
                  {report.revenue.breakdown.subscriptions.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Other Revenue</span>
                <span className="text-sm font-medium text-gray-900">
                  {report.revenue.breakdown.other.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 pt-3 border-t-2 border-gray-300">
                <span className="text-base font-semibold text-gray-900">Total Revenue</span>
                <span className="text-base font-bold text-green-600">
                  {report.revenue.total.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </div>

          {/* Expense Breakdown */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Expense Breakdown</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Instructor Costs</span>
                <span className="text-sm font-medium text-gray-900">
                  {report.expenses.breakdown.instructor.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Rent</span>
                <span className="text-sm font-medium text-gray-900">
                  {report.expenses.breakdown.rent.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Marketing</span>
                <span className="text-sm font-medium text-gray-900">
                  {report.expenses.breakdown.marketing.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Utilities</span>
                <span className="text-sm font-medium text-gray-900">
                  {report.expenses.breakdown.utilities.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Operations</span>
                <span className="text-sm font-medium text-gray-900">
                  {report.expenses.breakdown.operations.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Other Expenses</span>
                <span className="text-sm font-medium text-gray-900">
                  {report.expenses.breakdown.other.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 pt-3 border-t-2 border-gray-300">
                <span className="text-base font-semibold text-gray-900">Total Expenses</span>
                <span className="text-base font-bold text-red-600">
                  {report.expenses.total.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </div>

          {/* Summary Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  {report.revenue.total.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600 mt-2">
                  {report.expenses.total.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Net Profit</p>
                <p className={`text-2xl font-bold mt-2 ${report.netProfit >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                  {report.netProfit.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Gross Margin</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{report.grossMargin.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <FiTrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-sm font-medium text-gray-900 mb-2">No Data Available</h3>
          <p className="text-sm text-gray-500">
            Select a period to view the Profit & Loss report
          </p>
        </div>
      )}
    </div>
  );
}

