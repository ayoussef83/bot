'use client';

import { useEffect, useState } from 'react';
import { FiUsers, FiDownload, FiFileText, FiAlertCircle } from 'react-icons/fi';

export default function ClassProfitabilityReportPage() {
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
          <FiUsers className="w-8 h-8 text-indigo-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Class Profitability Report</h1>
            <p className="text-sm text-gray-500 mt-1">Revenue and costs per class to identify profitable classes</p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Location (Optional)</label>
            <select className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
              <option value="">All Locations</option>
              <option value="MOA">MOA</option>
              <option value="Espace">Espace</option>
              <option value="SODIC">SODIC</option>
              <option value="PalmHills">PalmHills</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Program (Optional)</label>
            <select className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
              <option value="">All Programs</option>
              <option value="AI">AI</option>
              <option value="robotics">Robotics</option>
              <option value="coding">Coding</option>
              <option value="general">General</option>
            </select>
          </div>
        </div>
      </div>

      {/* Report Table */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-12">
          <FiUsers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-sm font-medium text-gray-900 mb-2">Class Profitability Report</h3>
          <p className="text-sm text-gray-500">
            Revenue per class, instructor cost per class, net profit, and margin percentage
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
            <p className="text-sm font-medium text-gray-600">Total Classes</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">0</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Profitable Classes</p>
            <p className="text-2xl font-bold text-green-600 mt-2">0</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Unprofitable Classes</p>
            <p className="text-2xl font-bold text-red-600 mt-2">0</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Average Margin</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">0.0%</p>
          </div>
        </div>
      </div>

      {/* Alert for Negative Margin Classes */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FiAlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-yellow-900 mb-1">Negative Margin Classes</h3>
            <p className="text-sm text-yellow-800">
              Classes with negative margins (revenue &lt; instructor cost) are highlighted in the report.
              Consider adjusting pricing or reducing instructor costs for these classes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

