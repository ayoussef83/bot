# E2E User-Journey Test — mv-app (2026-07-03)

Ran as super_admin against the live stack (backend `stable-20260703-parents-fix` + deploy.sh sync). Full journey: course → level → parent → student → enrollment → instructor → availability → room → class → match → session → attendance → complete → invoice → payment → allocation → accounting.

## ✅ What works cleanly (data flows everywhere it should)

| Step | Verified reflection |
|---|---|
| Parent + student + enrollment | Student profile shows parent phone + enrollments |
| Instructor (user + profile + availability) | Availability window enforced on session create |
| Class ↔ enrollment match | **Guard works:** rejects if student's course level ≠ class course level |
| Session create | **Guards work:** rejects if instructor has no availability; rejects out-of-window (Cairo TZ-aware) |
| Attendance | Session shows it, student profile shows it (`attendances:1`), student /sessions view shows it, `markedById/markedAt` populated (new audit columns live) |
| Invoice 1500 → payment 1500 cash → allocation | Invoice auto-flips to **paid**; cash account balance 0→1500; finance overview cash position + net correct; management dashboard `monthlyRevenue:1500, cashIn:1500`; accounting dashboard lists the payment with `receivedBy` audit |

## ❌ Bugs found (in priority order)

1. **Class creation spawns a duplicate Course.** `POST /classes` forbids `courseLevelId`/`roomId` (DTO whitelist), then the service auto-creates a NEW course named after the class (course "E2E-GRP-…" appeared in /courses/levels). Every class created via UI = one junk course. Fix: add `courseLevelId`, `roomId` to Create/UpdateClassDto and stop auto-creating courses.
2. **Class detail shows 0 enrolled students** even after enrollment.classId is set — the include still counts the legacy `students` relation instead of `enrollments`. Ops can't see rosters. (Confirms DB_AUDIT B1.)
3. **Student profile shows 0 invoices** though the invoice exists — student GET include is missing invoices; unpaid balance can't be displayed.
4. **No payroll accrual on session completion** — `instructorSessions:0` after a completed session with attendance. Verify whether a payroll run generates them retroactively; if not, completion should create the InstructorSession cost record (Chain 5 gap).
5. **`scheduledDate` not normalized** — date-only string reaches Prisma and 500s ("premature end of input"); should be parsed or rejected with 400.
6. **Empty-string FK ids → 500** (enrollment PATCH classId:"", attendance sessionId:"") — Prisma P2003 leaks as Internal Server Error; add `@IsUUID`/non-empty validation.
7. **Invoice accepts `classId: ""`** — stored dangling (bare string field, no validation). Confirms DB_AUDIT C finding.

## Notes
- Dashboard routes are `/dashboard/management|ops|accounting|instructor` (no root route).
- No notification fired on payment (receipt automation not built yet — known blueprint gap).
- Test data left in DB, prefixed `E2E` (student bd70ac26…, course "E2E Course 1783079129", junk course "E2E-GRP-1783079193" from bug #1) — say the word and I'll clean it.

## Suggested fix batch
Bugs 1–3 + 5–7 are one small backend PR (DTO fields, includes, validation). Bug 4 needs a payroll-flow decision. I can implement the batch and deploy via `./deploy.sh backend`.
