'use client';

import { useEffect, useMemo, useState } from 'react';
import StandardListView from '@/components/StandardListView';
import EmptyState from '@/components/EmptyState';
import { ActionButton, Column } from '@/components/DataTable';
import HighlightedText from '@/components/HighlightedText';
import {
  classesService,
  groupsService,
  roomsService,
  teachingSlotsService,
  studentsService,
  type Group,
  type Room,
  type TeachingSlot,
} from '@/lib/services';
import { FiEdit, FiSave, FiX } from 'react-icons/fi';

function toErrorString(err: any) {
  return err?.response?.data?.message || err?.message || String(err || 'Unknown error');
}

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const BRANCHES = ['MOA', 'Espace', 'SODIC', 'PalmHills'];

const timeToMinutes = (hhmm: string) => {
  const m = /^(\d{2}):(\d{2})$/.exec(String(hhmm || '').trim());
  if (!m) return 0;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
};

const isTeachingSlotWithinRoomAvailability = (slot: any, room: any) => {
  const avs = Array.isArray(room?.availabilities) ? room.availabilities : [];
  if (!avs.length) return false;
  const day = Number(slot?.dayOfWeek);
  const sStart = timeToMinutes(String(slot?.startTime || '00:00'));
  const sEnd = timeToMinutes(String(slot?.endTime || '00:00'));
  for (const a of avs) {
    const aDay = Number(a?.dayOfWeek);
    if (aDay !== day) continue;
    const aStart = timeToMinutes(String(a?.startTime || '00:00'));
    const aEnd = timeToMinutes(String(a?.endTime || '00:00'));
    if (sStart >= aStart && sEnd <= aEnd) return true;
  }
  return false;
};

type Draft = {
  branch: string;
  roomId: string;
  teachingSlotId: string;
};

type GroupRow = {
  id: string;
  group: Group & { _members?: any[] };
  defaultClass?: any | null;
};

