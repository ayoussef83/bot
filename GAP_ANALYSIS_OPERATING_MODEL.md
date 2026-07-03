# Gap Analysis — Operating Model v1.0 (Drive docs) vs MV-OS

**Date:** 2026-07-03
**Sources read in full:** Operating Model Overview, Operations Department Roles, Sales Agent Manual, Sales Department Roles (all v1.0 July 2026), 2025 Customer Data sheet, sales commission sheet, payment/customer history sheets.
**Context:** the docs describe the target operating model currently mapped onto FunnelFast (GHL) + sheets + D1 warehouse. MV-OS's job is to BE that system. Below: what the model requires vs what MV-OS has.

## A. Covered already (exists or in-flight)

| Operating model requirement | MV-OS status |
|---|---|
| Cohorts (code, program, level, instructor, day/time, place, capacity) | `Class` + `Group` + naming convention — ✅ built |
| Instructor availability board | `InstructorAvailability` + guards — ✅ built (proven in E2E) |
| Room availability per branch | `Room` + `RoomAvailability` — ✅ built |
| Open-a-slot approval chain (demand → instructor → room → Leader approves) | Allocation engine (`AllocationRun→CandidateGroup` w/ lock+confirm) — ✅ built, matches Workflow A almost exactly |
| Payments capture (amount, method incl. VF cash/InstaPay/POS/bank, date, remaining balance) | Finance invoices+payments+allocations — ✅ built (remaining = derived, better than the sheet) |
| Attendance same-day | `SessionAttendance` + markedBy/markedAt — ✅ built |
| Session log (topic + homework) | `SessionReport` — ✅ model added today (add `topicCovered`,`homework` fields) |
| Unified inbox + AI first-reply + one-contact-per-parent | Social inbox port — 🔄 S1 brief |
| Channel pipelines / lead sources (Messenger, Leads, WhatsApp, calls, friends, old data, website trial) | CRM port — 🔄 S2 (add these as source enum/values) |
| Roles & boundaries ("nobody edits another department's area") | RBAC — 🔄 S4 brief |
| Parent portal / community | Parent app — 🔄 S7 (later) |

## B. GAPS — required by the model, missing in MV-OS

### B1. Renewal engine (Workflow E) — **the biggest gap, owns the revenue flywheel**
Docs: 12-session rounds; Renewal Date = expected session-12 date set at enrollment; at session 8 → auto parent notification + renewal opportunity ("Renewal Due" → "Reminder Sent" → "Negotiating" → "Renewed"/Lost); call within 3 days; fixed renewal price list, no improvised discounts; payment resets counter + new date; lost only with recorded churn reason after 3 attempts; churned families → monthly win-back list → Sales.
MV-OS has: nothing. Needs:
- `EnrollmentRound` (enrollmentId, roundNo, sessionsPlanned=12, startSession, renewalDate) or fields on StudentEnrollment
- `RenewalCase` (enrollmentId, dueDate, stage, attempts, instructorRecommendation, churnReason?, ownerId) + pipeline UI
- Session-8 trigger (scheduled task counts completed sessions per enrollment)
- Churn reasons enum + monthly win-back list feed into CRM as lead campaign

### B2. Slot-request demand queue (Sales → Ops official channel)
Docs: agent tags `slot request` + course/level/day/time/branch; weekly review; 3–4 matching = open a group; requester parents contacted when slot opens.
MV-OS has: `CourseDemand` (engine input) but no sales-facing request object. Needs: `SlotRequest` (contactId/parentId, course, level, preferredDay, timeWindow, location, status open/matched/closed) + demand counter view grouped by course+level+time + feed into AllocationRun + "notify waiting parents" on group open.

### B3. Onboarding pipeline + audits
Docs: paid → onboarding opportunity auto-created → Ops verifies payment fields <24h → "Onboarded" (portfolio, community, portal invite, welcome msg) → seats filled updated. Daily audits: unpaid bookings (seat without paid), incomplete paid profiles, attendance not recorded.
MV-OS has: enrollment + invoice, no pipeline/no audits. Needs:
- Onboarding status on enrollment (paid_pending_verification → onboarded) + checklist
- **Daily audit cron** (system-crons pattern): (a) enrollment w/o allocated payment, (b) paid contact w/ missing required fields, (c) yesterday's sessions w/o attendance → flags on ops dashboard
- Welcome message automation (bilingual template) via notifications

### B4. Student portfolio + milestone progress reports
Docs: portfolio per student (name, course, level, start date, payment statement, renewal date, certificates, project photos); instructor writes progress report at sessions 4/8/12; Instructors Manager approves <48h; Ops publishes + WhatsApp notify; portfolio is the renewal pitch.
MV-OS has: SessionReport (per session) only. Needs: `ProgressReport` (enrollmentId, milestone 4|8|12, content, strengths, nextFocus, status draft/approved/published, approvedById, publishedAt) + `PortfolioItem` (studentId, type certificate|photo|project, url via storage/minio, caption) + approval flow + parent notification. Portal rendering = parent app (S7); model + API now.

