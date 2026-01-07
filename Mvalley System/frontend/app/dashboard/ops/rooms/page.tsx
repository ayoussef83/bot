'use client';

import { useEffect, useMemo, useState } from 'react';
import StandardListView from '@/components/StandardListView';
import EmptyState from '@/components/EmptyState';
import { roomsService, teachingSlotsService, type Room, type TeachingSlot } from '@/lib/services';
import { ActionButton, Column } from '@/components/DataTable';
import { FiCalendar, FiEdit, FiPlus, FiSave, FiTrash2, FiX } from 'react-icons/fi';

function toErrorString(err: any) {
  return err?.response?.data?.message || err?.message || String(err || 'Unknown error');
}

const LOCATIONS = ['MOA', 'Espace', 'SODIC', 'PalmHills'];
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const slotIndexToTime = (idx: number) => {
  const mins = idx * 30;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};
const timeToSlotIndex = (hhmm: string) => {
  const m = /^(\d{2}):(\d{2})$/.exec(String(hhmm || '').trim());
  if (!m) return 0;
  const h = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  return Math.max(0, Math.min(47, Math.floor((h * 60 + mm) / 30)));
};

const toYmd = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const toDateKey = (v: any) => {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return toYmd(d);
};

const startOfWeekSunday = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay(); // 0=Sun
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - day);
  return date;
};

const addDays = (d: Date, days: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
};

const overlapsWeek = (ts: any, weekStart: Date, weekEndExclusive: Date) => {
  const ef = ts?.effectiveFrom ? new Date(ts.effectiveFrom) : null;
  const et = ts?.effectiveTo ? new Date(ts.effectiveTo) : null;
  const start = ef ? ef : new Date('1970-01-01T00:00:00Z');
  const end = et ? et : new Date('2999-12-31T00:00:00Z');
  // overlap if start < weekEnd && end >= weekStart (treat end inclusive)
  return start < weekEndExclusive && end >= weekStart;
};