export default function AllocationsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [teachingSlots, setTeachingSlots] = useState<TeachingSlot[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({ branch: '', roomId: '', teachingSlotId: '' });
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [g, r, ts, s] = await Promise.all([
        groupsService.getAll(),
        roomsService.getAll(),
        teachingSlotsService.getAll(),
        studentsService.getAll(),
      ]);
      const groupsList = Array.isArray(g.data) ? g.data : [];
      const roomsList = Array.isArray(r.data) ? r.data : [];
      const slotsList = Array.isArray(ts.data) ? ts.data : [];
      const studentsList = Array.isArray(s.data) ? s.data : [];

      // Attach members (best-effort): members = students whose enrollments groupId === group.id
      // We rely on existing group payloads not containing members; this is purely UI assistance.
      // If backend later exposes member counts, we should swap to that.
      const membersByGroup = new Map<string, any[]>();
      for (const gr of groupsList as any[]) membersByGroup.set(String(gr.id), []);
      for (const st of studentsList as any[]) {
        const ens = Array.isArray(st?.enrollments) ? st.enrollments : [];
        for (const e of ens) {
          const gid = String(e?.groupId || '').trim();
          if (!gid) continue;
          const arr = membersByGroup.get(gid) || [];
          arr.push(st);
          membersByGroup.set(gid, arr);
        }
      }
      const enriched = (groupsList as any[]).map((gr) => ({ ...gr, _members: membersByGroup.get(String(gr.id)) || [] }));

      setGroups(enriched);
      setRooms(roomsList);
      setTeachingSlots(slotsList);
      setStudents(studentsList);
    } catch (e: any) {
      setError(toErrorString(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const groupMembersVisual = (members: any[]) => {
    const top = members.slice(0, 3);
    const rest = members.length - top.length;
    if (!members.length) return <span className="text-xs text-gray-500">—</span>;
    return (
      <div className="flex items-center gap-1">
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

  const rows: GroupRow[] = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const list = (groups as any[]).filter((g: any) => {
      if (!q) return true;
      const name = String(g?.name || '').toLowerCase();
      const course = String(g?.courseLevel?.course?.name || '').toLowerCase();
      const level = String(g?.courseLevel?.name || '').toLowerCase();
      return name.includes(q) || course.includes(q) || level.includes(q);
    });

    return list.map((g: any) => ({
      id: g.id,
      group: g,
      defaultClass: g.defaultClass || null,
    }));
  }, [groups, searchTerm]);

  const columns: Column<GroupRow>[] = [
    {
      key: 'branch',
      label: 'Branch',
      render: (_: any, row: any) => {
        const isEditing = editingId === row.id;
        const currentRoomId = String(row?.defaultClass?.roomId || '');
        const currentRoom = rooms.find((r) => String(r.id) === currentRoomId);
        const currentBranch = String(currentRoom?.location || row?.defaultClass?.location || '');

        if (!isEditing) {
          return <span className="text-sm text-gray-700">{currentBranch || '—'}</span>;
        }

        return (
          <select
            value={draft.branch || currentBranch || ''}
            onChange={(e) => setDraft({ branch: e.target.value, roomId: '', teachingSlotId: '' })}
            className="w-full rounded-md border-gray-300 text-sm"
          >
            <option value="">Select…</option>
            {BRANCHES.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        );
      },
    },
    {
      key: 'room',
      label: 'Room',
      render: (_: any, row: any) => {
        const isEditing = editingId === row.id;
        const currentRoomId = String(row?.defaultClass?.roomId || '');
        const currentRoom = rooms.find((r) => String(r.id) === currentRoomId);

        if (!isEditing) {
          return <span className="text-sm text-gray-700">{currentRoom?.name || '—'}</span>;
        }

        const roomsForBranch = rooms.filter((r: any) => !draft.branch || String(r.location) === String(draft.branch));

        return (
          <select
            value={draft.roomId || currentRoomId || ''}
            disabled={!draft.branch}
            onChange={(e) => setDraft((d) => ({ ...d, roomId: e.target.value, teachingSlotId: '' }))}
            className="w-full rounded-md border-gray-300 text-sm disabled:opacity-60"
          >
            <option value="">Select…</option>
            {roomsForBranch.map((r: any) => (
              <option key={r.id} value={r.id}>
                {r.name} • cap {r.capacity}
              </option>
            ))}
          </select>
        );
      },
    },
    {
      key: 'slot',
      label: 'Room available slot',
      render: (_: any, row: any) => {
        const isEditing = editingId === row.id;
        const currentSlotId = String(row?.defaultClass?.teachingSlotId || '');
        const currentSlot = teachingSlots.find((ts: any) => String(ts.id) === currentSlotId);

        if (!isEditing) {
          if (!currentSlot) return <span className="text-sm text-gray-500">—</span>;
          const label = `${DOW[currentSlot.dayOfWeek]} ${currentSlot.startTime}–${currentSlot.endTime}`;
          return <span className="text-sm text-gray-700">{label}</span>;
        }

        const selectedRoomId = draft.roomId || String(row?.defaultClass?.roomId || '');
        const selectedRoom = rooms.find((r: any) => String(r.id) === String(selectedRoomId));
        const options = teachingSlots
          .filter((ts: any) => String(ts.roomId) === String(selectedRoomId))
          .filter((ts: any) => (selectedRoom ? isTeachingSlotWithinRoomAvailability(ts, selectedRoom) : true));

        // Lock reserved/occupied slots unless it's already this group's slot
        const isLockedByOther = (ts: any) => {
          const status = String(ts.status || '').toLowerCase();
          if (status !== 'reserved' && status !== 'occupied') return false;
          const currentClassId = String(ts.currentClassId || '');
          const groupClassId = String(row?.group?.defaultClassId || '');
          return Boolean(currentClassId) && Boolean(groupClassId) && currentClassId !== groupClassId;
        };

        return (
          <select
            value={draft.teachingSlotId || currentSlotId || ''}
            disabled={!draft.roomId || !selectedRoom?.availabilities?.length}
            onChange={(e) => setDraft((d) => ({ ...d, teachingSlotId: e.target.value }))}
            className="w-full rounded-md border-gray-300 text-sm disabled:opacity-60"
          >
            <option value="">{!selectedRoom?.availabilities?.length ? 'Set room availability first…' : 'Select…'}</option>
            {options.map((ts: any) => {
              const label = `${DOW[ts.dayOfWeek]} ${ts.startTime}–${ts.endTime}`;
              const locked = isLockedByOther(ts);
              const by = ts?.currentClass?.name ? ` • reserved by ${ts.currentClass.name}` : '';
              return (
                <option key={ts.id} value={ts.id} disabled={locked}>
                  {label} • {ts.status}
                  {by}
                </option>
              );
            })}
          </select>
        );
      },
    },
    {
      key: 'instructor',
      label: 'Instructor',
      render: (_: any, row: any) => {
        const isEditing = editingId === row.id;
        const slotId = isEditing ? draft.teachingSlotId : String(row?.defaultClass?.teachingSlotId || '');
        const slot = teachingSlots.find((ts: any) => String(ts.id) === String(slotId));
        const u = slot?.instructor?.user;
        const name = u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : '—';

        // Enabled only after selecting slot (stage gating). If no slot, show placeholder.
        if (!isEditing) {
          return <span className="text-sm text-gray-700">{name}</span>;
        }
        return (
          <input
            value={name}
            disabled
            className="w-full rounded-md border-gray-200 text-sm bg-gray-50"
          />
        );
      },
    },
    {
      key: 'group',
      label: 'Group',
      render: (_: any, row: any) => (
        <span className="text-sm text-gray-900 font-medium">
          <HighlightedText text={row.group.name} query={searchTerm} />
        </span>
      ),
    },
    {
      key: 'members',
      label: 'Group members',
      render: (_: any, row: any) => groupMembersVisual((row.group as any)._members || []),
    },
  ];

  const actions = (row: GroupRow): ActionButton[] => {
    const isEditing = editingId === row.id;
    if (!isEditing) {
      return [
        {
          label: 'Edit',
          icon: <FiEdit className="w-4 h-4" />,
          onClick: () => {
            const currentRoomId = String(row?.defaultClass?.roomId || '');
            const currentRoom = rooms.find((r) => String(r.id) === currentRoomId);
            setEditingId(row.id);
            setDraft({
              branch: String(currentRoom?.location || row?.defaultClass?.location || ''),
              roomId: currentRoomId,
              teachingSlotId: String(row?.defaultClass?.teachingSlotId || ''),
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
          setSaving(true);
          setError('');
          try {
            if (!draft.branch) throw new Error('Branch is required');
            if (!draft.roomId) throw new Error('Room is required');
            if (!draft.teachingSlotId) throw new Error('Room available slot is required');

            const slot = teachingSlots.find((ts: any) => String(ts.id) === String(draft.teachingSlotId));
            if (!slot) throw new Error('Invalid slot');

            // If slot is reserved by another group, block
            const lockedStatus = String(slot.status || '').toLowerCase();
            if ((lockedStatus === 'reserved' || lockedStatus === 'occupied') && slot.currentClassId && slot.currentClassId !== (row.group as any).defaultClassId) {
              throw new Error(`Slot is ${slot.status}. Release it first to reassign.`);
            }

            // Ensure a class exists for this slot
            let classId = String(slot.currentClassId || (row.group as any).defaultClassId || '');
            if (!classId) {
              const created = await classesService.createFromTeachingSlot({ teachingSlotId: slot.id });
              classId = String((created as any)?.data?.id || '');
            }
            if (!classId) throw new Error('Failed to create group for this slot');

            // Link group -> class
            await groupsService.update(row.group.id, { defaultClassId: classId });

            setEditingId(null);
            await fetchAll();
          } catch (e: any) {
            setError(toErrorString(e));
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

  return (
    <>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">{error}</div>}

      <StandardListView
        title="Allocations"
        subtitle="Allocate Branch → Room → Room available slot → Instructor → Group. Students are managed from the Group page."
        searchPlaceholder="Search groups…"
        onSearch={setSearchTerm}
        searchValue={searchTerm}
        filters={[]}
        columns={columns}
        data={rows}
        loading={loading}
        actions={actions}
        emptyMessage="No groups found"
        emptyState={
          <EmptyState
            icon={<FiEdit className="w-12 h-12 text-gray-400" />}
            title="No groups"
            message="Create groups first, then allocate them to a room slot."
          />
        }
        getRowId={(r) => r.id}
      />
    </>
  );
}


