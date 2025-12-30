'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { instructorsService, Instructor } from '@/lib/services';
import api from '@/lib/api';
import StandardListView, { FilterConfig } from '@/components/StandardListView';
import { Column, ActionButton } from '@/components/DataTable';
import SummaryCard from '@/components/SummaryCard';
import { FiPlus, FiEdit, FiTrash2, FiUserCheck, FiUsers, FiBriefcase, FiDollarSign } from 'react-icons/fi';

export default function PeoplePage() {
  const router = useRouter();
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [costTypeFilter, setCostTypeFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);
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
    setError('');
    try {
      const response = await instructorsService.getAll();
      const instructorsData = Array.isArray(response.data) ? response.data : (response.data as any)?.data || [];
      setInstructors(instructorsData);
    } catch (err: any) {
      console.error('Error fetching instructors:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to load people';
      setError(errorMessage);
      setInstructors([]);
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
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save person');
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

  // Filter and search
  const filteredInstructors = useMemo(() => {
    return instructors.filter((instructor) => {
      const matchesSearch =
        searchTerm === '' ||
        instructor.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instructor.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instructor.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCostType = costTypeFilter === '' || instructor.costType === costTypeFilter;

      return matchesSearch && matchesCostType;
    });
  }, [instructors, searchTerm, costTypeFilter]);

  // Calculate metrics
  const totalPeople = filteredInstructors.length;
  const hourlyCount = filteredInstructors.filter((i) => i.costType === 'hourly').length;
  const monthlyCount = filteredInstructors.filter((i) => i.costType === 'monthly').length;
  const totalClasses = filteredInstructors.reduce((sum, i) => sum + (i.classes?.length || 0), 0);

  // Column definitions
  const columns: Column<Instructor>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (_, row) => (
        <a
          href={`/dashboard/hr/people/details?id=${row.id}`}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
          onClick={(e) => {
            e.preventDefault();
            router.push(`/dashboard/hr/people/details?id=${row.id}`);
          }}
        >
          {row.user?.firstName} {row.user?.lastName}
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
      label: 'Fee Model',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-700 capitalize">{value}</span>
      ),
    },
    {
      key: 'costAmount',
      label: 'Fees',
      sortable: true,
      render: (value, row) => (
        <span className="text-sm text-gray-900">
          {value} {row.costType === 'hourly' ? '/hr' : '/mo'}
        </span>
      ),
    },
    {
      key: 'classes',
      label: 'Classes',
      sortable: false,
      render: (_, row) => (
        <span className="text-sm text-gray-600">
          {row.classes?.length || 0} assigned
        </span>
      ),
    },
    {
      key: 'utilization',
      label: 'Utilization',
      sortable: false,
      render: (_, row) => {
        const classCount = row.classes?.length || 0;
        return (
          <span className={`text-sm font-medium ${
            classCount > 0 ? 'text-green-600' : 'text-gray-400'
          }`}>
            {classCount > 0 ? `${classCount} classes` : 'No assignments'}
          </span>
        );
      },
    },
  ];

  // Action buttons
  const actions = (row: Instructor): ActionButton[] => [
    {
      label: 'View Profile',
      onClick: () => router.push(`/dashboard/hr/people/details?id=${row.id}`),
      variant: 'primary',
      icon: <FiUserCheck className="w-4 h-4" />,
    },
    {
      label: 'Edit',
      onClick: () => handleEdit(row),
      icon: <FiEdit className="w-4 h-4" />,
    },
  ];

  // Filters
  const filters: FilterConfig[] = [
    {
      key: 'costType',
      label: 'Fee Model',
      type: 'select',
      options: [
        { value: '', label: 'All Models' },
        { value: 'hourly', label: `Hourly (${hourlyCount})` },
        { value: 'monthly', label: `Monthly (${monthlyCount})` },
      ],
      value: costTypeFilter,
      onChange: setCostTypeFilter,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <FiUsers className="w-8 h-8 text-indigo-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">People</h1>
          <p className="text-sm text-gray-500 mt-1">Manage instructors and staff</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Person Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => {
                setShowForm(false);
                setEditingInstructor(null);
                setFormData({ userId: '', costType: 'hourly', costAmount: '' });
              }}
            ></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h2 className="text-xl font-semibold mb-4">
                  {editingInstructor ? 'Edit Person' : 'Add Person'}
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
                      {editingInstructor
                        ? 'User cannot be changed after creation'
                        : 'Note: Only users with instructor role are shown'}
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
                      {editingInstructor ? 'Update' : 'Create'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingInstructor(null);
                        setFormData({ userId: '', costType: 'hourly', costAmount: '' });
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
        title=""
        subtitle=""
        primaryAction={{
          label: 'Add Person',
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
        emptyMessage="No people found"
        summaryCards={
          <>
            <SummaryCard
              title="Total People"
              value={totalPeople}
              icon={<FiUsers className="w-5 h-5" />}
            />
            <SummaryCard
              title="Hourly"
              value={hourlyCount}
              variant="info"
              icon={<FiDollarSign className="w-5 h-5" />}
            />
            <SummaryCard
              title="Monthly"
              value={monthlyCount}
              variant="warning"
              icon={<FiDollarSign className="w-5 h-5" />}
            />
            <SummaryCard
              title="Total Classes"
              value={totalClasses}
              variant="success"
              icon={<FiUserCheck className="w-5 h-5" />}
            />
          </>
        }
        getRowId={(row) => row.id}
        onRowClick={(row) => {
          router.push(`/dashboard/hr/people/details?id=${row.id}`);
        }}
      />
    </div>
  );
}

