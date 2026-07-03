# MV-OS Database Structure Audit

**Date:** 2026-07-03 | **Scope:** `Mvalley System/backend/prisma/schema.prisma` (1,865 lines, 50 models, 18 migrations since 2025-12-31 baseline)

## Verdict

Solid core. The allocation chain and finance domain are genuinely well-modeled (explainability JSON, economics on candidate groups, immutable payroll snapshots, financial periods with lock states, payment↔invoice allocation). Consistent conventions throughout: uuid PKs, soft deletes, snake_case `@@map`, sensible indexes. The problems are concentrated in five areas below — all fixable inside the Wave plan, none require a rebuild.

## Strengths (keep as-is)

- **Allocation engine:** `AllocationRun → CourseDemand → TimeCluster → CandidateGroup → TeachingSlot → Class` with lock/confirm lifecycle, margin gates (`minMarginPct`, red/yellow/green), and `explanation Json` for auditability.
- **Finance:** Invoice/Payment separation with `PaymentAllocation` join, `FinancialPeriod` open/closed/locked, `ReconciliationRecord`, `MonthlySnapshot`. Payroll: `@@unique(instructorId, periodYear, periodMonth)` + immutable `snapshot Json`.
- **Instructor domain:** cost models with effective windows, contracts, blackouts, documents with expiry — richer than the sheet ever was.

## Findings

### A. Blockers for the operating model (fix in Wave 1)

| # | Issue | Fix | Owner |
|---|---|---|---|
| A1 | `Location` is a hardcoded enum `{MOA, Espace, SODIC, PalmHills}` — missing Online, DOKKI, Maadi (all live in the sheet). `Class.locationName String?` exists as a backfill hack, proving the enum already failed once. Used in 6 models. | Replace with `Location` table (type: own_branch/partner_venue/online). Migrate enum values; drop `locationName`. | S4 (owns model) + S6 (seeds) |
| A2 | RBAC is a single `User.role` enum column. No Role/Permission tables, no multi-role, no location scoping. `hr`, `student`, `school_admin` roles exist in enum but unused. | Port Nour Auto `Role/Permission/RolePermission/UserRole` + `UserLocation`. Keep enum column during transition, drop after seed. | S4 |
| A3 | **No session report model.** `SessionAttendance` = attended bool + notes only. Chain 3 (report → parent/payroll/quality) has no table; Form Responses fields (engagement 1–5, clarity/pace/activities/difficulty, issues, follow-ups, material suitability) have no home. `InstructorFeedbackSummary` aggregates from a source that doesn't exist. | New `SessionReport` model 1:1 with Session (instructorId, engagement, 4 rating fields, issues, followUps, materialSuitability, submittedAt). | S4 (model) / S5 (writes) |
| A4 | `NotificationChannel` lacks `push`; no `PushDevice`, no `OtpCode` — mobile auth/push impossible. | Add in mobile API work. | S4 |
| A5 | Old marketing models will collide with inbox port: `Lead.marketingConversationId @unique` allows only ONE conversation per lead (a parent with WhatsApp + IG threads breaks); no assignment log/followers/templates. | Confirmed: replace per PORT_PLAN Phase 1; the field-diff must resolve `Conversation/Message` (@@map `marketing_messages`) against Nour Auto's. | S1 |

### B. Integrity risks (fix during Wave 1–2, cheap now, expensive later)

| # | Issue | Fix |
|---|---|---|
| B1 | **Three ways to place a student:** `Student.classId`, `StudentEnrollment.classId`, `Group` membership. They can disagree — same failure mode as the sheet's duplicate tabs. | Deprecate `Student.classId`; enrollments are the truth. Backfill + drop in a migration. |
| B2 | **Schedule duplicated** between `TeachingSlot` (day/time) and `Class` (dayOfWeek/startTime/endTime). Drift = double-booking that the DB can't see. | Rule: slot wins, class fields become derived cache; service must write both atomically. Document in code. |
| B3 | Money is `Float` across all 15+ finance fields. Float rounding in accounting is a real bug class. | Migrate to `Decimal @db.Decimal(12,2)` before real volume. One migration, do it early. |
| B4 | `Session.room` is a free `String?` while rooms are modeled — untyped override defeats room conflict checks. | Change to `roomId FK`. |
| B5 | Status fields as bare strings: `Session.status`, `StudentEnrollment.status` ("active/paused/completed"). Everything else uses enums. | Convert to enums for consistency + query safety. |
| B6 | `User.email @unique` + soft delete: re-registering a deleted email throws. | Partial unique index (`WHERE deleted_at IS NULL`) via raw migration. |
| B7 | Attendance rows lack `markedBy`/`markedAt` — payroll triggers off `attendanceComplete`; no audit path for disputes. | Add two columns when S5 builds attendance marking. |

### C. Dangling references (decide, don't drift)

- `Invoice.classId`, `Invoice.subscriptionId`, `Invoice.installmentPlanId` — bare strings; Subscription/InstallmentPlan models don't exist. Either build or remove before parents can pay through the app.
- `Expense.sessionId`, `Notification.studentId/leadId/parentId`, `ReconciliationRecord.related*` — intentional loose links; acceptable, but add indexes where queried.
- `LeadSource` enum lacks `whatsapp`/`meta_ads` — today's actual top sources. (Moot if S2 replaces Lead with CRM Contact — confirm before adding.)
- JSON `studentIds` arrays in allocation models: fine as engine snapshots; never treat as authoritative membership.

### D. Dedupe strategy needed before CRM port (S2 input)

`Lead.phone` (required), `Parent.phone` (required), `Participant.phone` (optional) will all coexist with CRM `Contact`. Define phone-normalized (E.164) matching + merge precedence: Participant → Contact → Parent, one human = one Contact.

## Priority order

1. **A1 Location table + A2 RBAC + A4 mobile prereqs** — S4, already briefed (this audit adds A1 explicitly)
2. **A3 SessionReport** — S4 adds model now, S5 consumes
3. **A5 marketing collision** — S1's field-diff step, already briefed
4. **B1–B2** — integrator migration between Wave 1 and 2
5. **B3 Decimal migration** — do before parent payments go live
6. **C invoice dangles + D dedupe** — decide at S2 kickoff

Briefs updated? → S4 and S6 briefs already cover A1/A2/A4; A3 + B-items added here are NEW asks for S4/S5 and the integrator.

## Fix status (2026-07-03, integrator commit)

Implemented in schema + migration `20260703120000_db_audit_fixes` (backend type-check clean):
- ✅ A1 (partial): Location enum extended with DOKKI/Maadi/Online — full table conversion stays with S4
- ✅ A3: `SessionReport` model + `ReportRating` enum (Google Form fields, 1:1 Session)
- ✅ A4: `push` notification channel, `PushDevice`, `OtpCode` models
- ✅ B4: `Session.roomId` FK added (`room` string kept read-only, deprecated)
- ✅ B5: `SessionStatus` + `EnrollmentStatus` enums replace bare strings (DTOs updated)
- ✅ B7: `SessionAttendance.markedById/markedAt`
- 📝 B1/B2: deprecation + source-of-truth comments in schema; backfill/drop scheduled post-Wave 1
- ⏳ B3 (Float→Decimal), B6 (partial unique email), A2 (RBAC tables), C/D decisions — unchanged, owners as above

**Migration not yet applied to any DB** — run `npx prisma migrate deploy` on dev/staging before next backend build.
