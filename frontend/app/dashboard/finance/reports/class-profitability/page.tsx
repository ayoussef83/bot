'use client';

import { useEffect, useState } from 'react';
import { FiUsers, FiDownload, FiFileText, FiAlertCircle } from 'react-icons/fi';
import { financeReportsService, type ClassProfitabilityReport, type FinancialPeriod } from '@/lib/services';

export default function ClassProfitabilityReportPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ClassProfitabilityReport | null>(null);
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
      const data = await financeReportsService.getClassProfitability(
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
          {/* Classes Table */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Class Profitability</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Instructor Cost</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net Profit</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Margin</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Sessions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {report.classes.map((cls) => (
                    <tr key={cls.classId} className={cls.margin < 0 ? 'bg-red-50' : ''}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{cls.className}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{cls.location}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                        {cls.revenue.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                        {cls.instructorCost.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-medium ${cls.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {cls.netProfit.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-medium ${cls.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {cls.margin.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-600">{cls.studentCount}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-600">{cls.sessionCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Classes</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{report.summary.totalClasses}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Profitable Classes</p>
                <p className="text-2xl font-bold text-green-600 mt-2">{report.summary.profitableClasses}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Unprofitable Classes</p>
                <p className="text-2xl font-bold text-red-600 mt-2">{report.summary.unprofitableClasses}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Average Margin</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{report.summary.averageMargin.toFixed(1)}%</p>
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
        </>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-gray-500">Select a period to view the report</div>
        </div>
      )}
    </div>
  );
}

