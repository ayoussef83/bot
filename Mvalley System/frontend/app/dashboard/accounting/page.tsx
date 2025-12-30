'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import SummaryCard from '@/components/SummaryCard';
import DataTable, { Column } from '@/components/DataTable';
import { FiDollarSign, FiAlertCircle, FiTrendingDown } from 'react-icons/fi';

interface OutstandingBalance {
  studentId: string;
  studentName: string;
  outstandingAmount: number;
  pendingPayments: number;
}

export default function AccountingDashboard() {
  const [data, setData] = useState<{
    totalReceived?: number;
    totalOutstanding?: number;
    totalExpenses?: number;
    outstandingBalances?: OutstandingBalance[];
    expenseBreakdown?: { [key: string]: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/dashboard/accounting');
      setData(response.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  // Outstanding Balances columns
  const balanceColumns: Column<OutstandingBalance>[] = [
    {
      key: 'studentName',
      label: 'Student',
      render: (value) => <span className="text-sm font-medium text-gray-900">{value}</span>,
    },
    {
      key: 'outstandingAmount',
      label: 'Outstanding Amount',
      align: 'right',
      render: (value) => (
        <span className="text-sm font-semibold text-red-600">
          EGP {value.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'pendingPayments',
      label: 'Pending Payments',
      align: 'right',
      render: (value) => <span className="text-sm text-gray-500">{value}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Accounting Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Financial overview and outstanding balances</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          label="Total Received"
          value={`EGP ${(data?.totalReceived || 0).toLocaleString()}`}
          icon={<FiDollarSign className="w-5 h-5" />}
          variant="success"
        />
        <SummaryCard
          label="Total Outstanding"
          value={`EGP ${(data?.totalOutstanding || 0).toLocaleString()}`}
          icon={<FiAlertCircle className="w-5 h-5" />}
          variant="danger"
        />
        <SummaryCard
          label="Total Expenses"
          value={`EGP ${(data?.totalExpenses || 0).toLocaleString()}`}
          icon={<FiTrendingDown className="w-5 h-5" />}
          variant="danger"
        />
      </div>

      {/* Outstanding Balances */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Outstanding Balances</h2>
        {data?.outstandingBalances && data.outstandingBalances.length > 0 ? (
          <DataTable
            columns={balanceColumns}
            data={data.outstandingBalances}
            emptyMessage="No outstanding balances"
            loading={loading}
          />
        ) : (
          <div className="text-center py-8 text-gray-500">No outstanding balances</div>
        )}
      </div>

      {/* Expense Breakdown */}
      {data?.expenseBreakdown && Object.keys(data.expenseBreakdown).length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Expense Breakdown</h2>
          <div className="space-y-4">
            {Object.entries(data.expenseBreakdown).map(([category, amount]) => (
              <div key={category} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {category.replace('_', ' ')}
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  EGP {Number(amount).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
