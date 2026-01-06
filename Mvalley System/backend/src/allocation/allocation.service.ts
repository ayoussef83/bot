import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CandidateGroupStatus, Location, UserStatus } from '@prisma/client';

type WeeklySlot = { dayOfWeek: number; from: string; to: string };

function isHHmm(v: string) {
  return /^\d{2}:\d{2}$/.test(String(v || '').trim());
}

function timeToMinutes(hhmm: string) {
  const [h, m] = hhmm.split(':').map((x) => parseInt(x, 10));
  return h * 60 + m;
}

function overlapsTime(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  const a0 = timeToMinutes(aStart);
  const a1 = timeToMinutes(aEnd);
  const b0 = timeToMinutes(bStart);
  const b1 = timeToMinutes(bEnd);
  return a0 < b1 && b0 < a1;
}

function normalizeDateInput(value: string) {
  const v = String(value || '').trim();
  if (!v) throw new BadRequestException('Invalid date');
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(v);
  const d = isDateOnly ? new Date(`${v}T00:00:00.000Z`) : new Date(v);
  if (Number.isNaN(d.getTime())) throw new BadRequestException(`Invalid date: ${value}`);
  return d;
}

function coursePrefix(courseName: string) {
  const words = String(courseName || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  const w = words[0] || 'G';
  return w.slice(0, 2).toUpperCase();
}

@Injectable()
export class AllocationService {
  constructor(private prisma: PrismaService) {}

  private parseAvailability(input: any): Record<string, WeeklySlot[]> {
    if (!input || typeof input !== 'object') return {};
    // Accept: { [studentId]: WeeklySlot[] } OR [{ studentId, slots: WeeklySlot[] }]
    if (Array.isArray(input)) {
      const out: Record<string, WeeklySlot[]> = {};
      for (const row of input) {
        const sid = String((row as any)?.studentId || '').trim();
        const slots = (row as any)?.slots;
        if (!sid || !Array.isArray(slots)) continue;
        out[sid] = slots as WeeklySlot[];
      }
      return out;
    }
    return input as Record<string, WeeklySlot[]>;
  }

  private clusterAvailability(studentIds: string[], availability: Record<string, WeeklySlot[]>) {
    const clusters = new Map<string, { dayOfWeek: number; startTime: string; endTime: string; studentIds: string[] }>();

    for (const sid of studentIds) {
      const slots = availability[sid] || [];
      for (const s of slots) {
        const day = Number((s as any).dayOfWeek);
        const from = String((s as any).from || '').trim();
        const to = String((s as any).to || '').trim();
        if (!Number.isFinite(day) || day < 0 || day > 6) continue;
        if (!isHHmm(from) || !isHHmm(to)) continue;
        if (timeToMinutes(from) >= timeToMinutes(to)) continue;

        const key = `${day}|${from}|${to}`;
        const existing = clusters.get(key);
        if (existing) existing.studentIds.push(sid);
        else clusters.set(key, { dayOfWeek: day, startTime: from, endTime: to, studentIds: [sid] });
      }
    }

    return Array.from(clusters.values())
      .map((c) => ({ ...c, studentCount: c.studentIds.length }))
      .sort((a, b) => b.studentCount - a.studentCount);
  }

  private async generateCandidateName(runId: string, courseName: string, levelDigit: number) {
    const prefix = coursePrefix(courseName);
    const existing = await this.prisma.candidateGroup.findMany({
      where: { runId, deletedAt: null, name: { startsWith: `${prefix}-` } },
      select: { name: true },
    });
    const re = new RegExp(`^${prefix}-(\\d{2})-${levelDigit}$`);
    let max = 0;
    for (const g of existing) {
      const m = re.exec(String(g.name || '').trim());
      if (!m) continue;
      const n = parseInt(m[1], 10);
      if (Number.isFinite(n)) max = Math.max(max, n);
    }
    const next = String(max + 1).padStart(2, '0');
    return `${prefix}-${next}-${levelDigit}`;
  }

  private instructorHasSkills(instructor: any, required: string[]) {
    if (!required.length) return true;
    const have = new Set(
      (instructor?.skills || []).map((s: any) => String(s?.name || '').trim().toLowerCase()).filter(Boolean),
    );
    return required.every((r) => have.has(String(r).trim().toLowerCase()));
  }

  private isAvailabilityCoveringSlot(av: any, dayOfWeek: number, startTime: string, endTime: string, fromDate: Date, toDate: Date) {
    if (!av) return false;
    if (Number(av.dayOfWeek) !== dayOfWeek) return false;
    const aStart = String(av.startTime || '').trim();
    const aEnd = String(av.endTime || '').trim();
    if (!isHHmm(aStart) || !isHHmm(aEnd)) return false;
    if (timeToMinutes(aStart) > timeToMinutes(startTime)) return false;
    if (timeToMinutes(aEnd) < timeToMinutes(endTime)) return false;
    const effFrom = av.effectiveFrom ? new Date(av.effectiveFrom) : null;
    const effTo = av.effectiveTo ? new Date(av.effectiveTo) : null;
    if (effFrom && effFrom > toDate) return false;
    if (effTo && effTo < fromDate) return false;
    return true;
  }

  private weeksInRange(from: Date, to: Date) {
    const ms = Math.max(0, to.getTime() - from.getTime());
    return Math.max(1, Math.ceil(ms / (7 * 24 * 60 * 60 * 1000)));
  }

  private async estimateInstructorCost(instructor: any, fromDate: Date, toDate: Date, sessionMinutes: number, plannedSessions: number) {
    const models = (instructor?.costModels || []).filter((m: any) => !m.deletedAt);
    const pickModelAt = (d: Date) => {
      const t = d.getTime();
      const candidates = models.filter((m: any) => {
        const start = m.effectiveFrom ? new Date(m.effectiveFrom).getTime() : -Infinity;
        const end = m.effectiveTo ? new Date(m.effectiveTo).getTime() : Infinity;
        return t >= start && t <= end;
      });
      candidates.sort((a: any, b: any) => new Date(b.effectiveFrom || 0).getTime() - new Date(a.effectiveFrom || 0).getTime());
      return candidates[0] || null;
    };

    const model = pickModelAt(fromDate) || pickModelAt(new Date(toDate.getTime() - 1));
    const type = String(model?.type || instructor?.costType || 'hourly').toLowerCase();
    const amount = Number(model?.amount ?? instructor?.costAmount ?? 0);
    if (!Number.isFinite(amount) || amount <= 0) return { cost: 0, model: model || null, type, amount };

    const totalGroupMinutes = plannedSessions * sessionMinutes;

    if (type === 'per_session' || type === 'per-session') {
      return { cost: amount * plannedSessions, model: model || null, type: 'per_session', amount };
    }
    if (type === 'hourly') {
      return { cost: amount * (totalGroupMinutes / 60), model: model || null, type: 'hourly', amount };
    }
    if (type === 'monthly') {
      // Allocate a share of monthly cost based on group minutes vs total available minutes in the range (forecasting)
      const av = (instructor?.availability || []).filter((a: any) => !a.deletedAt);
      let weeklyAvailMinutes = 0;
      for (const a of av) {
        const aStart = String(a.startTime || '');
        const aEnd = String(a.endTime || '');
        if (!isHHmm(aStart) || !isHHmm(aEnd)) continue;
        weeklyAvailMinutes += Math.max(0, timeToMinutes(aEnd) - timeToMinutes(aStart));
      }
      const weeks = this.weeksInRange(fromDate, toDate);
      const totalAvailMinutes = Math.max(1, weeklyAvailMinutes * weeks);
      const share = Math.min(1, totalGroupMinutes / totalAvailMinutes);
      return { cost: amount * share, model: model || null, type: 'monthly', amount };
    }

    // fallback
    return { cost: amount * (totalGroupMinutes / 60), model: model || null, type: 'hourly', amount };
  }

  private async pickInstructor(params: {
    requiredSkills: string[];
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    fromDate: Date;
    toDate: Date;
    sessionDurationMins: number;
    plannedSessions: number;
  }) {
    const instructors = await this.prisma.instructor.findMany({
      where: { deletedAt: null, user: { status: UserStatus.active } },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, status: true } },
        skills: true,
        availability: true,
        costModels: true,
      },
    });

    const scored: any[] = [];
    for (const ins of instructors) {
      const skillOk = this.instructorHasSkills(ins, params.requiredSkills);
      if (!skillOk) continue;
      const availOk = (ins.availability || []).some((a: any) =>
        this.isAvailabilityCoveringSlot(a, params.dayOfWeek, params.startTime, params.endTime, params.fromDate, params.toDate),
      );
      if (!availOk) continue;

      const cost = await this.estimateInstructorCost(ins, params.fromDate, params.toDate, params.sessionDurationMins, params.plannedSessions);

      // utilization: scheduled minutes in range
      const sessions = await this.prisma.session.findMany({
        where: {
          deletedAt: null,
          instructorId: ins.id,
          scheduledDate: { gte: params.fromDate, lt: params.toDate },
        },
        select: { startTime: true, endTime: true },
      });
      let scheduledMinutes = 0;
      for (const s of sessions) {
        const st = new Date(s.startTime).getTime();
        const en = new Date(s.endTime).getTime();
        if (en > st) scheduledMinutes += (en - st) / 60000;
      }
      const addedMinutes = params.plannedSessions * params.sessionDurationMins;
      const util = scheduledMinutes + addedMinutes;

      scored.push({
        instructor: ins,
        cost,
        utilizationMinutes: util,
        score: util, // for tie-break later
      });
    }

    scored.sort((a, b) => {
      // Lowest cost first
      if (a.cost.cost !== b.cost.cost) return a.cost.cost - b.cost.cost;
      // Then utilization balance (lower is better)
      return a.utilizationMinutes - b.utilizationMinutes;
    });

    return { best: scored[0] || null, candidates: scored.slice(0, 10) };
  }

  private async pickRoom(params: {
    preferredLocation?: Location | null;
    studentCount: number;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    fromDate: Date;
    toDate: Date;
  }) {
    const rooms = await this.prisma.room.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        ...(params.preferredLocation ? { location: params.preferredLocation } : {}),
      },
      include: { availabilities: true },
    });

    const eligible: any[] = [];
    for (const room of rooms) {
      if (Number(room.capacity) < params.studentCount) continue;
      const ok = (room.availabilities || []).some((a: any) =>
        this.isAvailabilityCoveringSlot(a, params.dayOfWeek, params.startTime, params.endTime, params.fromDate, params.toDate),
      );
      if (!ok) continue;
      eligible.push({
        room,
        waste: Number(room.capacity) - params.studentCount,
      });
    }

    eligible.sort((a, b) => a.waste - b.waste);
    return { best: eligible[0] || null, candidates: eligible.slice(0, 10) };
  }

  private computeEconomics(pricePerStudent: number, studentCount: number, instructorCost: number) {
    const revenue = Math.max(0, Number(pricePerStudent || 0) * studentCount);
    const cost = Math.max(0, Number(instructorCost || 0));
    const margin = revenue - cost;
    return { revenue, cost, margin };
  }

  async createRun(dto: any, userId: string) {
    const fromDate = normalizeDateInput(dto.fromDate);
    const toDate = normalizeDateInput(dto.toDate);
    if (toDate <= fromDate) throw new BadRequestException('toDate must be after fromDate');
    if (!Array.isArray(dto.demands) || !dto.demands.length) throw new BadRequestException('At least one demand is required');

    const run = await this.prisma.allocationRun.create({
      data: {
        status: 'running' as any,
        fromDate,
        toDate,
        notes: dto.notes || null,
        params: dto.params || undefined,
        createdById: userId,
        startedAt: new Date(),
      },
    });

    try {
      // Create demands
      const demandRecords = [];
      for (const d of dto.demands) {
        const studentIds = Array.isArray(d.studentIds) ? d.studentIds.map((s: any) => String(s).trim()).filter(Boolean) : [];
        if (!studentIds.length) throw new BadRequestException('Demand studentIds are required');
        if (!d.courseLevelId) throw new BadRequestException('Demand courseLevelId is required');
        if (!Number.isFinite(Number(d.minCapacity)) || Number(d.minCapacity) < 1) throw new BadRequestException('Invalid minCapacity');
        if (!Number.isFinite(Number(d.maxCapacity)) || Number(d.maxCapacity) < 1) throw new BadRequestException('Invalid maxCapacity');
        if (Number(d.minCapacity) > Number(d.maxCapacity)) throw new BadRequestException('minCapacity cannot exceed maxCapacity');

        demandRecords.push(
          await this.prisma.courseDemand.create({
            data: {
              runId: run.id,
              courseLevelId: d.courseLevelId,
              studentIds,
              studentAvailability: d.studentAvailability || undefined,
              requiredSkills: d.requiredSkills || undefined,
              minCapacity: Number(d.minCapacity),
              maxCapacity: Number(d.maxCapacity),
              plannedSessions: Number(d.plannedSessions),
              sessionDurationMins: Number(d.sessionDurationMins),
              pricePerStudent: Number(d.pricePerStudent),
              preferredLocation: d.preferredLocation || undefined,
            },
            include: { courseLevel: { include: { course: true } } },
          }),
        );
      }

      // Build clusters + candidate groups
      for (const demand of demandRecords as any[]) {
        const availability = this.parseAvailability(demand.studentAvailability);
        const clusters = this.clusterAvailability(demand.studentIds as any, availability);

        // Persist clusters for explainability
        for (const c of clusters) {
          await this.prisma.timeCluster.create({
            data: {
              runId: run.id,
              demandId: demand.id,
              dayOfWeek: c.dayOfWeek,
              startTime: c.startTime,
              endTime: c.endTime,
              studentCount: c.studentCount,
              studentIds: c.studentIds,
              score: c.studentCount,
              explanation: { source: 'student_availability', key: `${c.dayOfWeek}|${c.startTime}|${c.endTime}` },
            },
          });
        }

        if (!clusters.length) {
          // Create a single blocked candidate group to show why nothing was produced
          const name = await this.generateCandidateName(run.id, demand.courseLevel.course.name, demand.courseLevel.sortOrder);
          await this.prisma.candidateGroup.create({
            data: {
              runId: run.id,
              demandId: demand.id,
              name,
              status: CandidateGroupStatus.blocked,
              blockReason: 'no_student_availability',
              courseLevelId: demand.courseLevelId,
              dayOfWeek: 0,
              startTime: '00:00',
              endTime: '00:00',
              startDate: fromDate,
              endDate: toDate,
              studentCount: 0,
              studentIds: [],
              minCapacity: demand.minCapacity,
              maxCapacity: demand.maxCapacity,
              expectedRevenue: 0,
              expectedCost: 0,
              expectedMargin: 0,
              currency: 'EGP',
              explanation: { reason: 'No student availability provided for this demand.' },
            },
          });
          continue;
        }

        // For each cluster, split into groups up to maxCapacity
        for (const c of clusters) {
          const chunks: string[][] = [];
          const ids = [...c.studentIds];
          while (ids.length) chunks.push(ids.splice(0, demand.maxCapacity));

          for (const chunk of chunks) {
            const studentCount = chunk.length;
            const name = await this.generateCandidateName(run.id, demand.courseLevel.course.name, demand.courseLevel.sortOrder);

            let status: CandidateGroupStatus = CandidateGroupStatus.draft;
            let blockReason: string | null = null;

            if (studentCount < demand.minCapacity) {
              status = CandidateGroupStatus.blocked;
              blockReason = 'min_capacity';
            }

            const requiredSkills = Array.isArray(demand.requiredSkills) ? (demand.requiredSkills as any[]).map((x) => String(x)) : [];

            const instructorPick = status === CandidateGroupStatus.blocked
              ? { best: null, candidates: [] }
              : await this.pickInstructor({
                  requiredSkills,
                  dayOfWeek: c.dayOfWeek,
                  startTime: c.startTime,
                  endTime: c.endTime,
                  fromDate,
                  toDate,
                  sessionDurationMins: demand.sessionDurationMins,
                  plannedSessions: demand.plannedSessions,
                });

            const roomPick = status === CandidateGroupStatus.blocked
              ? { best: null, candidates: [] }
              : await this.pickRoom({
                  preferredLocation: demand.preferredLocation,
                  studentCount,
                  dayOfWeek: c.dayOfWeek,
                  startTime: c.startTime,
                  endTime: c.endTime,
                  fromDate,
                  toDate,
                });

            const instructorCost = instructorPick.best?.cost?.cost || 0;
            const econ = this.computeEconomics(demand.pricePerStudent, studentCount, instructorCost);

            const minMarginPct = Number(dto?.params?.minMarginPct ?? 0);
            const marginPct = econ.revenue > 0 ? econ.margin / econ.revenue : -1;

            if (status !== CandidateGroupStatus.blocked) {
              if (!instructorPick.best) {
                status = CandidateGroupStatus.blocked;
                blockReason = 'no_instructor';
              } else if (!roomPick.best) {
                status = CandidateGroupStatus.blocked;
                blockReason = 'no_room';
              } else if (econ.margin < 0 || marginPct < minMarginPct) {
                status = CandidateGroupStatus.blocked;
                blockReason = 'not_profitable';
              }
            }

            await this.prisma.candidateGroup.create({
              data: {
                runId: run.id,
                demandId: demand.id,
                name,
                status,
                blockReason: blockReason || undefined,
                courseLevelId: demand.courseLevelId,
                dayOfWeek: c.dayOfWeek,
                startTime: c.startTime,
                endTime: c.endTime,
                startDate: fromDate,
                endDate: toDate,
                instructorId: instructorPick.best?.instructor?.id || undefined,
                roomId: roomPick.best?.room?.id || undefined,
                studentCount,
                studentIds: chunk,
                minCapacity: demand.minCapacity,
                maxCapacity: demand.maxCapacity,
                expectedRevenue: econ.revenue,
                expectedCost: econ.cost,
                expectedMargin: econ.margin,
                currency: 'EGP',
                explanation: {
                  cluster: { dayOfWeek: c.dayOfWeek, startTime: c.startTime, endTime: c.endTime, studentCount: c.studentCount },
                  requiredSkills,
                  instructor: instructorPick.best
                    ? {
                        id: instructorPick.best.instructor.id,
                        name: `${instructorPick.best.instructor.user?.firstName || ''} ${instructorPick.best.instructor.user?.lastName || ''}`.trim(),
                        cost: instructorPick.best.cost,
                        utilizationMinutes: instructorPick.best.utilizationMinutes,
                        considered: instructorPick.candidates.map((x: any) => ({
                          id: x.instructor.id,
                          cost: x.cost,
                          utilizationMinutes: x.utilizationMinutes,
                        })),
                      }
                    : { reason: 'No eligible instructor found.' },
                  room: roomPick.best
                    ? {
                        id: roomPick.best.room.id,
                        name: roomPick.best.room.name,
                        location: roomPick.best.room.location,
                        capacity: roomPick.best.room.capacity,
                        waste: roomPick.best.waste,
                        considered: roomPick.candidates.map((x: any) => ({
                          id: x.room.id,
                          capacity: x.room.capacity,
                          waste: x.waste,
                        })),
                      }
                    : { reason: 'No eligible room found.' },
                  economics: { ...econ, minMarginPct, marginPct },
                  decision: { status, blockReason },
                },
              },
            });
          }
        }
      }

      await this.prisma.allocationRun.update({
        where: { id: run.id },
        data: { status: 'completed' as any, finishedAt: new Date() },
      });

      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'create',
          entityType: 'AllocationRun',
          entityId: run.id,
        },
      });

      return this.getRun(run.id);
    } catch (e: any) {
      await this.prisma.allocationRun.update({
        where: { id: run.id },
        data: { status: 'failed' as any, finishedAt: new Date(), error: String(e?.message || e) },
      });
      throw e;
    }
  }

  async listRuns() {
    return this.prisma.allocationRun.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { createdBy: { select: { id: true, firstName: true, lastName: true, email: true } }, _count: { select: { candidateGroups: true } } },
    });
  }

  async getRun(id: string) {
    const run = await this.prisma.allocationRun.findFirst({
      where: { id, deletedAt: null },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        demands: { include: { courseLevel: { include: { course: true } } } },
        _count: { select: { timeClusters: true, candidateGroups: true } },
      },
    });
    if (!run) throw new NotFoundException('Allocation run not found');
    return run;
  }

  async getCandidateGroup(id: string) {
    const cg = await this.prisma.candidateGroup.findFirst({
      where: { id, deletedAt: null },
      include: {
        courseLevel: { include: { course: true } },
        instructor: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
        room: true,
        demand: true,
        confirmedGroup: true,
        confirmedClass: true,
      },
    });
    if (!cg) throw new NotFoundException('Candidate group not found');
    return cg;
  }

  async listCandidateGroups(runId: string) {
    const run = await this.prisma.allocationRun.findFirst({ where: { id: runId, deletedAt: null }, select: { id: true } });
    if (!run) throw new NotFoundException('Allocation run not found');
    return this.prisma.candidateGroup.findMany({
      where: { runId, deletedAt: null },
      orderBy: [{ status: 'asc' }, { expectedMargin: 'desc' }],
      include: {
        courseLevel: { include: { course: true } },
        instructor: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
        room: true,
      },
    });
  }

  async updateCandidateStatus(id: string, action: 'hold' | 'reject', reason: string, userId: string) {
    const cg = await this.prisma.candidateGroup.findFirst({ where: { id, deletedAt: null } });
    if (!cg) throw new NotFoundException('Candidate group not found');
    if (cg.status === CandidateGroupStatus.confirmed) throw new BadRequestException('Confirmed candidate group is locked');
    const nextStatus = action === 'hold' ? CandidateGroupStatus.held : CandidateGroupStatus.rejected;
    if (!String(reason || '').trim()) throw new BadRequestException('Reason is required');

    const updated = await this.prisma.candidateGroup.update({
      where: { id },
      data: {
        status: nextStatus,
        explanation: {
          ...(cg.explanation as any),
          ops: { action, reason, at: new Date().toISOString(), by: userId },
        },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'update',
        entityType: 'CandidateGroup',
        entityId: id,
        changes: JSON.stringify({ action, reason }),
      },
    });

    return updated;
  }

  async confirmCandidateGroup(id: string, payload: { reason: string; instructorId?: string; roomId?: string }, userId: string) {
    const cg = await this.prisma.candidateGroup.findFirst({
      where: { id, deletedAt: null },
      include: { courseLevel: { include: { course: true } }, room: true, instructor: true, demand: true },
    });
    if (!cg) throw new NotFoundException('Candidate group not found');
    if (cg.status === CandidateGroupStatus.confirmed) return cg;
    if (!String(payload.reason || '').trim()) throw new BadRequestException('Reason is required');
    if (cg.studentCount < cg.minCapacity) throw new BadRequestException('Minimum capacity not met');

    const instructorId = payload.instructorId || cg.instructorId;
    const roomId = payload.roomId || cg.roomId;
    if (!instructorId) throw new BadRequestException('Instructor is required');
    if (!roomId) throw new BadRequestException('Room is required');
    if (cg.expectedMargin < 0) throw new BadRequestException('Not profitable');

    const override = (payload.instructorId && payload.instructorId !== cg.instructorId) || (payload.roomId && payload.roomId !== cg.roomId);
    if (override && payload.reason.trim().length < 5) throw new BadRequestException('Override requires a reason');

    // Double booking checks (recurring classes)
    const fromDate = new Date(cg.startDate);
    const toDate = cg.endDate ? new Date(cg.endDate) : new Date(fromDate.getTime() + 90 * 24 * 60 * 60 * 1000);

    const overlapClassWhere = (base: any) => ({
      deletedAt: null,
      dayOfWeek: cg.dayOfWeek,
      AND: [
        { startTime: { lt: cg.endTime } },
        { endTime: { gt: cg.startTime } },
        { startDate: { lt: toDate } },
        { OR: [{ endDate: null }, { endDate: { gt: fromDate } }] },
      ],
      ...base,
    });

    const instructorConflicts = await this.prisma.class.findFirst({
      where: overlapClassWhere({ instructorId }),
      select: { id: true, name: true },
    });
    if (instructorConflicts) throw new BadRequestException(`Instructor is already booked by class: ${instructorConflicts.name}`);

    const roomConflicts = await this.prisma.class.findFirst({
      where: overlapClassWhere({ roomId }),
      select: { id: true, name: true },
    });
    if (roomConflicts) throw new BadRequestException(`Room is already booked by class: ${roomConflicts.name}`);

    const room = await this.prisma.room.findFirst({ where: { id: roomId, deletedAt: null } });
    if (!room) throw new BadRequestException('Invalid room');

    // Create real Class + Group atomically, lock candidate group
    const result = await this.prisma.$transaction(async (tx) => {
      const classEntity = await tx.class.create({
        data: {
          name: `${cg.courseLevel.course.name} - ${cg.name}`,
          location: room.location,
          locationName: room.name,
          roomId: room.id,
          capacity: cg.maxCapacity,
          minCapacity: cg.minCapacity,
          maxCapacity: cg.maxCapacity,
          code: cg.name,
          courseLevelId: cg.courseLevelId,
          levelNumber: cg.courseLevel.sortOrder,
          plannedSessions: (cg.demand as any)?.plannedSessions ?? null,
          price: (cg.demand as any)?.pricePerStudent ?? null,
          instructorId,
          dayOfWeek: cg.dayOfWeek,
          startTime: cg.startTime,
          endTime: cg.endTime,
          startDate: fromDate,
          endDate: cg.endDate ? new Date(cg.endDate) : null,
        } as any,
      });

      const group = await tx.group.create({
        data: {
          name: cg.name,
          courseLevelId: cg.courseLevelId,
          defaultClassId: classEntity.id,
          createdById: userId,
        },
      });

      // Assign enrollments to group (same course level)
      const studentIds = Array.isArray(cg.studentIds) ? (cg.studentIds as any[]) : [];
      await tx.studentEnrollment.updateMany({
        where: { courseLevelId: cg.courseLevelId, studentId: { in: studentIds }, status: 'active' },
        data: { groupId: group.id, classId: classEntity.id },
      });

      const updated = await tx.candidateGroup.update({
        where: { id: cg.id },
        data: {
          status: CandidateGroupStatus.confirmed,
          lockedAt: new Date(),
          lockedById: userId,
          instructorId,
          roomId: room.id,
          confirmedGroupId: group.id,
          confirmedClassId: classEntity.id,
          explanation: {
            ...(cg.explanation as any),
            ops: { action: 'confirm', reason: payload.reason, override, at: new Date().toISOString(), by: userId },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'update',
          entityType: 'CandidateGroup',
          entityId: cg.id,
          changes: JSON.stringify({ action: 'confirm', reason: payload.reason, override, instructorId, roomId }),
        },
      });

      return updated;
    });

    return result;
  }
}


