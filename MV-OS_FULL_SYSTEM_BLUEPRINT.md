# MV-OS Full System Blueprint — Mind Valley Center

**Date:** 2026-07-03
**Companion docs:** `MV-OS_PRODUCT_ARCHITECTURE.md` (UI system), `PORT_PLAN_NOURAUTO.md` (component port)

MV-OS becomes the single operating system for the whole company: one database, one API, three surfaces — **web dashboard** (team), **mobile app** (parents/students), **instructor app mode** (delivery + allocation). Nothing lives in GHL, sheets, or WhatsApp-on-a-phone anymore.

---

## 1. The Operating Loop

Every part of the business is one loop; every stage is a module that already exists, is being ported, or is a defined gap:

```
ATTRACT ──► ENGAGE ──► ENROLL ──► DELIVER ──► GET PAID ──► RETAIN ──► (loop)
   │           │           │           │            │            │
Meta ads   Social      CRM        Allocation    Finance     Campaigns
ETL +      inbox +     pipeline   engine +      invoices,   + progress
lead       AI agent    contacts→  scheduler,    payments,   reports to
intake     WhatsApp    student    sessions,     payroll     parents,
(port)     (port)      convert    attendance    (built)     renewals
                       (built+port) (built)                  (port+new)
```

## 2. Stage by Stage

### ATTRACT — Marketing intelligence (porting from Nour Auto)
- **meta-ads-etl** pulls spend/results from ad account 789492000686313 nightly → real EGP-per-enrollment (not per-conversation) per ad set, per branch.
- **lead-intake** catches every form/CTWA lead with attribution (campaign → ad → creative).
- **conversion-match** closes the loop: which creative produced paying students, not just chats. Kills the "EGP 22/conversation" blindspot.

### ENGAGE — Social inbox + AI agent (porting)
- Unified inbox: WhatsApp (01060014563 via Cloud API), FB Messenger, IG DMs, comments.
- **AI agent** does first-line qualification in Egyptian Arabic: age, branch (Zayed/Tagamo3/Online), program interest — the exact disqualification filters from past campaigns (wrong age, wrong location, online-unaware).
- Round-robin assignment to Bassem, Jana, Sara with `ConversationAssignmentLog` — replaces GHL.
- Templates/snippets = approved Arabic scripts; trigger links measure interest.

### ENROLL — CRM (porting)
- Pipeline: New → Qualified → Trial Booked → Trial Attended → Enrolled → Lost, with reasons.
- Contact = the **parent**; children link as students on conversion. Convert-to-Student wizard already specced in the architecture doc.
- Tasks/activities give sales follow-up discipline; management sees conversion per rep, per branch, per source.

### DELIVER — Academic core (ALREADY BUILT — the strongest part)
- Students, Parents, Courses/Levels, Enrollments, Groups, Rooms + availability grids, Classes, Sessions, SessionAttendance.
- **Allocation engine** (AllocationRun, CourseDemand, TimeCluster, CandidateGroup, TeachingSlot): demand → proposed groups → room + slot + instructor assignment. This is the scheduling brain competitors don't have.
- Instructor stack: skills, contracts, availability, blackout dates, cost models, payroll, feedback summaries, documents.

### GET PAID — Finance (built)
- Invoices, Payments + allocations, expenses, cash accounts, bank sync runs, financial periods, reconciliation, monthly snapshots, instructor payroll.
- Gap: **payment links** (Paymob/Fawry) so a parent pays from a WhatsApp message or the app.

### RETAIN — the flywheel (mostly new, cheap to build on ported parts)
- Scheduler already sends session reminders/SMS confirmations.
- Add: attendance push to parents, end-of-level progress report, renewal campaign (campaigns module, ported) targeting students finishing a level, win-back for dropped students.
- Referral trigger links: parent shares a personal link; attribution is automatic.

## 3. Team Operating Model (who lives where)

