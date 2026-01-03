'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { instructorsService, Instructor } from '@/lib/services';
import api from '@/lib/api';
import StandardListView, { FilterConfig } from '@/components/StandardListView';
import { Column, ActionButton } from '@/components/DataTable';
import SummaryCard from '@/components/SummaryCard';
import EmptyState from '@/components/EmptyState';
import { downloadExport } from '@/lib/export';
import { FiPlus, FiEdit, FiTrash2, FiUserCheck, FiUsers } from 'react-icons/fi';

export default function InstructorsPage() {
  const router = useRouter();
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [costTypeFilter, setCostTypeFilter] = useState('');
  const [formData, setFormData] = useState({
    userId: '',
    costType: 'hourly',
    costAmount: '',
  });

  useEffect(() => {
    fetchInstructors();
  }, []);

  useEffect(() => {
    if (instructors.length > 0) {
      fetchUsers();
    }
  }, [instructors]);

  const fetchInstructors = async () => {
    try {
      const response = await instructorsService.getAll();
      setInstructors(response.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load instructors');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      // Filter users that don't already have instructor profiles
      const instructorUserIds = instructors.map((i) => i.userId);
      const availableUsers = response.data.filter(
        (u: any) => !instructorUserIds.includes(u.id) && u.role === 'instructor',
      );
      setUsers(availableUsers);
    } catch (err) {
      // Ignore errors, just won't show user dropdown
      console.error('Failed to load users', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingInstructor) {
        await instructorsService.update(editingInstructor.id, {
          ...formData,
          costAmount: parseFloat(formData.costAmount),
        });
      } else {
        await instructorsService.create({
          ...formData,
          costAmount: parseFloat(formData.costAmount),
        });
      }
      setShowForm(false);
      setEditingInstructor(null);
      setFormData({ userId: '', costType: 'hourly', costAmount: '' });
      fetchInstructors();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save instructor');
    }
  };

  const handleEdit = (instructor: Instructor) => {
    setEditingInstructor(instructor);
    setFormData({
      userId: instructor.userId,
      costType: instructor.costType,
      costAmount: instructor.costAmount.toString(),
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this instructor?')) return;
    try {
      await instructorsService.delete(id);
      fetchInstructors();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete instructor');
    }
  };

  // Filter instructors
  const filteredInstructors = useMemo(() => {
    return instructors.filter((instructor) => {
      const matchesSearch =
        searchTerm === '' ||
        `${instructor.user?.firstName || ''} ${instructor.user?.lastName || ''}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        instructor.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCostType = costTypeFilter === '' || instructor.costType === costTypeFilter;

      return matchesSearch && matchesCostType;
    });
  }, [instructors, searchTerm, costTypeFilter]);

  // Column definitions
  const columns: Column<Instructor>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (_, row) => (
        <a
          href={`/dashboard/instructors/details?id=${row.id}`}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
          onClick={(e) => {
            e.preventDefault();
            router.push(`/dashboard/instructors/details?id=${row.id}`);
          }}
        >
          {row.user?.firstName || ''} {row.user?.lastName || ''}
        </a>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (_, row) => (
        <span className="text-sm text-gray-500">{row.user?.email || '-'}</span>
      ),
    },
    {
      key: 'costType',
      label: 'Cost Type',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-500 capitalize">{value}</span>
      ),
    },
    {
      key: 'costAmount',
      label: 'Cost Amount',
      sortable: true,
      align: 'right',
      render: (value, row) => (
        <span className="text-sm font-semibold text-gray-900">
          EGP {value.toLocaleString()}
          <span className="text-xs text-gray-500 ml-1">
            /{row.costType === 'hourly' ? 'hr' : 'mo'}
          </span>
        </span>
      ),
    },
    {
      key: 'classes',
      label: 'Courses',
      render: (_, row) => (
        <span className="text-sm text-gray-500">{row.classes?.length || 0}</span>
      ),
    },
  ];

  // Action buttons
  const actions = (row: Instructor): ActionButton[] => [
    {
      label: 'Edit',
      onClick: () => handleEdit(row),
      icon: <FiEdit className="w-4 h-4" />,
    },
    {
      label: 'Delete',
      onClick: () => handleDelete(row.id),
      variant: 'danger',
      icon: <FiTrash2 className="w-4 h-4" />,
    },
  ];

  // Filters
  const filters: FilterConfig[] = [
    {
      key: 'costType',
      label: 'Cost Type',
      type: 'select',
      options: [
        { value: 'hourly', label: 'Hourly' },
        { value: 'monthly', label: 'Monthly' },
      ],
      value: costTypeFilter,
      onChange: setCostTypeFilter,
    },
  ];

  // Summary statistics
  const totalInstructors = filteredInstructors.length;
  const totalClasses = filteredInstructors.reduce(
    (sum, i) => sum + (i.classes?.length || 0),
    0,
  );
  const hourlyInstructors = filteredInstructors.filter((i) => i.costType === 'hourly').length;

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Instructor Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => {
                setShowForm(false);
                setEditingInstructor(null);
              }}
            ></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h2 className="text-xl font-semibold mb-4">
                  {editingInstructor ? 'Edit Instructor' : 'New Instructor'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">User</label>
                    <select
                      required
                      disabled={!!editingInstructor}
                      value={formData.userId}
                      onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100"
                    >
                      <option value="">Select a user...</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.firstName} {user.lastName} ({user.email})
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-sm text-gray-500">
                      Note: Only users with instructor role are shown
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Cost Type</label>
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
                        Cost Amount (EGP)
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
                      {editingInstructor ? 'Update' : 'Create'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingInstructor(null);
                      }}
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

      {/* Standard List View */}
      <StandardListView
        title="Instructors"
        subtitle="Manage instructor profiles and assignments"
        primaryAction={{
          label: 'Add Instructor',
          onClick: () => {
            setShowForm(true);
            setEditingInstructor(null);
            setFormData({ userId: '', costType: 'hourly', costAmount: '' });
            fetchUsers();
          },
          icon: <FiPlus className="w-4 h-4" />,
        }}
        searchPlaceholder="Search by name or email..."
        onSearch={setSearchTerm}
        searchValue={searchTerm}
        filters={filters}
        columns={columns}
        data={filteredInstructors}
        loading={loading}
        actions={actions}
        emptyMessage="No instructors found"
        emptyState={
          <EmptyState
            title="No instructors found"
            message="Get started by adding your first instructor"
            action={{
              label: 'Add Instructor',
              onClick: () => {
                setShowForm(true);
                setEditingInstructor(null);
              },
            }}
          />
        }
        summaryCards={
          <>
            <SummaryCard
              title="Total Instructors"
              value={totalInstructors}
              icon={<FiUserCheck className="w-8 h-8" />}
            />
            <SummaryCard
              title="Total Classes"
              value={totalClasses}
              icon={<FiUsers className="w-8 h-8" />}
            />
            <SummaryCard
              title="Hourly Instructors"
              value={hourlyInstructors}
              variant="info"
              icon={<FiUserCheck className="w-8 h-8" />}
            />
          </>
        }
        getRowId={(row) => row.id}
        onRowClick={(row) => {
          router.push(`/dashboard/instructors/${row.id}`);
        }}
      />

      {/* Export Buttons */}
      <div className="flex justify-end gap-2">
        <button
          onClick={() => downloadExport('instructors', 'xlsx')}
          className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 text-sm font-medium"
        >
          Export Excel
        </button>
        <button
          onClick={() => downloadExport('instructors', 'pdf')}
          className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 text-sm font-medium"
        >
          Export PDF
        </button>
      </div>
    </div>
  );
}
