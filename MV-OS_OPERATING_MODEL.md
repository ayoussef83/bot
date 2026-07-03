# MV-OS Operating Model — Data Flow & RBAC

**Date:** 2026-07-03
**Source of truth for how the company works inside MV-OS.**
**Derived from:** the live "Schedule System" Google Sheet (12 tabs, analyzed 2026-07-03), `MV-OS_FULL_SYSTEM_BLUEPRINT.md`, `PORT_PLAN_NOURAUTO.md`

## Principle: Write Once, Reflect Everywhere

The sheet fails because every tab is a manual copy. In MV-OS every fact is written **once, at the moment it happens, by the person who owns it** — and every department's view is derived. No re-typing, no sync steps.

---

## 1. The Six Data Chains

### Chain 1 — Availability → Capacity
**Writer:** Instructor (app) → `InstructorAvailability` windows (day, start, end, mode Online/Offline, location)
**Derived automatically:**
- Ops: free-slot grid per day/location (replaces Dashboard tab: 62 sessions / 87 free slots)
- Sales: bookable trial slots per course/branch (they never ask ops "do we have a spot?")
- Management: availability % KPI = offered hours vs contract hours (replaces Lists tab %)
- Allocation engine: the constraint set for proposals

### Chain 2 — Demand → Schedule
**Writers:** Sales (enrollment creates `CourseDemand`), Ops (runs `AllocationRun`), Instructor (accepts/declines in app)
**Flow:** demand pool → engine proposes groups honoring HARD constraints (inside availability window ✚ no double-booking ✚ location matches instructor mode ✚ room free) → instructor confirms → `TeachingSlot` locked → sessions generated for the term.
**Derived:** instructor week view (app), parent schedule (app), room calendars, ops timetable (replaces Entry + both timetable tabs + Schedules/All_Schedules).
**Rule change vs sheet:** the sheet *flags* ❌ Wrong Day / Double Booked / Out of Hours but lets them run (13 groups today). MV-OS **blocks the save**. Exceptions need a management override, which is logged.

### Chain 3 — Session → Everything
The richest chain. **Writer:** Instructor (app), during/after each session.
1. Marks attendance against the real enrollment list (no free-text names)
2. Submits structured report — same fields as the Google Form: engagement 1–5, clarity/pace/activities/difficulty, issues, follow-ups, material suitability 1–5
**Derived automatically:**
- Parent: attendance notification (+ session summary) in app/WhatsApp
- Next session: previous follow-ups shown to instructor at session start
- Payroll: session delivered → accrual per `InstructorCostModel`
- Ops: report-compliance board (replaces "session report tracker" tab); missing report at +24h → instructor push reminder; +48h → ops flag
- Management: engagement/material-quality trends per course, per instructor
- Curriculum (R&D slots): low material-suitability scores route to the instructor's R&D backlog

### Chain 4 — Lead → Enrollment (CRM port)
**Writers:** Marketing ETL (attribution), AI agent + Sales (inbox/CRM), Sales (convert wizard)
**Flow:** ad → conversation → contact (parent) → opportunity through pipeline → convert = `Student` + `Enrollment` + `CourseDemand` + auto-`Invoice`.
**Derived:** finance sees the invoice instantly; ops sees demand; marketing sees which creative produced the enrollment (CAC per program/branch).

### Chain 5 — Attendance → Money
**Writers:** nobody (fully derived)
- Sessions attended vs sessions paid → renewal alert at N−2 sessions → sales task + parent app renewal offer
- Delivered sessions → `InstructorPayroll` run → accounting approves → expense posted → monthly snapshot
- Overdue invoices → dunning sequence (scheduler)

### Chain 6 — Spend → CAC (marketing-intel port)
Meta ETL (spend/results) + Chain 4 attribution → cost per enrollment per program/branch/creative → management dashboard. Kills the per-conversation blindspot.

---

## 2. Locations (correction from sheet)

