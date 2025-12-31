'use client';

import { useEffect, useState } from 'react';
import { financeService, FinanceOverview } from '@/lib/services';
import SummaryCard from '@/components/SummaryCard';
import { FiDollarSign, FiTrendingUp, FiTrendingDown, FiAlertCircle, FiCreditCard, FiFileText, FiUsers, FiClock } from 'react-icons/fi';

export default function FinanceOverviewPage() {
  const [overview, setOverview] = useState<FinanceOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await financeService.getOverview();
      setOverview(response.data);
    } catch (err: any) {
      console.error('Error fetching finance overview:', err);
      setError(err.response?.data?.message || 'Failed to load finance overview');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading finance overview...</div>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Failed to load finance overview'}
        </div>
      </div>
    );
  }

  const { cashPosition, expectedRevenue, actualRevenue, variance, overdueInvoices, netResult, unpaidInstructorBalances } = overview;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <FiDollarSign className="w-8 h-8 text-indigo-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance Overview</h1>
          <p className="text-sm text-gray-500 mt-1">Cash position, revenue, and financial health</p>
        </div>
      </div>

      {/* Cash Position */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Cash Position</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="col-span-1 md:col-span-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Total Cash</span>
              <span className="text-3xl font-bold text-gray-900">
                {cashPosition.total.toLocaleString('en-US', { style: 'currency', currency: 'EGP' })}
              </span>
            </div>
          </div>
          {cashPosition.breakdown.map((account) => (
            <div key={account.name} className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">{account.name}</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {account.balance.toLocaleString('en-US', { style: 'currency', currency: 'EGP' })}
              </p>
              <p className="text-xs text-gray-500 mt-1 capitalize">{account.type}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Expected Revenue"
          value={expectedRevenue.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
          icon={<FiTrendingUp className="w-5 h-5" />}
          variant="info"
        />
        <SummaryCard
          title="Actual Revenue"
          value={(actualRevenue || 0).toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
          icon={<FiDollarSign className="w-5 h-5" />}
          variant="success"
        />
        <SummaryCard
          title="Variance"
          value={variance.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
          icon={variance >= 0 ? <FiTrendingUp className="w-5 h-5" /> : <FiTrendingDown className="w-5 h-5" />}
          variant={variance >= 0 ? 'success' : 'warning'}
        />
        <SummaryCard
          title="Overdue Invoices"
          value={overdueInvoices.count}
          subtitle={`${overdueInvoices.amount.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}`}
          icon={<FiAlertCircle className="w-5 h-5" />}
          variant={overdueInvoices.count > 0 ? 'warning' : 'default'}
        />
      </div>

      {/* Net Result */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Net Result (This Period)</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-600">Revenue</p>
            <p className="text-2xl font-bold text-green-600 mt-2">
              {netResult.revenue.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Expenses</p>
            <p className="text-2xl font-bold text-red-600 mt-2">
              {netResult.expenses.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Profit/Loss</p>
            <p className={`text-2xl font-bold mt-2 ${netResult.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {netResult.profit.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Margin</p>
            <p className={`text-2xl font-bold mt-2 ${(netResult.margin || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(netResult.margin || 0).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {(overdueInvoices.count > 0 || unpaidInstructorBalances > 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-yellow-900 mb-2">Alerts</h3>
          <ul className="space-y-1 text-sm text-yellow-800">
            {overdueInvoices.count > 0 && (
              <li>
                <FiAlertCircle className="inline w-4 h-4 mr-2" />
                {overdueInvoices.count} overdue invoice(s) totaling{' '}
                {overdueInvoices.amount.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
              </li>
            )}
            {unpaidInstructorBalances > 0 && (
              <li>
                <FiUsers className="inline w-4 h-4 mr-2" />
                Unpaid instructor balances:{' '}
                {unpaidInstructorBalances.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Payments</h2>
            <FiCreditCard className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {!overview.recentPayments || overview.recentPayments.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No recent payments</p>
            ) : (
              overview.recentPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{payment.paymentNumber}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(payment.receivedDate).toLocaleDateString()} • {payment.cashAccount?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-600">
                      {payment.amount.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{payment.method.replace('_', ' ')}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Expenses</h2>
            <FiFileText className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {!overview.recentExpenses || overview.recentExpenses.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No recent expenses</p>
            ) : (
              overview.recentExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{expense.description}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(expense.expenseDate).toLocaleDateString()} • {expense.category?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-red-600">
                      {expense.amount.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{expense.status.replace('_', ' ')}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
