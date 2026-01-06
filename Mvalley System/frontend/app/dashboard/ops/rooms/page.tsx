'use client';

import { useEffect, useMemo, useState } from 'react';
import StandardListView from '@/components/StandardListView';
import EmptyState from '@/components/EmptyState';
import { roomsService, type Room } from '@/lib/services';
import { ActionButton, Column } from '@/components/DataTable';
import { FiEdit, FiPlus, FiSave, FiTrash2, FiX } from 'react-icons/fi';

function toErrorString(err: any) {
  return err?.response?.data?.message || err?.message || String(err || 'Unknown error');
}

const LOCATIONS = ['MOA', 'Espace', 'SODIC', 'PalmHills'];

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [form, setForm] = useState({ name: '', location: 'MOA', capacity: '', isActive: true });

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await roomsService.getAll();
      setRooms(Array.isArray(res.data) ? res.data : []);
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
    </>
  );
}


