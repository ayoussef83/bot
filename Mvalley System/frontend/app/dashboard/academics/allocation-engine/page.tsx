'use client';

import { useEffect, useMemo, useState } from 'react';
import StandardListView from '@/components/StandardListView';
import EmptyState from '@/components/EmptyState';
import { classesService, teachingSlotsService, type TeachingSlot } from '@/lib/services';
import { ActionButton, Column } from '@/components/DataTable';
import { FiExternalLink, FiEye, FiPlus, FiRefreshCw, FiX } from 'react-icons/fi';

function toErrorString(err: any) {
  return err?.response?.data?.message || err?.message || String(err || 'Unknown error');
}

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AllocationEnginePage() {
  const [slots, setSlots] = useState<TeachingSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TeachingSlot | null>(null);

  const fetchSlots = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await teachingSlotsService.getAll();
      setSlots(Array.isArray(res.data) ? res.data : []);
    } catch (e: any) {
      setError(toErrorString(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns: Column<TeachingSlot>[] = [
    {
      key: 'status',
      label: 'Slot',
      render: (_: any, row: any) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900 capitalize">{row.status}</div>
          <div className="text-gray-500">
            {DOW[row.dayOfWeek ?? 0]} {row.startTime}–{row.endTime}
          </div>
        </div>
      ),
    },
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
      key: 'instructor',
      label: 'Instructor',
      render: (_: any, row: any) => (
        <span className="text-sm text-gray-700">
          {[row?.instructor?.user?.firstName, row?.instructor?.user?.lastName].filter(Boolean).join(' ') || '—'}
        </span>
      ),
    },
    {
      key: 'room',
      label: 'Room',
      render: (_: any, row: any) => <span className="text-sm text-gray-700">{row?.room?.name || '—'}</span>,
    },
    {
      key: 'capacity',
      label: 'Capacity',
      render: (_: any, row: any) => <span className="text-sm text-gray-700">{row.minCapacity}–{row.maxCapacity}</span>,
    },
    {
      key: 'group',
      label: 'Group',
      render: (_: any, row: any) => {
        const c = row?.currentClass;
        if (!c) return <span className="text-sm text-gray-500">—</span>;
        const count = Array.isArray(c.enrollments) ? c.enrollments.length : (c?._count?.enrollments ?? undefined);
        return (
          <div className="text-sm">
            <div className="font-medium text-gray-900">{c.name || 'Group'}</div>
            <div className="text-gray-500 capitalize">
              {c.lifecycleStatus || '—'} • {c.profitabilityStatus || '—'}{typeof count === 'number' ? ` • ${count} students` : ''}
            </div>
          </div>
        );
      },
    },
  ];

  const filtered = useMemo(() => slots, [slots]);

  const actions = (row: TeachingSlot): ActionButton[] => {
    const base: ActionButton[] = [
      {
        label: 'View',
        icon: <FiEye className="w-4 h-4" />,
        onClick: async () => {
          const res = await teachingSlotsService.getById(row.id);
          setSelectedSlot(res.data as any);
          setShowModal(true);
        },
      },
    ];

    if (row.status === 'open' && !row.currentClassId) {
      base.push({
        label: 'Create Group',
        icon: <FiPlus className="w-4 h-4" />,
        onClick: async () => {
          try {
            const created = await classesService.createFromTeachingSlot({ teachingSlotId: row.id });
            const classId = (created.data as any)?.id;
            await fetchSlots();
            if (classId) window.location.href = `/dashboard/academics/allocations?classId=${encodeURIComponent(classId)}`;
          } catch (e: any) {
            setError(toErrorString(e));
          }
        },
      });
    }

    if (row.currentClassId) {
      base.push({
        label: 'Manage Allocations',
        icon: <FiExternalLink className="w-4 h-4" />,
        onClick: () => {
          window.location.href = `/dashboard/academics/allocations?classId=${encodeURIComponent(String(row.currentClassId))}`;
        },
      });
    }

    return base;
  };

  return (
    <>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">{error}</div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-sm font-medium text-gray-800">Teaching Slots</div>
          <button
            className="inline-flex items-center gap-2 px-3 py-2 border border-gray-400 rounded-md text-sm hover:bg-gray-50"
            onClick={fetchSlots}
          >
            <FiRefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Ops defines capacity (Instructor + Room + Day + Time). Sales creates a group from a slot and fills it with students. The system blocks confirmation unless capacity and profitability rules are met.
        </p>
      </div>

      <StandardListView
        title="Allocation Engine"
        subtitle="TeachingSlot-driven: start from capacity, then fill groups safely."
        searchPlaceholder="Search…"
        onSearch={() => {}}
        searchValue=""
        filters={[]}
        columns={columns}
        data={filtered}
        loading={loading}
        actions={actions}
        emptyMessage="No teaching slots"
        emptyState={
          <EmptyState
            icon={<FiEye className="w-12 h-12 text-gray-400" />}
            title="No teaching slots"
            message="Ops should create teaching slots first (capacity), then Sales can create and fill groups."
          />
        }
        getRowId={(r) => r.id}
      />

      {showModal && selectedSlot && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)} />
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">
                      {selectedSlot.courseLevel?.course?.name || 'Course'} • Level {selectedSlot.courseLevel?.sortOrder ?? '-'}
                    </h2>
                    <div className="text-sm text-gray-500 mt-1">
                      Slot: <span className="capitalize">{selectedSlot.status}</span> • {DOW[selectedSlot.dayOfWeek ?? 0]} {selectedSlot.startTime}–{selectedSlot.endTime}
                      <br />
                      Instructor: {[selectedSlot.instructor?.user?.firstName, selectedSlot.instructor?.user?.lastName].filter(Boolean).join(' ') || '—'} • Room:{' '}
                      {selectedSlot.room?.name || '—'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 border border-gray-200 rounded p-3">
                    <div className="text-xs text-gray-500">Slot Rules</div>
                    <div className="mt-1 text-sm text-gray-800">
                      Capacity: {selectedSlot.minCapacity}–{selectedSlot.maxCapacity}
                      <br />
                      Price per student: {Number(selectedSlot.pricePerStudent || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} {selectedSlot.currency || 'EGP'}
                      <br />
                      Min margin: {Math.round(Number(selectedSlot.minMarginPct || 0) * 100)}%
                    </div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded p-3">
                    <div className="text-xs text-gray-500">Current Group</div>
                    {selectedSlot.currentClass ? (
                      <div className="mt-1 text-sm text-gray-800">
                        <div className="font-medium">{selectedSlot.currentClass.name}</div>
                        <div className="capitalize text-gray-700">
                          {selectedSlot.currentClass.lifecycleStatus} • {selectedSlot.currentClass.profitabilityStatus}
                        </div>
                        <div className="text-xs text-gray-600 mt-2">
                          Revenue: {Number(selectedSlot.currentClass.expectedRevenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} • Cost:{' '}
                          {Number(selectedSlot.currentClass.expectedCost || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} • Margin:{' '}
                          {Number(selectedSlot.currentClass.expectedMargin || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-1 text-sm text-gray-500">No group yet</div>
                    )}
                    <div className="text-xs text-gray-500 mt-2">
                      Slot created by: {selectedSlot.createdBy?.firstName ? `${selectedSlot.createdBy.firstName} ${selectedSlot.createdBy.lastName || ''}`.trim() : (selectedSlot.createdBy?.email || '—')}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}



