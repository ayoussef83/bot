'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { instructorsService, Instructor } from '@/lib/services';
import StandardListView, { FilterConfig } from '@/components/StandardListView';
import { Column, ActionButton } from '@/components/DataTable';
import SummaryCard from '@/components/SummaryCard';
import { FiPlus, FiEdit, FiTrash2, FiUserCheck, FiUsers, FiBriefcase, FiDollarSign } from 'react-icons/fi';

export default function PeoplePage() {
  const router = useRouter();
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [costTypeFilter, setCostTypeFilter] = useState('');

  useEffect(() => {
    fetchInstructors();
  }, []);

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
      label: 'Cost Model',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-700 capitalize">{value}</span>
      ),
    },
    {
      key: 'costAmount',
      label: 'Cost',
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
      onClick: () => {
        // Edit functionality can be added later
        alert('Edit functionality coming soon');
      },
      icon: <FiEdit className="w-4 h-4" />,
    },
  ];

  // Filters
  const filters: FilterConfig[] = [
    {
      key: 'costType',
      label: 'Cost Model',
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

      {/* Standard List View */}
      <StandardListView
        title=""
        subtitle=""
        primaryAction={{
          label: 'Add Person',
          onClick: () => {
            // Add person functionality can be added later
            alert('Add person functionality coming soon');
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