Real operating locations: **MOA, ESPACES, DOKKI, Maadi, Online** (+ Zayed/Tagamo3 from CRM history). Model as `Location` entities with type (own branch / partner venue / online). Rooms belong to locations; instructor availability and groups reference locations. Every chain is location-scoped.

## 3. RBAC

### Model
`User → UserRole → Role → RolePermission → Permission(resource.action)` + **scope dimensions** applied in services, not just guards:
- **location scope** (user ↔ locations): ops/sales can be limited per branch
- **ownership scope**: `own` = records where user is the assignee/instructor/parent

Enforcement layers: (1) NestJS `RolesGuard` + `@Permissions()` decorator per endpoint, (2) service-level scope filters in every query, (3) frontend sidebar/pages by role intent, (4) app mode by role. Sensitive writes → `AuditLog`.

### Permission Matrix

| Resource | super_admin | management | operations | sales | accounting | instructor | parent (app) |
|---|---|---|---|---|---|---|---|
| Students/Parents | CRUD | CRUD | CRUD | R + create-via-convert | R | R (own groups, names only — no parent phone/financials) | R (own children) |
| Courses/Levels | CRUD | CRUD | CRUD | R | — | R | R (catalog) |
| Groups/Sessions | CRUD | CRUD + override invalid | CRUD | R (capacity view) | — | R (own) + attendance/report W (own) | R (own children) |
| Allocation runs | CRUD | approve/override | CRUD | — | — | accept/decline own proposals | — |
| Availability | CRUD | R | R + edit on behalf | — | — | W (own) | — |
| CRM (contacts/pipeline) | CRUD | R + reassign | R | CRUD (own + team) | — | — | — |
| Inbox conversations | CRUD | R all + reassign | R | RW (assigned + unassigned pool) | — | — | own thread via app chat |
| Campaigns/Marketing intel | CRUD | R | — | R (attribution of own leads) | — | — | — |
| Invoices/Payments | CRUD | R | R | R (own converts) | CRUD | — | R + pay (own) |
| Expenses | CRUD | R | — | — | CRUD | R (own reimbursements) | — |
| Payroll | CRUD | approve | — | — | run + CRUD | R (own) | — |
| Dashboards/Reports | all | all | ops | sales | finance | own stats | — |
| Settings/Users/Roles | CRUD | R | — | — | — | — | — |
| Audit log | R | R | — | — | — | — | — |

### Role notes
- **management** = Ahmed/Rana: the only role that can override a blocked (invalid) schedule save — logged with reason.
- **sales** (Bassem, Jana, Sara): round-robin owns conversations; can see the capacity grid read-only so they only book trials into real slots.
- **instructor**: strictly own-scope; student PII minimized (child name + age group only).
- **marketing** (if split later): campaigns + intel + inbox R, no CRM money data.
- **parent**: app-only role; never a dashboard user. Children-scoped everywhere.

### Migration note
MV-OS currently ships fixed roles; the port brings Nour Auto's `Role/Permission/RolePermission/UserRole` tables — adopt them as-is and seed the matrix above.

## 4. Sheet Retirement Map

| Sheet tab | Replaced by | Data migrated? |
|---|---|---|
| Lists | Instructor + Course + Location seeds | ✅ import script |
| Availability | InstructorAvailability | ✅ import script |
| Entry | Groups + TeachingSlots (13 invalid ones imported as "needs fix" queue) | ✅ import script |
| groups | Group codes (keep naming convention PY/MA/WD/AI/AR/PB/WEB/FL + serial) | ✅ |
| Dashboard | Ops capacity dashboard (computed) | derived |
| Colored/Text timetable, Schedules, All_Schedules, Instructor Week Data | Calendar views (computed) | derived |
| Form Responses 1 | Instructor app session report (same fields) | ✅ historical import for trends |
| session report tracker | Compliance board + auto reminders | derived |

Cutover: run sheet + system in parallel for 2 weeks; the import script is re-runnable (idempotent upsert) so the sheet stays the writer until instructors are live on the app.
