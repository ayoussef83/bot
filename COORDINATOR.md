# MV-OS COORDINATOR — Parallel Agent Build Plan

**Pattern:** same as NourAutoERP (proven): one integrator session + parallel Cowork sessions, each owning a module on its own feature branch. The integrator merges to `main`, deploys, and keeps this file updated. Sessions read this file + their brief at start.

## Roles

- **Integrator (Ahmed's main session with Claude):** owns `main`, merges branches, resolves shared-file conflicts, deploys to the datacenter, updates this file.
- **Module sessions:** each gets a `BRIEF_*.md`, works ONLY on its branch and its files, pushes to origin, never deploys, never merges.

## Sessions & Branches

| # | Session | Branch | Scope | Depends on |
|---|---|---|---|---|
| S1 | Social Inbox port | `feature/inbox-port` | Port social-inbox module + inbox UI from NourAutoERP (PORT_PLAN Phase 1) | — |
| S2 | CRM port | `feature/crm-port` | CRM module + pipeline/contacts UI + Lead migration (Phase 2) | S1 prisma models (coordinate) |
| S3 | Marketing intel | `feature/marketing-intel` | meta-ads-etl, lead-intake, conversion-match + UI (Phase 3) | S2 contacts |
| S4 | RBAC + mobile API | `feature/mobile-api` | Role/Permission tables, permission matrix seed (OPERATING_MODEL §3), `mobile/` API namespace, FCM push | — |
| S5 | Instructor app | `feature/app-instructor` | Expo app: schedule, attendance, session report, availability, allocation accept/decline | S4 |
| S6 | Sheet import + Locations | `feature/sheet-import` | Location model (MOA/ESPACES/DOKKI/Maadi/Online), idempotent importer for the Schedule System sheet, invalid-groups fix queue | — |
| S7 | Parent app | `feature/app-parent` | Expo parent mode: schedule, attendance, payments, chat | S4, S5 shipped |

Recommended wave 1: **S1 + S4 + S6** (no interdependencies). Wave 2: S2 + S5. Wave 3: S3 + S7.

## Shared Files — single-writer rules

| File | Owner |
|---|---|
| `backend/prisma/schema.prisma` | Integrator merges all model additions; sessions submit models in their brief PR description |
| `backend/src/app.module.ts` | Integrator |
| `frontend/src/components/AppSidebar.tsx` | Integrator |
| `.env*` / server env | Ahmed only |

Sessions add NEW files freely inside their module directories. Any edit to a shared file = note it in the PR/commit message with `[SHARED]`.

## Working rules (all sessions)

1. Active tree is `Mvalley System/Mvalley System/` (inner). Do not touch the stale outer `backend/`.
2. Git via Desktop Commander on the Mac; clear `.git/index.lock` first; push after every commit. Sandbox git push fails (proxy).
3. `npx tsc --noEmit` clean before every commit. `React.ReactNode`, auth fetch wrapper, no bare `fetch()`.
4. Prisma: `prisma migrate dev` on your branch; never against prod DB. Migration files commit with the branch.
5. Blocked >30 min → write the blocker into this file under "Blockers" and move to next task.
6. Read before coding: `MV-OS_OPERATING_MODEL.md` (data chains + RBAC), `PORT_PLAN_NOURAUTO.md`, `MV-OS_FULL_SYSTEM_BLUEPRINT.md`.

## Deployment (mv-app, set up 2026-07-03)

- Server: `ssh mv-app` → stack at `/opt/stacks/mvalley-system`, git checkout at `/opt/stacks/mvalley-repo` (clone of GitHub main)
- Deploy: `cd /opt/stacks/mvalley-system && ./deploy.sh backend|frontend|all` (pulls main, syncs code preserving server `.env*`, builds, restarts, shows logs)
- Rollback: `./deploy.sh rollback <tag>` — stable baseline tags like `stable-20260703-parents-fix`
- Rules: never touch postgres/minio, never edit server `.env`, migrations auto-apply on backend start (`prisma migrate deploy` in entrypoint)
- **Only the integrator deploys.** Sessions never run deploy.sh.
- Tag a `stable-YYYYMMDD-<name>` baseline after every verified deploy.

## Integrator loop

Every merge window: `git fetch --all` → review each feature branch diff → merge to `main` in dependency order → run migrations on staging → deploy → smoke test → update Status below. Use the session-coordinator skill ("check sessions") to generate branch status reports.

## Status

| Branch | State | Last update |
|---|---|---|
| `feature/inbox-port` | Branch created, brief ready (`BRIEF_INBOX_PORT.md`), session not started | 2026-07-03 |
| `feature/mobile-api` | Branch created, brief ready (`BRIEF_RBAC_MOBILE.md`), session not started | 2026-07-03 |
| `feature/sheet-import` | Branch created, brief ready (`BRIEF_SHEET_IMPORT.md`), session not started | 2026-07-03 |

## Blockers

_none_
