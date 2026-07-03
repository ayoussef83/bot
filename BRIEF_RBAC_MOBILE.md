# BRIEF S4 — RBAC + Mobile API

**Branch:** `feature/mobile-api` | **Read first:** `COORDINATOR.md`, `MV-OS_OPERATING_MODEL.md` (§3 RBAC matrix)
**Mission:** Replace fixed roles with table-driven RBAC and expose a mobile API namespace with push notifications.

## Part A — RBAC

1. Copy Nour Auto RBAC models from `~/NourAutoERP/backend/prisma/schema.prisma`: `Role, Permission, RolePermission, UserRole` (+ `Branch, UserBranch` adapted to `Location, UserLocation`). Deliver as `prisma/PROPOSED_MODELS_RBAC.md` for integrator merge.
2. `Location` model: id, name, type (`own_branch | partner_venue | online`). Seed: MOA, ESPACES, DOKKI, Maadi, Online, Sheikh Zayed, Tagamo3.
3. Port/adapt guards from Nour Auto `backend/src/auth/`: `RolesGuard`, `@Permissions('resource.action')` decorator.
4. Seed script `prisma/seed-rbac.ts`: the full permission matrix from OPERATING_MODEL §3 (7 roles). Idempotent.
5. Scope filters: helper `applyScope(query, user, {location?, ownership?})` used by services; document usage in `RBAC_USAGE.md`.
6. Wire existing endpoints minimally: add `@Permissions()` to students, groups, finance controllers as reference implementations (3 controllers is enough — the rest follow in their own sessions).

## Part B — Mobile API

1. New module `backend/src/mobile/` with controllers namespaced `/mobile/*`:
   - `mobile/auth` — OTP login (adapt Nour Auto `OtpCode` flow; SMS via existing provider)
   - `mobile/instructor` — my-week (sessions), session detail w/ enrolled students, attendance POST, session-report POST (fields per OPERATING_MODEL Chain 3), availability GET/PUT, allocation proposals GET + accept/decline POST
   - `mobile/parent` — children, schedule, attendance history, invoices (read), stub for chat
2. Push: `PushDevice` model (userId, fcmToken, platform); FCM send service inside existing notifications module pattern — but as NEW files in `mobile/` (notifications module is not shared-listed, still coordinate via commit note).
3. All mobile endpoints guarded by RBAC from Part A (instructor/parent roles, ownership scope).
4. Document every endpoint in `MOBILE_API.md` (method, path, role, request/response JSON) — this is S5/S7's contract.

## Acceptance

- Backend compiles, no DI errors; guards reject wrong-role access in an e2e smoke test
- Seed script runs idempotently; matrix matches OPERATING_MODEL §3
- `MOBILE_API.md` complete — S5 can build the app against it without asking questions
- No edits to `app.module.ts` / `schema.prisma` ([SHARED] — deliver proposals, integrator merges)
