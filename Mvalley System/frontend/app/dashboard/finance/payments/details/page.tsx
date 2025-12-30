'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { financeService, Payment } from '@/lib/services';
import StandardDetailView, { Tab, ActionButton, Breadcrumb } from '@/components/StandardDetailView';
import StatusBadge from '@/components/settings/StatusBadge';
import { FiEdit, FiTrash2, FiDollarSign, FiCalendar, FiUser, FiFileText } from 'react-icons/fi';

export default function PaymentDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchPayment(id);
    } else {
      setError('Missing payment id');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchPayment = async (paymentId: string) => {
    try {
      const response = await financeService.getPaymentById(paymentId);
      setPayment(response.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load payment');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!payment || !confirm('Are you sure you want to delete this payment?')) return;
    try {
      await financeService.deletePayment(payment.id);
      router.push('/dashboard/finance');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete payment');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading payment details...</div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error || 'Payment not found'}
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
      label: `Payment - EGP ${payment.amount.toLocaleString()}`,
      href: `/dashboard/finance/payments/details?id=${id}`,
    },
  ];

  // Action buttons
  const actions: ActionButton[] = [
    {
      label: 'Edit',
      onClick: () => {
        router.push(`/dashboard/finance/payments/edit?id=${id}`);
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
                EGP {payment.amount.toLocaleString()}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
              <div className="mt-1">
                <StatusBadge
                  status={
                    payment.status === 'completed'
                      ? 'active'
                      : payment.status === 'pending'
                      ? 'warning'
                      : 'inactive'
                  }
                  label={payment.status}
                />
              </div>
            </div>
            {payment.student && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                  <FiUser className="w-4 h-4" />
                  Student
                </h3>
                <a
                  href={`/dashboard/students/details?id=${payment.studentId}`}
                  className="text-lg text-indigo-600 hover:text-indigo-900"
                  onClick={(e) => {
                    e.preventDefault();
                    if (payment.studentId) {
                      router.push(`/dashboard/students/details?id=${payment.studentId}`);
                    }
                  }}
                >
                  {payment.student.firstName} {payment.student.lastName}
                </a>
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Type</h3>
              <p className="text-lg text-gray-900 capitalize">{payment.type}</p>
            </div>
            {payment.paymentDate && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                  <FiCalendar className="w-4 h-4" />
                  Payment Date
                </h3>
                <p className="text-lg text-gray-900">
                  {new Date(payment.paymentDate).toLocaleDateString()}
                </p>
              </div>
            )}
            {payment.dueDate && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                  <FiCalendar className="w-4 h-4" />
                  Due Date
                </h3>
                <p className="text-lg text-gray-900">
                  {new Date(payment.dueDate).toLocaleDateString()}
                </p>
              </div>
            )}
            {payment.notes && (
              <div className="col-span-2">
                <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                  <FiFileText className="w-4 h-4" />
                  Notes
                </h3>
                <p className="text-lg text-gray-900 whitespace-pre-wrap">{payment.notes}</p>
              </div>
            )}
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
          {payment.studentId && (
            <button
              onClick={() => router.push(`/dashboard/students/details?id=${payment.studentId}`)}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              👤 View Student
            </button>
          )}
          <button
            onClick={() => router.push(`/dashboard/finance?payment=${payment.id}`)}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            💳 View All Payments
          </button>
        </div>
      </div>
      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Payment Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Amount:</span>
            <span className="font-medium text-gray-900">
              EGP {payment.amount.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Type:</span>
            <span className="font-medium text-gray-900 capitalize">{payment.type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Status:</span>
            <StatusBadge
              status={
                payment.status === 'completed'
                  ? 'active'
                  : payment.status === 'pending'
                  ? 'warning'
                  : 'inactive'
              }
              label={payment.status}
            />
          </div>
          {payment.dueDate && (
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="text-gray-500">Days Until Due:</span>
              <span className="font-medium text-gray-900">
                {Math.ceil(
                  (new Date(payment.dueDate).getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                )}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <StandardDetailView
      title={`Payment - EGP ${payment.amount.toLocaleString()}`}
      subtitle={payment.student ? `${payment.student.firstName} ${payment.student.lastName}` : 'Payment Details'}
      actions={actions}
      tabs={tabs}
      breadcrumbs={breadcrumbs}
      sidebar={sidebar}
    />
  );
}

