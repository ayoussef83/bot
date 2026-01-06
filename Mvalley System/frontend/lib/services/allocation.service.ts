import api from '../api';

export type CandidateGroupStatus = 'draft' | 'blocked' | 'held' | 'confirmed' | 'rejected';

export interface AllocationRun {
  id: string;
  status: string;
  fromDate: string;
  toDate: string;
  notes?: string | null;
  createdAt: string;
  createdBy?: { id: string; firstName?: string; lastName?: string; email?: string } | null;
  _count?: { candidateGroups: number };
}

export interface CandidateGroup {
  id: string;
  name: string;
  status: CandidateGroupStatus;
  blockReason?: string | null;
  courseLevel?: any;
  instructor?: any;
  room?: any;
  studentCount: number;
  expectedRevenue: number;
  expectedCost: number;
  expectedMargin: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  startDate: string;
  endDate?: string | null;
  explanation?: any;
}

export const allocationService = {
  listRuns: () => api.get<AllocationRun[]>('/allocation/runs'),
  createRun: (data: any) => api.post('/allocation/runs', data),
  getRun: (id: string) => api.get(`/allocation/runs/${id}`),
  listCandidateGroups: (runId: string) => api.get<CandidateGroup[]>(`/allocation/runs/${runId}/candidate-groups`),
  getCandidateGroup: (id: string) => api.get<CandidateGroup>(`/allocation/candidate-groups/${id}`),
  holdOrReject: (id: string, payload: { action: 'hold' | 'reject'; reason: string }) =>
    api.patch(`/allocation/candidate-groups/${id}/status`, payload),
  confirm: (id: string, payload: { reason: string; instructorId?: string; roomId?: string }) =>
    api.post(`/allocation/candidate-groups/${id}/confirm`, payload),
};