| Role | Daily surface | What the system does for them |
|---|---|---|
| Sales (Bassem, Jana, Sara) | Inbox + CRM pipeline | Auto-assigned conversations, AI-prequalified leads, follow-up tasks, trial booking into real class capacity |
| Operations | Academics + Allocation + Scheduler | Demand → groups → rooms/slots/instructors in one flow; attendance oversight; parent comms queue |
| Instructors | Mobile app (instructor mode) | Schedule, attendance marking, session reports, availability input, payroll visibility |
| Accounting | Finance | Invoices auto-created on enrollment, payment status, reconciliation, payroll runs |
| Management (Ahmed, Rana) | Dashboards + Reports | CAC per program/branch, pipeline conversion, occupancy, instructor utilization, cash position |

Handoffs are enforced by the data model, not by chat messages: a lead can't become a student without a contact record; a group can't be scheduled without a room slot and an available instructor; an enrollment auto-creates the invoice.

---

## 4. Customer Touchpoints (every one lands in MV-OS)

1. **Ad click → WhatsApp/Messenger** → social inbox, attributed to the creative.
2. **AI agent + sales chat** → qualification, trial booking.
3. **Trial reminder** → scheduler SMS/WhatsApp (already built).
4. **Enrollment** → welcome message + payment link + app invite.
5. **Every session** → reminder before, attendance notification after.
6. **Level milestones** → progress report + certificate + next-level offer.
7. **Payments** → invoice, receipt, gentle dunning for overdue.
8. **Parent app** (below) → self-service for all of the above.
9. **Renewal/win-back campaigns** → campaigns module, measured end-to-end.

---

## 5. The Mobile App — one app, two modes

Same NestJS API, role-gated. React Native/Expo (Ahmed already has Expo tooling installed). JWT auth reused; OTP login via existing `OtpCode`-style flow (port from Nour Auto if needed).

### Parent/Student mode
- **Home:** children's upcoming sessions, announcements, balance due.
- **Schedule:** per-child calendar (Session + SessionAttendance models — no new backend).
- **Attendance & progress:** attendance history, level progress, instructor feedback summaries.
- **Payments:** invoices, pay-now link, receipts.
- **Chat:** opens a conversation in the social inbox — parents chat in the app, team answers from the same inbox as WhatsApp/FB.
- **Enrollment:** browse programs, book trial, re-enroll (feeds CourseDemand → allocation).

### Instructor mode
- **My week:** assigned sessions (InstructorSession), room/group details, student lists.
- **Attendance:** mark in-session (writes SessionAttendance) — replaces paper.
- **Session report:** 2-minute structured note per session → feeds parent progress reports.
- **Availability:** weekly availability + blackout dates (InstructorAvailability, InstructorBlackoutDate) — this is the input the allocation engine needs; today it's collected manually.
- **Allocation responses:** accept/decline proposed assignments from AllocationRun → confirmed TeachingSlot.
- **Payroll:** sessions delivered × cost model, payout status (InstructorPayroll).

**Key point:** ~90% of the app's backend already exists. The app is mostly a mobile client + a thin `mobile/` API namespace (scoped endpoints + push notifications via FCM added to the notifications module).

---

## 6. Gaps (net-new work, in build order)

1. **Mobile API namespace + push notifications** (FCM in notifications module)
2. **Payment links** (Paymob/Fawry integration in Finance)
3. **Parent-facing progress reports** (template over existing attendance + feedback data)
4. **Instructor allocation accept/decline flow** (small state machine on TeachingSlot)
5. **App itself** (Expo, two modes, Arabic-first RTL)
6. **Renewal/win-back automation rules** (scheduler + campaigns glue)

## 7. Sequence

1. Nour Auto port Phases 0–4 (`PORT_PLAN_NOURAUTO.md`) — closes ATTRACT/ENGAGE/ENROLL and retires GHL.
2. Gaps 1–2 (mobile API + payments) — unblocks the app.
3. App MVP: instructor mode first (internal users, faster iteration, immediate ops value: attendance + availability).
4. Parent mode second (schedule, payments, chat).
5. Retention automations last — they need the data the rest generates.
