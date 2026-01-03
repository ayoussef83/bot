'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { studentsService, Student, parentsService } from '@/lib/services';
import StandardListView, { FilterConfig } from '@/components/StandardListView';
import { Column, ActionButton } from '@/components/DataTable';
import SummaryCard from '@/components/SummaryCard';
import EmptyState from '@/components/EmptyState';
import { downloadExport } from '@/lib/export';
import { FiPlus, FiEdit, FiTrash2, FiUsers } from 'react-icons/fi';
import StatusBadge from '@/components/settings/StatusBadge';
import HighlightedText from '@/components/HighlightedText';

export default function StudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [trackFilter, setTrackFilter] = useState('');
  const [unallocatedPaidCount, setUnallocatedPaidCount] = useState<number>(0);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    learningTrack: 'general',
    status: 'active',
    email: '',
    phone: '',
  });
  const [parentLookup, setParentLookup] = useState<{ found: boolean; parent?: any } | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [checkingPhone, setCheckingPhone] = useState(false);

  useEffect(() => {
    fetchStudents();
    studentsService
      .getUnallocatedPaidInsight()
      .then((res: any) => {
        setUnallocatedPaidCount(Number(res?.data?.count || 0));
      })
      .catch(() => {
        // Non-blocking card
        setUnallocatedPaidCount(0);
      });
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await studentsService.getAll();
      setStudents(response.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await studentsService.update(editingStudent.id, {
          ...formData,
          age: parseInt(formData.age),
        });
      } else {
        await studentsService.create({
          ...formData,
          age: parseInt(formData.age),
          parentId: selectedParentId || undefined,
        });
      }
      setShowForm(false);
      setEditingStudent(null);
      setFormData({
        firstName: '',
        lastName: '',
        age: '',
        learningTrack: 'general',
        status: 'active',
        email: '',
        phone: '',
      });
      setParentLookup(null);
      setSelectedParentId('');
      fetchStudents();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save student');
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      firstName: student.firstName,
      lastName: student.lastName,
      age: student.age.toString(),
      learningTrack: student.learningTrack,
      status: student.status,
      email: student.email || '',
      phone: student.phone || '',
    });
    setParentLookup(null);
    setSelectedParentId(student.parentId || '');
    setShowForm(true);
  };

  // Phone lookup (only when creating)
  useEffect(() => {
    let t: any;
    if (!showForm || editingStudent) return;
    const phone = (formData.phone || '').trim();
    if (phone.length < 7) {
      setParentLookup(null);
      setSelectedParentId('');
      return;
    }
    setCheckingPhone(true);
    t = setTimeout(() => {
      parentsService
        .lookupByPhone(phone)
        .then((res: any) => {
          const data = res?.data;
          setParentLookup(data);
          if (data?.found && data?.parent?.id) setSelectedParentId(data.parent.id);
          else setSelectedParentId('');
        })
        .catch(() => {
          setParentLookup(null);
          setSelectedParentId('');
        })
        .finally(() => setCheckingPhone(false));
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.phone, showForm, editingStudent]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    try {
      await studentsService.delete(id);
      fetchStudents();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete student');
    }
  };

  // Filter and search students
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        searchTerm === '' ||
        `${student.firstName} ${student.lastName}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.phone?.includes(searchTerm);

      const matchesStatus = statusFilter === '' || student.status === statusFilter;
      const matchesTrack = trackFilter === '' || student.learningTrack === trackFilter;

      return matchesSearch && matchesStatus && matchesTrack;
    });
  }, [students, searchTerm, statusFilter, trackFilter]);

  // Column definitions
  const columns: Column<Student>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (_, row) => (
        <a
          href={`/dashboard/students/details?id=${encodeURIComponent(row.id)}`}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            router.push(`/dashboard/students/details?id=${encodeURIComponent(row.id)}`);
          }}
        >
          <HighlightedText text={`${row.firstName} ${row.lastName}`} query={searchTerm} />
        </a>
      ),
    },
    {
      key: 'age',
      label: 'Age',
      sortable: true,
      render: (value) => <span className="text-sm text-gray-500">{value}</span>,
    },
    {
      key: 'learningTrack',
      label: 'Track',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-500 capitalize">{value}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => {
        const statusMap: { [key: string]: 'active' | 'inactive' | 'warning' } = {
          active: 'active',
          paused: 'warning',
          finished: 'inactive',
        };
        return <StatusBadge status={statusMap[value] || 'inactive'} label={value} />;
      },
    },
    {
      key: 'class',
      label: 'Class',
      render: (_, row) => (
        <span className="text-sm text-gray-500">
          <HighlightedText text={row.class?.name || '-'} query={searchTerm} />
        </span>
      ),
    },
  ];

  // Action buttons
  const actions = (row: Student): ActionButton[] => [
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
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'paused', label: 'Paused' },
        { value: 'finished', label: 'Finished' },
      ],
      value: statusFilter,
      onChange: setStatusFilter,
    },
    {
      key: 'track',
      label: 'Learning Track',
      type: 'select',
      options: [
        { value: 'AI', label: 'AI' },
        { value: 'robotics', label: 'Robotics' },
        { value: 'coding', label: 'Coding' },
        { value: 'general', label: 'General' },
      ],
      value: trackFilter,
      onChange: setTrackFilter,
    },
  ];

  // Summary statistics
  const activeStudents = filteredStudents.filter((s) => s.status === 'active').length;
  const totalStudents = filteredStudents.length;

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Student Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowForm(false)}></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h2 className="text-xl font-semibold mb-4">
                  {editingStudent ? 'Edit Student' : 'Add New Student'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">First Name</label>
                      <input
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Last Name</label>
                      <input
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Age</label>
                      <input
                        type="number"
                        required
                        min="5"
                        max="18"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Learning Track</label>
                      <select
                        value={formData.learningTrack}
                        onChange={(e) => setFormData({ ...formData, learningTrack: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value="general">General</option>
                        <option value="AI">AI</option>
                        <option value="robotics">Robotics</option>
                        <option value="coding">Coding</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                      {!editingStudent && (
                        <div className="mt-2 text-xs text-gray-500">
                          {checkingPhone ? (
                            <span>Checking parent by phone…</span>
                          ) : parentLookup?.found ? (
                            <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                              <div className="font-medium text-yellow-800">
                                Existing parent found: {parentLookup.parent?.firstName}{' '}
                                {parentLookup.parent?.lastName}
                              </div>
                              <div className="text-yellow-700">
                                Kids: {(parentLookup.parent?.students || [])
                                  .map((s: any) => `${s.firstName} ${s.lastName}`)
                                  .join(', ') || '—'}
                              </div>
                              <label className="mt-2 inline-flex items-center gap-2 text-yellow-900">
                                <input
                                  type="checkbox"
                                  checked={!!selectedParentId}
                                  onChange={(e) =>
                                    setSelectedParentId(e.target.checked ? parentLookup.parent?.id : '')
                                  }
                                />
                                Link new student to this parent
                              </label>
                            </div>
                          ) : formData.phone.trim().length >= 7 ? (
                            <span>No parent found for this phone.</span>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="finished">Finished</option>
                    </select>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <button
                      type="submit"
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                    >
                      {editingStudent ? 'Update' : 'Create'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingStudent(null);
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
        title="Students"
        subtitle="Manage student records and enrollment"
        primaryAction={{
          label: 'Add Student',
          onClick: () => {
            setShowForm(true);
            setEditingStudent(null);
            setFormData({
              firstName: '',
              lastName: '',
              age: '',
              learningTrack: 'general',
              status: 'active',
              email: '',
              phone: '',
            });
          },
          icon: <FiPlus className="w-4 h-4" />,
        }}
        searchPlaceholder="Search by name, email, or phone..."
        onSearch={setSearchTerm}
        searchValue={searchTerm}
        filters={filters}
        columns={columns}
        data={filteredStudents}
        loading={loading}
        actions={actions}
        emptyMessage="No students found"
        emptyState={
          <EmptyState
            title="No students found"
            message="Get started by adding your first student"
            action={{
              label: 'Add Student',
              onClick: () => {
                setShowForm(true);
                setEditingStudent(null);
              },
            }}
          />
        }
        summaryCards={
          <>
            <SummaryCard
              title="Total Students"
              value={totalStudents}
              icon={<FiUsers className="w-8 h-8" />}
            />
            <SummaryCard
              title="Active Students"
              value={activeStudents}
              variant="success"
              icon={<FiUsers className="w-8 h-8" />}
            />
            <SummaryCard
              title="Inactive Students"
              value={totalStudents - activeStudents}
              variant="warning"
              icon={<FiUsers className="w-8 h-8" />}
            />
            <SummaryCard
              title="Paid, Unallocated"
              value={unallocatedPaidCount}
              variant={unallocatedPaidCount > 0 ? 'danger' : 'default'}
              subtitle="Students with payments but no class"
              icon={<FiUsers className="w-8 h-8" />}
              onClick={() => router.push('/dashboard/academics/allocations')}
            />
          </>
        }
        getRowId={(row) => row.id}
        onRowClick={(row) => {
          router.push(`/dashboard/students/details?id=${encodeURIComponent(row.id)}`);
        }}
      />

      {/* Export Buttons */}
      <div className="flex justify-end gap-2">
        <button
          onClick={() => downloadExport('students', 'xlsx')}
          className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 text-sm font-medium"
        >
          Export Excel
        </button>
        <button
          onClick={() => downloadExport('students', 'pdf')}
          className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 text-sm font-medium"
        >
          Export PDF
        </button>
      </div>
    </div>
  );
}
