'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { instructorsService, Instructor, InstructorDocument } from '@/lib/services';
import StandardDetailView, { Tab, ActionButton, Breadcrumb } from '@/components/StandardDetailView';
import StatusBadge from '@/components/settings/StatusBadge';
import { Column } from '@/components/DataTable';
import DataTable from '@/components/DataTable';
import { FiEdit, FiTrash2, FiUserCheck, FiBookOpen, FiCalendar, FiDollarSign, FiUsers, FiClock, FiFileText, FiAlertTriangle, FiPlus } from 'react-icons/fi';

interface Class {
  id: string;
  name: string;
  location: string;
  capacity: number;
  minCapacity?: number;
  maxCapacity?: number;
  students?: any[];
  utilizationPercentage?: number;
}

interface Session {
  id: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: string;
  class?: {
    id: string;
    name: string;
  };
}

interface PayrollRow {
  id: string;
  periodYear: number;
  periodMonth: number;
  status: string;
  currency: string;
  totalAmount: number;
  generatedAt: string;
}

interface AvailabilityRow {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location?: string | null;
  isActive: boolean;
}

interface CostModelRow {
  id: string;
  type: string;
  amount: number;
  currency: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  notes?: string | null;
}

export default function InstructorDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [payroll, setPayroll] = useState<PayrollRow[]>([]);
  const [availability, setAvailability] = useState<AvailabilityRow[]>([]);
  const [costModels, setCostModels] = useState<CostModelRow[]>([]);
  const [documents, setDocuments] = useState<InstructorDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabError, setTabError] = useState<string>('');

  // Availability modal
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [editingAvailability, setEditingAvailability] = useState<AvailabilityRow | null>(null);
  const [availabilityForm, setAvailabilityForm] = useState({
    dayOfWeek: '0',
    startTime: '09:00',
    endTime: '17:00',
    location: '',
    isActive: true,
  });

  // Cost model modal
  const [showCostModelModal, setShowCostModelModal] = useState(false);
  const [editingCostModel, setEditingCostModel] = useState<CostModelRow | null>(null);
  const [costModelForm, setCostModelForm] = useState({
    type: 'hourly',
    amount: '',
    currency: 'EGP',
    effectiveFrom: new Date().toISOString().slice(0, 10),
    effectiveTo: '',
    notes: '',
  });

  // Documents
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docType, setDocType] = useState('contract');
  const [docVisibleToInstructor, setDocVisibleToInstructor] = useState(false);

  // Payroll generation
  const now = new Date();
  const [payrollYear, setPayrollYear] = useState<number>(now.getFullYear());
  const [payrollMonth, setPayrollMonth] = useState<number>(now.getMonth() + 1);

  const monthRange = useMemo(() => {
    const y = now.getFullYear();
    const m = now.getMonth();
    const start = new Date(y, m, 1, 0, 0, 0, 0);
    const end = new Date(y, m + 1, 1, 0, 0, 0, 0);
    return { start, end };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const utilization = useMemo(() => {
    // Utilization for current month: scheduled minutes / available minutes.
    const avail = availability || [];
    const sess = sessions || [];
    if (avail.length === 0) return null;

    const { start, end } = monthRange;
    const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
    const occurrencesByDow = Array(7).fill(0);
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(start.getFullYear(), start.getMonth(), d);
      occurrencesByDow[dt.getDay()]++;
    }
    const toMin = (hhmm: string) => {
      const m = /^(\d{2}):(\d{2})$/.exec(hhmm || '');
      if (!m) return null;
      const hh = Number(m[1]);
      const mm = Number(m[2]);
      if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
      return hh * 60 + mm;
    };

    let availableMinutes = 0;
    for (const a of avail) {
      if (!a.isActive) continue;
      const s = toMin(a.startTime);
      const e = toMin(a.endTime);
      if (s == null || e == null || s >= e) continue;
      availableMinutes += (e - s) * (occurrencesByDow[a.dayOfWeek] || 0);
    }

    let scheduledMinutes = 0;
    for (const s of sess) {
      const dt = new Date(s.scheduledDate);
      if (dt < start || dt >= end) continue;
      scheduledMinutes += Math.max(0, (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 60000);
    }

    if (availableMinutes <= 0) return null;
    const pct = Math.min(999, (scheduledMinutes / availableMinutes) * 100);
    return {
      pct,
      scheduledMinutes: Math.round(scheduledMinutes),
      availableMinutes: Math.round(availableMinutes),
    };
  }, [availability, sessions, monthRange]);

  const user = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const str = localStorage.getItem('user');
    return str ? JSON.parse(str) : null;
  }, []);

  useEffect(() => {
    if (id) {
      fetchInstructor(id);
      fetchPayroll(id);
    } else {
      setError('Missing instructor id');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchInstructor = async (instructorId: string) => {
    try {
      const response = await instructorsService.getById(instructorId);
      setInstructor(response.data);
      setClasses((response.data as any).classes || []);
      setSessions((response.data as any).sessions || []);
      setAvailability((response.data as any).availability || []);
      setCostModels((response.data as any).costModels || []);
      setDocuments((response.data as any).documents || []);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load instructor');
    } finally {
      setLoading(false);
    }
  };

  const fetchPayroll = async (instructorId: string) => {
    try {
      const response = await instructorsService.getPayroll(instructorId);
      setPayroll(response.data || []);
    } catch (err: any) {
      // ignore (role-based access)
    }
  };

  const refreshAvailability = async () => {
    if (!id) return;
    try {
      const res = await instructorsService.listAvailability(String(id));
      setAvailability(res.data || []);
    } catch (e: any) {
      setTabError(e?.response?.data?.message || 'Failed to load availability');
    }
  };

  const refreshCostModels = async () => {
    if (!id) return;
    try {
      const res = await instructorsService.listCostModels(String(id));
      setCostModels(res.data || []);
    } catch (e: any) {
      setTabError(e?.response?.data?.message || 'Failed to load cost models');
    }
  };

  const refreshDocuments = async () => {
    if (!id) return;
    try {
      const res = await instructorsService.listDocuments(String(id));
      setDocuments(res.data || []);
    } catch (e: any) {
      setTabError(e?.response?.data?.message || 'Failed to load documents');
    }
  };

  const handleDelete = async () => {
    if (!instructor || !confirm('Are you sure you want to delete this instructor?')) return;
    try {
      await instructorsService.delete(instructor.id);
      router.push('/dashboard/instructors');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete instructor');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading instructor details...</div>
      </div>
    );
  }

  if (error || !instructor) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error || 'Instructor not found'}
        </div>
        <button
          onClick={() => router.push('/dashboard/instructors')}
          className="text-indigo-600 hover:text-indigo-900"
        >
          ← Back to Instructors
        </button>
      </div>
    );
  }

  const instructorName = instructor.user
    ? `${instructor.user.firstName} ${instructor.user.lastName}`
    : 'Unknown Instructor';

  // Breadcrumbs
  const breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard', href: '/dashboard/management' },
    { label: 'Instructors', href: '/dashboard/instructors' },
    { label: instructorName, href: `/dashboard/instructors/details?id=${id}` },
  ];

  // Action buttons (role-based)
  const actions: ActionButton[] = [
    ...(user?.role !== 'instructor'
      ? [
          {
            label: 'Edit',
            onClick: () => {
              router.push(`/dashboard/instructors?editId=${encodeURIComponent(String(id || ''))}&stayList=true`);
            },
            icon: <FiEdit className="w-4 h-4" />,
          } as ActionButton,
        ]
      : []),
    ...(user?.role === 'super_admin'
      ? [
          {
            label: 'Delete',
            onClick: handleDelete,
            variant: 'danger',
            icon: <FiTrash2 className="w-4 h-4" />,
          } as ActionButton,
        ]
      : []),
  ];

  // Class columns
  const classColumns: Column<Class>[] = [
    {
      key: 'name',
      label: 'Class Name',
      render: (value, row) => (
        <a
          href={`/dashboard/courses/details?id=${row.id}`}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
          onClick={(e) => {
            e.preventDefault();
            router.push(`/dashboard/courses/details?id=${row.id}`);
          }}
        >
          {value}
        </a>
      ),
    },
    {
      key: 'location',
      label: 'Location',
      render: (value) => <span className="text-sm text-gray-500">{value}</span>,
    },
    {
      key: 'capacity',
      label: 'Capacity',
      render: (_, row) => (
        <span className="text-sm text-gray-500">
          {row.students?.length || 0} / {(row.maxCapacity ?? row.capacity)}
          {row.minCapacity != null ? ` (min ${row.minCapacity})` : ''}
        </span>
      ),
    },
    {
      key: 'utilization',
      label: 'Utilization',
      render: (_, row) => (
        <span className="text-sm text-gray-500">
          {(row.utilizationPercentage || 0).toFixed(1)}%
        </span>
      ),
    },
  ];

  // Session columns
  const sessionColumns: Column<Session>[] = [
    {
      key: 'date',
      label: 'Date',
      render: (_, row) => (
        <span className="text-sm text-gray-900">
          {new Date(row.scheduledDate).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'class',
      label: 'Class',
      render: (_, row) => (
        <a
          href={`/dashboard/courses/details?id=${row.class?.id}`}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
          onClick={(e) => {
            e.preventDefault();
            if (row.class?.id) {
              router.push(`/dashboard/courses/details?id=${row.class.id}`);
            }
          }}
        >
          {row.class?.name || '-'}
        </a>
      ),
    },
    {
      key: 'time',
      label: 'Time',
      render: (_, row) => (
        <span className="text-sm text-gray-500">
          {new Date(row.startTime).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}{' '}
          -{' '}
          {new Date(row.endTime).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => {
        const statusMap: { [key: string]: 'active' | 'inactive' | 'warning' } = {
          completed: 'active',
          scheduled: 'warning',
          cancelled: 'inactive',
        };
        return <StatusBadge status={statusMap[value] || 'inactive'} label={value} />;
      },
    },
  ];

  const normalizedRole = String(user?.role || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
  const show = (roles: string[]) =>
    !user?.role || roles.includes(normalizedRole) || normalizedRole === 'super_admin';
  const canOps = show(['operations', 'super_admin']);
  const canAccounting = show(['accounting', 'super_admin']);
  const canHr = show(['hr', 'super_admin']);

  // Tabs
  const tabs: Tab[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <FiUserCheck className="w-4 h-4" />,
      content: (
        <div className="space-y-6">
          {(((instructor as any).availability?.length || 0) === 0) && show(['operations', 'management', 'super_admin']) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
              <FiAlertTriangle className="w-5 h-5 text-yellow-700 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-yellow-800">Utilization risk</div>
                <div className="text-sm text-yellow-700">No availability is defined for this instructor.</div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            {instructor.user && (
              <>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Name</h3>
                  <p className="text-lg text-gray-900">
                    {instructor.user.firstName} {instructor.user.lastName}
                  </p>
                </div>
                {instructor.user.email && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
                    <p className="text-lg text-gray-900">{instructor.user.email}</p>
                  </div>
                )}
              </>
            )}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
              <p className="text-lg text-gray-900 capitalize">{(instructor as any).user?.status || 'active'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Utilization (this month)</h3>
              <p className="text-lg text-gray-900">
                {utilization ? `${utilization.pct.toFixed(0)}%` : '—'}
              </p>
              {utilization && (
                <p className="text-xs text-gray-500 mt-1">
                  {Math.round(utilization.scheduledMinutes / 60)}h scheduled / {Math.round(utilization.availableMinutes / 60)}h available
                </p>
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                <FiDollarSign className="w-4 h-4" />
                Fees Type (legacy)
              </h3>
              <p className="text-lg text-gray-900 capitalize">{instructor.costType}</p>
              <p className="text-xs text-gray-400 mt-1">Accounting cost models are the source of truth.</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                <FiDollarSign className="w-4 h-4" />
                Fees (legacy)
              </h3>
              <p className="text-lg text-gray-900">
                EGP {instructor.costAmount.toLocaleString()}
                {instructor.costType === 'hourly' && ' / hour'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Skills & Domains</h3>
              {((instructor as any).skills || []).length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {(instructor as any).skills.map((s: any) => (
                    <span key={s.id} className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 border border-gray-200">
                      {s.name}{s.level ? ` • ${String(s.level).replace('_',' ')}` : ''}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500">No skills recorded.</div>
              )}
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Contract Summary</h3>
              {((instructor as any).contracts || []).length > 0 ? (
                <div className="space-y-2">
                  {((instructor as any).contracts || []).slice(0, 2).map((c: any) => (
                    <div key={c.id} className="text-sm text-gray-700">
                      <span className="font-medium">{c.contractType}</span>{' '}
                      <span className="text-gray-500">
                        ({new Date(c.startDate).toLocaleDateString()}
                        {c.endDate ? ` → ${new Date(c.endDate).toLocaleDateString()}` : ''})
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500">No contracts recorded.</div>
              )}
            </div>
          </div>
        </div>
      ),
    },
    ...(show(['operations', 'management', 'super_admin'])
      ? [
          {
            id: 'availability',
            label: 'Availability',
            icon: <FiClock className="w-4 h-4" />,
            content: (
              <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
                {tabError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                    {tabError}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Sessions are blocked if scheduled outside availability/blackout dates.
                  </div>
                  {canOps && (
                    <button
                      className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                      onClick={() => {
                        setEditingAvailability(null);
                        setAvailabilityForm({ dayOfWeek: '0', startTime: '09:00', endTime: '17:00', location: '', isActive: true });
                        setShowAvailabilityModal(true);
                      }}
                    >
                      <FiPlus className="w-4 h-4" />
                      Add Availability
                    </button>
                  )}
                </div>

                <DataTable
                  columns={[
                    {
                      key: 'dayOfWeek',
                      label: 'Day',
                      render: (v) => {
                        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                        return <span className="text-sm">{days[Number(v)] || v}</span>;
                      },
                    },
                    { key: 'startTime', label: 'From', render: (v) => <span className="text-sm">{v}</span> },
                    { key: 'endTime', label: 'To', render: (v) => <span className="text-sm">{v}</span> },
                    { key: 'location', label: 'Location', render: (v) => <span className="text-sm text-gray-600">{v || 'Any'}</span> },
                    { key: 'isActive', label: 'Active', render: (v) => <span className="text-sm text-gray-600">{v ? 'Yes' : 'No'}</span> },
                  ]}
                  data={availability}
                  emptyMessage="No availability set"
                  actions={
                    canOps
                      ? (row: any) => [
                          {
                            label: 'Edit',
                            onClick: () => {
                              setEditingAvailability(row);
                              setAvailabilityForm({
                                dayOfWeek: String(row.dayOfWeek ?? '0'),
                                startTime: row.startTime || '09:00',
                                endTime: row.endTime || '17:00',
                                location: row.location || '',
                                isActive: Boolean(row.isActive),
                              });
                              setShowAvailabilityModal(true);
                            },
                            icon: <FiEdit className="w-4 h-4" />,
                          },
                          {
                            label: 'Delete',
                            variant: 'danger',
                            onClick: async () => {
                              if (!confirm('Delete this availability?')) return;
                              try {
                                await instructorsService.deleteAvailability(row.id);
                                await refreshAvailability();
                              } catch (e: any) {
                                setTabError(e?.response?.data?.message || 'Failed to delete availability');
                              }
                            },
                            icon: <FiTrash2 className="w-4 h-4" />,
                          },
                        ]
                      : undefined
                  }
                />

                {showAvailabilityModal && (
                  <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowAvailabilityModal(false)} />
                      <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 space-y-4">
                          <h2 className="text-xl font-semibold">{editingAvailability ? 'Edit Availability' : 'Add Availability'}</h2>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Day</label>
                              <select
                                value={availabilityForm.dayOfWeek}
                                onChange={(e) => setAvailabilityForm({ ...availabilityForm, dayOfWeek: e.target.value })}
                                className="mt-1 block w-full rounded-md border border-gray-400 shadow-sm focus:border-indigo-600 focus:ring-indigo-600"
                              >
                                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d, idx) => (
                                  <option key={d} value={String(idx)}>{d}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Location</label>
                              <select
                                value={availabilityForm.location}
                                onChange={(e) => setAvailabilityForm({ ...availabilityForm, location: e.target.value })}
                                className="mt-1 block w-full rounded-md border border-gray-400 shadow-sm focus:border-indigo-600 focus:ring-indigo-600"
                              >
                                <option value="">Any</option>
                                {['MOA','Espace','SODIC','PalmHills'].map((loc) => (
                                  <option key={loc} value={loc}>{loc}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">From</label>
                              <input
                                type="time"
                                value={availabilityForm.startTime}
                                onChange={(e) => setAvailabilityForm({ ...availabilityForm, startTime: e.target.value })}
                                className="mt-1 block w-full rounded-md border border-gray-400 shadow-sm focus:border-indigo-600 focus:ring-indigo-600"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">To</label>
                              <input
                                type="time"
                                value={availabilityForm.endTime}
                                onChange={(e) => setAvailabilityForm({ ...availabilityForm, endTime: e.target.value })}
                                className="mt-1 block w-full rounded-md border border-gray-400 shadow-sm focus:border-indigo-600 focus:ring-indigo-600"
                              />
                            </div>
                          </div>
                          <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                              type="checkbox"
                              checked={availabilityForm.isActive}
                              onChange={(e) => setAvailabilityForm({ ...availabilityForm, isActive: e.target.checked })}
                              className="rounded border-gray-300"
                            />
                            Active
                          </label>
                          <div className="flex gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => setShowAvailabilityModal(false)}
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  setTabError('');
                                  const payload: any = {
                                    dayOfWeek: parseInt(availabilityForm.dayOfWeek),
                                    startTime: availabilityForm.startTime,
                                    endTime: availabilityForm.endTime,
                                    location: availabilityForm.location || undefined,
                                    isActive: availabilityForm.isActive,
                                  };
                                  if (!id) return;
                                  if (editingAvailability) {
                                    await instructorsService.updateAvailability(editingAvailability.id, payload);
                                  } else {
                                    await instructorsService.addAvailability(String(id), payload);
                                  }
                                  setShowAvailabilityModal(false);
                                  await refreshAvailability();
                                } catch (e: any) {
                                  setTabError(e?.response?.data?.message || 'Failed to save availability');
                                }
                              }}
                              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ),
          },
        ]
      : []),
    {
      id: 'assignments',
      label: 'Assignments',
      icon: <FiCalendar className="w-4 h-4" />,
      content: (
        <div className="space-y-6">
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Courses</div>
            {classes.length > 0 ? (
              <DataTable
                columns={classColumns}
                data={classes}
                emptyMessage="No courses assigned"
                onRowClick={(row) => router.push(`/dashboard/courses/details?id=${row.id}`)}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No courses assigned</p>
              </div>
            )}
          </div>

          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Sessions</div>
            {sessions.length > 0 ? (
              <DataTable
                columns={sessionColumns}
                data={sessions}
                emptyMessage="No sessions found"
                onRowClick={(row) => router.push(`/dashboard/sessions/details?id=${row.id}`)}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No sessions found</p>
              </div>
            )}
          </div>
        </div>
      ),
    },
    ...(show(['accounting', 'management', 'instructor', 'super_admin'])
      ? [
          {
            id: 'payroll',
            label: 'Payroll',
            icon: <FiDollarSign className="w-4 h-4" />,
            content: (
              <div className="space-y-6">
                {tabError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                    {tabError}
                  </div>
                )}

                {canAccounting && (
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex flex-wrap items-end gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Year</label>
                        <input
                          type="number"
                          min="2000"
                          max="2100"
                          value={payrollYear}
                          onChange={(e) => setPayrollYear(parseInt(e.target.value))}
                          className="mt-1 block w-28 rounded-md border border-gray-400 shadow-sm focus:border-indigo-600 focus:ring-indigo-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Month</label>
                        <input
                          type="number"
                          min="1"
                          max="12"
                          value={payrollMonth}
                          onChange={(e) => setPayrollMonth(parseInt(e.target.value))}
                          className="mt-1 block w-24 rounded-md border border-gray-400 shadow-sm focus:border-indigo-600 focus:ring-indigo-600"
                        />
                      </div>
                      <button
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
                        onClick={async () => {
                          if (!id) return;
                          try {
                            setTabError('');
                            await instructorsService.generatePayroll({ year: payrollYear, month: payrollMonth, instructorId: String(id) });
                            await fetchPayroll(String(id));
                          } catch (e: any) {
                            setTabError(e?.response?.data?.message || 'Failed to generate payroll');
                          }
                        }}
                      >
                        Generate Payroll
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Payroll generation requires attendance for all included sessions.
                    </p>
                  </div>
                )}

                <DataTable
                  columns={[
                    {
                      key: 'period',
                      label: 'Period',
                      render: (_, r: any) => (
                        <span className="text-sm">
                          {r.periodYear}-{String(r.periodMonth).padStart(2, '0')}
                        </span>
                      ),
                    },
                    { key: 'status', label: 'Status', render: (v: any) => <span className="text-sm text-gray-600">{v}</span> },
                    {
                      key: 'total',
                      label: 'Total',
                      render: (_, r: any) => (
                        <span className="text-sm">
                          {r.currency} {Number(r.totalAmount || 0).toLocaleString()}
                        </span>
                      ),
                    },
                    {
                      key: 'generatedAt',
                      label: 'Generated',
                      render: (v: any) => <span className="text-sm text-gray-600">{v ? new Date(v).toLocaleDateString() : '—'}</span>,
                    },
                  ]}
                  data={payroll}
                  emptyMessage="No payroll snapshots yet"
                />

                <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-700">Cost Models</div>
                    {canAccounting && (
                      <button
                        className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                        onClick={() => {
                          setEditingCostModel(null);
                          setCostModelForm({
                            type: 'hourly',
                            amount: '',
                            currency: 'EGP',
                            effectiveFrom: new Date().toISOString().slice(0, 10),
                            effectiveTo: '',
                            notes: '',
                          });
                          setShowCostModelModal(true);
                        }}
                      >
                        <FiPlus className="w-4 h-4" />
                        Add Cost Model
                      </button>
                    )}
                  </div>

                  <DataTable
                    columns={[
                      { key: 'type', label: 'Type', render: (v) => <span className="text-sm capitalize">{String(v).replace('_',' ')}</span> },
                      { key: 'amount', label: 'Amount', render: (v, r: any) => <span className="text-sm">{r.currency} {Number(v || 0).toLocaleString()}</span> },
                      { key: 'effectiveFrom', label: 'From', render: (v) => <span className="text-sm text-gray-600">{v ? new Date(v).toLocaleDateString() : '—'}</span> },
                      { key: 'effectiveTo', label: 'To', render: (v) => <span className="text-sm text-gray-600">{v ? new Date(v).toLocaleDateString() : '—'}</span> },
                      { key: 'notes', label: 'Notes', render: (v) => <span className="text-sm text-gray-600">{v || '—'}</span> },
                    ]}
                    data={costModels}
                    emptyMessage="No cost models"
                    actions={
                      canAccounting
                        ? (row: any) => [
                            {
                              label: 'Edit',
                              onClick: () => {
                                setEditingCostModel(row);
                                setCostModelForm({
                                  type: row.type || 'hourly',
                                  amount: String(row.amount ?? ''),
                                  currency: row.currency || 'EGP',
                                  effectiveFrom: row.effectiveFrom ? String(row.effectiveFrom).slice(0, 10) : new Date().toISOString().slice(0, 10),
                                  effectiveTo: row.effectiveTo ? String(row.effectiveTo).slice(0, 10) : '',
                                  notes: row.notes || '',
                                });
                                setShowCostModelModal(true);
                              },
                              icon: <FiEdit className="w-4 h-4" />,
                            },
                            {
                              label: 'Delete',
                              variant: 'danger',
                              onClick: async () => {
                                if (!confirm('Delete this cost model?')) return;
                                try {
                                  await instructorsService.deleteCostModel(row.id);
                                  await refreshCostModels();
                                } catch (e: any) {
                                  setTabError(e?.response?.data?.message || 'Failed to delete cost model');
                                }
                              },
                              icon: <FiTrash2 className="w-4 h-4" />,
                            },
                          ]
                        : undefined
                    }
                  />

                  {showCostModelModal && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowCostModelModal(false)} />
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 space-y-4">
                            <h2 className="text-xl font-semibold">{editingCostModel ? 'Edit Cost Model' : 'Add Cost Model'}</h2>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Type</label>
                                <select
                                  value={costModelForm.type}
                                  onChange={(e) => setCostModelForm({ ...costModelForm, type: e.target.value })}
                                  className="mt-1 block w-full rounded-md border border-gray-400 shadow-sm focus:border-indigo-600 focus:ring-indigo-600"
                                >
                                  <option value="hourly">Hourly</option>
                                  <option value="per_session">Per Session</option>
                                  <option value="monthly">Monthly</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Currency</label>
                                <input
                                  value={costModelForm.currency}
                                  onChange={(e) => setCostModelForm({ ...costModelForm, currency: e.target.value })}
                                  className="mt-1 block w-full rounded-md border border-gray-400 shadow-sm focus:border-indigo-600 focus:ring-indigo-600"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Amount</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={costModelForm.amount}
                                  onChange={(e) => setCostModelForm({ ...costModelForm, amount: e.target.value })}
                                  className="mt-1 block w-full rounded-md border border-gray-400 shadow-sm focus:border-indigo-600 focus:ring-indigo-600"
                                />
                              </div>
                              <div />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Effective From</label>
                                <input
                                  type="date"
                                  value={costModelForm.effectiveFrom}
                                  onChange={(e) => setCostModelForm({ ...costModelForm, effectiveFrom: e.target.value })}
                                  className="mt-1 block w-full rounded-md border border-gray-400 shadow-sm focus:border-indigo-600 focus:ring-indigo-600"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Effective To (optional)</label>
                                <input
                                  type="date"
                                  value={costModelForm.effectiveTo}
                                  onChange={(e) => setCostModelForm({ ...costModelForm, effectiveTo: e.target.value })}
                                  className="mt-1 block w-full rounded-md border border-gray-400 shadow-sm focus:border-indigo-600 focus:ring-indigo-600"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Notes</label>
                              <textarea
                                value={costModelForm.notes}
                                onChange={(e) => setCostModelForm({ ...costModelForm, notes: e.target.value })}
                                className="mt-1 block w-full rounded-md border border-gray-400 shadow-sm focus:border-indigo-600 focus:ring-indigo-600"
                                rows={3}
                              />
                            </div>
                            <div className="flex gap-2 pt-2">
                              <button
                                type="button"
                                onClick={() => setShowCostModelModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!id) return;
                                  try {
                                    setTabError('');
                                    const payload: any = {
                                      type: costModelForm.type,
                                      amount: parseFloat(String(costModelForm.amount || 0)),
                                      currency: costModelForm.currency,
                                      effectiveFrom: costModelForm.effectiveFrom,
                                      effectiveTo: costModelForm.effectiveTo ? costModelForm.effectiveTo : undefined,
                                      notes: costModelForm.notes || undefined,
                                    };
                                    if (editingCostModel) {
                                      await instructorsService.updateCostModel(editingCostModel.id, payload);
                                    } else {
                                      await instructorsService.createCostModel(String(id), payload);
                                    }
                                    setShowCostModelModal(false);
                                    await refreshCostModels();
                                  } catch (e: any) {
                                    setTabError(e?.response?.data?.message || 'Failed to save cost model');
                                  }
                                }}
                                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ),
          },
        ]
      : []),
    ...(show(['management', 'super_admin'])
      ? [
          {
            id: 'performance',
            label: 'Performance',
            icon: <FiUsers className="w-4 h-4" />,
            content: (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <pre className="text-xs bg-gray-50 border border-gray-200 rounded p-3 overflow-auto">
{JSON.stringify((instructor as any).feedbackSummaries || [], null, 2)}
                </pre>
              </div>
            ),
          },
        ]
      : []),
    ...(show(['hr', 'management', 'super_admin'])
      ? [
          {
            id: 'documents',
            label: 'Documents',
            icon: <FiFileText className="w-4 h-4" />,
            content: (
              <div className="space-y-4">
                {tabError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                    {tabError}
                  </div>
                )}

                {canHr && (
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-semibold text-gray-900">Upload document</div>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!id || !docFile) return;
                          try {
                            setUploadingDoc(true);
                            setTabError('');
                            const presign = await instructorsService.presignDocumentUpload(String(id), {
                              type: docType,
                              name: docFile.name,
                              contentType: docFile.type || 'application/octet-stream',
                              visibleToInstructor: docVisibleToInstructor,
                            });
                            const uploadUrl = presign.data?.uploadUrl;
                            if (!uploadUrl) throw new Error('Upload URL missing');
                            await fetch(uploadUrl, {
                              method: 'PUT',
                              headers: { 'Content-Type': docFile.type || 'application/octet-stream' },
                              body: docFile,
                            });
                            setDocFile(null);
                            await refreshDocuments();
                          } catch (e: any) {
                            setTabError(e?.response?.data?.message || e?.message || 'Failed to upload document');
                          } finally {
                            setUploadingDoc(false);
                          }
                        }}
                        disabled={!docFile || uploadingDoc}
                        className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md ${
                          !docFile || uploadingDoc
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                      >
                        <FiPlus className="w-4 h-4" />
                        {uploadingDoc ? 'Uploading…' : 'Upload'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Type</label>
                        <select
                          value={docType}
                          onChange={(e) => setDocType(e.target.value)}
                          className="mt-1 block w-full rounded-md border border-gray-400 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 text-sm"
                        >
                          <option value="id">ID</option>
                          <option value="contract">Contract</option>
                          <option value="certificate">Certificate</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700">File</label>
                        <input
                          type="file"
                          onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                          className="mt-1 block w-full rounded-md border border-gray-400 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 text-sm"
                        />
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={docVisibleToInstructor}
                            onChange={(e) => setDocVisibleToInstructor(e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          Visible to instructor
                        </label>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Files are uploaded to S3 using a short-lived secure link.
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-900">Documents</div>
                    <button
                      type="button"
                      onClick={refreshDocuments}
                      className="text-sm text-indigo-600 hover:text-indigo-900"
                    >
                      Refresh
                    </button>
                  </div>
                  {documents.length === 0 ? (
                    <div className="p-4 text-sm text-gray-500">No documents uploaded.</div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {documents.map((d) => (
                        <div key={d.id} className="p-4 flex items-start justify-between gap-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{d.name}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              <span className="capitalize">{d.type}</span>
                              {d.expiresAt ? ` • Expires ${new Date(d.expiresAt).toLocaleDateString()}` : ''}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  setTabError('');
                                  const res = await instructorsService.presignDocumentDownload(d.id);
                                  const url = res.data?.url;
                                  if (url) window.open(url, '_blank', 'noopener,noreferrer');
                                } catch (e: any) {
                                  setTabError(e?.response?.data?.message || 'Failed to open document');
                                }
                              }}
                              className="px-3 py-2 text-sm font-medium rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                              View / Download
                            </button>
                            {canHr && (
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!confirm('Delete this document?')) return;
                                  try {
                                    setTabError('');
                                    await instructorsService.deleteDocument(d.id);
                                    await refreshDocuments();
                                  } catch (e: any) {
                                    setTabError(e?.response?.data?.message || 'Failed to delete document');
                                  }
                                }}
                                className="px-3 py-2 text-sm font-medium rounded-md bg-red-600 text-white hover:bg-red-700"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ),
          },
        ]
      : []),
  ];

  // Sidebar with quick actions
  const sidebar = (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
        <div className="space-y-2">
          <button
            onClick={() => router.push(`/dashboard/academics/allocations?instructorId=${encodeURIComponent(instructor.id)}`)}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            📚 Manage Allocations
          </button>
          <button
            onClick={() => router.push(`/dashboard/sessions?instructor=${instructor.id}`)}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            📅 View Sessions
          </button>
        </div>
      </div>
      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Assigned Classes:</span>
            <span className="font-medium text-gray-900">{classes.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Total Sessions:</span>
            <span className="font-medium text-gray-900">{sessions.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Total Students:</span>
            <span className="font-medium text-gray-900">
              {classes.reduce((sum, c) => sum + (c.students?.length || 0), 0)}
            </span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-200">
            <span className="text-gray-500">Fees Type:</span>
            <span className="font-medium text-gray-900 capitalize">{instructor.costType}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <StandardDetailView
      title={instructorName}
      subtitle={instructor.user?.email || 'Instructor Profile'}
      actions={actions}
      tabs={tabs}
      breadcrumbs={breadcrumbs}
      sidebar={sidebar}
    />
  );
}

