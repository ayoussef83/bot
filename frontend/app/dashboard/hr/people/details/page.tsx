'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { instructorsService, Instructor } from '@/lib/services';
import api from '@/lib/api';
import StandardDetailView, { Tab, ActionButton, Breadcrumb } from '@/components/StandardDetailView';
import StatusBadge from '@/components/settings/StatusBadge';
import { Column } from '@/components/DataTable';
import DataTable from '@/components/DataTable';
import { FiEdit, FiTrash2, FiUser, FiMail, FiPhone, FiDollarSign, FiCalendar, FiUserCheck, FiActivity, FiClock } from 'react-icons/fi';

export default function PersonDetailPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [id, setId] = useState<string | null>(null);

  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const instructorId = params.get('id');
      if (instructorId) {
        setId(instructorId);
      } else {
        setError('Missing person id');
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchInstructor(id);
    }
  }, [id]);

  const fetchInstructor = async (instructorId: string) => {
    try {
      const response = await instructorsService.getById(instructorId);
      setInstructor(response.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load person');
    } finally {
      setLoading(false);
    }
  };

  const [showEditForm, setShowEditForm] = useState(false);
  const [formData, setFormData] = useState({
    costType: 'hourly',
    costAmount: '',
  });

  useEffect(() => {
    if (instructor) {
      setFormData({
        costType: instructor.costType,
        costAmount: instructor.costAmount.toString(),
      });
    }
  }, [instructor]);

  const handleDelete = async () => {
    if (!instructor || !confirm('Are you sure you want to delete this person?')) return;
    try {
      await instructorsService.delete(instructor.id);
      router.push('/dashboard/hr/people');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete person');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instructor) return;
    try {
      await instructorsService.update(instructor.id, {
        costType: formData.costType,
        costAmount: parseFloat(formData.costAmount),
      });
      setShowEditForm(false);
      fetchInstructor(instructor.id);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update person');
    }
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading person details...</div>
      </div>
    );
  }

  if (error || !instructor) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error || 'Person not found'}
        </div>
        <button
          onClick={() => router.push('/dashboard/hr/people')}
          className="text-indigo-600 hover:text-indigo-900"
        >
          ← Back to People
        </button>
      </div>
    );
  }

  const userName = instructor.user ? `${instructor.user.firstName} ${instructor.user.lastName}` : 'Unknown';
  const userEmail = instructor.user?.email || '-';

  // Breadcrumbs
  const breadcrumbs: Breadcrumb[] = [
    { label: 'HR', href: '/dashboard/hr' },
    { label: 'People', href: '/dashboard/hr/people' },
    { label: userName, href: `/dashboard/hr/people/details?id=${id}` },
  ];

  // Action buttons
  const actions: ActionButton[] = [
    {
      label: 'Edit',
      onClick: () => setShowEditForm(true),
      icon: <FiEdit className="w-4 h-4" />,
    },
    {
      label: 'Delete',
      onClick: handleDelete,
      variant: 'danger',
      icon: <FiTrash2 className="w-4 h-4" />,
    },
  ];

  // Classes columns (read-only from Academic Ops)
  const classColumns: Column<any>[] = [
    {
      key: 'name',
      label: 'Class Name',
      render: (value) => (
        <span className="text-sm font-medium text-gray-900">{value || '-'}</span>
      ),
    },
    {
      key: 'location',
      label: 'Location',
      render: (value) => (
        <span className="text-sm text-gray-600 capitalize">{value || '-'}</span>
      ),
    },
    {
      key: 'students',
      label: 'Students',
      render: (_, row) => (
        <span className="text-sm text-gray-600">
          {row.students?.length || 0} enrolled
        </span>
      ),
    },
  ];

  // Sessions columns (read-only from Academic Ops)
  const sessionColumns: Column<any>[] = [
    {
      key: 'date',
      label: 'Date',
      render: (_, row) => (
        <span className="text-sm text-gray-900">
          {row.scheduledDate ? new Date(row.scheduledDate).toLocaleDateString() : '-'}
        </span>
      ),
    },
    {
      key: 'class',
      label: 'Class',
      render: (_, row) => (
        <span className="text-sm text-gray-600">{row.class?.name || '-'}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className="text-sm text-gray-600 capitalize">{value || '-'}</span>
      ),
    },
  ];

  // Tabs
  const tabs: Tab[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <FiUser className="w-4 h-4" />,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">First Name</h3>
              <p className="text-lg text-gray-900">{instructor.user?.firstName || '-'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Last Name</h3>
              <p className="text-lg text-gray-900">{instructor.user?.lastName || '-'}</p>
            </div>
            {instructor.user?.email && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                  <FiMail className="w-4 h-4" />
                  Email
                </h3>
                <p className="text-lg text-gray-900">{instructor.user.email}</p>
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Fee Model</h3>
              <p className="text-lg text-gray-900 capitalize">{instructor.costType}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                <FiDollarSign className="w-4 h-4" />
                Fee Amount
              </h3>
              <p className="text-lg text-gray-900">
                {instructor.costAmount} {instructor.costType === 'hourly' ? '/hour' : '/month'}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Classes Assigned</h3>
              <p className="text-lg text-gray-900">{instructor.classes?.length || 0}</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'assignments',
      label: 'Assignments',
      count: instructor.classes?.length || 0,
      icon: <FiUserCheck className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Class assignments are managed in Academic Operations. This is a read-only view.
            </p>
          </div>
          {instructor.classes && instructor.classes.length > 0 ? (
            <DataTable
              columns={classColumns}
              data={instructor.classes}
              emptyMessage="No classes assigned"
            />
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No classes assigned</p>
              <p className="text-sm mt-2">Assign classes in Academic Operations</p>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'sessions',
      label: 'Sessions',
      count: instructor.sessions?.length || 0,
      icon: <FiCalendar className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Sessions are managed in Academic Operations. This is a read-only view.
            </p>
          </div>
          {instructor.sessions && instructor.sessions.length > 0 ? (
            <DataTable
              columns={sessionColumns}
              data={instructor.sessions}
              emptyMessage="No sessions found"
            />
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No sessions recorded</p>
              <p className="text-sm mt-2">Sessions will appear here when assigned in Academic Operations</p>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: <FiActivity className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Utilization</h3>
              <p className="text-2xl font-bold text-gray-900">
                {instructor.classes?.length || 0} classes
              </p>
              <p className="text-xs text-gray-500 mt-1">Currently assigned</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Sessions</h3>
              <p className="text-2xl font-bold text-gray-900">
                {instructor.sessions?.length || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Performance metrics are calculated from Academic Operations data. 
              Detailed analytics coming soon.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'cost',
      label: 'Fees',
      icon: <FiDollarSign className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Fee Model</h3>
              <p className="text-lg font-bold text-gray-900 capitalize">{instructor.costType}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Rate</h3>
              <p className="text-lg font-bold text-gray-900">
                {instructor.costAmount} {instructor.costType === 'hourly' ? '/hour' : '/month'}
              </p>
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Fee information is used by Finance for expense calculations. 
              Payroll processing is handled by Finance.
            </p>
          </div>
        </div>
      ),
    },
  ];

  // Sidebar with summary
  const sidebar = (
    <div className="space-y-4">
      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Fee Model:</span>
            <span className="font-medium text-gray-900 capitalize">{instructor.costType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Rate:</span>
            <span className="font-medium text-gray-900">
              {instructor.costAmount} {instructor.costType === 'hourly' ? '/hr' : '/mo'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Classes:</span>
            <span className="font-medium text-gray-900">{instructor.classes?.length || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Sessions:</span>
            <span className="font-medium text-gray-900">{instructor.sessions?.length || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Edit Form Modal */}
      {showEditForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowEditForm(false)}
            ></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h2 className="text-xl font-semibold mb-4">Edit Person</h2>
                <form onSubmit={handleEditSubmit} className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> User information (name, email) is managed in User Settings. 
                      You can only update fee information here.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Fee Type</label>
                      <select
                        value={formData.costType}
                        onChange={(e) => setFormData({ ...formData, costType: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value="hourly">Hourly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Fee Amount (EGP)
                      </label>
                      <input
                        type="number"
                        required
                        step="0.01"
                        min="0"
                        value={formData.costAmount}
                        onChange={(e) => setFormData({ ...formData, costAmount: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <button
                      type="submit"
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                    >
                      Update
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEditForm(false)}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      <StandardDetailView
        title={userName}
        subtitle={userEmail}
        actions={actions}
        tabs={tabs}
        breadcrumbs={breadcrumbs}
        sidebar={sidebar}
      />
    </>
  );
}

