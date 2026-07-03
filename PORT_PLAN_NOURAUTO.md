# MV-OS ← NourAutoERP Component Port Plan

**Date:** 2026-07-03
**Decision owner:** Ahmed
**Scope decided:** CRM + Social Inbox + Marketing. New social-inbox REPLACES the old marketing conversation core. Full CRM REPLACES Lead/LeadFollowUp as source of truth.

---

## 1. Repos & Paths

| | Source (Nour Auto) | Target (MV OS) |
|---|---|---|
| Local path | `~/NourAutoERP` | `~/Mvalley System/Mvalley System/` (inner tree = ACTIVE; outer `~/Mvalley System/backend` is stale since 2026-01-04) |
| GitHub | `ayoussef83/NourAutoERP` | `ayoussef83/bot` |
| Backend | NestJS, `backend/src/` | NestJS, `backend/src/` |
| Frontend | Next.js App Router, `frontend/src/` | Next.js App Router, `frontend/src/` |
| DB | Postgres + Prisma (raw SQL for Oracle mirrors, `prisma db push` FORBIDDEN) | Postgres + Prisma **with real migrations** (`prisma/migrations/` exists — use `prisma migrate`) |

## 2. Current State (verified 2026-07-03)

**MV OS already contains an OLD partial port** inside `backend/src/marketing/`:
campaigns, channel-accounts, conversations, messages, participants, meta OAuth.
Prisma already has: `ChannelAccount, Campaign, Participant, Conversation, Message, Attribution, Lead, LeadFollowUp`.
`backend/src/sales/` has leads + follow-ups.

**Nour Auto source modules to port:**

| Module | Path | Contents |
|---|---|---|
| CRM | `backend/src/crm/` | contacts, pipelines (+stages), opportunities |
| Social Inbox | `backend/src/social-inbox/` | conversations, messages, participants, channel-accounts, campaigns, ai-agent (+scheduler), auto-reply, baileys-bridge (WhatsApp Web), whatsapp-cloud, twilio + calls, templates, snippets, trigger-links, manual-actions, reminders, quotes, meta OAuth, webhooks, crypto service |
| Marketing | `backend/src/marketing/` | meta-ads-etl, lead-intake, conversion-match, gbp (Google Business Profile) |

**Nour Auto frontend to port:**
- `dashboard/crm/` — pipeline board, contacts, pipelines settings
- `dashboard/inbox/` — inbox + layout + 7 components (CrmPanel, ContactRail, QuoteComposer, InboxNavTabs, TeamInboxTabs, InboxIconRail, InboxCrmActions) + snippets/templates/trigger-links/manual-actions/settings pages
- `dashboard/marketing/` + `dashboard/ai-agent/`

**Prisma models to add to MV OS** (from Nour Auto schema):
`Contact, Pipeline, PipelineStage, Opportunity, ContactNote, Task, Activity, Tag, ContactTag, ConversationAssignmentLog, ConversationFollower, SocialMessageTemplate, SocialSnippet, SocialTriggerLink, SocialTriggerLinkClick, SocialManualAction, MessageLog, IntegrationSetting, Quote` (adapt: drop `QuoteCarImage` — auto-specific).
Shared models (`ChannelAccount, Campaign, Participant, Conversation, Message`) need a **field-level diff** — Nour Auto versions are newer.

## 3. Phases

### Phase 0 — Foundations (½ session)
1. Add backend deps missing in MV OS: `@whiskeysockets/baileys @hapi/boom qrcode pino iconv-lite imapflow cron pg`
2. Env vars: Meta app creds (App ID/secret, verify token), WhatsApp Cloud token, Twilio SID/token, `SOCIAL_CRYPTO_KEY` (channel-account token encryption), AI agent key. Mirror Nour Auto `.env.example`.
3. Verify MV OS `main.ts` global prefix + guard setup matches assumptions.
4. Create feature branch `feature/nourauto-port`.