const availabilityOverlapsWeek = (av: any, weekStartKey: string, weekEndKey: string) => {
  const s = toDateKey(av?.effectiveFrom) || '0000-01-01';
  const e = toDateKey(av?.effectiveTo) || '9999-12-31';
  return s <= weekEndKey && e >= weekStartKey;
};

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [teachingSlots, setTeachingSlots] = useState<TeachingSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [form, setForm] = useState({ name: '', location: 'MOA', capacity: '', isActive: true });

  // Availability grid (7 days x 48 half-hours)
  const [showAvailability, setShowAvailability] = useState(false);
  const [availabilityRoom, setAvailabilityRoom] = useState<Room | null>(null);
  const [grid, setGrid] = useState<boolean[][]>(() => Array.from({ length: 7 }, () => Array.from({ length: 48 }, () => false)));
  const [savingGrid, setSavingGrid] = useState(false);
  const [weekDate, setWeekDate] = useState<string>(() => toYmd(new Date()));

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [r, ts] = await Promise.all([roomsService.getAll(), teachingSlotsService.getAll()]);
      setRooms(Array.isArray(r.data) ? r.data : []);
      setTeachingSlots(Array.isArray(ts.data) ? ts.data : []);
    } catch (e: any) {
      setError(toErrorString(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // When week changes in availability view, rebuild the grid from availabilities for that specific week
  useEffect(() => {
    if (!showAvailability || !availabilityRoom) return;
    const base = weekDate ? new Date(`${weekDate}T00:00:00`) : new Date();
    const ws = startOfWeekSunday(base);
    const weKey = toYmd(addDays(ws, 6));
    const wsKey = toYmd(ws);

    const next = Array.from({ length: 7 }, () => Array.from({ length: 48 }, () => false));
    const avs = Array.isArray((availabilityRoom as any).availabilities) ? (availabilityRoom as any).availabilities : [];
    for (const a of avs) {
      if (!availabilityOverlapsWeek(a, wsKey, weKey)) continue;
      const day = Number(a?.dayOfWeek);
      if (!Number.isFinite(day) || day < 0 || day > 6) continue;
      const startIdx = timeToSlotIndex(String(a?.startTime || '00:00'));
      const endIdx = timeToSlotIndex(String(a?.endTime || '00:00'));
      const endExclusive = Math.max(startIdx + 1, endIdx);
      for (let i = startIdx; i < endExclusive; i++) next[day][i] = true;
    }
    setGrid(next);
  }, [weekDate, showAvailability, availabilityRoom]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return rooms;
    return rooms.filter((r: any) => {
      return (
        String(r?.name || '').toLowerCase().includes(q) ||
        String(r?.location || '').toLowerCase().includes(q)
      );
    });
  }, [rooms, searchTerm]);

  const columns: Column<Room>[] = [
    { key: 'name', label: 'Room', render: (v) => <span className="text-sm font-medium text-gray-900">{String(v || '-')}</span> },
    { key: 'location', label: 'Location', render: (v) => <span className="text-sm text-gray-700">{String(v || '-')}</span> },
    { key: 'capacity', label: 'Capacity', render: (v) => <span className="text-sm text-gray-700">{Number(v || 0)}</span> },
    { key: 'isActive', label: 'Active', render: (v) => <span className="text-sm text-gray-700">{v ? 'Yes' : 'No'}</span> },
  ];

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', location: 'MOA', capacity: '', isActive: true });
    setShowModal(true);
  };

  const openEdit = (row: Room) => {
    setEditing(row);
    setForm({
      name: row.name || '',
      location: String(row.location || 'MOA'),
      capacity: String(row.capacity ?? ''),
      isActive: Boolean(row.isActive),
    });
    setShowModal(true);
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name.trim(),
        location: form.location,
        capacity: Number(form.capacity),
        isActive: form.isActive,
      };
      if (!payload.name) throw new Error('Room name is required');
      if (!payload.location) throw new Error('Location is required');
      if (!Number.isFinite(payload.capacity) || payload.capacity < 1) throw new Error('Capacity must be a positive number');

      if (editing?.id) await roomsService.update(editing.id, payload);
      else await roomsService.create(payload);

      setShowModal(false);
      await fetchAll();
    } catch (e: any) {
      setError(toErrorString(e));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: Room) => {
    if (!confirm('Delete this room?')) return;
    try {
      await roomsService.delete(row.id);
      await fetchAll();
    } catch (e: any) {
      setError(toErrorString(e));
    }
  };

  const actions = (row: Room): ActionButton[] => [
    {
      label: 'Availability',
      icon: <FiCalendar className="w-4 h-4" />,
      onClick: () => {
        // Build grid from existing availabilities
        const next = Array.from({ length: 7 }, () => Array.from({ length: 48 }, () => false));
        const avs = Array.isArray((row as any).availabilities) ? (row as any).availabilities : [];
        for (const a of avs) {
          const day = Number(a?.dayOfWeek);
          if (!Number.isFinite(day) || day < 0 || day > 6) continue;
          const startIdx = timeToSlotIndex(String(a?.startTime || '00:00'));
          const endIdx = timeToSlotIndex(String(a?.endTime || '00:00'));
          const endExclusive = Math.max(startIdx + 1, endIdx);
          for (let i = startIdx; i < endExclusive; i++) next[day][i] = true;
        }
        setAvailabilityRoom(row);
        setGrid(next);
        setWeekDate(toYmd(new Date()));
        setShowAvailability(true);
      },
    },
    { label: 'Edit', icon: <FiEdit className="w-4 h-4" />, onClick: () => openEdit(row) },
    { label: 'Delete', icon: <FiTrash2 className="w-4 h-4" />, variant: 'danger', onClick: () => remove(row) },
  ];

  return (
    <>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">{error}</div>}

      <StandardListView
        title="Rooms"
        subtitle="Define physical rooms used by Teaching Slots"
        primaryAction={{ label: 'Add Room', icon: <FiPlus className="w-4 h-4" />, onClick: openCreate }}
        searchPlaceholder="Search rooms…"
        onSearch={setSearchTerm}
        searchValue={searchTerm}
        filters={[]}
        columns={columns}
        data={filtered}
        loading={loading}
        actions={actions}
        emptyMessage="No rooms found"
        emptyState={
          <EmptyState
            icon={<FiPlus className="w-12 h-12 text-gray-400" />}
            title="No rooms yet"
            message="Create rooms first, then create Teaching Slots."
            action={{ label: 'Add Room', onClick: openCreate }}
          />
        }
        getRowId={(r) => r.id}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)} />
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">{editing ? 'Edit Room' : 'Add Room'}</h2>
                  <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                    <FiX className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Room Name</label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="mt-1 block w-full rounded-md border border-gray-400 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="e.g. Room 1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Location</label>
                      <select
                        value={form.location}
                        onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                        className="mt-1 block w-full rounded-md border border-gray-400 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        {LOCATIONS.map((l) => (
                          <option key={l} value={l}>
                            {l}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Capacity</label>
                      <input
                        value={form.capacity}
                        onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
                        className="mt-1 block w-full rounded-md border border-gray-400 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        inputMode="numeric"
                        placeholder="e.g. 20"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                    />
                    Active
                  </label>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-400 rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={save}
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium disabled:opacity-60"
                    >
                      <span className="inline-flex items-center justify-center gap-2">
                        <FiSave className="w-4 h-4" /> {saving ? 'Saving…' : 'Save'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAvailability && availabilityRoom && (
        <div className="mt-6 bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-lg font-semibold text-gray-900">Room Availability</div>
              <div className="text-sm text-gray-500">
                {availabilityRoom.name} • {availabilityRoom.location} • 30-minute grid (reserved slots show group name and are locked)
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowAvailability(false)}
              className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
            >
              Close
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            {(() => {
              const base = weekDate ? new Date(`${weekDate}T00:00:00`) : new Date();
              const ws = startOfWeekSunday(base);
              const we = addDays(ws, 7);
              const weKey = toYmd(addDays(ws, 6));
              const wsKey = toYmd(ws);
              return (
                <>
                  <div className="text-sm text-gray-700 font-medium">Week:</div>
                  <button
                    type="button"
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                    onClick={() => setWeekDate(toYmd(addDays(ws, -7)))}
                  >
                    Prev
                  </button>
                  <input
                    type="date"
                    value={weekDate}
                    onChange={(e) => setWeekDate(e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <button
                    type="button"
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                    onClick={() => setWeekDate(toYmd(addDays(ws, 7)))}
                  >
                    Next
                  </button>
                  <div className="text-xs text-gray-500">
                    Showing reserved/occupied slots effective during {ws.toLocaleDateString('en-GB')} – {addDays(we, -1).toLocaleDateString('en-GB')}
                  </div>
                  <div className="text-xs text-gray-500">
                    Editing room availability for this week only ({wsKey} → {weKey}).
                  </div>
                </>
              );
            })()}
          </div>

          {(() => {
            const base = weekDate ? new Date(`${weekDate}T00:00:00`) : new Date();
            const weekStart = startOfWeekSunday(base);
            const weekEndExclusive = addDays(weekStart, 7);
            const slotBlocks = teachingSlots
              .filter((ts: any) => String(ts.roomId) === String((availabilityRoom as any).id))
              .filter((ts: any) => ['reserved', 'occupied'].includes(String(ts.status || '').toLowerCase()))
              .filter((ts: any) => overlapsWeek(ts, weekStart, weekEndExclusive));
            const locked = new Map<string, { label: string; isStart: boolean }>();
            for (const s of slotBlocks as any[]) {
              const day = Number(s.dayOfWeek);
              const startIdx = timeToSlotIndex(String(s.startTime));
              const endIdx = timeToSlotIndex(String(s.endTime));
              const endExclusive = Math.max(startIdx + 1, endIdx);
              const label = String(s.currentClass?.name || s.currentClassId || 'Reserved');
              for (let i = startIdx; i < endExclusive; i++) {
                locked.set(`${day}|${i}`, { label, isStart: i === startIdx });
              }
            }

            return (
              <div className="border border-gray-200 rounded overflow-auto">
                <div className="min-w-[1200px]">
                  <div className="grid" style={{ gridTemplateColumns: `140px repeat(48, minmax(0, 1fr))` }}>
                    <div className="sticky left-0 z-10 bg-white border-b border-gray-200 p-2 text-xs text-gray-500">Day</div>
                    {Array.from({ length: 48 }).map((_, i) => (
                      <div key={i} className="border-b border-gray-200 p-1 text-[10px] text-gray-500 text-center">
                        {i % 2 === 0 ? slotIndexToTime(i) : ''}
                      </div>
                    ))}

                    {DOW.map((d, dayIdx) => (
                      <div key={d} className="contents">
                        <div className="sticky left-0 z-10 bg-white border-b border-gray-200 p-2 text-sm font-medium text-gray-900">
                          {d}
                        </div>
                        {Array.from({ length: 48 }).map((_, slotIdx) => {
                          const on = grid[dayIdx]?.[slotIdx];
                          const lockInfo = locked.get(`${dayIdx}|${slotIdx}`);
                          const isLocked = Boolean(lockInfo);
                          const title = isLocked
                            ? `${d} ${slotIndexToTime(slotIdx)}-${slotIndexToTime(slotIdx + 1)} • ${lockInfo?.label} (locked)`
                            : `${d} ${slotIndexToTime(slotIdx)}-${slotIndexToTime(slotIdx + 1)}`;

                          return (
                            <button
                              key={slotIdx}
                              type="button"
                              disabled={isLocked}
                              onClick={() => {
                                setGrid((g) => {
                                  const copy = g.map((row) => row.slice());
                                  copy[dayIdx][slotIdx] = !copy[dayIdx][slotIdx];
                                  return copy;
                                });
                              }}
                              className={`border-b border-gray-200 h-7 relative ${
                                isLocked
                                  ? 'bg-gray-300 cursor-not-allowed'
                                  : on
                                    ? 'bg-green-200 hover:bg-green-300'
                                    : 'bg-white hover:bg-gray-50'
                              }`}
                              title={title}
                            >
                              {lockInfo?.isStart ? (
                                <span className="absolute left-0 top-0 h-full w-full text-[9px] text-gray-800 px-1 flex items-center overflow-hidden">
                                  {lockInfo.label}
                                </span>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="flex items-center justify-between gap-3 mt-4">
            <button
              type="button"
              onClick={() => setGrid(Array.from({ length: 7 }, () => Array.from({ length: 48 }, () => false)))}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium"
            >
              Clear
            </button>
            <button
              type="button"
              disabled={savingGrid}
              onClick={async () => {
                setSavingGrid(true);
                setError('');
                try {
                  const room = availabilityRoom as any;
                  const existing = Array.isArray(room.availabilities) ? room.availabilities : [];
                  const base = weekDate ? new Date(`${weekDate}T00:00:00`) : new Date();
                  const ws = startOfWeekSunday(base);
                  const wsKey = toYmd(ws);
                  const weKey = toYmd(addDays(ws, 6)); // inclusive end (Sat)

                  // Only replace availabilities for the selected week; keep other weeks untouched
                  const toDelete = existing.filter((a: any) => availabilityOverlapsWeek(a, wsKey, weKey));
                  await Promise.all(toDelete.map((a: any) => roomsService.deleteAvailability(a.id)));

                  const create: any[] = [];
                  for (let day = 0; day < 7; day++) {
                    let runStart: number | null = null;
                    for (let i = 0; i <= 48; i++) {
                      const on = i < 48 ? !!grid[day][i] : false;
                      if (on && runStart === null) runStart = i;
                      if ((!on || i === 48) && runStart !== null) {
                        const startTime = slotIndexToTime(runStart);
                        const endTime = slotIndexToTime(i);
                        create.push({ dayOfWeek: day, startTime, endTime, effectiveFrom: wsKey, effectiveTo: weKey });
                        runStart = null;
                      }
                    }
                  }

                  for (const payload of create) {
                    await roomsService.addAvailability(room.id, payload);
                  }

                  await fetchAll();
                  setShowAvailability(false);
                } catch (e: any) {
                  setError(toErrorString(e));
                } finally {
                  setSavingGrid(false);
                }
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium disabled:opacity-60"
            >
              {savingGrid ? 'Saving…' : 'Save availability'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}


