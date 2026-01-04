'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiCreditCard, FiArrowLeft, FiDollarSign, FiCalendar, FiUser, FiCheckCircle, FiXCircle, FiClock, FiFileText } from 'react-icons/fi';
import { financeService, Payment } from '@/lib/services';

export default function PaymentDetailsPage() {
  const router = useRouter();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      fetchPayment(id);
    } else {
      setError('Payment ID not provided');
      setLoading(false);
    }
  }, []);

  const fetchPayment = async (id: string) => {
    try {
      const response = await financeService.getPaymentById(id);
      setPayment(response.data);
    } catch (err: any) {
      console.error('Error fetching payment:', err);
      setError(err.response?.data?.message || 'Failed to load payment');
    } finally {
      setLoading(false);
    }
  };

  const formatDateCairo = (value: any) => {
    if (!value) return '-';
    try {
      return new Date(value).toLocaleDateString('en-GB', { timeZone: 'Africa/Cairo' });
    } catch {
      return '-';
    }
  };

  const formatTimeCairo = (value: any) => {
    if (!value) return '-';
    try {
      return new Date(value).toLocaleTimeString('en-GB', {
        timeZone: 'Africa/Cairo',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '-';
    }
  };

  const handleRefund = async () => {
    if (!payment) return;
    const reason = prompt('Refund reason?');
    if (!reason) return;
    try {
      await financeService.reversePayment(payment.id, reason);
      await fetchPayment(payment.id);
      alert('Payment refunded (reversed).');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to refund payment');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      received: { color: 'bg-green-100 text-green-800', label: 'Received' },
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      reversed: { color: 'bg-red-100 text-red-800', label: 'Reversed' },
      failed: { color: 'bg-gray-100 text-gray-800', label: 'Failed' },
    };
    const badge = badges[status as keyof typeof badges] || badges.received;
    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const getMethodLabel = (method: string) => {
    return method.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const totalAllocated = payment?.allocations?.reduce((sum, alloc) => sum + alloc.amount, 0) || 0;
  const unallocatedAmount = payment ? payment.amount - totalAllocated : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading payment...</div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.push('/dashboard/finance/cash/payments')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <FiArrowLeft className="w-4 h-4" />
          Back to Payments
        </button>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Payment not found'}
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
            onClick={() => router.push('/dashboard/finance/cash/payments')}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <FiCreditCard className="w-8 h-8 text-indigo-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payment Details</h1>
            <p className="text-sm text-gray-500 mt-1">{payment.paymentNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(payment.status)}
          {(payment.status || '') !== 'reversed' && (
            <button
              onClick={handleRefund}
              className="px-3 py-2 text-sm font-medium rounded-md border border-red-300 text-red-700 hover:bg-red-50"
            >
              Refund
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payment Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Amount</h3>
                <p className="text-2xl font-bold text-green-600">
                  {payment.amount.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Payment Method</h3>
                <p className="text-lg text-gray-900">{getMethodLabel(payment.method)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                  <FiCalendar className="w-4 h-4" />
                  Received Date
                </h3>
                <p className="text-lg text-gray-900">{formatDateCairo(payment.receivedDate)}</p>
                <p className="text-sm text-gray-500">{formatTimeCairo(payment.receivedDate)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                  <FiUser className="w-4 h-4" />
                  Recorded By
                </h3>
                <p className="text-lg text-gray-900">
                  {(payment as any)?.recordedBy
                    ? `${(payment as any).recordedBy.firstName || ''} ${(payment as any).recordedBy.lastName || ''}`.trim()
                    : '-'}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Cash Account</h3>
                <p className="text-lg text-gray-900">{payment.cashAccount?.name || '-'}</p>
                {payment.cashAccount && (
                  <p className="text-sm text-gray-500 mt-1">
                    {payment.cashAccount.type.charAt(0).toUpperCase() + payment.cashAccount.type.slice(1)}
                  </p>
                )}
              </div>
              {payment.referenceNumber && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Reference Number</h3>
                  <p className="text-lg text-gray-900 font-mono">{payment.referenceNumber}</p>
                </div>
              )}
              {payment.student && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                    <FiUser className="w-4 h-4" />
                    Student
                  </h3>
                  <p className="text-lg text-gray-900">
                    {payment.student.firstName} {payment.student.lastName}
                  </p>
                  {payment.student.email && (
                    <p className="text-sm text-gray-500 mt-1">{payment.student.email}</p>
                  )}
                </div>
              )}
              {!payment.student && (payment as any).Student && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                    <FiUser className="w-4 h-4" />
                    Student
                  </h3>
                  <p className="text-lg text-gray-900">
                    {(payment as any).Student.firstName} {(payment as any).Student.lastName}
                  </p>
                  {(payment as any).Student.email && (
                    <p className="text-sm text-gray-500 mt-1">{(payment as any).Student.email}</p>
                  )}
                </div>
              )}
            </div>
            {payment.notes && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{payment.notes}</p>
              </div>
            )}
          </div>

          {/* Allocations */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Allocations</h2>
            {payment.allocations && payment.allocations.length > 0 ? (
              <div className="space-y-4">
                {payment.allocations.map((allocation) => (
                  <div
                    key={allocation.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <FiFileText className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {allocation.invoice?.invoiceNumber || 'Invoice'}
                        </span>
                      </div>
                      {allocation.invoice?.student && (
                        <p className="text-sm text-gray-500">
                          {allocation.invoice.student.firstName} {allocation.invoice.student.lastName}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Allocated on {new Date(allocation.allocatedAt || '').toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">
                        {allocation.amount.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FiClock className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No allocations yet</p>
                <p className="text-sm mt-1">This payment has not been allocated to any invoice</p>
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
                <span className="text-sm text-gray-500">Payment Amount</span>
                <span className="text-sm font-medium text-gray-900">
                  {payment.amount.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Allocated</span>
                <span className="text-sm font-medium text-green-600">
                  {totalAllocated.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t border-gray-200">
                <span className="text-sm font-medium text-gray-700">Unallocated</span>
                <span className={`text-sm font-semibold ${unallocatedAmount > 0 ? 'text-yellow-600' : 'text-gray-900'}`}>
                  {unallocatedAmount.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Info</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-500">Status:</span>
                <span className="ml-2 font-medium text-gray-900">{getStatusBadge(payment.status)}</span>
              </div>
              <div>
                <span className="text-gray-500">Payment #:</span>
                <span className="ml-2 font-mono text-gray-900">{payment.paymentNumber}</span>
              </div>
              <div>
                <span className="text-gray-500">Created:</span>
                <span className="ml-2 text-gray-900">
                  {new Date(payment.createdAt || '').toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
