'use client';

import { useEffect, useState } from 'react';
import { FiCheckCircle, FiAlertCircle, FiTrendingUp, FiTrendingDown, FiLock, FiUnlock, FiDollarSign } from 'react-icons/fi';

export default function ReconciliationPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [loading, setLoading] = useState(false);

  // Mock data for now
  const periods = [
    { code: '2025-01', label: 'January 2025', status: 'open' },
    { code: '2024-12', label: 'December 2024', status: 'closed' },
    { code: '2024-11', label: 'November 2024', status: 'locked' },
  ];

  const currentPeriod = periods[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <FiCheckCircle className="w-8 h-8 text-indigo-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reconciliation</h1>
          <p className="text-sm text-gray-500 mt-1">Reconcile expected revenue with actual cash received</p>
        </div>
      </div>

      {/* Period Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Period</label>
        <select
          value={selectedPeriod || currentPeriod.code}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          {periods.map((period) => (
            <option key={period.code} value={period.code}>
              {period.label} ({period.status})
            </option>
          ))}
        </select>
      </div>

      {/* Expected vs Actual Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Expected Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {0.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
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
                {0.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
              </p>
            </div>
            <FiDollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Variance</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {0.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-gray-500 mt-1">0.0% variance</p>
            </div>
            <FiCheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Reconciliation Table Placeholder */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-12">
          <FiCheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-sm font-medium text-gray-900 mb-2">Reconciliation Table</h3>
          <p className="text-sm text-gray-500">
            Reconciliation table with expected vs actual comparison will be displayed here
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Features: Matched/Missing/Extra status, adjustment creation, period locking
          </p>
        </div>
      </div>

      {/* Period Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900">Period Status: {currentPeriod.status}</p>
          <p className="text-xs text-gray-500 mt-1">
            {currentPeriod.status === 'locked' && 'Locked periods cannot be modified'}
          </p>
        </div>
        <div className="flex gap-3">
          {currentPeriod.status === 'open' && (
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium">
              Close Period
            </button>
          )}
          {currentPeriod.status === 'closed' && (
            <button className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm font-medium">
              Lock Period
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

