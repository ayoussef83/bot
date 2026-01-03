'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiFileText, FiEdit, FiTrash2, FiArrowLeft, FiDollarSign, FiCalendar, FiUser, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import api from '@/lib/api';

interface Invoice {
  id: string;
  invoiceNumber: string;
  studentId: string | null;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
  } | null;
  classId: string | null;
  subscriptionId: string | null;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  status: 'issued' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';
  notes: string | null;
  paymentAllocations: Array<{
    id: string;
    amount: number;
    allocatedAt: string;
    payment: {
      id: string;
      paymentNumber: string;
      amount: number;
      receivedDate: string;
      method: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function InvoiceDetailsPage() {
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      fetchInvoice(id);
    } else {
      setError('Invoice ID not provided');
      setLoading(false);
    }
  }, []);

  const fetchInvoice = async (id: string) => {
    try {
      const response = await api.get(`/finance/invoices/${id}`);
      setInvoice(response.data);
    } catch (err: any) {
      console.error('Error fetching invoice:', err);
      setError(err.response?.data?.message || 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      issued: { color: 'bg-blue-100 text-blue-800', label: 'Issued' },
      partially_paid: { color: 'bg-yellow-100 text-yellow-800', label: 'Partially Paid' },
      paid: { color: 'bg-green-100 text-green-800', label: 'Paid' },
      overdue: { color: 'bg-red-100 text-red-800', label: 'Overdue' },
      cancelled: { color: 'bg-gray-100 text-gray-800', label: 'Cancelled' },
    };
    const badge = badges[status as keyof typeof badges] || badges.issued;
    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const totalAllocated = invoice?.paymentAllocations.reduce((sum, alloc) => sum + alloc.amount, 0) || 0;
  const remainingBalance = invoice ? invoice.totalAmount - totalAllocated : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading invoice...</div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Invoice not found'}
        </div>
        <button
          onClick={() => router.push('/dashboard/finance/revenue/invoices')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Back to Invoices
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard/finance/revenue/invoices')}
            className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <FiFileText className="w-8 h-8 text-indigo-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{invoice.invoiceNumber}</h1>
              <p className="text-sm text-gray-500 mt-1">Invoice Details</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          {invoice.status !== 'cancelled' && invoice.status !== 'paid' && (
            <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium flex items-center gap-2">
              <FiEdit className="w-4 h-4" />
              Edit
            </button>
          )}
          {invoice.status === 'issued' && (
            <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium flex items-center gap-2">
              <FiXCircle className="w-4 h-4" />
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Invoice Number</p>
                <p className="text-base text-gray-900 mt-1">{invoice.invoiceNumber}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <div className="mt-1">{getStatusBadge(invoice.status)}</div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Issue Date</p>
                <p className="text-base text-gray-900 mt-1">
                  {new Date(invoice.issueDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Due Date</p>
                <p className="text-base text-gray-900 mt-1">
                  {new Date(invoice.dueDate).toLocaleDateString()}
                </p>
              </div>
              {invoice.student && (
                <>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Student</p>
                    <p className="text-base text-gray-900 mt-1">
                      {invoice.student.firstName} {invoice.student.lastName}
                    </p>
                  </div>
                  {invoice.student.email && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="text-base text-gray-900 mt-1">{invoice.student.email}</p>
                    </div>
                  )}
                </>
              )}
            </div>
            {invoice.notes && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-500">Notes</p>
                <p className="text-sm text-gray-700 mt-1">{invoice.notes}</p>
              </div>
            )}
          </div>

          {/* Payment Allocations */}
          {invoice.paymentAllocations.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Allocations</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Number</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Received Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Allocated Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {invoice.paymentAllocations.map((allocation) => (
                      <tr key={allocation.id}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {allocation.payment.paymentNumber}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                          {allocation.amount.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 capitalize">
                          {allocation.payment.method.replace('_', ' ')}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {new Date(allocation.payment.receivedDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {new Date(allocation.allocatedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Amount Summary */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Amount Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Subtotal</span>
                <span className="text-sm font-medium text-gray-900">
                  {invoice.subtotal.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 2 })}
                </span>
              </div>
              {invoice.discountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Discount</span>
                  <span className="text-sm font-medium text-red-600">
                    -{invoice.discountAmount.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              {invoice.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Tax</span>
                  <span className="text-sm font-medium text-gray-900">
                    {invoice.taxAmount.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              <div className="pt-3 border-t border-gray-200 flex justify-between">
                <span className="text-base font-semibold text-gray-900">Total Amount</span>
                <span className="text-base font-bold text-gray-900">
                  {invoice.totalAmount.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 2 })}
                </span>
              </div>
              {totalAllocated > 0 && (
                <>
                  <div className="pt-3 border-t border-gray-200 flex justify-between">
                    <span className="text-sm text-gray-600">Total Allocated</span>
                    <span className="text-sm font-medium text-green-600">
                      {totalAllocated.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-900">Remaining Balance</span>
                    <span className={`text-sm font-bold ${remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {remainingBalance.toLocaleString('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {remainingBalance > 0 && invoice.status !== 'cancelled' && (
                <button
                  onClick={() => router.push(`/dashboard/finance/cash/payments?invoiceId=${invoice.id}`)}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium flex items-center justify-center gap-2"
                >
                  <FiDollarSign className="w-4 h-4" />
                  Record Payment
                </button>
              )}
              <button
                onClick={() => window.print()}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium"
              >
                Print Invoice
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}







