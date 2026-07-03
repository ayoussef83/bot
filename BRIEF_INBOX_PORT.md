# BRIEF S1 — Social Inbox Port

**Branch:** `feature/inbox-port` | **Read first:** `COORDINATOR.md`, `MV-OS_OPERATING_MODEL.md`, `PORT_PLAN_NOURAUTO.md` (Phase 1)
**Mission:** Port NourAutoERP's social-inbox (backend + frontend) into MV-OS, replacing the old conversation core inside `marketing/`.

## Source → Target

- Source: `~/NourAutoERP/backend/src/social-inbox/` → Target: `Mvalley System/backend/src/social-inbox/`
- Source: `~/NourAutoERP/frontend/src/app/dashboard/inbox/` (+ its 7 `_components`) → Target: `Mvalley System/frontend/src/app/dashboard/inbox/`
- Active MV-OS tree is the INNER `Mvalley System/Mvalley System/` — never touch outer `backend/`.

## Steps

1. Add deps to backend `package.json`: `@whiskeysockets/baileys @hapi/boom qrcode pino iconv-lite cron` (check what's imported; add only what's needed).
2. Copy module; fix imports to MV-OS paths (PrismaModule, auth guards). Register `SocialInboxModule` in a NEW file note — do NOT edit `app.module.ts` yourself ([SHARED], integrator does it; list needed registrations in your final commit message).
3. Prisma: field-diff Nour Auto's `ChannelAccount, Campaign, Participant, Conversation, Message` against MV-OS's existing versions. Produce `prisma/PROPOSED_MODELS_INBOX.md` with the merged models + new models (`ConversationAssignmentLog, ConversationFollower, SocialMessageTemplate, SocialSnippet, SocialTriggerLink, SocialTriggerLinkClick, SocialManualAction, MessageLog, IntegrationSetting`). Integrator merges into schema.prisma.
4. Strip auto-industry parts: `quotes.*` + `QuoteCarImage`, `twenty-bridge.service.ts`, `twenty-webhook.controller.ts`, partslink references.
5. Data migration script `scripts/migrate-old-conversations.ts`: old marketing conversations/messages → new tables, idempotent.
6. Frontend: port inbox pages; replace `authFetch` import with MV-OS auth lib equivalent (check `frontend/src/lib/`); keep Arabic labels.
7. Env: document every var needed in `ENV_NEEDED_INBOX.md` (Meta app creds, WhatsApp Cloud token for 01060014563, `SOCIAL_CRYPTO_KEY`, Twilio if kept).

## Acceptance

- Backend compiles; module loads without DI errors (list registrations for integrator)
- `npx tsc --noEmit` clean in frontend
- Old conversations visible in new inbox UI after migration script (test against local DB only)
- Round-robin assignment works for 3 sales users
- No `prisma migrate` against any shared/prod DB — migration SQL committed only
