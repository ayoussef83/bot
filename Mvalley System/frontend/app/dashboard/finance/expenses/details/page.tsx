'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { financeService, Expense } from '@/lib/services';
import StandardDetailView, { Tab, ActionButton, Breadcrumb } from '@/components/StandardDetailView';
import { FiEdit, FiTrash2, FiDollarSign, FiCalendar, FiUserCheck, FiFileText } from 'react-icons/fi';

export default function ExpenseDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchExpense(id);
    } else {
      setError('Missing expense id');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchExpense = async (expenseId: string) => {
    try {
      const response = await financeService.getExpenseById(expenseId);
      setExpense(response.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load expense');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!expense || !confirm('Are you sure you want to delete this expense?')) return;
    try {
      await financeService.deleteExpense(expense.id);
      router.push('/dashboard/finance');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete expense');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading expense details...</div>
      </div>
    );
  }

  if (error || !expense) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error || 'Expense not found'}
        </div>
        <button
          onClick={() => router.push('/dashboard/finance')}
          className="text-indigo-600 hover:text-indigo-900"
        >
          ← Back to Finance
        </button>
      </div>
    );
  }

  // Breadcrumbs
  const breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard', href: '/dashboard/management' },
    { label: 'Finance', href: '/dashboard/finance' },
    {
      label: `Expense - EGP ${expense.amount.toLocaleString()}`,
      href: `/dashboard/finance/expenses/details?id=${id}`,
    },
  ];

  // Action buttons
  const actions: ActionButton[] = [
    {
      label: 'Edit',
      onClick: () => {
        router.push(`/dashboard/finance/expenses/edit?id=${id}`);
      },
      icon: <FiEdit className="w-4 h-4" />,
    },
    {
      label: 'Delete',
      onClick: handleDelete,
      variant: 'danger',
      icon: <FiTrash2 className="w-4 h-4" />,
    },
  ];

  // Tabs
  const tabs: Tab[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <FiDollarSign className="w-4 h-4" />,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                <FiDollarSign className="w-4 h-4" />
                Amount
              </h3>
              <p className="text-2xl font-bold text-gray-900">
                EGP {expense.amount.toLocaleString()}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Category</h3>
              <p className="text-lg text-gray-900 capitalize">{expense.category}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                <FiCalendar className="w-4 h-4" />
                Expense Date
              </h3>
              <p className="text-lg text-gray-900">
                {new Date(expense.expenseDate).toLocaleDateString()}
              </p>
            </div>
            {expense.instructor && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                  <FiUserCheck className="w-4 h-4" />
                  Instructor
                </h3>
                <a
                  href={`/dashboard/instructors/details?id=${expense.instructorId}`}
                  className="text-lg text-indigo-600 hover:text-indigo-900"
                  onClick={(e) => {
                    e.preventDefault();
                    if (expense.instructorId) {
                      router.push(`/dashboard/instructors/details?id=${expense.instructorId}`);
                    }
                  }}
                >
                  {expense.instructor.user?.firstName} {expense.instructor.user?.lastName}
                </a>
              </div>
            )}
            <div className="col-span-2">
              <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                <FiFileText className="w-4 h-4" />
                Description
              </h3>
              <p className="text-lg text-gray-900 whitespace-pre-wrap">{expense.description}</p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  // Sidebar with quick actions
  const sidebar = (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
        <div className="space-y-2">
          {expense.instructorId && (
            <button
              onClick={() => router.push(`/dashboard/instructors/details?id=${expense.instructorId}`)}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              👤 View Instructor
            </button>
          )}
          <button
            onClick={() => router.push(`/dashboard/finance?expense=${expense.id}`)}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            💳 View All Expenses
          </button>
        </div>
      </div>
      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Expense Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Amount:</span>
            <span className="font-medium text-gray-900">
              EGP {expense.amount.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Category:</span>
            <span className="font-medium text-gray-900 capitalize">{expense.category}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Date:</span>
            <span className="font-medium text-gray-900">
              {new Date(expense.expenseDate).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <StandardDetailView
      title={`Expense - EGP ${expense.amount.toLocaleString()}`}
      subtitle={`${expense.category} • ${new Date(expense.expenseDate).toLocaleDateString()}`}
      actions={actions}
      tabs={tabs}
      breadcrumbs={breadcrumbs}
      sidebar={sidebar}
    />
  );
}

