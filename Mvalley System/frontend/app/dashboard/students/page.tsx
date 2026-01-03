'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { coursesService, studentsService, Student, parentsService, classesService, type Class } from '@/lib/services';
import StandardListView, { FilterConfig } from '@/components/StandardListView';
import { Column, ActionButton } from '@/components/DataTable';
import SummaryCard from '@/components/SummaryCard';
import EmptyState from '@/components/EmptyState';
import { downloadExport } from '@/lib/export';
import { FiPlus, FiEdit, FiTrash2, FiUsers } from 'react-icons/fi';
import StatusBadge from '@/components/settings/StatusBadge';
import HighlightedText from '@/components/HighlightedText';

export default function StudentsPage() {
  const toErrorString = (err: any, fallback: string) => {
    const msg = err?.response?.data?.message ?? err?.message ?? err;
    if (typeof msg === 'string') return msg;
    if (Array.isArray(msg)) return msg.filter(Boolean).join(', ') || fallback;
    if (msg && typeof msg === 'object') {
      const nested = (msg as any).message;
      if (typeof nested === 'string') return nested;
      if (Array.isArray(nested)) return nested.filter(Boolean).join(', ') || fallback;
      try {
        return JSON.stringify(msg);
      } catch {
        return fallback;
      }
    }
    return fallback;
  };

  const router = useRouter();
  const searchParams = useSearchParams();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [unallocatedPaidCount, setUnallocatedPaidCount] = useState<number>(0);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    status: 'active',
    email: '',
    phone: '',
  });
  const [parentLookup, setParentLookup] = useState<{ found: boolean; parent?: any } | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [parentForm, setParentForm] = useState({ firstName: '', lastName: '', email: '' });

  const [levels, setLevels] = useState<any[]>([]);
  const [courseGroups, setCourseGroups] = useState<Class[]>([]);
  const [selectedCourseGroupIds, setSelectedCourseGroupIds] = useState<string[]>([]);
  const [phoneGate, setPhoneGate] = useState<'empty' | 'checking' | 'found' | 'new'>('empty');

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

  useEffect(() => {
    // Support deep-link edit: /dashboard/students?editId=...
    const editId = searchParams?.get('editId');
    if (!editId) return;
    const found = students.find((s) => s.id === editId);
    if (!found) return;
    handleEdit(found);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, students]);

  useEffect(() => {
    // Load available courses/levels
    coursesService
      .listLevels()
      .then((res: any) => setLevels(res.data || []))
      .catch(() => setLevels([]));
  }, []);

  useEffect(() => {
    // Load actual course groups (what you see in /dashboard/courses)
    classesService
      .getAll()
      .then((res: any) => setCourseGroups(res.data || []))
      .catch(() => setCourseGroups([]));
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await studentsService.getAll();
      setStudents(response.data);
      setError('');
    } catch (err: any) {
      setError(toErrorString(err, 'Failed to load students'));
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
          learningTrack: 'general',
          age: parseInt(formData.age),
        });
      } else {
        if (!formData.phone.trim()) {
          setError('Phone is required');
          return;
        }
        if (phoneGate === 'empty' || phoneGate === 'checking') {
          setError('Please enter a phone number and wait for verification.');
          return;
        }

        let parentId = selectedParentId || undefined;
        if (phoneGate === 'new') {
          if (!parentForm.firstName.trim() || !parentForm.lastName.trim()) {
            setError('Parent first name and last name are required for a new phone number.');
            return;
          }
          const createdParent = await parentsService.create({
            firstName: parentForm.firstName.trim(),
            lastName: parentForm.lastName.trim(),
            phone: formData.phone.trim(),
            email: parentForm.email.trim() || undefined,
          });
          parentId = createdParent.data?.id;
          setSelectedParentId(parentId || '');
        }

        const created = await studentsService.create({
          ...formData,
          learningTrack: 'general',
          age: parseInt(formData.age),
          parentId,
        });

        const createdStudentId = (created as any)?.data?.id;
        if (createdStudentId && selectedCourseGroupIds.length > 0) {
          // Map each selected course-group (class) to a matching CourseLevel (by name). If missing, create Course + Level 1.
          for (const classId of selectedCourseGroupIds) {
            const courseGroup = courseGroups.find((c) => c.id === classId);
            if (!courseGroup?.name) continue;

            let level = levels.find(
              (l: any) => String(l?.course?.name || '').trim() === courseGroup.name.trim(),
            );
            if (!level) {
              const createdCourse = await coursesService.create({
                name: courseGroup.name.trim(),
                isActive: true,
              });
              const createdLevel = await coursesService.createLevel({
                courseId: createdCourse.data.id,
                name: 'Level 1',
                sortOrder: 1,
                isActive: true,
              });
              level = { ...createdLevel.data, course: createdCourse.data };
              setLevels((prev) => [...prev, level]);
            }

            await studentsService.addEnrollment(createdStudentId, {
              courseLevelId: level.id,
              classId: courseGroup.id,
            });
          }
        }
      }
      setShowForm(false);
      setEditingStudent(null);
      setFormData({
        firstName: '',
        lastName: '',
        age: '',
        status: 'active',
        email: '',
        phone: '',
      });
      setParentLookup(null);
      setSelectedParentId('');
      setParentForm({ firstName: '', lastName: '', email: '' });
      setSelectedCourseGroupIds([]);
      setPhoneGate('empty');
      fetchStudents();
    } catch (err: any) {
      setError(toErrorString(err, 'Failed to save student'));
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      firstName: student.firstName,
      lastName: student.lastName,
      age: student.age.toString(),
      status: student.status,
      email: student.email || '',
      phone: student.phone || '',
    });
    setParentLookup(null);
    setSelectedParentId(student.parentId || '');
    setParentForm({
      firstName: student.parent?.firstName || '',
      lastName: student.parent?.lastName || '',
      email: student.parent?.email || '',
    });
    setSelectedCourseGroupIds(
      (student.enrollments || []).map((e: any) => e.classId).filter(Boolean),
    );
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
      setPhoneGate('empty');
      return;
    }
    setCheckingPhone(true);
    setPhoneGate('checking');
    t = setTimeout(() => {
      parentsService
        .lookupByPhone(phone)
        .then((res: any) => {
          const data = res?.data;
          setParentLookup(data);
          if (data?.found && data?.parent?.id) {
            setSelectedParentId(data.parent.id);
            setParentForm({
              firstName: data.parent?.firstName || '',
              lastName: data.parent?.lastName || '',
              email: data.parent?.email || '',
            });
            setPhoneGate('found');
          } else {
            setSelectedParentId('');
            setParentForm({ firstName: '', lastName: '', email: '' });
            setPhoneGate('new');
          }
        })
        .catch(() => {
          setParentLookup(null);
          setSelectedParentId('');
          setPhoneGate('new');
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
      setError(toErrorString(err, 'Failed to delete student'));
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
      return matchesSearch && matchesStatus;
    });
  }, [students, searchTerm, statusFilter]);

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
      key: 'courses',
      label: 'Courses',
      render: (_, row) => (
        <span className="text-sm text-gray-500">{(row.enrollments || []).length}</span>
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
      label: 'Course',
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
                  {/* Phone-first gate */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Parent Phone (required)
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="e.g. 010xxxxxxxx"
                    />
                    {!editingStudent && (
                      <div className="mt-2 text-xs text-gray-600">
                        {checkingPhone ? (
                          <span>Checking phone…</span>
                        ) : phoneGate === 'found' ? (
                          <div className="bg-green-50 border border-green-200 rounded p-2">
                            <div className="font-medium text-green-800">
                              Existing parent found: {parentLookup?.parent?.firstName}{' '}
                              {parentLookup?.parent?.lastName}
                            </div>
                            <div className="text-green-700">
                              Students: {(parentLookup?.parent?.students || [])
                                .map((s: any) => `${s.firstName} ${s.lastName}`)
                                .join(', ') || '—'}
                            </div>
                          </div>
                        ) : phoneGate === 'new' && formData.phone.trim().length >= 7 ? (
                          <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                            <div className="font-medium text-yellow-800">New parent phone</div>
                            <div className="text-yellow-700">
                              Please enter parent details below.
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>

                  {/* Parent details (for new phone numbers) */}
                  {!editingStudent && phoneGate === 'new' && (
                    <div className="rounded-md border border-gray-200 p-3 bg-gray-50 space-y-3">
                      <div className="text-sm font-medium text-gray-900">Parent Details</div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Parent First Name</label>
                          <input
                            type="text"
                            required
                            value={parentForm.firstName}
                            onChange={(e) => setParentForm({ ...parentForm, firstName: e.target.value })}
                            className="mt-1 block w-full rounded-md border border-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Parent Last Name</label>
                          <input
                            type="text"
                            required
                            value={parentForm.lastName}
                            onChange={(e) => setParentForm({ ...parentForm, lastName: e.target.value })}
                            className="mt-1 block w-full rounded-md border border-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Parent Email (optional)</label>
                        <input
                          type="email"
                          value={parentForm.email}
                          onChange={(e) => setParentForm({ ...parentForm, email: e.target.value })}
                          className="mt-1 block w-full rounded-md border border-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Student fields - disabled until phone is verified */}
                  {(() => {
                    const phoneOk =
                      editingStudent ||
                      ((phoneGate === 'found' || phoneGate === 'new') && !checkingPhone);
                    const parentOk =
                      editingStudent ||
                      (phoneGate === 'found' ? !!selectedParentId : phoneGate === 'new'
                        ? !!parentForm.firstName.trim() && !!parentForm.lastName.trim()
                        : false);
                    const enabled = phoneOk && parentOk;

                    return (
                      <fieldset disabled={!enabled} className={!enabled ? 'opacity-60' : ''}>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Student First Name</label>
                            <input
                              type="text"
                              required
                              value={formData.firstName}
                              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                              className="mt-1 block w-full rounded-md border border-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Student Last Name</label>
                            <input
                              type="text"
                              required
                              value={formData.lastName}
                              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                              className="mt-1 block w-full rounded-md border border-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Age</label>
                            <input
                              type="number"
                              required
                              min="5"
                              max="18"
                              value={formData.age}
                              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                              className="mt-1 block w-full rounded-md border border-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Student Email (optional)</label>
                            <input
                              type="email"
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              className="mt-1 block w-full rounded-md border border-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                          </div>
                        </div>

                        {/* Courses (replaces Track) */}
                        <div className="mt-4">
                          <div className="flex items-center justify-between">
                            <label className="block text-sm font-medium text-gray-700">
                              Courses (one student can have multiple)
                            </label>
                            <button
                              type="button"
                              onClick={() => router.push('/dashboard/courses')}
                              className="text-xs text-indigo-600 hover:text-indigo-900"
                            >
                              Manage Courses →
                            </button>
                          </div>
                          {courseGroups.length === 0 ? (
                            <div className="mt-2 text-sm text-gray-500">
                              No courses found yet. Add a course in /dashboard/courses and it will appear here.
                            </div>
                          ) : (
                            <div className="mt-2 max-h-40 overflow-auto rounded-md border border-gray-200 bg-white p-2 space-y-2">
                              {courseGroups.map((cg: any) => {
                                const label = `${cg?.name || 'Course'}${cg?.location ? ` (${cg.location})` : ''}`;
                                const checked = selectedCourseGroupIds.includes(cg.id);
                                return (
                                  <label key={cg.id} className="flex items-center gap-2 text-sm text-gray-700">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={(e) => {
                                        const next = e.target.checked
                                          ? Array.from(new Set([...selectedCourseGroupIds, cg.id]))
                                          : selectedCourseGroupIds.filter((x) => x !== cg.id);
                                        setSelectedCourseGroupIds(next);
                                      }}
                                    />
                                    {label}
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700">Status</label>
                          <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="mt-1 block w-full rounded-md border border-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          >
                            <option value="active">Active</option>
                            <option value="paused">Paused</option>
                            <option value="finished">Finished</option>
                          </select>
                        </div>
                      </fieldset>
                    );
                  })()}

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
              status: 'active',
              email: '',
              phone: '',
            });
            setParentLookup(null);
            setSelectedParentId('');
            setParentForm({ firstName: '', lastName: '', email: '' });
            setSelectedCourseGroupIds([]);
            setPhoneGate('empty');
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
