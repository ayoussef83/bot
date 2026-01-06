'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { instructorsService, Instructor, InstructorDocument } from '@/lib/services';
import api from '@/lib/api';
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
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
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
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [docPreviewUrl, setDocPreviewUrl] = useState<string>('');
  const [docPreviewContentType, setDocPreviewContentType] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabErrors, setTabErrors] = useState<Record<string, string>>({});

  const setTabError = (tabId: string, message: string) =>
    setTabErrors((s) => ({ ...s, [tabId]: message }));
  const clearTabError = (tabId: string) =>
    setTabErrors((s) => ({ ...s, [tabId]: '' }));

  // Inline edit (avoid old list modal)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    status: 'active',
    costType: 'hourly',
    costAmount: '',
    age: '',
    educationLevel: 'undergraduate',
    livingArea: '',
  });

  // Sidebar summary range
  const [summaryPreset, setSummaryPreset] = useState<'7d' | 'month' | 'year' | 'all' | 'custom'>('month');
  const [summaryFrom, setSummaryFrom] = useState<string>('');
  const [summaryTo, setSummaryTo] = useState<string>('');

  // Availability fast editor
  const [availabilityDrafts, setAvailabilityDrafts] = useState<Record<string, Partial<AvailabilityRow>>>({});
  const [newSlot, setNewSlot] = useState<Partial<AvailabilityRow>>({
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '17:00',
    location: '',
    isActive: true,
    effectiveFrom: '',
    effectiveTo: '',
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

  const currentMonthFees = useMemo(() => {
    const { start, end } = monthRange;
    const monthSessions = (sessions || []).filter((s) => {
      const d = new Date(s.scheduledDate);
      return d >= start && d < end && s.status === 'completed';
    });

    const cm = (costModels || []) as any[];
    const pickCostModel = (at: Date) => {
      const ms = at.getTime();
      const matches = cm.filter((m) => {
        const from = new Date(m.effectiveFrom).getTime();
        const to = m.effectiveTo ? new Date(m.effectiveTo).getTime() : Infinity;
        return from <= ms && ms <= to;
      });
      matches.sort((a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime());
      return matches[0] || null;
    };

    let total = 0;
    for (const s of monthSessions) {
      const at = new Date(s.startTime || s.scheduledDate);
      const model = pickCostModel(at);
      const legacyType = (instructor as any)?.costType || 'hourly';
      const legacyAmount = Number((instructor as any)?.costAmount ?? 0);
      const type = model?.type || legacyType;
      const amount = Number(model?.amount ?? legacyAmount ?? 0);
      if (!Number.isFinite(amount)) continue;
      if (type === 'per_session') {
        total += amount;
      } else if (type === 'monthly') {
        // Show monthly once (not per session)
        total = amount;
        break;
      } else {
        const durationMs = new Date(s.endTime).getTime() - new Date(s.startTime).getTime();
        const hours = durationMs / 3600000;
        if (!Number.isFinite(hours)) continue;
        total += Math.max(0, hours) * amount;
      }
    }

    return Math.round(total * 100) / 100;
  }, [sessions, costModels, monthRange, instructor]);

  const summaryRange = useMemo(() => {
    const now = new Date();
    if (summaryPreset === 'all') return { from: null as Date | null, to: null as Date | null };
    if (summaryPreset === '7d') return { from: new Date(now.getTime() - 7 * 24 * 3600 * 1000), to: now };
    if (summaryPreset === 'month') return { from: monthRange.start, to: monthRange.end };
    if (summaryPreset === 'year') return { from: new Date(now.getFullYear(), 0, 1), to: now };
    if (summaryPreset === 'custom') {
      const f = summaryFrom ? new Date(summaryFrom) : null;
      const t = summaryTo ? new Date(summaryTo) : null;
      return { from: f, to: t };
    }
    return { from: monthRange.start, to: monthRange.end };
  }, [summaryPreset, summaryFrom, summaryTo, monthRange]);

  const sessionsInSummaryRange = useMemo(() => {
    const { from, to } = summaryRange;
    return (sessions || []).filter((s) => {
      const d = new Date(s.scheduledDate);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [sessions, summaryRange]);

  const feesInSummaryRange = useMemo(() => {
    const { from, to } = summaryRange;
    const rangeSessions = (sessions || []).filter((s) => {
      if (s.status !== 'completed') return false;
      const d = new Date(s.scheduledDate);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });

    const cm = (costModels || []) as any[];
    const pickModelAt = (at: Date) => {
      const ms = at.getTime();
      const matches = cm.filter((m) => {
        const from = new Date(m.effectiveFrom).getTime();
        const to = m.effectiveTo ? new Date(m.effectiveTo).getTime() : Infinity;
        return from <= ms && ms <= to;
      });
      matches.sort((a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime());
      return matches[0] || null;
    };

    const legacyType = (instructor as any)?.costType || 'hourly';
    const legacyAmount = Number((instructor as any)?.costAmount ?? 0);

    let total = 0;
    for (const s of rangeSessions) {
      const at = new Date(s.startTime || s.scheduledDate);
      const model = pickModelAt(at);
      const type = model?.type || legacyType;
      const amount = Number(model?.amount ?? legacyAmount ?? 0);
      if (!Number.isFinite(amount)) continue;
      if (type === 'per_session') {
        total += amount;
      } else if (type === 'monthly') {
        // For a custom range, monthly salary isn't well-defined. We show it only for Month/Year presets.
        if (summaryPreset === 'month' || summaryPreset === 'year') {
          total = amount;
          break;
        }
      } else {
        const durationMs = new Date(s.endTime).getTime() - new Date(s.startTime).getTime();
        const hours = durationMs / 3600000;
        if (!Number.isFinite(hours)) continue;
        total += Math.max(0, hours) * amount;
      }
    }

    return Math.round(total * 100) / 100;
  }, [sessions, costModels, instructor, summaryRange, summaryPreset]);

  const currentEffectiveCostModel = useMemo(() => {
    const now = new Date();
    const cms = (costModels || []) as any[];
    const matches = cms.filter((m) => {
      const from = new Date(m.effectiveFrom).getTime();
      const to = m.effectiveTo ? new Date(m.effectiveTo).getTime() : Infinity;
      const t = now.getTime();
      return from <= t && t <= to;
    });
    matches.sort((a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime());
    return matches[0] || null;
  }, [costModels]);

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
      setTabError('availability', e?.response?.data?.message || 'Failed to load availability');
    }
  };

  const time12h = (hhmm: string) => {
    const m = /^(\d{2}):(\d{2})$/.exec(String(hhmm || ''));
    if (!m) return hhmm || '';
    let h = Number(m[1]);
    const min = m[2];
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${min} ${ampm}`;
  };

  const refreshCostModels = async () => {
    if (!id) return;
    try {
      const res = await instructorsService.listCostModels(String(id));
      setCostModels(res.data || []);
    } catch (e: any) {
      setTabError('payroll', e?.response?.data?.message || 'Failed to load cost models');
    }
  };

  const refreshDocuments = async () => {
    if (!id) return;
    try {
      const res = await instructorsService.listDocuments(String(id));
      setDocuments(res.data || []);
    } catch (e: any) {
      setTabError('documents', e?.response?.data?.message || 'Failed to load documents');
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
              setEditForm({
                firstName: String((instructor as any).user?.firstName || ''),
                lastName: String((instructor as any).user?.lastName || ''),
                email: String((instructor as any).user?.email || ''),
                status: String((instructor as any).user?.status || 'active'),
                costType: (instructor as any).costType || 'hourly',
                costAmount: String((instructor as any).costAmount ?? ''),
                age: String((instructor as any).age ?? ''),
                educationLevel: String((instructor as any).educationLevel || 'undergraduate'),
                livingArea: String((instructor as any).livingArea || ''),
              });
              setShowEditModal(true);
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
                Fees Type
              </h3>
              <p className="text-lg text-gray-900 capitalize">
                {(currentEffectiveCostModel?.type || instructor.costType) || '—'}
              </p>
              {currentEffectiveCostModel?.effectiveFrom && (
                <p className="text-xs text-gray-400 mt-1">
                  Effective from {new Date(currentEffectiveCostModel.effectiveFrom).toLocaleDateString()}
                </p>
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                <FiDollarSign className="w-4 h-4" />
                Fees
              </h3>
              <p className="text-lg text-gray-900">
                {(currentEffectiveCostModel?.currency || 'EGP').toUpperCase()}{' '}
                {Number(currentEffectiveCostModel?.amount ?? instructor.costAmount).toLocaleString()}
                {(currentEffectiveCostModel?.type || instructor.costType) === 'hourly' && ' / hour'}
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

          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Age</h3>
              <div className="text-sm text-gray-700">{(instructor as any).age ?? '—'}</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Education Level</h3>
              <div className="text-sm text-gray-700 capitalize">
                {String((instructor as any).educationLevel || '').replace('_', ' ') || '—'}
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Living Area</h3>
              <div className="text-sm text-gray-700">{(instructor as any).livingArea || '—'}</div>
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
              <div className="space-y-4">
                {!!tabErrors.availability && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                    {tabErrors.availability}
                  </div>
                )}

                <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="text-sm text-gray-600">
                      Simple weekly list. Weekend is <span className="font-medium">Fri</span> + <span className="font-medium">Sat</span>.
                    </div>
                    <button
                      type="button"
                      className="text-sm text-indigo-600 hover:text-indigo-900"
                      onClick={refreshAvailability}
                    >
                      Refresh
                    </button>
                  </div>

                  {canOps && (
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-2 items-end">
                      <div className="md:col-span-2">
                        <label className="block text-xs text-gray-600">Apply time (to checked days)</label>
                        <div className="flex gap-2 mt-1">
                          <input
                            type="time"
                            value={String(newSlot.startTime || '09:00')}
                            onChange={(e) => setNewSlot((s) => ({ ...s, startTime: e.target.value }))}
                            className="w-full rounded-md border border-gray-400 px-2 py-1 text-sm"
                          />
                          <input
                            type="time"
                            value={String(newSlot.endTime || '17:00')}
                            onChange={(e) => setNewSlot((s) => ({ ...s, endTime: e.target.value }))}
                            className="w-full rounded-md border border-gray-400 px-2 py-1 text-sm"
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Display: {time12h(String(newSlot.startTime || '09:00'))} – {time12h(String(newSlot.endTime || '17:00'))}
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs text-gray-600">Location</label>
                        <select
                          value={String(newSlot.location || '')}
                          onChange={(e) => setNewSlot((s) => ({ ...s, location: e.target.value }))}
                          className="mt-1 w-full rounded-md border border-gray-400 px-2 py-1 text-sm"
                        >
                          <option value="">Any</option>
                          {['MOA', 'Espace', 'SODIC', 'PalmHills'].map((loc) => (
                            <option key={loc} value={loc}>{loc}</option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-2 flex gap-2">
                        <button
                          type="button"
                          className="flex-1 px-3 py-2 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700"
                          onClick={async () => {
                            if (!id) return;
                            try {
                              clearTabError('availability');
                              // Apply to days that are currently active (including unsaved draft toggles).
                              const activeDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                                .map((_, dow) => {
                                  const row = availability.find((a) => Number(a.dayOfWeek) === dow) || null;
                                  const draft = row ? (availabilityDrafts[row.id] || {}) : {};
                                  const isActive = row ? Boolean((draft as any).isActive ?? row.isActive) : false;
                                  return { dow, row, isActive };
                                })
                                .filter((x) => x.isActive);

                              await Promise.all(
                                activeDays.map(async ({ dow, row }) => {
                                  if (!row) {
                                    await instructorsService.addAvailability(String(id), {
                                      dayOfWeek: dow,
                                      startTime: String(newSlot.startTime || '09:00'),
                                      endTime: String(newSlot.endTime || '17:00'),
                                      location: (newSlot.location as any) || undefined,
                                      isActive: true,
                                    });
                                  } else {
                                    await instructorsService.updateAvailability(row.id, {
                                      startTime: String(newSlot.startTime || '09:00'),
                                      endTime: String(newSlot.endTime || '17:00'),
                                      location: (newSlot.location as any) || null,
                                    });
                                  }
                                }),
                              );
                              setAvailabilityDrafts({});
                              await refreshAvailability();
                            } catch (e: any) {
                              setTabError('availability', e?.response?.data?.message || 'Failed to apply times');
                            }
                          }}
                        >
                          Apply
                        </button>
                        <button
                          type="button"
                          className="flex-1 px-3 py-2 text-sm rounded border border-gray-300 hover:bg-gray-50"
                          onClick={() => setAvailabilityDrafts({})}
                        >
                          Clear checks
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-900">Weekly Availability</div>
                    <div className="text-xs text-gray-500">Fri + Sat = weekend</div>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayLabel, dayOfWeek) => {
                      const row = availability.find((a) => Number(a.dayOfWeek) === dayOfWeek) || null;
                      const draft = row ? (availabilityDrafts[row.id] || {}) : {};
                      const isActive = row ? Boolean((draft as any).isActive ?? row.isActive) : false;
                      const startTime = row ? String((draft as any).startTime ?? row.startTime ?? '09:00') : '09:00';
                      const endTime = row ? String((draft as any).endTime ?? row.endTime ?? '17:00') : '17:00';
                      const location = row ? String((draft as any).location ?? row.location ?? '') : '';
                      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Fri + Sat

                      return (
                        <div key={dayLabel} className="p-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <label className="flex items-center gap-2 text-sm font-medium text-gray-900">
                                <input
                                  type="checkbox"
                                  checked={isActive}
                                  onChange={async (e) => {
                                    if (!canOps) return;
                                    if (!row) {
                                      // Create the slot on first click so checkbox is immediately usable.
                                      if (!id) return;
                                      if (!e.target.checked) return;
                                      try {
                                        clearTabError('availability');
                                        await instructorsService.addAvailability(String(id), {
                                          dayOfWeek,
                                          startTime: String(newSlot.startTime || '09:00'),
                                          endTime: String(newSlot.endTime || '17:00'),
                                          location: (newSlot.location as any) || undefined,
                                          isActive: true,
                                        });
                                        await refreshAvailability();
                                      } catch (err: any) {
                                        setTabError('availability', err?.response?.data?.message || 'Failed to add day slot');
                                      }
                                      return;
                                    }
                                    setAvailabilityDrafts((s) => ({ ...s, [row.id]: { ...(s[row.id] || {}), isActive: e.target.checked } }));
                                  }}
                                />
                                {dayLabel}
                              </label>
                              {isWeekend && (
                                <span className="text-xs px-2 py-0.5 rounded bg-gray-100 border border-gray-200 text-gray-700">
                                  Weekend
                                </span>
                              )}
                              {(startTime || endTime) && (
                                <span className="text-xs text-gray-500">
                                  {time12h(startTime)} – {time12h(endTime)}
                                </span>
                              )}
                            </div>

                            {row ? (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:items-end">
                                <div>
                                  <label className="block text-xs text-gray-600">From</label>
                                  <input
                                    type="time"
                                    value={startTime}
                                    onChange={(e) =>
                                      setAvailabilityDrafts((s) => ({ ...s, [row.id]: { ...(s[row.id] || {}), startTime: e.target.value } }))
                                    }
                                    disabled={!canOps}
                                    className="mt-1 w-full rounded-md border border-gray-400 px-2 py-1 text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-600">To</label>
                                  <input
                                    type="time"
                                    value={endTime}
                                    onChange={(e) =>
                                      setAvailabilityDrafts((s) => ({ ...s, [row.id]: { ...(s[row.id] || {}), endTime: e.target.value } }))
                                    }
                                    disabled={!canOps}
                                    className="mt-1 w-full rounded-md border border-gray-400 px-2 py-1 text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-600">Location</label>
                                  <select
                                    value={location}
                                    onChange={(e) =>
                                      setAvailabilityDrafts((s) => ({ ...s, [row.id]: { ...(s[row.id] || {}), location: e.target.value } }))
                                    }
                                    disabled={!canOps}
                                    className="mt-1 w-full rounded-md border border-gray-400 px-2 py-1 text-sm"
                                  >
                                    <option value="">Any</option>
                                    {['MOA', 'Espace', 'SODIC', 'PalmHills'].map((loc) => (
                                      <option key={loc} value={loc}>{loc}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="flex gap-2">
                                  {canOps && (
                                    <>
                                      <button
                                        type="button"
                                        className="flex-1 px-3 py-2 text-sm rounded border border-gray-300 hover:bg-gray-50"
                                        onClick={async () => {
                                          try {
                                            clearTabError('availability');
                                            await instructorsService.updateAvailability(row.id, {
                                              isActive,
                                              startTime,
                                              endTime,
                                              location: location || null,
                                            });
                                            setAvailabilityDrafts((s) => {
                                              const next = { ...s };
                                              delete next[row.id];
                                              return next;
                                            });
                                            await refreshAvailability();
                                          } catch (e: any) {
                                            setTabError('availability', e?.response?.data?.message || 'Failed to save');
                                          }
                                        }}
                                      >
                                        Save
                                      </button>
                                      <button
                                        type="button"
                                        className="flex-1 px-3 py-2 text-sm rounded bg-red-600 text-white hover:bg-red-700"
                                        onClick={async () => {
                                          if (!confirm('Delete this day availability?')) return;
                                          try {
                                            await instructorsService.deleteAvailability(row.id);
                                            await refreshAvailability();
                                          } catch (e: any) {
                                            setTabError('availability', e?.response?.data?.message || 'Failed to delete');
                                          }
                                        }}
                                      >
                                        Delete
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500">
                                No slot for this day.
                                {canOps && (
                                  <button
                                    type="button"
                                    className="ml-2 text-sm text-indigo-600 hover:text-indigo-900"
                                    onClick={async () => {
                                      if (!id) return;
                                      try {
                                        clearTabError('availability');
                                        await instructorsService.addAvailability(String(id), {
                                          dayOfWeek,
                                          startTime: '09:00',
                                          endTime: '17:00',
                                          isActive: true,
                                        });
                                        await refreshAvailability();
                                      } catch (e: any) {
                                        setTabError('availability', e?.response?.data?.message || 'Failed to add day slot');
                                      }
                                    }}
                                  >
                                    Add
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
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
                {!!tabErrors.payroll && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                    {tabErrors.payroll}
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
                            clearTabError('payroll');
                            const res = await instructorsService.generatePayroll({ year: payrollYear, month: payrollMonth, instructorId: String(id) });
                            const status = res.data?.results?.[0]?.status;
                            if (status === 'no_sessions') {
                              setTabError('payroll', 'No sessions found in this month to calculate payroll.');
                            }
                            await fetchPayroll(String(id));
                          } catch (e: any) {
                            setTabError('payroll', e?.response?.data?.message || 'Failed to generate payroll');
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
                                  setTabError('payroll', e?.response?.data?.message || 'Failed to delete cost model');
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
                                    clearTabError('payroll');
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
                                    setTabError('payroll', e?.response?.data?.message || 'Failed to save cost model');
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
    {
      id: 'performance',
      label: 'Performance',
      icon: <FiUsers className="w-4 h-4" />,
      content: show(['management', 'super_admin']) ? (
        <div className="space-y-4">
          {(() => {
            const summaries = ((instructor as any).feedbackSummaries || []) as any[];
            const totalFeedback = summaries.reduce((s, x) => s + Number(x.totalFeedback || 0), 0);
            const weightedRating =
              totalFeedback > 0
                ? summaries.reduce((s, x) => s + Number(x.avgRating || 0) * Number(x.totalFeedback || 0), 0) / totalFeedback
                : null;

            const now = new Date();
            const startCur = new Date(now.getFullYear(), now.getMonth(), 1);
            const startPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endPrev = startCur;

            const prevStudents = new Set<string>();
            const curStudents = new Set<string>();
            for (const s of sessions || []) {
              const sd = new Date(s.scheduledDate);
              const atts = ((s as any).attendances || []) as any[];
              for (const a of atts) {
                const sid = String(a.studentId || a.student?.id || '');
                if (!sid) continue;
                if (sd >= startPrev && sd < endPrev) prevStudents.add(sid);
                if (sd >= startCur) curStudents.add(sid);
              }
            }
            let retained = 0;
            Array.from(prevStudents).forEach((sid) => {
              if (curStudents.has(sid)) retained++;
            });
            const retentionPct = prevStudents.size > 0 ? (retained / prevStudents.size) * 100 : null;

            const last90 = new Date(now.getTime() - 90 * 24 * 3600 * 1000);
            const recent = (sessions || []).filter((s) => new Date(s.scheduledDate) >= last90);
            const completed = recent.filter((s) => s.status === 'completed').length;
            const cancelled = recent.filter((s) => s.status === 'cancelled').length;
            const reliabilityPct = completed + cancelled > 0 ? (completed / (completed + cancelled)) * 100 : null;

            const latestSummary = summaries[0] || null;

            return (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="text-xs text-gray-500">Avg Rating</div>
                    <div className="text-2xl font-semibold text-gray-900">{weightedRating != null ? weightedRating.toFixed(2) : '—'}</div>
                    <div className="text-xs text-gray-500 mt-1">{totalFeedback > 0 ? `${totalFeedback} feedback` : 'No feedback yet'}</div>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="text-xs text-gray-500">Attendance reliability (last 90d)</div>
                    <div className="text-2xl font-semibold text-gray-900">{reliabilityPct != null ? `${reliabilityPct.toFixed(0)}%` : '—'}</div>
                    <div className="text-xs text-gray-500 mt-1">{completed} completed / {cancelled} cancelled</div>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="text-xs text-gray-500">Student retention (prev → current month)</div>
                    <div className="text-2xl font-semibold text-gray-900">{retentionPct != null ? `${retentionPct.toFixed(0)}%` : '—'}</div>
                    <div className="text-xs text-gray-500 mt-1">{retained} returning / {prevStudents.size} last month</div>
                  </div>
                </div>

                {show(['hr', 'super_admin']) && (
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="text-sm font-semibold text-gray-900 mb-1">Internal notes (HR)</div>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                      {latestSummary?.notes || '—'}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      ) : (
        <div className="text-sm text-gray-500">Not available for your role.</div>
      ),
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: <FiFileText className="w-4 h-4" />,
      content: show(['hr', 'management', 'super_admin']) ? (
        <div className="space-y-4">
          {!!tabErrors.documents && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
              {tabErrors.documents}
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
                      clearTabError('documents');
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
                      setTabError('documents', e?.response?.data?.message || e?.message || 'Failed to upload document');
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
                  <div key={d.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
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
                              clearTabError('documents');
                              const res = await instructorsService.presignDocumentDownload(d.id);
                              const url = res.data?.url;
                              if (!url) throw new Error('Download URL missing');
                              setSelectedDocId(d.id);
                              setDocPreviewUrl(url);
                              setDocPreviewContentType(String((d.metadata as any)?.contentType || ''));
                            } catch (e: any) {
                              setTabError('documents', e?.response?.data?.message || e?.message || 'Failed to load document');
                            }
                          }}
                          className="px-3 py-2 text-sm font-medium rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          Preview
                        </button>
                        {selectedDocId === d.id && docPreviewUrl && (
                          <a
                            href={docPreviewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                          >
                            Open
                          </a>
                        )}
                        {canHr && (
                          <button
                            type="button"
                            onClick={async () => {
                              if (!confirm('Delete this document?')) return;
                              try {
                                clearTabError('documents');
                                await instructorsService.deleteDocument(d.id);
                                await refreshDocuments();
                              } catch (e: any) {
                                setTabError('documents', e?.response?.data?.message || 'Failed to delete document');
                              }
                            }}
                            className="px-3 py-2 text-sm font-medium rounded-md bg-red-600 text-white hover:bg-red-700"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                    {selectedDocId === d.id && docPreviewUrl && (
                      <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
                        <div className="px-3 py-2 bg-gray-50 text-xs text-gray-600 flex items-center justify-between">
                          <span>Preview</span>
                          <span className="text-gray-400">{docPreviewContentType}</span>
                        </div>
                        <div className="p-3">
                          {docPreviewContentType.startsWith('image/') ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={docPreviewUrl} alt={d.name} className="max-h-64 w-auto border border-gray-200 rounded" />
                          ) : docPreviewContentType.includes('pdf') ? (
                            <iframe
                              src={docPreviewUrl}
                              className="w-full h-64 border border-gray-200 rounded"
                              title={`preview-${d.id}`}
                            />
                          ) : (
                            <div className="text-sm text-gray-600">
                              No inline preview for this file type. Use <span className="font-medium">Open</span>.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-500">Not available for your role.</div>
      ),
    },
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
        <div className="mb-3 space-y-2">
          <div className="flex items-center gap-2">
            <select
              value={summaryPreset}
              onChange={(e) => setSummaryPreset(e.target.value as any)}
              className="w-full rounded-md border border-gray-300 text-sm"
            >
              <option value="7d">Last 7 days</option>
              <option value="month">This month</option>
              <option value="year">This year</option>
              <option value="all">All</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          {summaryPreset === 'custom' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500">From</label>
                <input
                  type="date"
                  value={summaryFrom}
                  onChange={(e) => setSummaryFrom(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500">To</label>
                <input
                  type="date"
                  value={summaryTo}
                  onChange={(e) => setSummaryTo(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 text-sm"
                />
              </div>
            </div>
          )}
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Assigned Classes:</span>
            <span className="font-medium text-gray-900">{classes.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Sessions (range):</span>
            <span className="font-medium text-gray-900">{sessionsInSummaryRange.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Total Students:</span>
            <span className="font-medium text-gray-900">
              {classes.reduce((sum, c) => sum + (c.students?.length || 0), 0)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Fees (range):</span>
            <span className="font-medium text-gray-900">
              {(currentEffectiveCostModel?.currency || 'EGP').toUpperCase()} {Number(feesInSummaryRange || 0).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-200">
            <span className="text-gray-500">Fees Type:</span>
            <span className="font-medium text-gray-900 capitalize">{(currentEffectiveCostModel?.type || instructor.costType) as any}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <StandardDetailView
        title={instructorName}
        subtitle={instructor.user?.email || 'Instructor Profile'}
        actions={actions}
        tabs={tabs}
        breadcrumbs={breadcrumbs}
        sidebar={sidebar}
        onTabChange={() => {
          // Clear alerts when switching tabs so messages don't appear in other tabs
          setTabErrors({});
        }}
      />
      {showEditModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowEditModal(false)} />
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 space-y-4">
                <h2 className="text-xl font-semibold">Edit Instructor</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                    <input
                      value={editForm.firstName}
                      onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-400 shadow-sm focus:border-indigo-600 focus:ring-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                    <input
                      value={editForm.lastName}
                      onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-400 shadow-sm focus:border-indigo-600 focus:ring-indigo-600"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-400 shadow-sm focus:border-indigo-600 focus:ring-indigo-600"
                      inputMode="email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-400 shadow-sm focus:border-indigo-600 focus:ring-indigo-600"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fees Type</label>
                    <select
                      value={editForm.costType}
                      onChange={(e) => setEditForm({ ...editForm, costType: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-400 shadow-sm focus:border-indigo-600 focus:ring-indigo-600"
                    >
                      <option value="hourly">Hourly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fees Amount</label>
                    <input
                      value={editForm.costAmount}
                      onChange={(e) => setEditForm({ ...editForm, costAmount: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-400 shadow-sm focus:border-indigo-600 focus:ring-indigo-600"
                      inputMode="decimal"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Age</label>
                    <input
                      value={editForm.age}
                      onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-400 shadow-sm focus:border-indigo-600 focus:ring-indigo-600"
                      inputMode="numeric"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Education Level</label>
                    <select
                      value={editForm.educationLevel}
                      onChange={(e) => setEditForm({ ...editForm, educationLevel: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-400 shadow-sm focus:border-indigo-600 focus:ring-indigo-600"
                    >
                      <option value="undergraduate">Undergraduate</option>
                      <option value="graduate">Graduate</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Living Area</label>
                    <input
                      value={editForm.livingArea}
                      onChange={(e) => setEditForm({ ...editForm, livingArea: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-400 shadow-sm focus:border-indigo-600 focus:ring-indigo-600"
                    />
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Skills, contracts, availability, cost models, payroll, and documents are edited inside their tabs.
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        setError('');
                        // Update user profile fields (super_admin-only endpoint on backend)
                        if ((instructor as any)?.user?.id) {
                          await api.patch(`/users/${(instructor as any).user.id}`, {
                            firstName: editForm.firstName,
                            lastName: editForm.lastName,
                            email: editForm.email,
                            status: editForm.status,
                          });
                        }

                        // Update instructor profile + fees
                        await instructorsService.update(String(id), {
                          costType: editForm.costType,
                          costAmount: parseFloat(editForm.costAmount || '0'),
                          age: editForm.age ? parseInt(editForm.age) : null,
                          educationLevel: editForm.educationLevel || null,
                          livingArea: editForm.livingArea || null,
                        });
                        setShowEditModal(false);
                        await fetchInstructor(String(id));
                      } catch (e: any) {
                        setError(e?.response?.data?.message || 'Failed to update instructor');
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
    </>
  );
}

