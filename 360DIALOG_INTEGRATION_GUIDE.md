# 360dialog Integration Guide — MV-OS

**Source:** Nour Auto session handoff (2026-07-03). 360dialog = Meta WhatsApp Cloud API with exactly two swaps.

## The two swaps (everything else is identical Meta Cloud API)
1. Base URL: `https://waba-v2.360dialog.io` (instead of `graph.facebook.com/<phoneNumberId>`)
2. Auth header: `D360-API-KEY: <key>` (instead of `Authorization: Bearer <token>`)

Payloads AND webhook format are byte-identical Meta Cloud API — all Cloud API knowledge carries over.

## Config to store (IntegrationConfig `whatsapp_360dialog`)
- secrets: `{ apiKey }` (encrypted)
- config: `{ phoneNumberId, transport: 'd360', defaultLanguage: 'ar', templateMap: { <internal key>: <approved template name> } }`
- `phoneNumberId` is needed for the inbound thread key even though sends don't put it in the URL.

## Sending (implemented in `notifications/providers/dialog360-whatsapp.provider.ts`)
- `POST /messages` with Meta-format bodies: text / template / media / reaction
- **24-hour window rule:** free-form text only inside 24h of the customer's last message; outside → must use an APPROVED template. Our provider sends template when `templateMap[templateKey]` exists, else free-form text.
- Fallback: `NotificationsService` falls back to SMS automatically if the WA send throws.

## Templates API
- `GET/POST https://waba-v2.360dialog.io/v1/configs/templates` — list + submit templates (categories, status, pricing). Submit the renewal_session8 / welcome_onboarding / progress_report_published bodies here and wait for approval before mapping.

## Inbound webhooks (S1 inbox scope)
- Standard Meta verify handshake; payload shape `entry → changes → value.messages / statuses / contacts`.

## ⚠️ The two gotchas that bit Nour Auto
1. **Inbound media:** media URLs come as `lookaside.fbsbx.com` — you must download by swapping the host to `waba-v2.360dialog.io` and sending the `D360-API-KEY` header, or downloads fail.
2. **Thread keys:** ALWAYS normalize phones to international `20…` BEFORE building the `<phoneNumberId>:<waId>` conversation key — otherwise the same parent appears as duplicate conversations (01xx vs 201xx). Our provider's `normalizePhone()` does this for sends; S1 must apply the same rule on webhook ingestion.
