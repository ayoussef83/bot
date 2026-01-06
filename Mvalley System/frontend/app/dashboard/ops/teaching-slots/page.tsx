'use client';

import { useEffect, useMemo, useState } from 'react';
import StandardListView from '@/components/StandardListView';
import EmptyState from '@/components/EmptyState';
import {
  coursesService,
  instructorsService,
  roomsService,
  teachingSlotsService,
  type TeachingSlot,
  type Room,
  type Instructor,
} from '@/lib/services';
import { ActionButton, Column } from '@/components/DataTable';
import { FiEdit, FiPlus, FiSave, FiTrash2, FiX } from 'react-icons/fi';

function toErrorString(err: any) {
  return err?.response?.data?.message || err?.message || String(err || 'Unknown error');
}

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function TeachingSlotsPage() {
  const [slots, setSlots] = useState<TeachingSlot[]>([]);
  const [levels, setLevels] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<TeachingSlot | null>(null);
  const [form, setForm] = useState({
    courseLevelId: '',
    instructorId: '',
    roomId: '',
    dayOfWeek: 0,
    startTime: '16:00',
    endTime: '18:00',
    effectiveFrom: '',
    effectiveTo: '',
    minCapacity: '6',
    maxCapacity: '12',
    plannedSessions: '8',
    sessionDurationMins: '90',
    pricePerStudent: '0',
    minMarginPct: '0', // percent input
    currency: 'EGP',
  });

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [s, l, i, r] = await Promise.all([
        teachingSlotsService.getAll(),
        coursesService.listLevels(),
        instructorsService.getAll(),
        roomsService.getAll(),
      ]);
      setSlots(Array.isArray(s.data) ? s.data : []);
      setLevels(Array.isArray(l.data) ? l.data : []);
      setInstructors(Array.isArray(i.data) ? i.data : []);
      setRooms(Array.isArray(r.data) ? r.data : []);
    } catch (e: any) {
      setError(toErrorString(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return slots;
    return slots.filter((s: any) => {
      const course = String(s?.courseLevel?.course?.name || '').toLowerCase();
      const level = String(s?.courseLevel?.name || '').toLowerCase();
      const room = String(s?.room?.name || '').toLowerCase();
      const inst = `${s?.instructor?.user?.firstName || ''} ${s?.instructor?.user?.lastName || ''}`.trim().toLowerCase();
      return course.includes(q) || level.includes(q) || room.includes(q) || inst.includes(q) || String(s?.status || '').toLowerCase().includes(q);
    });
  }, [slots, searchTerm]);

  const columns: Column<TeachingSlot>[] = [
    { key: 'status', label: 'Status', render: (v: any) => <span className="text-sm capitalize">{String(v || '-')}</span> },
    {
      key: 'course',
      label: 'Course / Level',
      render: (_: any, row: any) => (
        <span className="text-sm text-gray-700">
          {row?.courseLevel?.course?.name || 'Course'} — {row?.courseLevel?.sortOrder ?? '-'}
        </span>
      ),
    },
    {
      key: 'time',
      label: 'Day / Time',
      render: (_: any, row: any) => (
        <span className="text-sm text-gray-700">
          {DOW[row?.dayOfWeek ?? 0]} {row?.startTime}–{row?.endTime}
        </span>
      ),
    },
    { key: 'room', label: 'Room', render: (_: any, row: any) => <span className="text-sm text-gray-700">{row?.room?.name || '—'}</span> },
    {
      key: 'instructor',
      label: 'Instructor',
      render: (_: any, row: any) => (
        <span className="text-sm text-gray-700">
          {[row?.instructor?.user?.firstName, row?.instructor?.user?.lastName].filter(Boolean).join(' ') || '—'}
        </span>
      ),
    },
    { key: 'capacity', label: 'Capacity', render: (_: any, row: any) => <span className="text-sm text-gray-700">{row.minCapacity}–{row.maxCapacity}</span> },
    {
      key: 'economics',
      label: 'Price / Margin',
      render: (_: any, row: any) => (
        <span className="text-sm text-gray-700">
          {Number(row.pricePerStudent || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} {row.currency || 'EGP'} • {Math.round(Number(row.minMarginPct || 0) * 100)}%
        </span>
      ),
    },
  ];

  const levelOptions = levels.map((l: any) => ({
    id: l.id,
    label: `${l?.course?.name || 'Course'} — ${l?.sortOrder ?? ''} ${l?.name ? `(${l.name})` : ''}`.trim(),
  }));
  const instructorOptions = instructors.map((ins: any) => ({
    id: ins.id,
    label: `${ins?.user?.firstName || ''} ${ins?.user?.lastName || ''}`.trim() || ins.id,
  }));
  const roomOptions = rooms.map((r: any) => ({
    id: r.id,
    label: `${r.name} (${r.location}) • cap ${r.capacity}`,
  }));

  const openCreate = () => {
    setEditing(null);
    setForm((f) => ({
      ...f,
      courseLevelId: levelOptions[0]?.id || '',
      instructorId: instructorOptions[0]?.id || '',
      roomId: roomOptions[0]?.id || '',
    }));
    setShowModal(true);
  };

  const openEdit = (row: any) => {
    setEditing(row);
    setForm({
      courseLevelId: row.courseLevelId || row?.courseLevel?.id || '',
      instructorId: row.instructorId || row?.instructor?.id || '',
      roomId: row.roomId || row?.room?.id || '',
      dayOfWeek: Number(row.dayOfWeek ?? 0),
      startTime: String(row.startTime || '16:00'),
      endTime: String(row.endTime || '18:00'),
      effectiveFrom: row.effectiveFrom ? String(row.effectiveFrom).slice(0, 10) : '',
      effectiveTo: row.effectiveTo ? String(row.effectiveTo).slice(0, 10) : '',
      minCapacity: String(row.minCapacity ?? ''),
      maxCapacity: String(row.maxCapacity ?? ''),
      plannedSessions: String(row.plannedSessions ?? ''),
      sessionDurationMins: String(row.sessionDurationMins ?? ''),
      pricePerStudent: String(row.pricePerStudent ?? '0'),
      minMarginPct: String(Math.round(Number(row.minMarginPct || 0) * 100)), // show as %
      currency: String(row.currency || 'EGP'),
    });
    setShowModal(true);
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const payload: any = {
        courseLevelId: form.courseLevelId,
        instructorId: form.instructorId,
        roomId: form.roomId,
        dayOfWeek: Number(form.dayOfWeek),
        startTime: form.startTime,
        endTime: form.endTime,
        effectiveFrom: form.effectiveFrom || undefined,
        effectiveTo: form.effectiveTo || undefined,
        minCapacity: Number(form.minCapacity),
        maxCapacity: Number(form.maxCapacity),
        plannedSessions: Number(form.plannedSessions),
        sessionDurationMins: Number(form.sessionDurationMins),
        pricePerStudent: Number(form.pricePerStudent),
        minMarginPct: Number(form.minMarginPct) / 100,
        currency: String(form.currency || 'EGP').toUpperCase(),
      };
      if (!payload.courseLevelId) throw new Error('Course level is required');
      if (!payload.instructorId) throw new Error('Instructor is required');
      if (!payload.roomId) throw new Error('Room is required');
      if (!Number.isFinite(payload.minCapacity) || !Number.isFinite(payload.maxCapacity)) throw new Error('Capacity is required');

      if (editing?.id) await teachingSlotsService.update(editing.id, payload);
      else await teachingSlotsService.create(payload);

      setShowModal(false);
      await fetchAll();
    } catch (e: any) {
      setError(toErrorString(e));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: TeachingSlot) => {
    const reason = prompt('Reason for deleting this teaching slot? (required)');
    if (!reason?.trim()) return;
    try {
      await teachingSlotsService.delete(row.id, reason.trim());
      await fetchAll();
    } catch (e: any) {
      setError(toErrorString(e));
    }
  };

  const actions = (row: TeachingSlot): ActionButton[] => [
    { label: 'Edit', icon: <FiEdit className="w-4 h-4" />, onClick: () => openEdit(row) },
    { label: 'Delete', icon: <FiTrash2 className="w-4 h-4" />, variant: 'danger', onClick: () => remove(row) },
  ];

  return (
    <>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">{error}</div>}

      <StandardListView
        title="Teaching Slots"
        subtitle="Ops-defined teaching capacity (Instructor + Room + Time). Sales creates/fills groups from slots."
        primaryAction={{ label: 'Add Teaching Slot', icon: <FiPlus className="w-4 h-4" />, onClick: openCreate }}
        searchPlaceholder="Search slots…"
        onSearch={setSearchTerm}
        searchValue={searchTerm}
        filters={[]}
        columns={columns}
        data={filtered}
        loading={loading}
        actions={actions}
        emptyMessage="No teaching slots found"
        emptyState={
          <EmptyState
            icon={<FiPlus className="w-12 h-12 text-gray-400" />}
            title="No teaching slots yet"
            message="Create teaching slots first, then create groups from Allocation Engine."
            action={{ label: 'Add Teaching Slot', onClick: openCreate }}
          />
        }
        getRowId={(r) => r.id}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)} />
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">{editing ? 'Edit Teaching Slot' : 'Add Teaching Slot'}</h2>
                  <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                    <FiX className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Course / Level</label>
                      <select
                        value={form.courseLevelId}
                        onChange={(e) => setForm((f) => ({ ...f, courseLevelId: e.target.value }))}
                        className="mt-1 block w-full rounded-md border border-gray-400 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value="">Select…</option>
                        {levelOptions.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Instructor</label>
                      <select
                        value={form.instructorId}
                        onChange={(e) => setForm((f) => ({ ...f, instructorId: e.target.value }))}
                        className="mt-1 block w-full rounded-md border border-gray-400 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value="">Select…</option>
                        {instructorOptions.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Room</label>
                      <select
                        value={form.roomId}
                        onChange={(e) => setForm((f) => ({ ...f, roomId: e.target.value }))}
                        className="mt-1 block w-full rounded-md border border-gray-400 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value="">Select…</option>
                        {roomOptions.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-xs text-gray-500">
                        If rooms list is empty, create rooms first at <a className="text-indigo-600" href="/dashboard/ops/rooms">Rooms</a>.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Day</label>
                      <select
                        value={form.dayOfWeek}
                        onChange={(e) => setForm((f) => ({ ...f, dayOfWeek: Number(e.target.value) }))}
                        className="mt-1 block w-full rounded-md border border-gray-400 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        {DOW.map((d, idx) => (
                          <option key={d} value={idx}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Start time</label>
                      <input
                        type="time"
                        value={form.startTime}
                        onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                        className="mt-1 block w-full rounded-md border border-gray-400 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">End time</label>
                      <input
                        type="time"
                        value={form.endTime}
                        onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                        className="mt-1 block w-full rounded-md border border-gray-400 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Effective From (optional)</label>
                      <input
                        type="date"
                        value={form.effectiveFrom}
                        onChange={(e) => setForm((f) => ({ ...f, effectiveFrom: e.target.value }))}
                        className="mt-1 block w-full rounded-md border border-gray-400 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Effective To (optional)</label>
                      <input
                        type="date"
                        value={form.effectiveTo}
                        onChange={(e) => setForm((f) => ({ ...f, effectiveTo: e.target.value }))}
                        className="mt-1 block w-full rounded-md border border-gray-400 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Min capacity</label>
                      <input
                        value={form.minCapacity}
                        onChange={(e) => setForm((f) => ({ ...f, minCapacity: e.target.value }))}
                        className="mt-1 block w-full rounded-md border border-gray-400 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        inputMode="numeric"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Max capacity</label>
                      <input
                        value={form.maxCapacity}
                        onChange={(e) => setForm((f) => ({ ...f, maxCapacity: e.target.value }))}
                        className="mt-1 block w-full rounded-md border border-gray-400 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        inputMode="numeric"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700"># Sessions</label>
                      <input
                        value={form.plannedSessions}
                        onChange={(e) => setForm((f) => ({ ...f, plannedSessions: e.target.value }))}
                        className="mt-1 block w-full rounded-md border border-gray-400 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        inputMode="numeric"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Session mins</label>
                      <input
                        value={form.sessionDurationMins}
                        onChange={(e) => setForm((f) => ({ ...f, sessionDurationMins: e.target.value }))}
                        className="mt-1 block w-full rounded-md border border-gray-400 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        inputMode="numeric"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Currency</label>
                      <input
                        value={form.currency}
                        onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                        className="mt-1 block w-full rounded-md border border-gray-400 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Price per student</label>
                      <input
                        value={form.pricePerStudent}
                        onChange={(e) => setForm((f) => ({ ...f, pricePerStudent: e.target.value }))}
                        className="mt-1 block w-full rounded-md border border-gray-400 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        inputMode="decimal"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Min margin %</label>
                      <input
                        value={form.minMarginPct}
                        onChange={(e) => setForm((f) => ({ ...f, minMarginPct: e.target.value }))}
                        className="mt-1 block w-full rounded-md border border-gray-400 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        inputMode="decimal"
                        placeholder="e.g. 20"
                      />
                    </div>
                  </div>

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
    </>
  );
}


