'use client';

import { useEffect, useMemo, useState } from 'react';
import StandardListView from '@/components/StandardListView';
import EmptyState from '@/components/EmptyState';
import { allocationService, type AllocationRun, type CandidateGroup } from '@/lib/services';
import { ActionButton, Column } from '@/components/DataTable';
import { FiCheck, FiEye, FiPauseCircle, FiPlay, FiX, FiXCircle } from 'react-icons/fi';

function toErrorString(err: any) {
  return err?.response?.data?.message || err?.message || String(err || 'Unknown error');
}

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AllocationEnginePage() {
  const [runs, setRuns] = useState<AllocationRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string>('');
  const [candidateGroups, setCandidateGroups] = useState<CandidateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [selectedCG, setSelectedCG] = useState<CandidateGroup | null>(null);
  const [actionMode, setActionMode] = useState<'view' | 'confirm' | 'hold' | 'reject'>('view');
  const [reason, setReason] = useState('');

  const fetchRuns = async () => {
    setLoading(true);
    setError('');
    try {
      const r = await allocationService.listRuns();
      const list = Array.isArray(r.data) ? r.data : [];
      setRuns(list);
      if (!selectedRunId && list[0]?.id) setSelectedRunId(list[0].id);
    } catch (e: any) {
      setError(toErrorString(e));
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidateGroups = async (runId: string) => {
    if (!runId) return;
    setError('');
    try {
      const res = await allocationService.listCandidateGroups(runId);
      setCandidateGroups(Array.isArray(res.data) ? res.data : []);
    } catch (e: any) {
      setError(toErrorString(e));
    }
  };

  useEffect(() => {
    fetchRuns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedRunId) fetchCandidateGroups(selectedRunId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRunId]);

  const columns: Column<CandidateGroup>[] = [
    { key: 'name', label: 'Candidate', render: (v) => <span className="text-sm font-medium text-gray-900">{String(v || '-')}</span> },
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
      label: 'Time',
      render: (_: any, row: any) => (
        <span className="text-sm text-gray-700">
          {DOW[row?.dayOfWeek ?? 0]} {row?.startTime}–{row?.endTime}
        </span>
      ),
    },
    { key: 'studentCount', label: 'Students', render: (v) => <span className="text-sm text-gray-700">{Number(v || 0)}</span> },
    {
      key: 'room',
      label: 'Room',
      render: (_: any, row: any) => <span className="text-sm text-gray-700">{row?.room?.name || '—'}</span>,
    },
    {
      key: 'instructor',
      label: 'Instructor',
      render: (_: any, row: any) => {
        const u = row?.instructor?.user;
        const name = [u?.firstName, u?.lastName].filter(Boolean).join(' ').trim();
        return <span className="text-sm text-gray-700">{name || '—'}</span>;
      },
    },
    {
      key: 'margin',
      label: 'Margin',
      render: (_: any, row: any) => (
        <span className="text-sm text-gray-700">
          {Number(row?.expectedMargin || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (v: any, row: any) => (
        <span className="text-sm">
          <span className="capitalize">{String(v || '-')}</span>
          {row?.blockReason ? <span className="text-xs text-gray-500"> • {row.blockReason}</span> : null}
        </span>
      ),
    },
  ];

  const filtered = useMemo(() => candidateGroups, [candidateGroups]);

  const actions = (row: CandidateGroup): ActionButton[] => {
    const disabled = row.status === 'confirmed';
    const base: ActionButton[] = [
      {
        label: 'View',
        icon: <FiEye className="w-4 h-4" />,
        onClick: async () => {
          const res = await allocationService.getCandidateGroup(row.id);
          setSelectedCG(res.data as any);
          setActionMode('view');
          setReason('');
          setShowModal(true);
        },
      },
    ];

    if (disabled) return base;

    return [
      ...base,
      {
        label: 'Confirm',
        icon: <FiCheck className="w-4 h-4" />,
        onClick: async () => {
          const res = await allocationService.getCandidateGroup(row.id);
          setSelectedCG(res.data as any);
          setActionMode('confirm');
          setReason('');
          setShowModal(true);
        },
      },
      {
        label: 'Hold',
        icon: <FiPauseCircle className="w-4 h-4" />,
        onClick: async () => {
          const res = await allocationService.getCandidateGroup(row.id);
          setSelectedCG(res.data as any);
          setActionMode('hold');
          setReason('');
          setShowModal(true);
        },
      },
      {
        label: 'Reject',
        icon: <FiXCircle className="w-4 h-4" />,
        variant: 'danger',
        onClick: async () => {
          const res = await allocationService.getCandidateGroup(row.id);
          setSelectedCG(res.data as any);
          setActionMode('reject');
          setReason('');
          setShowModal(true);
        },
      },
    ];
  };

  const runOptions = runs.map((r) => ({
    id: r.id,
    label: `${new Date(r.fromDate).toLocaleDateString('en-GB')} → ${new Date(r.toDate).toLocaleDateString('en-GB')} • ${r.status} • ${
      r._count?.candidateGroups ?? 0
    } groups`,
  }));

  return (
    <>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">{error}</div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-sm font-medium text-gray-800">Allocation Runs</div>
          <button
            className="inline-flex items-center gap-2 px-3 py-2 border border-gray-400 rounded-md text-sm hover:bg-gray-50"
            onClick={fetchRuns}
          >
            <FiPlay className="w-4 h-4" /> Refresh
          </button>
        </div>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500">Run</label>
            <select
              value={selectedRunId}
              onChange={(e) => setSelectedRunId(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-400 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 text-sm"
            >
              <option value="">Select…</option>
              {runOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <StandardListView
        title="Allocation Engine"
        subtitle="Review Candidate Groups and confirm only when instructor + room + min capacity + profitability are satisfied."
        searchPlaceholder="Search…"
        onSearch={() => {}}
        searchValue=""
        filters={[]}
        columns={columns}
        data={filtered}
        loading={loading}
        actions={actions}
        emptyMessage="No candidate groups"
        emptyState={
          <EmptyState
            icon={<FiEye className="w-12 h-12 text-gray-400" />}
            title="No candidate groups"
            message="Create an allocation run to generate candidate groups."
          />
        }
        getRowId={(r) => r.id}
      />

      {showModal && selectedCG && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)} />
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">{selectedCG.name}</h2>
                    <div className="text-sm text-gray-500 mt-1">
                      {selectedCG.courseLevel?.course?.name || 'Course'} • Level {selectedCG.courseLevel?.sortOrder ?? '-'} •{' '}
                      {DOW[selectedCG.dayOfWeek ?? 0]} {selectedCG.startTime}–{selectedCG.endTime} • Students: {selectedCG.studentCount}
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
                    <div className="text-xs text-gray-500">Economics</div>
                    <div className="mt-1 text-sm text-gray-800">
                      Revenue: {Number(selectedCG.expectedRevenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      <br />
                      Cost: {Number(selectedCG.expectedCost || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      <br />
                      Margin: {Number(selectedCG.expectedMargin || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded p-3">
                    <div className="text-xs text-gray-500">Status</div>
                    <div className="mt-1 text-sm text-gray-800 capitalize">
                      {selectedCG.status} {selectedCG.blockReason ? `• ${selectedCG.blockReason}` : ''}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Room: {selectedCG.room?.name || '—'} • Instructor:{' '}
                      {[selectedCG.instructor?.user?.firstName, selectedCG.instructor?.user?.lastName].filter(Boolean).join(' ') || '—'}
                    </div>
                  </div>
                </div>

                {actionMode !== 'view' && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Reason (required)</label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full rounded-md border border-gray-400 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 text-sm p-2"
                      rows={3}
                      placeholder="Why are you confirming/holding/rejecting this candidate group?"
                    />
                  </div>
                )}

                <details className="bg-gray-50 border border-gray-200 rounded p-3">
                  <summary className="text-sm font-medium text-gray-700 cursor-pointer">Explainability log</summary>
                  <pre className="mt-2 text-xs overflow-auto">{JSON.stringify(selectedCG.explanation || {}, null, 2)}</pre>
                </details>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium"
                  >
                    Close
                  </button>

                  {actionMode === 'hold' && (
                    <button
                      type="button"
                      disabled={!reason.trim()}
                      onClick={async () => {
                        try {
                          await allocationService.holdOrReject(selectedCG.id, { action: 'hold', reason: reason.trim() });
                          setShowModal(false);
                          await fetchCandidateGroups(selectedRunId);
                        } catch (e: any) {
                          setError(toErrorString(e));
                        }
                      }}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm font-medium disabled:opacity-60"
                    >
                      Hold
                    </button>
                  )}

                  {actionMode === 'reject' && (
                    <button
                      type="button"
                      disabled={!reason.trim()}
                      onClick={async () => {
                        try {
                          await allocationService.holdOrReject(selectedCG.id, { action: 'reject', reason: reason.trim() });
                          setShowModal(false);
                          await fetchCandidateGroups(selectedRunId);
                        } catch (e: any) {
                          setError(toErrorString(e));
                        }
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium disabled:opacity-60"
                    >
                      Reject
                    </button>
                  )}

                  {actionMode === 'confirm' && (
                    <button
                      type="button"
                      disabled={!reason.trim()}
                      onClick={async () => {
                        try {
                          await allocationService.confirm(selectedCG.id, { reason: reason.trim() });
                          setShowModal(false);
                          await fetchCandidateGroups(selectedRunId);
                        } catch (e: any) {
                          setError(toErrorString(e));
                        }
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium disabled:opacity-60"
                    >
                      Confirm
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


