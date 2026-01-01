'use client';

import { useEffect, useMemo, useState } from 'react';
import StandardListView from '@/components/StandardListView';
import { ActionButton, Column } from '@/components/DataTable';
import EmptyState from '@/components/EmptyState';
import { studentsService, classesService, parentsService, Student, Class, ParentContact } from '@/lib/services';
import { FiEdit, FiSave, FiX } from 'react-icons/fi';

type Draft = {
  parentId: string;
  classId: string;
};

export default function AllocationsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [parents, setParents] = useState<ParentContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const parentLabel = (p: ParentContact) => `${p.firstName} ${p.lastName} (${p.phone})`;

  const columns: Column<Student>[] = [
    {
      key: 'student',
      label: 'Student',
      render: (_, row) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">
            {row.firstName} {row.lastName}
          </div>
          <div className="text-gray-500">{row.phone || row.email || '-'}</div>
        </div>
      ),
    },
    {
      key: 'parent',
      label: 'Contact (Parent)',
      render: (_, row) => {
        const isEditing = editingId === row.id;
        if (!isEditing) {
          return (
            <span className="text-sm text-gray-700">
              {row.parent ? `${row.parent.firstName} ${row.parent.lastName}` : '-'}
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
      key: 'class',
      label: 'Group (Class)',
      render: (_, row) => {
        const isEditing = editingId === row.id;
        if (!isEditing) {
          return <span className="text-sm text-gray-700">{row.class?.name || '-'}</span>;
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
                {c.name} ({c.location})
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
        <span className="text-sm text-gray-600">{row.class?.location || '-'}</span>
      ),
    },
    {
      key: 'instructor',
      label: 'Instructor',
      render: (_, row) => (
        <span className="text-sm text-gray-600">
          {row.class?.instructor?.user
            ? `${row.class.instructor.user.firstName} ${row.class.instructor.user.lastName}`
            : '-'}
        </span>
      ),
    },
  ];

  const actions = (row: Student): ActionButton[] => {
    const isEditing = editingId === row.id;
    if (!isEditing) {
      return [
        {
          label: 'Edit row',
          icon: <FiEdit className="w-4 h-4" />,
          onClick: () => {
            setEditingId(row.id);
            setDraft({
              parentId: row.parentId || '',
              classId: row.classId || '',
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
          if (!row.id) return;
          setSaving(true);
          setError('');
          try {
            await studentsService.update(row.id, {
              parentId: draft.parentId || undefined,
              classId: draft.classId || undefined,
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

  const rows = useMemo(() => students, [students]);

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}
      <StandardListView
        title="Allocations"
        subtitle="Assign each student to a Contact (Parent) and a Group (Class) inline—no wizard."
        data={rows}
        columns={columns}
        actions={actions}
        loading={loading || saving}
        getRowId={(r) => r.id}
        emptyState={
          <EmptyState
            title="No students yet"
            message="Create students first, then allocate them to contacts and classes."
          />
        }
        searchPlaceholder="Search students..."
        onRowClick={(row) => {
          if (editingId) return;
          // keep current behavior: details page
          window.location.href = `/dashboard/students/details?id=${encodeURIComponent(row.id)}`;
        }}
      />
    </div>
  );
}


