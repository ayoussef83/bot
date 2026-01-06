'use client';

import { useEffect, useMemo, useState } from 'react';
import StandardListView from '@/components/StandardListView';
import { ActionButton, Column } from '@/components/DataTable';
import EmptyState from '@/components/EmptyState';
import {
  studentsService,
  classesService,
  groupsService,
  roomsService,
  teachingSlotsService,
  Student,
  Class,
  type StudentEnrollment,
  type Group,
  type Room,
  type TeachingSlot,
} from '@/lib/services';
import { FiEdit, FiSave, FiX } from 'react-icons/fi';
import HighlightedText from '@/components/HighlightedText';
import { useSearchParams } from 'next/navigation';

type Draft = {
  classId: string;
  groupId: string;
  roomId: string;
  teachingSlotId: string;
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
  const [groups, setGroups] = useState<Group[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [teachingSlots, setTeachingSlots] = useState<TeachingSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({ classId: '', groupId: '', roomId: '', teachingSlotId: '' });
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [s, c, g, r, ts] = await Promise.all([
        studentsService.getAll(),
        classesService.getAll(),
        groupsService.getAll(),
        roomsService.getAll(),
        teachingSlotsService.getAll(),
      ]);
      setStudents(Array.isArray(s.data) ? s.data : []);
      setClasses(Array.isArray(c.data) ? c.data : []);
      setGroups(Array.isArray(g.data) ? g.data : []);
      setRooms(Array.isArray(r.data) ? r.data : []);
      setTeachingSlots(Array.isArray(ts.data) ? ts.data : []);
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

  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const groupMembersMap = useMemo(() => {
    const map = new Map<string, Student[]>();
    for (const s of students as any[]) {
      const ens = Array.isArray(s?.enrollments) ? s.enrollments : [];
      for (const e of ens) {
        const gid = String(e?.groupId || '').trim();
        if (!gid) continue;
        const arr = map.get(gid) || [];
        arr.push(s as any);
        map.set(gid, arr);
      }
    }
    return map;
  }, [students]);

  const GroupMembersVisual = ({ groupId }: { groupId: string }) => {
    const members = groupMembersMap.get(groupId) || [];
    const top = members.slice(0, 3);
    const rest = members.length - top.length;
    if (!members.length) return null;
    return (
      <div className="flex items-center gap-1 mt-1">
        {top.map((m: any) => {
          const initials = `${String(m.firstName || '').slice(0, 1)}${String(m.lastName || '').slice(0, 1)}`.toUpperCase();
          return (
            <div
              key={m.id}
              className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-semibold border border-indigo-200"
              title={`${m.firstName} ${m.lastName}`}
            >
              {initials}
            </div>
          );
        })}
        {rest > 0 && <div className="text-xs text-gray-500">+{rest}</div>}
      </div>
    );
  };

  const columns: Column<EnrollmentRow>[] = [
    {
      key: 'student',
      label: 'Student',
      render: (_, row) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">
            <a
              href={`/dashboard/students/details?id=${encodeURIComponent(row.studentId)}`}
              className="text-indigo-600 hover:text-indigo-900"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = `/dashboard/students/details?id=${encodeURIComponent(row.studentId)}`;
              }}
            >
              <HighlightedText
                text={`${row.student.firstName} ${row.student.lastName}`}
                query={searchTerm}
              />
            </a>
          </div>
          <div className="text-gray-500">
            <HighlightedText text={row.student.phone || row.student.email || '-'} query={searchTerm} />
          </div>
        </div>
      ),
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
      key: 'group',
      label: 'Group',
      render: (_, row) => {
        const isEditing = editingId === row.enrollmentId;
        if (!isEditing) {
          const gid = String((row.enrollment as any)?.groupId || (row.enrollment as any)?.group?.id || '').trim();
          return (
            <span className="text-sm text-gray-700">
              <HighlightedText text={(row.enrollment as any)?.group?.name || '-'} query={searchTerm} />
              {gid ? <GroupMembersVisual groupId={gid} /> : null}
            </span>
          );
        }

        const levelId = row.enrollment?.courseLevelId;
        const options = levelId ? groups.filter((gg: any) => gg.courseLevelId === levelId) : groups;

        return (
          <select
            value={draft.groupId}
            onChange={(e) => {
              const nextGroupId = e.target.value;
              const selected = groups.find((gg) => gg.id === nextGroupId) as any;
              setDraft((d) => ({
                ...d,
                groupId: nextGroupId,
                classId: selected?.defaultClassId ? String(selected.defaultClassId) : d.classId,
              }));
            }}
            className="w-full rounded-md border-gray-300 text-sm"
          >
            <option value="">— None —</option>
            {options.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        );
      },
    },
    {
      key: 'class',
      label: 'Course Group',
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
      key: 'room',
      label: 'Room',
      render: (_, row) => {
        const isEditing = editingId === row.enrollmentId;
        const selectedClass: any = isEditing ? classes.find((c: any) => c.id === draft.classId) : row.enrollment?.class;
        const currentRoomId = String(selectedClass?.roomId || '');
        const currentRoom = rooms.find((r: any) => String(r.id) === currentRoomId);

        if (!isEditing) {
          return <span className="text-sm text-gray-600">{currentRoom?.name || '—'}</span>;
        }

        return (
          <select
            value={draft.roomId || currentRoomId || ''}
            onChange={(e) => setDraft((d) => ({ ...d, roomId: e.target.value, teachingSlotId: '' }))}
            className="w-full rounded-md border-gray-300 text-sm"
          >
            <option value="">Select…</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.location}) • cap {r.capacity}
              </option>
            ))}
          </select>
        );
      },
    },
    {
      key: 'slot',
      label: 'Room available slot',
      render: (_, row) => {
        const isEditing = editingId === row.enrollmentId;
        const selectedClass: any = isEditing ? classes.find((c: any) => c.id === draft.classId) : row.enrollment?.class;
        const currentSlotId = String(selectedClass?.teachingSlotId || '');
        const currentSlot = teachingSlots.find((ts: any) => String(ts.id) === currentSlotId);

        if (!isEditing) {
          if (!currentSlot) return <span className="text-sm text-gray-500">—</span>;
          return (
            <span className="text-sm text-gray-600">
              {DOW[currentSlot.dayOfWeek]} {currentSlot.startTime}–{currentSlot.endTime}
            </span>
          );
        }

        const levelId = row.enrollment?.courseLevelId;
        const options = teachingSlots.filter((ts: any) => {
          if (levelId && String(ts.courseLevelId) !== String(levelId)) return false;
          const roomId = draft.roomId || selectedClass?.roomId || '';
          if (roomId && String(ts.roomId) !== String(roomId)) return false;
          return true;
        });

        return (
          <select
            value={draft.teachingSlotId || currentSlotId || ''}
            onChange={async (e) => {
              const slotId = e.target.value;
              const slot = teachingSlots.find((x: any) => String(x.id) === String(slotId));
              if (!slot) {
                setDraft((d) => ({ ...d, teachingSlotId: '', roomId: d.roomId }));
                return;
              }
              try {
                let classId = String(slot.currentClassId || '');
                if (!classId) {
                  const created = await classesService.createFromTeachingSlot({ teachingSlotId: slot.id });
                  classId = String((created as any)?.data?.id || '');
                  await fetchAll();
                }
                setDraft((d) => ({
                  ...d,
                  teachingSlotId: slot.id,
                  roomId: slot.roomId,
                  classId: classId || d.classId,
                }));
              } catch (err: any) {
                setError(err?.response?.data?.message || 'Failed to create group from slot');
              }
            }}
            className="w-full rounded-md border-gray-300 text-sm"
          >
            <option value="">Select…</option>
            {options.map((ts: any) => (
              <option key={ts.id} value={ts.id}>
                {DOW[ts.dayOfWeek]} {ts.startTime}–{ts.endTime} • {ts.status}
              </option>
            ))}
          </select>
        );
      },
    },
    {
      key: 'branch',
      label: 'Branch',
      render: (_, row) => {
        const isEditing = editingId === row.enrollmentId;
        const selected = isEditing
          ? classes.find((c) => c.id === draft.classId)
          : (row.enrollment?.class as any);
        const branch = selected ? ((selected as any).locationName || (selected as any).location || '-') : '-';
        return (
          <span className="text-sm text-gray-600">
            <HighlightedText text={branch} query={searchTerm} />
          </span>
        );
      },
    },
    {
      key: 'instructor',
      label: 'Instructor',
      render: (_, row) => {
        const isEditing = editingId === row.enrollmentId;
        const selected: any = isEditing ? classes.find((c: any) => c.id === draft.classId) : row.enrollment?.class;
        const slot = selected?.teachingSlotId ? teachingSlots.find((ts: any) => String(ts.id) === String(selected.teachingSlotId)) : null;
        const u = slot?.instructor?.user || selected?.instructor?.user;
        const name = u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : '-';
        return (
          <span className="text-sm text-gray-600">
            <HighlightedText text={name} query={searchTerm} />
          </span>
        );
      },
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
            const cls: any = row.enrollment?.class;
            const slotId = cls?.teachingSlotId ? String(cls.teachingSlotId) : '';
            const roomId = cls?.roomId ? String(cls.roomId) : '';
            setDraft({
              classId: row.enrollment.classId || preselectedClassId || '',
              groupId: (row.enrollment as any).groupId || '',
              roomId,
              teachingSlotId: slotId,
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
            // Allocation is on Enrollment
            await studentsService.updateEnrollment(row.enrollmentId, {
              classId: draft.classId ? draft.classId : null,
              groupId: draft.groupId ? draft.groupId : null,
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
        subtitle="Assign each enrollment (Course Level) to a Course Group inline—students can have multiple courses."
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


