'use client';

import { useEffect, useMemo, useState } from 'react';
import StandardListView, { FilterConfig } from '@/components/StandardListView';
import EmptyState from '@/components/EmptyState';
import { ActionButton, Column } from '@/components/DataTable';
import { FiEdit, FiPlus, FiSave, FiTrash2, FiX } from 'react-icons/fi';
import { coursesService, classesService, groupsService, studentsService, type Group, type Class, type Student } from '@/lib/services';

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [levels, setLevels] = useState<any[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Group | null>(null);
  const [form, setForm] = useState({
    courseLevelId: '',
    defaultClassId: '',
    location: '',
    minCapacity: '',
    maxCapacity: '',
    ageMin: '',
    ageMax: '',
  });
  const [membersSearch, setMembersSearch] = useState('');
  const [pendingMemberEnrollmentIds, setPendingMemberEnrollmentIds] = useState<Set<string>>(new Set());
  const [savingMembers, setSavingMembers] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [g, l, c, s] = await Promise.all([
        groupsService.getAll(),
        coursesService.listLevels(),
        classesService.getAll(),
        studentsService.getAll(),
      ]);
      setGroups(Array.isArray(g.data) ? g.data : []);
      setLevels(Array.isArray(l.data) ? l.data : []);
      setClasses(Array.isArray(c.data) ? c.data : []);
      setStudents(Array.isArray(s.data) ? s.data : []);
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
      label: 'Name',
      render: (value) => <span className="text-sm font-medium text-gray-900">{String(value || '-')}</span>,
    },
    {
      key: 'courseName',
      label: 'Course Name',
      render: (_, row: any) => <span className="text-sm text-gray-700">{row?.courseLevel?.course?.name || '-'}</span>,
    },
    {
      key: 'courseLevel',
      label: 'Course Level',
      render: (_, row: any) => (
        <span className="text-sm text-gray-700">
          {row?.courseLevel?.sortOrder ?? '-'} {row?.courseLevel?.name ? `(${row.courseLevel.name})` : ''}
        </span>
      ),
    },
    {
      key: 'capacity',
      label: 'Capacity',
      render: (_, row: any) => {
        const min = row?.minCapacity ?? row?.defaultClass?.minCapacity;
        const max = row?.maxCapacity ?? (row?.defaultClass?.maxCapacity ?? row?.defaultClass?.capacity);
        if (min && max) return <span className="text-sm text-gray-700">{min}–{max}</span>;
        if (max) return <span className="text-sm text-gray-700">{max}</span>;
        return <span className="text-sm text-gray-500">—</span>;
      },
    },
    {
      key: 'ageGroup',
      label: 'Age Group',
      render: (_, row: any) => {
        const ageMin = row?.ageMin ?? row?.defaultClass?.ageMin;
        const ageMax = row?.ageMax ?? row?.defaultClass?.ageMax;
        if (ageMin != null && ageMax != null) return <span className="text-sm text-gray-700">{ageMin}–{ageMax}</span>;
        if (ageMin != null) return <span className="text-sm text-gray-700">{ageMin}+</span>;
        return <span className="text-sm text-gray-500">—</span>;
      },
    },
    {
      key: 'location',
      label: 'Location',
      render: (_, row: any) => {
        const loc = row?.location || row?.defaultClass?.locationName || row?.defaultClass?.location;
        return <span className="text-sm text-gray-700">{loc || '—'}</span>;
      },
    },
    {
      key: 'createdAt',
      label: 'Creation date',
      render: (v: any) => <span className="text-sm text-gray-700">{v ? new Date(v).toLocaleDateString('en-GB') : '—'}</span>,
    },
    {
      key: 'createdBy',
      label: 'Created By',
      render: (_: any, row: any) => {
        const u = row?.createdBy;
        const name = [u?.firstName, u?.lastName].filter(Boolean).join(' ').trim();
        return <span className="text-sm text-gray-700">{name || u?.email || '—'}</span>;
      },
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
    setForm({ courseLevelId: '', defaultClassId: '', location: '', minCapacity: '', maxCapacity: '', ageMin: '', ageMax: '' });
    setPendingMemberEnrollmentIds(new Set());
    setMembersSearch('');
    setShowModal(true);
  };

  const openEdit = (row: any) => {
    setEditing(row);
    setForm({
      courseLevelId: row?.courseLevelId || row?.courseLevel?.id || '',
      defaultClassId: row?.defaultClassId || '',
      location: row?.location || '',
      minCapacity: row?.minCapacity != null ? String(row.minCapacity) : '',
      maxCapacity: row?.maxCapacity != null ? String(row.maxCapacity) : '',
      ageMin: row?.ageMin != null ? String(row.ageMin) : '',
      ageMax: row?.ageMax != null ? String(row.ageMax) : '',
    });
    setPendingMemberEnrollmentIds(new Set());
    setMembersSearch('');
    setShowModal(true);
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        courseLevelId: form.courseLevelId,
        defaultClassId: form.defaultClassId || null,
        location: form.location || null,
        minCapacity: form.minCapacity ? Number(form.minCapacity) : null,
        maxCapacity: form.maxCapacity ? Number(form.maxCapacity) : null,
        ageMin: form.ageMin ? Number(form.ageMin) : null,
        ageMax: form.ageMax ? Number(form.ageMax) : null,
      };
      if (!payload.courseLevelId) throw new Error('Course level is required');

      if (editing?.id) {
        await groupsService.update(editing.id, payload as any);
      } else {
        await groupsService.create(payload as any);
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
    label: `${l?.course?.name || 'Course'} — ${l?.sortOrder ?? ''} ${l?.name ? `(${l.name})` : ''}`.trim(),
  }));

  const classOptions = classes
    .filter((c: any) => !form.courseLevelId || String(c.courseLevelId || '') === String(form.courseLevelId))
    .map((c: any) => ({
    id: c.id,
    label: `${c.name} (${c.locationName || c.location})`,
  }));

  const memberCandidates = useMemo(() => {
    if (!form.courseLevelId) return [];
    const q = membersSearch.trim().toLowerCase();
    const out: { student: any; enrollment: any; isMember: boolean }[] = [];
    for (const s of students as any[]) {
      const ens = Array.isArray(s.enrollments) ? s.enrollments : [];
      for (const e of ens) {
        if (String(e.courseLevelId) !== String(form.courseLevelId)) continue;
        const isMember = Boolean(editing?.id && String(e.groupId || '') === String(editing.id));
        const fullName = `${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase();
        const phone = String(s.phone || '').toLowerCase();
        if (q && !fullName.includes(q) && !phone.includes(q)) continue;
        out.push({ student: s, enrollment: e, isMember });
      }
    }
    return out;
  }, [students, form.courseLevelId, membersSearch, editing?.id]);

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
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                    <div className="text-xs text-gray-500">Name (auto-generated)</div>
                    <div className="text-sm font-medium text-gray-900 mt-0.5">
                      {editing?.name ? editing.name : 'Will be generated after selecting Course Level'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Format: 2 letters (course name) - 3 digit number - 1 digit level. مثال: LW-001-1
                    </div>
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
                      If set, Allocations can auto-pick a class, but you can also set Location/Capacity/Age below.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Location (Branch)</label>
                      <select
                        value={form.location}
                        onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                        className="mt-1 block w-full rounded-md border border-gray-400 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value="">—</option>
                        <option value="MOA">MOA</option>
                        <option value="Espace">Espace</option>
                        <option value="SODIC">SODIC</option>
                        <option value="PalmHills">PalmHills</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Capacity (min / max)</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          value={form.minCapacity}
                          onChange={(e) => setForm((f) => ({ ...f, minCapacity: e.target.value }))}
                          className="mt-1 block w-full rounded-md border border-gray-400 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          inputMode="numeric"
                          placeholder="Min"
                        />
                        <input
                          value={form.maxCapacity}
                          onChange={(e) => setForm((f) => ({ ...f, maxCapacity: e.target.value }))}
                          className="mt-1 block w-full rounded-md border border-gray-400 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          inputMode="numeric"
                          placeholder="Max"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Age Group (from / to)</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          value={form.ageMin}
                          onChange={(e) => setForm((f) => ({ ...f, ageMin: e.target.value }))}
                          className="mt-1 block w-full rounded-md border border-gray-400 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          inputMode="numeric"
                          placeholder="From"
                        />
                        <input
                          value={form.ageMax}
                          onChange={(e) => setForm((f) => ({ ...f, ageMax: e.target.value }))}
                          className="mt-1 block w-full rounded-md border border-gray-400 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          inputMode="numeric"
                          placeholder="To"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">Group Members</div>
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        value={membersSearch}
                        onChange={(e) => setMembersSearch(e.target.value)}
                        className="w-full rounded-md border border-gray-400 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm px-2 py-1"
                        placeholder="Search student by name or phone…"
                      />
                    </div>
                    <div className="max-h-56 overflow-auto border border-gray-200 rounded-md">
                      {!form.courseLevelId ? (
                        <div className="p-3 text-sm text-gray-500">Select Course/Level to manage members.</div>
                      ) : memberCandidates.length === 0 ? (
                        <div className="p-3 text-sm text-gray-500">No students found for this course level.</div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {memberCandidates.map(({ student, enrollment, isMember }) => {
                            const enrolled = pendingMemberEnrollmentIds.has(enrollment.id) ? !isMember : isMember;
                            return (
                              <label key={enrollment.id} className="flex items-center justify-between p-2 text-sm">
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {student.firstName} {student.lastName}
                                  </div>
                                  <div className="text-xs text-gray-500">{student.phone || '—'}</div>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={enrolled}
                                  disabled={!editing?.id}
                                  onChange={() => {
                                    setPendingMemberEnrollmentIds((prev) => {
                                      const next = new Set(prev);
                                      if (next.has(enrollment.id)) next.delete(enrollment.id);
                                      else next.add(enrollment.id);
                                      return next;
                                    });
                                  }}
                                />
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end mt-2">
                      <button
                        type="button"
                        disabled={!editing?.id || pendingMemberEnrollmentIds.size === 0 || savingMembers}
                        onClick={async () => {
                          if (!editing?.id) return;
                          setSavingMembers(true);
                          setError('');
                          try {
                            for (const enrollmentId of Array.from(pendingMemberEnrollmentIds)) {
                              const match = memberCandidates.find((m) => m.enrollment.id === enrollmentId);
                              if (!match) continue;
                              const shouldBeMember = !match.isMember;
                              await studentsService.updateEnrollment(enrollmentId, {
                                groupId: shouldBeMember ? editing.id : null,
                                reason: 'Group members update (Groups tab)',
                              } as any);
                            }
                            setPendingMemberEnrollmentIds(new Set());
                            await fetchAll();
                          } catch (e: any) {
                            setError(e?.response?.data?.message || 'Failed to update members');
                          } finally {
                            setSavingMembers(false);
                          }
                        }}
                        className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm disabled:opacity-60"
                      >
                        {savingMembers ? 'Updating…' : 'Apply member changes'}
                      </button>
                    </div>
                    {!editing?.id ? (
                      <div className="text-xs text-gray-500 mt-2">Save the group first, then assign members.</div>
                    ) : null}
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


