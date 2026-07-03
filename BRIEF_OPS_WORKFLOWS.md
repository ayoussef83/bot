# BRIEF S8 — Ops Workflows: Slot Requests, Onboarding, Daily Audits

**Branch:** `feature/ops-workflows` | **Read first:** `COORDINATOR.md`, `GAP_ANALYSIS_OPERATING_MODEL.md` (B2, B3), the four operating-model PDFs (Drive folder 109zBwhDXM6snfXRON0kegzOdQsZUH5Rq)

## Part 1 — Slot Request queue (Workflow A input)
1. Model `SlotRequest`: parentId (or contact ref), courseId, courseLevelId?, preferredDay Int?, timeWindow String?, locationRef, notes, status (open|matched|closed), createdById, matchedClassId?. Deliver as `prisma/PROPOSED_MODELS_OPS.md` ([SHARED] schema — integrator merges).
2. Backend module `slot-requests/`: CRUD + `GET /slot-requests/demand` grouped by course+level+timeWindow with counts (the Sunday demand meeting view).
3. On group open (class create/confirm): endpoint to notify waiting requesters' owners + mark matched.
4. Frontend: ops page "Slot Requests" (demand board, 3+ matches highlighted); sales can create from student/parent context.

## Part 2 — Onboarding pipeline (Workflow B)
1. Enrollment gains onboarding fields: `onboardingStatus` (pending_payment|paid_unverified|onboarded), `onboardedAt`, `onboardedById` (proposal doc, integrator merges).
2. Flow: payment allocated to enrollment's invoice → status `paid_unverified` + ops notification; ops verifies → `onboarded` → triggers welcome message (bilingual template via notifications module) + portfolio stub creation (S9 model).
3. Ops dashboard widget: paid_unverified older than 24h = red.

## Part 3 — Daily audits (system-crons pattern)
Nightly job producing `AuditFlag` rows (model in proposal): 
- (a) active enrollment in a class with no allocated payment ("unpaid booking")
- (b) onboarded contact/parent with missing required fields (phone, student age, amount paid)
- (c) yesterday's completed-schedule sessions with no attendance recorded
- (d) sessions tomorrow with no reminder sent (once reminders wired)
Ops dashboard "Audits" panel lists open flags; resolving requires a note. Sales Manager sees (a) for their team.

## Acceptance
- Demand view groups correctly; 3 matching requests visibly flagged
- Payment → paid_unverified → onboarded transitions audited (AuditLog)
- Cron produces flags on seeded test data; zero false positives on clean data
- `npx tsc --noEmit` clean; no [SHARED] file edits; push branch only
