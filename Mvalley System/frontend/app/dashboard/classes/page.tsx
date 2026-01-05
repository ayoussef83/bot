'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { classesService, Class } from '@/lib/services';
import { coursesService } from '@/lib/services';
import StandardListView, { FilterConfig } from '@/components/StandardListView';
import { Column, ActionButton } from '@/components/DataTable';
import SummaryCard from '@/components/SummaryCard';
import EmptyState from '@/components/EmptyState';
import { downloadExport } from '@/lib/export';
import { FiPlus, FiEdit, FiTrash2, FiBookOpen, FiUsers } from 'react-icons/fi';
import HighlightedText from '@/components/HighlightedText';

export default function ClassesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [classes, setClasses] = useState<Class[]>([]);
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
    levelNumber: '',
    code: '',
    logoUrl: '',
    ageMin: '',
    ageMax: '',
    price: '',
    plannedSessions: '',
    description: '',
  });

  useEffect(() => {
    fetchClasses();
    // keep: this warms up course catalog in the background (safe no-op for UI)
    coursesService.listLevels().catch(() => null);
  }, []);

  // Support deep-link edit: /dashboard/courses?editId=...
  useEffect(() => {
    const editId = searchParams?.get('editId');
    if (!editId) return;
    const found = classes.find((c) => c.id === editId);
    if (!found) return;
    setEditingClass(found);
    setFormData({
      name: found.name,
      location: (found as any).location || 'MOA',
      capacity: String(found.capacity || ''),
      levelNumber:
        (found as any).levelNumber !== null && (found as any).levelNumber !== undefined
          ? String((found as any).levelNumber)
          : '',
      code: String((found as any).code || ''),
      logoUrl: String((found as any).logoUrl || ''),
      ageMin: (found as any).ageMin !== null && (found as any).ageMin !== undefined ? String((found as any).ageMin) : '',
      ageMax: (found as any).ageMax !== null && (found as any).ageMax !== undefined ? String((found as any).ageMax) : '',
      price: (found as any).price !== null && (found as any).price !== undefined ? String((found as any).price) : '',
      plannedSessions:
        (found as any).plannedSessions !== null && (found as any).plannedSessions !== undefined
          ? String((found as any).plannedSessions)
          : '',
      description: String((found as any).description || ''),
    });
    setShowForm(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, classes]);

  const fetchClasses = async () => {
    try {
      const response = await classesService.getAll();
      setClasses(response.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      location: 'MOA',
      capacity: '',
      levelNumber: '',
      code: '',
      logoUrl: '',
      ageMin: '',
      ageMax: '',
      price: '',
      plannedSessions: '',
      description: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.levelNumber || parseInt(formData.levelNumber) < 1) {
        setError('Level is required');
        return;
      }
      if (editingClass) {
        await classesService.update(editingClass.id, {
          ...formData,
          capacity: parseInt(formData.capacity),
          levelNumber: parseInt(formData.levelNumber),
          ageMin: formData.ageMin ? parseInt(formData.ageMin) : null,
          ageMax: formData.ageMax ? parseInt(formData.ageMax) : null,
          price: formData.price ? parseFloat(formData.price) : null,
          plannedSessions: formData.plannedSessions ? parseInt(formData.plannedSessions) : null,
        });
      } else {
        await classesService.create({
          ...formData,
          capacity: parseInt(formData.capacity),
          levelNumber: parseInt(formData.levelNumber),
          ageMin: formData.ageMin ? parseInt(formData.ageMin) : null,
          ageMax: formData.ageMax ? parseInt(formData.ageMax) : null,
          price: formData.price ? parseFloat(formData.price) : null,
          plannedSessions: formData.plannedSessions ? parseInt(formData.plannedSessions) : null,
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
      levelNumber:
        (classItem as any).levelNumber !== null && (classItem as any).levelNumber !== undefined
          ? String((classItem as any).levelNumber)
          : '',
      code: String((classItem as any).code || ''),
      logoUrl: String((classItem as any).logoUrl || ''),
      ageMin: (classItem as any).ageMin !== null && (classItem as any).ageMin !== undefined ? String((classItem as any).ageMin) : '',
      ageMax: (classItem as any).ageMax !== null && (classItem as any).ageMax !== undefined ? String((classItem as any).ageMax) : '',
      price: (classItem as any).price !== null && (classItem as any).price !== undefined ? String((classItem as any).price) : '',
      plannedSessions:
        (classItem as any).plannedSessions !== null && (classItem as any).plannedSessions !== undefined
          ? String((classItem as any).plannedSessions)
          : '',
      description: String((classItem as any).description || ''),
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

  const locations = ['MOA', 'Espace', 'SODIC', 'PalmHills'];

  // Column definitions
  const columns: Column<Class>[] = [
    {
      key: 'logo',
      label: 'Logo',
      render: (_, row) =>
        (row as any).logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={(row as any).logoUrl} alt="" className="w-8 h-8 rounded object-cover border border-gray-200" />
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
    },
    {
      key: 'name',
      label: 'Course',
      sortable: true,
      render: (_, row) => (
        <a
          href={`/dashboard/courses/details?id=${row.id}`}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            router.push(`/dashboard/courses/details?id=${row.id}`);
          }}
        >
          <HighlightedText text={row.name} query={searchTerm} />
        </a>
      ),
    },
    {
      key: 'level',
      label: 'Level',
      render: (_, row: any) => <span className="text-sm text-gray-600">{row?.levelNumber ?? '—'}</span>,
    },
    {
      key: 'code',
      label: 'Code',
      render: (_, row: any) => <span className="text-sm text-gray-600">{row?.code || '—'}</span>,
    },
    {
      key: 'sessions',
      label: '# Sessions',
      render: (_, row: any) => <span className="text-sm text-gray-600">{row?.plannedSessions ?? '—'}</span>,
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
      key: 'age',
      label: 'Age',
      render: (_, row: any) => {
        const a = row?.ageMin;
        const b = row?.ageMax;
        const txt = a != null || b != null ? `${a ?? '—'}-${b ?? '—'}` : '—';
        return <span className="text-sm text-gray-600">{txt}</span>;
      },
    },
    {
      key: 'price',
      label: 'Price',
      render: (_, row: any) => (
        <span className="text-sm text-gray-600">{row?.price != null ? `EGP ${Number(row.price).toLocaleString()}` : '—'}</span>
      ),
    },
    {
      key: 'students',
      label: 'Students',
      render: (_, row) => (
        <span className="text-sm text-gray-500">{row.students?.length || 0}</span>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (_, row: any) => <span className="text-sm text-gray-500">{String(row?.description || '').slice(0, 40) || '—'}</span>,
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
                  {editingClass ? 'Edit Course' : 'Add New Course'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Course</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="mt-1 block w-full rounded-md border border-gray-400 shadow-sm focus:border-indigo-600 focus:ring-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Location</label>
                      <select
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="mt-1 block w-full rounded-md border border-gray-400 shadow-sm focus:border-indigo-600 focus:ring-indigo-600"
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
                      <label className="block text-sm font-medium text-gray-700">Level</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={formData.levelNumber}
                        onChange={(e) => setFormData({ ...formData, levelNumber: e.target.value })}
                        className="mt-1 block w-full rounded-md border border-gray-400 shadow-sm focus:border-indigo-600 focus:ring-indigo-600"
                        placeholder="e.g. 1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Code</label>
                      <input
                        type="text"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        className="mt-1 block w-full rounded-md border border-gray-400 shadow-sm focus:border-indigo-600 focus:ring-indigo-600"
                        placeholder="e.g. PY-01"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Age From</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.ageMin}
                        onChange={(e) => setFormData({ ...formData, ageMin: e.target.value })}
                        className="mt-1 block w-full rounded-md border border-gray-400 shadow-sm focus:border-indigo-600 focus:ring-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Age To</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.ageMax}
                        onChange={(e) => setFormData({ ...formData, ageMax: e.target.value })}
                        className="mt-1 block w-full rounded-md border border-gray-400 shadow-sm focus:border-indigo-600 focus:ring-indigo-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Price (EGP)</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="mt-1 block w-full rounded-md border border-gray-400 shadow-sm focus:border-indigo-600 focus:ring-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Logo URL</label>
                      <input
                        type="url"
                        value={formData.logoUrl}
                        onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                        className="mt-1 block w-full rounded-md border border-gray-400 shadow-sm focus:border-indigo-600 focus:ring-indigo-600"
                        placeholder="https://..."
                      />
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
                        className="mt-1 block w-full rounded-md border border-gray-400 shadow-sm focus:border-indigo-600 focus:ring-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700"># of Sessions</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.plannedSessions}
                        onChange={(e) => setFormData({ ...formData, plannedSessions: e.target.value })}
                        className="mt-1 block w-full rounded-md border border-gray-400 shadow-sm focus:border-indigo-600 focus:ring-indigo-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Course Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-400 shadow-sm focus:border-indigo-600 focus:ring-indigo-600"
                      rows={3}
                      placeholder="Describe the course..."
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
        title="Courses"
        subtitle="Manage courses"
        primaryAction={{
          label: 'Add Course',
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
        emptyMessage="No courses found"
        emptyState={
          <EmptyState
            title="No courses found"
            message="Get started by creating your first course"
            action={{
              label: 'Add Course',
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
              title="Total Courses"
              value={totalClasses}
              icon={<FiBookOpen className="w-8 h-8" />}
            />
            <SummaryCard
              title="Total Students"
              value={totalStudents}
              icon={<FiUsers className="w-8 h-8" />}
            />
          </>
        }
        getRowId={(row) => row.id}
        onRowClick={(row) => {
          router.push(`/dashboard/courses/details?id=${row.id}`);
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
