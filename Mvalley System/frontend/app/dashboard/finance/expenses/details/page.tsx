'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiFileText, FiArrowLeft, FiDollarSign, FiCalendar, FiUser, FiCheckCircle, FiXCircle, FiClock, FiTag } from 'react-icons/fi';
import { financeService, Expense } from '@/lib/services';

export default function ExpenseDetailsPage() {
  const router = useRouter();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      fetchExpense(id);
    } else {
      setError('Expense ID not provided');
      setLoading(false);
    }
  }, []);

  const fetchExpense = async (id: string) => {
    try {
      const response = await financeService.getExpenseById(id);
      setExpense(response.data);
    } catch (err: any) {
      console.error('Error fetching expense:', err);
      setError(err.response?.data?.message || 'Failed to load expense');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      paid: { color: 'bg-green-100 text-green-800', label: 'Paid' },
      approved: { color: 'bg-blue-100 text-blue-800', label: 'Approved' },
      pending_approval: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending Approval' },
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      reversed: { color: 'bg-red-100 text-red-800', label: 'Reversed' },
    };
    const badge = badges[status as keyof typeof badges] || badges.draft;
    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const getMethodLabel = (method?: string) => {
    if (!method) return '-';
    return method.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading expense...</div>
      </div>
    );
  }

  if (error || !expense) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.push('/dashboard/finance/expenses')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <FiArrowLeft className="w-4 h-4" />
          Back to Expenses
        </button>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Expense not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard/finance/expenses')}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <FiFileText className="w-8 h-8 text-indigo-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Expense Details</h1>
            <p className="text-sm text-gray-500 mt-1">{expense.expenseNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(expense.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Expense Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Expense Information</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Amount</h3>
                <p className="text-2xl font-bold text-red-600">
                  {expense.amount.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                  <FiTag className="w-4 h-4" />
                  Category
                </h3>
                <p className="text-lg text-gray-900">{expense.category?.name || '-'}</p>
                {expense.category?.code && (
                  <p className="text-sm text-gray-500 mt-1 font-mono">{expense.category.code}</p>
                )}
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                  <FiCalendar className="w-4 h-4" />
                  Expense Date
                </h3>
                <p className="text-lg text-gray-900">
                  {new Date(expense.expenseDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              {expense.paidDate && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                    <FiCheckCircle className="w-4 h-4" />
                    Paid Date
                  </h3>
                  <p className="text-lg text-gray-900">
                    {new Date(expense.paidDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )}
              {expense.vendor && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Vendor</h3>
                  <p className="text-lg text-gray-900">{expense.vendor}</p>
                </div>
              )}
              {expense.paymentMethod && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Payment Method</h3>
                  <p className="text-lg text-gray-900">{getMethodLabel(expense.paymentMethod)}</p>
                </div>
              )}
              {expense.cashAccount && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Cash Account</h3>
                  <p className="text-lg text-gray-900">{expense.cashAccount.name}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {expense.cashAccount.type.charAt(0).toUpperCase() + expense.cashAccount.type.slice(1)}
                  </p>
                </div>
              )}
              {expense.instructor && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                    <FiUser className="w-4 h-4" />
                    Instructor
                  </h3>
                  <p className="text-lg text-gray-900">
                    {expense.instructor.user?.firstName} {expense.instructor.user?.lastName}
                  </p>
                  {expense.instructor.user?.email && (
                    <p className="text-sm text-gray-500 mt-1">{expense.instructor.user.email}</p>
                  )}
                </div>
              )}
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{expense.description}</p>
            </div>
            {expense.notes && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{expense.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Amount</span>
                <span className="text-sm font-medium text-red-600">
                  {expense.amount.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Category</span>
                <span className="text-sm font-medium text-gray-900">
                  {expense.category?.name || '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <span className="text-sm font-medium text-gray-900">{getStatusBadge(expense.status)}</span>
              </div>
            </div>
          </div>

          {/* Quick Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Info</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-500">Expense #:</span>
                <span className="ml-2 font-mono text-gray-900">{expense.expenseNumber}</span>
              </div>
              <div>
                <span className="text-gray-500">Created:</span>
                <span className="ml-2 text-gray-900">
                  {new Date(expense.createdAt || '').toLocaleDateString()}
                </span>
              </div>
              {expense.approvedBy && (
                <div>
                  <span className="text-gray-500">Approved By:</span>
                  <span className="ml-2 text-gray-900">{expense.approvedBy}</span>
                </div>
              )}
              {expense.approvedAt && (
                <div>
                  <span className="text-gray-500">Approved At:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(expense.approvedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
