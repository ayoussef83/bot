'use client';

import { useEffect, useMemo, useState } from 'react';
import StandardListView, { FilterConfig } from '@/components/StandardListView';
import EmptyState from '@/components/EmptyState';
import { ActionButton, Column } from '@/components/DataTable';
import { FiEdit, FiPlus, FiSave, FiTrash2, FiX } from 'react-icons/fi';
import { coursesService, classesService, groupsService, type Group, type Class } from '@/lib/services';

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [levels, setLevels] = useState<any[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Group | null>(null);
  const [form, setForm] = useState({ name: '', courseLevelId: '', defaultClassId: '' });

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [g, l, c] = await Promise.all([groupsService.getAll(), coursesService.listLevels(), classesService.getAll()]);
      setGroups(Array.isArray(g.data) ? g.data : []);
      setLevels(Array.isArray(l.data) ? l.data : []);
      setClasses(Array.isArray(c.data) ? c.data : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const columns: Column<Group>[] = [
    {
      key: 'name',
      label: 'Group',
      render: (value) => <span className="text-sm font-medium text-gray-900">{String(value || '-')}</span>,
    },
    {
      key: 'courseLevel',
      label: 'Course / Level',
      render: (_, row: any) => (
        <span className="text-sm text-gray-700">
          {(row?.courseLevel?.course?.name || 'Course') + ' — ' + (row?.courseLevel?.name || 'Level')}
        </span>
      ),
    },
    {
      key: 'defaultClass',
      label: 'Default Course Group',
      render: (_, row: any) => (
        <span className="text-sm text-gray-700">
          {row?.defaultClass?.name ? `${row.defaultClass.name} (${row.defaultClass.locationName || row.defaultClass.location})` : '-'}
        </span>
      ),
    },
  ];

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((g: any) => {
      const name = String(g?.name || '').toLowerCase();
      const course = String(g?.courseLevel?.course?.name || '').toLowerCase();
      const level = String(g?.courseLevel?.name || '').toLowerCase();
      return name.includes(q) || course.includes(q) || level.includes(q);
    });
  }, [groups, searchTerm]);

  const filters: FilterConfig[] = [];

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', courseLevelId: '', defaultClassId: '' });
    setShowModal(true);
  };

  const openEdit = (row: any) => {
    setEditing(row);
    setForm({
      name: row?.name || '',
      courseLevelId: row?.courseLevelId || row?.courseLevel?.id || '',
      defaultClassId: row?.defaultClassId || '',
    });
    setShowModal(true);
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name.trim(),
        courseLevelId: form.courseLevelId,
        defaultClassId: form.defaultClassId || null,
      };
      if (!payload.name) throw new Error('Group name is required');
      if (!payload.courseLevelId) throw new Error('Course level is required');

      if (editing?.id) {
        await groupsService.update(editing.id, payload);
      } else {
        await groupsService.create(payload);
      }
      setShowModal(false);
      await fetchAll();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to save group');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: Group) => {
    if (!confirm('Delete this group?')) return;
    try {
      await groupsService.delete(row.id);
      await fetchAll();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to delete group');
    }
  };

  const actions = (row: Group): ActionButton[] => [
    { label: 'Edit', icon: <FiEdit className="w-4 h-4" />, onClick: () => openEdit(row) },
    { label: 'Delete', icon: <FiTrash2 className="w-4 h-4" />, variant: 'danger', onClick: () => remove(row) },
  ];

  const levelOptions = levels.map((l: any) => ({
    id: l.id,
    label: `${l?.course?.name || 'Course'} — ${l?.name || 'Level'}`,
  }));

  const classOptions = classes.map((c: any) => ({
    id: c.id,
    label: `${c.name} (${c.locationName || c.location})`,
  }));

  return (
    <>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      <StandardListView
        title="Groups"
        subtitle="Operational cohorts for grouping students (used in Allocations)"
        primaryAction={{ label: 'Add Group', icon: <FiPlus className="w-4 h-4" />, onClick: openCreate }}
        searchPlaceholder="Search groups…"
        onSearch={setSearchTerm}
        searchValue={searchTerm}
        filters={filters}
        columns={columns}
        data={filtered}
        loading={loading}
        actions={actions}
        emptyMessage="No groups found"
        emptyState={
          <EmptyState
            icon={<FiPlus className="w-12 h-12 text-gray-400" />}
            title="No groups yet"
            message="Create groups to cohort students, then assign them in Allocations."
            action={{ label: 'Add Group', onClick: openCreate }}
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
                  <h2 className="text-xl font-semibold">{editing ? 'Edit Group' : 'Add Group'}</h2>
                  <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                    <FiX className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Group Name</label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="mt-1 block w-full rounded-md border border-gray-400 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="e.g. Group A"
                    />
                  </div>

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
                    <label className="block text-sm font-medium text-gray-700">Default Course Group (optional)</label>
                    <select
                      value={form.defaultClassId}
                      onChange={(e) => setForm((f) => ({ ...f, defaultClassId: e.target.value }))}
                      className="mt-1 block w-full rounded-md border border-gray-400 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="">None</option>
                      {classOptions.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      If set, selecting this Group in Allocations will auto-pick the Course Group.
                    </p>
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


