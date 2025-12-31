'use client';

import { useEffect, useState } from 'react';
import { FiUserCheck, FiDownload, FiFileText, FiTrendingUp } from 'react-icons/fi';
import { financeReportsService, type InstructorCostsReport, type FinancialPeriod } from '@/lib/services';

export default function InstructorCostsReportPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedInstructor, setSelectedInstructor] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<InstructorCostsReport | null>(null);
  const [periods, setPeriods] = useState<FinancialPeriod[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPeriods();
  }, []);

  useEffect(() => {
    if (selectedPeriod) {
      fetchReport();
    }
  }, [selectedPeriod, selectedInstructor]);

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
      const data = await financeReportsService.getInstructorCosts(
        selectedPeriod,
        selectedInstructor || undefined
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
          <FiUserCheck className="w-8 h-8 text-indigo-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Instructor Cost Report</h1>
            <p className="text-sm text-gray-500 mt-1">Instructor costs and efficiency metrics</p>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Instructor (Optional)</label>
            <select
              value={selectedInstructor}
              onChange={(e) => setSelectedInstructor(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              disabled={loading}
            >
              <option value="">All Instructors</option>
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
          {/* Instructors Table */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Instructor Costs</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instructor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost Type</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Sessions</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cost/Session</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cost/Hour</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net Contribution</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Efficiency</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {report.instructors.map((inst) => (
                    <tr key={inst.instructorId}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{inst.instructorName}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 capitalize">{inst.costType}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-600">{inst.sessions}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-600">{inst.hours.toFixed(1)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                        {inst.totalCost.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                        {inst.costPerSession.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                        {inst.costPerHour.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-green-600">
                        {inst.revenueGenerated.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-medium ${inst.netContribution >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {inst.netContribution.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                        {inst.efficiency.toFixed(1)}%
                      </td>
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
                <p className="text-sm font-medium text-gray-600">Total Instructors</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{report.summary.totalInstructors}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Cost</p>
                <p className="text-2xl font-bold text-red-600 mt-2">
                  {report.summary.totalCost.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Revenue Generated</p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  {report.summary.totalRevenue.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Cost Ratio</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{report.summary.costRatio.toFixed(1)}%</p>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                <p className="text-xl font-bold text-gray-900 mt-2">{report.summary.totalSessions}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Hours</p>
                <p className="text-xl font-bold text-gray-900 mt-2">{report.summary.totalHours.toFixed(1)}</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <FiUserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-sm font-medium text-gray-900 mb-2">No Data Available</h3>
          <p className="text-sm text-gray-500">
            Select a period to view the Instructor Costs report
          </p>
        </div>
      )}
    </div>
  );
}

