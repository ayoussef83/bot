# BRIEF S9 — Renewal Engine + Portfolio & Progress Reports

**Branch:** `feature/renewal-portfolio` | **Read first:** `COORDINATOR.md`, `GAP_ANALYSIS_OPERATING_MODEL.md` (B1, B4), Operating Model Overview PDF (Workflow D + E), Operations Department Roles PDF

## Part 1 — Renewal engine (Workflow E, owned by Operations)
Models (deliver `prisma/PROPOSED_MODELS_RENEWAL.md`, [SHARED] — integrator merges):
- Round tracking on `StudentEnrollment`: `sessionsPlanned Int @default(12)`, `roundNo Int @default(1)`, `renewalDate DateTime?`
- `RenewalCase`: enrollmentId, roundNo, dueDate, stage (due|reminder_sent|negotiating|renewed|lost), attempts Int, lastContactAt, instructorRecommendation String?, churnReason (enum: price|schedule|exams|moved|dissatisfied|other)?, churnNotes, ownerId, @@unique(enrollmentId, roundNo)

Logic:
1. Scheduled task (daily): for each active enrollment, count completed attended sessions this round; at **session 8** → create RenewalCase (stage due) + parent notification + instructor prompt for recommendation; compute/refresh `renewalDate` = projected session-12 date from the class schedule.
2. Stage machine endpoints (ops role): due→reminder_sent (auto on notification), →negotiating, →renewed (requires payment allocated to a NEW invoice for next round: increments roundNo, resets counters, new renewalDate, updates portfolio payment statement), →lost (REQUIRES churnReason; only after attempts>=3 or explicit no).
3. Win-back feed: `GET /renewals/win-back?month=` returns lost cases with reasons — consumed by CRM (S2) as a lead campaign source.
4. Frontend: "Renewals" pipeline page (ops only): columns per stage, case cards show portfolio link, session-8 report, instructor recommendation, renewal price (from PriceList when S10 lands; until then Class.price).
5. KPIs endpoint: renewal rate (renewed/due) monthly, notifications-on-time %, calls-within-3-days %.

## Part 2 — Portfolio + milestone reports (Workflow D)
Models:
- `ProgressReport`: enrollmentId, milestone (4|8|12), content, strengths, nextFocus, status (draft|approved|published), authorId (instructor), approvedById, approvedAt, publishedAt
- `PortfolioItem`: studentId, enrollmentId?, type (certificate|project_photo|note), url (minio/storage), caption, createdById

Logic:
1. Instructor writes report when session counter hits 4/8/12 (prompt via notification; instructor app later consumes same API).
2. Instructors-manager approval endpoint (48h SLA surfaced on ops dashboard); ops publish endpoint → parent notification (WhatsApp template when inbox lands; Notification row now).
3. Portfolio GET per student: identity, course+level, start date, payment statement (from invoices/allocations), renewal date, reports, items — this is also the parent-app portfolio API (S7 contract) and the renewal-call pitch view.
4. Frontend: portfolio tab on Student profile; approval queue page for instructors-manager role.

## Acceptance
- Simulated enrollment with 8 completed sessions auto-creates RenewalCase + notification
- renewed transition blocked without new-round payment; lost blocked without churnReason
- Report approval flow enforces roles (author ≠ approver)
- Portfolio endpoint returns complete pitch payload
- tsc clean; models via proposal doc only; push branch only
