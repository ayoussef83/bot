'use client';

import { useEffect, useState } from 'react';
import { FiDollarSign, FiDownload, FiFileText, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

export default function CashFlowReportPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [loading, setLoading] = useState(false);

  // Mock periods for now
  const periods = [
    { code: '2025-01', label: 'January 2025' },
    { code: '2024-12', label: 'December 2024' },
    { code: '2024-11', label: 'November 2024' },
  ];

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

      {/* Period Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
            <select
              value={selectedPeriod || periods[0].code}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              {periods.map((period) => (
                <option key={period.code} value={period.code}>
                  {period.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cash Account (Optional)</label>
            <select className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
              <option value="">All Accounts</option>
            </select>
          </div>
        </div>
      </div>

      {/* Report Table */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-12">
          <FiDollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-sm font-medium text-gray-900 mb-2">Cash Flow Report</h3>
          <p className="text-sm text-gray-500">
            Cash inflows, outflows, and net cash flow calculation
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Report data will be displayed here once backend endpoints are implemented
          </p>
        </div>
      </div>

      {/* Summary Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-600">Cash Inflows</p>
            <p className="text-2xl font-bold text-green-600 mt-2">
              {0.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Cash Outflows</p>
            <p className="text-2xl font-bold text-red-600 mt-2">
              {0.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Net Cash Flow</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {0.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Closing Balance</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {0.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

