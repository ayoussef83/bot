'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { classesService, Class } from '@/lib/services';
import { instructorsService, Instructor } from '@/lib/services';
import StandardListView, { FilterConfig } from '@/components/StandardListView';
import { Column, ActionButton } from '@/components/DataTable';
import SummaryCard from '@/components/SummaryCard';
import EmptyState from '@/components/EmptyState';
import { downloadExport } from '@/lib/export';
import { FiPlus, FiEdit, FiTrash2, FiBookOpen, FiUsers } from 'react-icons/fi';
import HighlightedText from '@/components/HighlightedText';

export default function ClassesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    location: 'MOA',
    capacity: '',
    instructorId: '',
    dayOfWeek: '0',
    startTime: '',
    endTime: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchClasses();
    fetchInstructors();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await classesService.getAll();
      setClasses(response.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const fetchInstructors = async () => {
    try {
      const response = await instructorsService.getAll();
      setInstructors(response.data);
    } catch (err: any) {
      // Don't block the page if instructors fail
      console.error('Failed to load instructors', err);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      location: 'MOA',
      capacity: '',
      instructorId: '',
      dayOfWeek: '0',
      startTime: '',
      endTime: '',
      startDate: '',
      endDate: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingClass) {
        await classesService.update(editingClass.id, {
          ...formData,
          capacity: parseInt(formData.capacity),
          dayOfWeek: parseInt(formData.dayOfWeek),
        });
      } else {
        await classesService.create({
          ...formData,
          capacity: parseInt(formData.capacity),
          dayOfWeek: parseInt(formData.dayOfWeek),
        });
      }
      setShowForm(false);
      setEditingClass(null);
      resetForm();
      fetchClasses();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save class');
    }
  };

  const handleEdit = (classItem: Class) => {
    setEditingClass(classItem);
    setFormData({
      name: classItem.name,
      location: classItem.location,
      capacity: classItem.capacity.toString(),
      instructorId: classItem.instructorId || '',
      dayOfWeek: classItem.dayOfWeek.toString(),
      startTime: classItem.startTime,
      endTime: classItem.endTime,
      startDate: classItem.startDate.split('T')[0],
      endDate: classItem.endDate ? classItem.endDate.split('T')[0] : '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this class?')) return;
    try {
      await classesService.delete(id);
      fetchClasses();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete class');
    }
  };

  // Filter classes
  const filteredClasses = classes.filter((classItem) => {
    const matchesSearch =
      searchTerm === '' ||
      classItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      classItem.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLocation = locationFilter === '' || classItem.location === locationFilter;

    return matchesSearch && matchesLocation;
  });

  const daysOfWeek = [
    { value: '0', label: 'Sunday' },
    { value: '1', label: 'Monday' },
    { value: '2', label: 'Tuesday' },
    { value: '3', label: 'Wednesday' },
    { value: '4', label: 'Thursday' },
    { value: '5', label: 'Friday' },
    { value: '6', label: 'Saturday' },
  ];

  const locations = ['MOA', 'Espace', 'SODIC', 'PalmHills'];

  // Column definitions
  const columns: Column<Class>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (_, row) => (
        <a
          href={`/dashboard/classes/details?id=${row.id}`}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            router.push(`/dashboard/classes/details?id=${row.id}`);
          }}
        >
          <HighlightedText text={row.name} query={searchTerm} />
        </a>
      ),
    },
    {
      key: 'location',
      label: 'Location',
      sortable: true,
      render: (value) => <span className="text-sm text-gray-500">{value}</span>,
    },
    {
      key: 'capacity',
      label: 'Capacity',
      sortable: true,
      render: (value) => <span className="text-sm text-gray-500">{value}</span>,
    },
    {
      key: 'students',
      label: 'Students',
      render: (_, row) => (
        <span className="text-sm text-gray-500">{row.students?.length || 0}</span>
      ),
    },
    {
      key: 'schedule',
      label: 'Schedule',
      render: (_, row) => {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return (
          <span className="text-sm text-gray-500">
            {dayNames[row.dayOfWeek]} {row.startTime} - {row.endTime}
          </span>
        );
      },
    },
    {
      key: 'utilization',
      label: 'Utilization',
      render: (_, row) => (
        <div className="text-sm text-gray-500">
          {row.utilizationPercentage?.toFixed(1) || 0}%
          {row.isUnderfilled && (
            <span className="ml-2 text-xs text-red-600">⚠️ Underfilled</span>
          )}
        </div>
      ),
    },
  ];

  // Action buttons
  const actions = (row: Class): ActionButton[] => [
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
      key: 'location',
      label: 'Location',
      type: 'select',
      options: locations.map((loc) => ({ value: loc, label: loc })),
      value: locationFilter,
      onChange: setLocationFilter,
    },
  ];

  // Summary statistics
  const totalClasses = filteredClasses.length;
  const totalStudents = filteredClasses.reduce((sum, c) => sum + (c.students?.length || 0), 0);
  const avgUtilization =
    filteredClasses.length > 0
      ? filteredClasses.reduce((sum, c) => sum + (c.utilizationPercentage || 0), 0) /
        filteredClasses.length
      : 0;

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Class Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowForm(false)}
            ></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h2 className="text-xl font-semibold mb-4">
                  {editingClass ? 'Edit Class' : 'Add New Class'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Class Name</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Location</label>
                      <select
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        {locations.map((loc) => (
                          <option key={loc} value={loc}>
                            {loc}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Capacity</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Instructor</label>
                      <select
                        value={formData.instructorId}
                        onChange={(e) => setFormData({ ...formData, instructorId: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value="">Select Instructor</option>
                        {instructors.map((instructor) => (
                          <option key={instructor.id} value={instructor.id}>
                            {instructor.user?.firstName || ''} {instructor.user?.lastName || ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Day of Week</label>
                      <select
                        value={formData.dayOfWeek}
                        onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        {daysOfWeek.map((day) => (
                          <option key={day.value} value={day.value}>
                            {day.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Start Time</label>
                      <input
                        type="time"
                        required
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">End Time</label>
                      <input
                        type="time"
                        required
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Start Date</label>
                      <input
                        type="date"
                        required
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      End Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <button
                      type="submit"
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                    >
                      {editingClass ? 'Update' : 'Create'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingClass(null);
                        resetForm();
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
        title="Classes"
        subtitle="Manage class schedules and enrollment"
        primaryAction={{
          label: 'Add Class',
          onClick: () => {
            setShowForm(true);
            setEditingClass(null);
            resetForm();
          },
          icon: <FiPlus className="w-4 h-4" />,
        }}
        searchPlaceholder="Search by name or location..."
        onSearch={setSearchTerm}
        searchValue={searchTerm}
        filters={filters}
        columns={columns}
        data={filteredClasses}
        loading={loading}
        actions={actions}
        emptyMessage="No classes found"
        emptyState={
          <EmptyState
            title="No classes found"
            message="Get started by creating your first class"
            action={{
              label: 'Add Class',
              onClick: () => {
                setShowForm(true);
                setEditingClass(null);
              },
            }}
          />
        }
        summaryCards={
          <>
            <SummaryCard
              title="Total Classes"
              value={totalClasses}
              icon={<FiBookOpen className="w-8 h-8" />}
            />
            <SummaryCard
              title="Total Students"
              value={totalStudents}
              icon={<FiUsers className="w-8 h-8" />}
            />
            <SummaryCard
              title="Avg Utilization"
              value={`${avgUtilization.toFixed(1)}%`}
              variant="info"
              icon={<FiUsers className="w-8 h-8" />}
            />
          </>
        }
        getRowId={(row) => row.id}
        onRowClick={(row) => {
          router.push(`/dashboard/classes/details?id=${row.id}`);
        }}
      />

      {/* Export Buttons */}
      <div className="flex justify-end gap-2">
        <button
          onClick={() => downloadExport('classes', 'xlsx')}
          className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 text-sm font-medium"
        >
          Export Excel
        </button>
        <button
          onClick={() => downloadExport('classes', 'pdf')}
          className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 text-sm font-medium"
        >
          Export PDF
        </button>
      </div>
    </div>
  );
}
