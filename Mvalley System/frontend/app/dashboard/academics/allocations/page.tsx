'use client';

import { useEffect, useMemo, useState } from 'react';
import StandardListView from '@/components/StandardListView';
import { ActionButton, Column } from '@/components/DataTable';
import EmptyState from '@/components/EmptyState';
import { studentsService, classesService, parentsService, Student, Class, ParentContact, type StudentEnrollment } from '@/lib/services';
import { FiEdit, FiSave, FiX } from 'react-icons/fi';
import HighlightedText from '@/components/HighlightedText';
import { useSearchParams } from 'next/navigation';

type Draft = {
  parentId: string;
  classId: string;
};

type EnrollmentRow = {
  id: string; // enrollmentId
  enrollmentId: string;
  studentId: string;
  student: Student;
  enrollment: StudentEnrollment;
  parentId?: string | null;
  parent?: any;
  classId?: string | null;
  class?: any;
};

export default function AllocationsPage() {
  const searchParams = useSearchParams();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [parents, setParents] = useState<ParentContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({ parentId: '', classId: '' });
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [s, c, p] = await Promise.all([
        studentsService.getAll(),
        classesService.getAll(),
        parentsService.getAll(),
      ]);
      setStudents(Array.isArray(s.data) ? s.data : []);
      setClasses(Array.isArray(c.data) ? c.data : []);
      setParents(Array.isArray(p.data) ? p.data : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load allocations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // If coming from a class quick-action, preselect that class in the row editor when you click "Edit row"
  const preselectedClassId = searchParams?.get('classId') || '';

  const parentLabel = (p: ParentContact) => `${p.firstName} ${p.lastName} (${p.phone})`;

  const columns: Column<EnrollmentRow>[] = [
    {
      key: 'student',
      label: 'Student',
      render: (_, row) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">
            <HighlightedText
              text={`${row.student.firstName} ${row.student.lastName}`}
              query={searchTerm}
            />
          </div>
          <div className="text-gray-500">
            <HighlightedText text={row.student.phone || row.student.email || '-'} query={searchTerm} />
          </div>
        </div>
      ),
    },
    {
      key: 'parent',
      label: 'Contact (Parent)',
      render: (_, row) => {
        const isEditing = editingId === row.enrollmentId;
        if (!isEditing) {
          return (
            <span className="text-sm text-gray-700">
              {row.student.parent ? (
                <HighlightedText
                  text={`${row.student.parent.firstName} ${row.student.parent.lastName}`}
                  query={searchTerm}
                />
              ) : (
                '-'
              )}
            </span>
          );
        }
        return (
          <select
            value={draft.parentId}
            onChange={(e) => setDraft((d) => ({ ...d, parentId: e.target.value }))}
            className="w-full rounded-md border-gray-300 text-sm"
          >
            <option value="">— Unassigned —</option>
            {parents.map((p) => (
              <option key={p.id} value={p.id}>
                {parentLabel(p)}
              </option>
            ))}
          </select>
        );
      },
    },
    {
      key: 'course',
      label: 'Course / Level',
      render: (_, row) => (
        <span className="text-sm text-gray-700">
          <HighlightedText
            text={`${row.enrollment?.courseLevel?.course?.name || 'Course'} — ${row.enrollment?.courseLevel?.name || 'Level'}`}
            query={searchTerm}
          />
        </span>
      ),
    },
    {
      key: 'class',
      label: 'Group (Class)',
      render: (_, row) => {
        const isEditing = editingId === row.enrollmentId;
        if (!isEditing) {
          return (
            <span className="text-sm text-gray-700">
              <HighlightedText text={row.enrollment?.class?.name || '-'} query={searchTerm} />
            </span>
          );
        }
        return (
          <select
            value={draft.classId}
            onChange={(e) => setDraft((d) => ({ ...d, classId: e.target.value }))}
            className="w-full rounded-md border-gray-300 text-sm"
          >
            <option value="">— Unassigned —</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({(c as any).locationName || c.location})
              </option>
            ))}
          </select>
        );
      },
    },
    {
      key: 'branch',
      label: 'Branch',
      render: (_, row) => (
        <span className="text-sm text-gray-600">
          <HighlightedText text={row.enrollment?.class?.locationName || row.enrollment?.class?.location || '-'} query={searchTerm} />
        </span>
      ),
    },
    {
      key: 'instructor',
      label: 'Instructor',
      render: (_, row) => (
        <span className="text-sm text-gray-600">
          {row.enrollment?.class?.instructor?.user ? (
            <HighlightedText
              text={`${row.enrollment.class.instructor.user.firstName} ${row.enrollment.class.instructor.user.lastName}`}
              query={searchTerm}
            />
          ) : (
            '-'
          )}
        </span>
      ),
    },
  ];

  const actions = (row: EnrollmentRow): ActionButton[] => {
    const isEditing = editingId === row.enrollmentId;
    if (!isEditing) {
      return [
        {
          label: 'Edit row',
          icon: <FiEdit className="w-4 h-4" />,
          onClick: () => {
            setEditingId(row.enrollmentId);
            setDraft({
              parentId: row.student.parentId || '',
              classId: row.enrollment.classId || preselectedClassId || '',
            });
          },
        },
      ];
    }
    return [
      {
        label: 'Save',
        icon: <FiSave className="w-4 h-4" />,
        onClick: async () => {
          if (!row.enrollmentId) return;
          setSaving(true);
          setError('');
          try {
            // Parent is on Student
            await studentsService.update(row.studentId, {
              parentId: draft.parentId ? draft.parentId : null,
            });
            // Allocation is on Enrollment
            await studentsService.updateEnrollment(row.enrollmentId, {
              classId: draft.classId ? draft.classId : null,
            });
            setEditingId(null);
            await fetchAll();
          } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to save allocation');
          } finally {
            setSaving(false);
          }
        },
      },
      {
        label: 'Cancel',
        icon: <FiX className="w-4 h-4" />,
        onClick: () => {
          setEditingId(null);
          setError('');
        },
      },
    ];
  };

  const rows = useMemo(() => {
    const enrollmentRows: EnrollmentRow[] = [];
    for (const s of students) {
      const ens = Array.isArray(s.enrollments) ? s.enrollments : [];
      for (const e of ens) {
        enrollmentRows.push({
          id: e.id,
          enrollmentId: e.id,
          studentId: s.id,
          student: s,
          enrollment: e,
          parentId: s.parentId,
          parent: s.parent,
          classId: e.classId,
          class: e.class,
        });
      }
      // If student has no enrollments yet, keep a row representing legacy class assignment
      if (ens.length === 0) {
        enrollmentRows.push({
          id: `legacy_${s.id}`,
          enrollmentId: `legacy_${s.id}`,
          studentId: s.id,
          student: s,
          enrollment: {
            id: `legacy_${s.id}` as any,
            studentId: s.id,
            courseLevelId: '' as any,
            status: 'legacy',
            classId: s.classId,
            class: s.class,
            courseLevel: { course: { name: 'Legacy' }, name: 'No enrollment' },
            createdAt: '' as any,
            updatedAt: '' as any,
          } as any,
          parentId: s.parentId,
          parent: s.parent,
          classId: s.classId,
          class: s.class,
        });
      }
    }

    const q = searchTerm.trim().toLowerCase();
    if (!q) return enrollmentRows;
    return enrollmentRows.filter((r) => {
      const s = r.student;
      const fullName = `${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase();
      const phone = (s.phone || '').toLowerCase();
      const email = (s.email || '').toLowerCase();
      const parentName = s.parent ? `${s.parent.firstName || ''} ${s.parent.lastName || ''}`.trim().toLowerCase() : '';
      const courseName = (r.enrollment?.courseLevel?.course?.name || '').toLowerCase();
      const levelName = (r.enrollment?.courseLevel?.name || '').toLowerCase();
      const className = (r.enrollment?.class?.name || '').toLowerCase();
      const branch = (r.enrollment?.class?.locationName || r.enrollment?.class?.location || '').toLowerCase();
      return (
        fullName.includes(q) ||
        phone.includes(q) ||
        email.includes(q) ||
        parentName.includes(q) ||
        courseName.includes(q) ||
        levelName.includes(q) ||
        className.includes(q) ||
        branch.includes(q)
      );
    });
  }, [students, searchTerm]);

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}
      <StandardListView
        title="Allocations"
        subtitle="Assign each enrollment (Course Level) to a Group (Class) inline—students can have multiple courses."
        data={rows}
        columns={columns}
        actions={actions}
        loading={loading || saving}
        getRowId={(r) => r.enrollmentId}
        searchPlaceholder="Search student, parent, phone, class, branch..."
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        emptyState={
          <EmptyState
            title="No students yet"
            message="Create students first, then allocate them to contacts and classes."
          />
        }
        onRowClick={(row) => {
          if (editingId) return;
          // keep current behavior: details page
          window.location.href = `/dashboard/students/details?id=${encodeURIComponent(row.id)}`;
        }}
      />
    </div>
  );
}