### B5. Roles are flatter than the org
Docs: Sales Manager vs Agent, Instructors Manager vs Instructor, Ops Leader vs Coordinator — approve vs execute split (e.g., only Ops Leader opens groups; Sales Mgr approves discounts in a Leader-set range; Instr Mgr approves reports).
MV-OS: single `sales`/`instructor`/`operations` roles. Needs (S4): add `sales_manager`, `instructors_manager`, `ops_leader` roles (or `isManager` on UserRole) + permission rows: `groups.approve` (ops_leader only), `reports.approve` (instructors_manager), `discounts.approve` (sales_manager), price-list edit (ops_leader).

### B6. Price list + discount governance + commissions
Docs: fixed new-sale discount range (Leader sets), fixed renewal price list, no improvised discounts. Commission sheet: monthly commission per rep (e.g. May = 4,385 EGP), rep attribution on every sale (Amira/Ayman), payment plans "Monthly" vs "Competition".
MV-OS has: `Class.price` only. Needs: `PriceList` (program+level+mode new|renewal, price, effectiveFrom) + `DiscountPolicy` (role, maxPct) + enforcement in invoice creation + `SalesCommission` (repId, period, rules %, computed from paid allocations) — commission report replaces the sheet.

### B7. KPI dashboard additions
From the four docs' KPI tables: paid→onboarded <24h, slot build same-day, capacity utilization (seats/6), outstanding EGP, reminder delivery 100%, renewal notifications 100% at s8, renewal calls ≤3d, renewal rate, attendance same-day %, first-response <15min, field completeness, unpaid-booking flags=0, win-back conversion, slot-request→open days.
MV-OS dashboards: management/ops/accounting basics. Needs: KPI widgets fed by B1–B3 entities + inbox response-time (post-S1).

### B8. Data corrections
Docs: "payment data is never deleted — corrections are logged". MV-OS: Payment has `reversed` status ✅ but enforce no-delete via RBAC (no `payments.delete` permission for anyone but super_admin) + AuditLog on reversals.

### B9. Locations
Customer sheets reveal **Nasr City** branch + Zayed/Tagamo3 active. Location seed list = MOA, ESPACES, DOKKI, Maadi, Nasr City, Sheikh Zayed, Tagamo3, Online. (S4/S6 updated.)

### B10. Customer data import
`2025 Customer Data` sheet = live roster (groups, kids, parent phones/emails, session counters, payment dates, rich notes incl. at-risk info). This extends the S6 importer: parents (dedupe by phone), students, group membership, next-payment dates → seed renewal dates. Historical sheets (client Data, Q2 2024, Payment details) = archive import for LTV/win-back lists.

## C. Contradictions to resolve with Ahmed
1. Docs cap groups at **6 students**; sheet groups have 7 (WeDo G76). Confirm capacity=6 hard or per-program.
2. Docs say renewals are **Operations'**, win-back is Sales'. MV-OS CRM port (S2) should model Renewal pipeline separately from sales pipelines and restrict access accordingly.
3. Docs assume FunnelFast stays for now. Decision taken earlier: MV-OS replaces it. The manuals' workflows become MV-OS UI requirements (esp. the agent's 6-area map: Conversations, Contacts, Opportunities, Calendars/slots, Cohorts read-only, Payments-reference).

## D. Implementation mapping

| Gap | Where | Wave |
|---|---|---|
| B5 roles, B9 locations | S4 (brief updated) | 1 |
| B10 import | S6 (brief updated) | 1 |
| B2 slot requests, B3 onboarding+audits | **NEW S8 brief** `feature/ops-workflows` | 2 |
| B1 renewal engine, B4 portfolio+reports | **NEW S9 brief** `feature/renewal-portfolio` | 2 |
| B6 pricing+commissions | **NEW S10 brief** `feature/pricing-commissions` | 3 |
| B7 KPIs, B8 no-delete | Integrator + dashboards after S8/S9 land | 3 |

## Implementation status (2026-07-03, deployed `2ce7901`, tag `stable-20260703-gap-closure`)

**Backend for B1–B4 is LIVE on mv-app** (`ops-model` module + migration `20260703200000_operating_model_gap`):
- ✅ B1 Renewal engine: `RenewalCase` + round fields on enrollment; daily 06:00 Cairo scan creates cases at session 8 + parent notification + projected renewal dates (verified: 2026-09-19 for the E2E enrollment = correct 12-week math); stage machine with guards (lost requires churnReason + 3 attempts; renewed requires fully-paid new-round invoice and increments round); `GET /renewals/win-back`; KPIs endpoint
- ✅ B2 Slot requests: CRUD + `GET /slot-requests/demand` (verified: 3 matching requests grouped, readyToOpen=true) + match-on-open endpoint
- ✅ B3 Onboarding: pending_payment → paid_unverified (auto on payment allocation, hook in finance) → onboarded (+bilingual welcome notification); Daily audits 05:30 Cairo: unpaid bookings, incomplete paid profiles, missing attendance (verified: 1 flag) + resolve-with-note
- ✅ B4 Portfolio: `ProgressReport` (4/8/12, draft→approved→published, author≠approver) + `PortfolioItem` + `GET /portfolio/student/:id` full pitch payload (verified) + publish notification; SessionReport gained topicCovered/homework
- ⏳ Remaining: frontend pages (S8/S9 briefs — now UI-only), B5 manager roles (S4), B6 pricing/commissions (S10), B7 KPI widgets, customer-data import (S6)