### Phase 1 — Social Inbox core (1–2 sessions)
1. Copy `social-inbox/` module wholesale → adapt imports, register in `app.module.ts`.
2. Prisma: field-diff shared models, add new models, `prisma migrate dev`.
3. Data migration script: old marketing conversations/messages → new tables (IDs preserved where possible).
4. Frontend: port `dashboard/inbox/` + components; adapt to MV OS `lib/` (check authFetch equivalent).
5. Strip auto-specific: QuoteCarImage, twenty-bridge (Twenty CRM), partslink references.
6. Retire old marketing conversation endpoints (keep campaigns/meta OAuth until Phase 3 rewires them).

### Phase 2 — CRM (1 session)
1. Copy `crm/` module + prisma models; migrate.
2. **Lead migration:** Lead → Contact + Opportunity in a default "Sales" pipeline; LeadFollowUp → Task. Keep `sales/` module read-only until verified, then remove from sidebar.
3. Frontend: `dashboard/crm/` pages + wire CrmPanel inside inbox.
4. Map roles: MV OS roles (super_admin, management, operations, accounting, sales, instructor) onto CRM guards.

### Phase 3 — Marketing intelligence (1 session)
1. Copy `marketing/` (meta-ads-etl, lead-intake, conversion-match, gbp) as new `marketing-intel/` module (avoids clash with legacy module until it's fully retired).
2. Wire Meta ads ETL to Mind Valley ad account `789492000686313` (campaign 120248508349360666 currently live).
3. Lead-intake → CRM contact creation with attribution (replaces GHL round-robin: Bassem, Jana, Sara).
4. Frontend: `dashboard/marketing/` + `dashboard/ai-agent/` pages.

### Phase 4 — Automations & cutover (1 session)
1. Enable ai-agent + scheduler, auto-reply, trigger links, campaigns.
2. Round-robin assignment on conversations (ConversationAssignmentLog supports this).
3. End-to-end test: FB/IG/WhatsApp message → inbox → CRM contact → pipeline.
4. Decide GHL cutover date; run both in parallel ≥1 week.

## 4. Build Rules (inherited from NourAutoERP CRM_AGENT_BRIEFING, adapted)

1. Use the MV OS auth fetch wrapper — never bare `fetch()`
2. `React.ReactNode`, never `JSX.Element`
3. No escaped backticks in JSX template literals
4. MV OS uses real Prisma migrations — `prisma migrate dev` on the feature branch (unlike Nour Auto, `db push` is not the issue here, but never run destructive migrations against prod DB without backup)
5. `npx tsc --noEmit` in `frontend/` must be clean before every commit
6. Register every new service/module in `app.module.ts` — NestJS DI errors crash the container
7. Git ops via Desktop Commander on the Mac (`rm -f .git/index.lock .git/HEAD.lock` first); sandbox cannot push

## 5. Risks

- **Shared-model drift:** MV OS Conversation/Message models diverged from Nour Auto's — field diff is mandatory before migration, or data loss.
- **Branch concept:** Nour Auto has `Branch/UserBranch`; MV OS doesn't. Inbox assignment references branches — map to MV OS locations (Zayed/Tagamo3/Online) or strip.
- **Baileys (WhatsApp Web bridge):** session state is fragile; prefer WhatsApp Cloud API for the 01060014563 line, keep Baileys as fallback.
- **Old marketing module consumers:** MV OS frontend pages may call old endpoints — grep before deleting anything.
- **Deployment:** MV OS runs in the Proxmox datacenter; confirm target VM + docker-compose before first deploy of the branch.

## 6. Verification Checklist (every phase)

- [ ] `npx tsc --noEmit` clean (frontend)
- [ ] Backend builds; container starts without NestJS DI errors
- [ ] Prisma migration applied + rollback script exists
- [ ] Old data visible in new UI (conversations / leads)
- [ ] Webhook round-trip tested (Meta test event)
- [ ] Committed to `feature/nourauto-port`, pushed to origin
