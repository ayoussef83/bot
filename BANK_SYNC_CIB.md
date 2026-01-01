# Bank Sync (CIB Business Online) — Safe Balance Retrieval

## Why we do **not** auto-login & scrape the portal

CIB Business Online is a protected banking portal. Automating login and scraping can:
- violate the bank’s Terms of Service,
- break when MFA/captcha changes,
- create security/compliance risk (storing credentials, session cookies).

For MV-OS we implement **safe, auditable bank balance sync** using:
- **Manual balance entry** (copy/paste the balance you see in the portal), or
- **Statement CSV upload** (download from the portal and upload to MV-OS).

If the business later wants automation, do it via:
- official bank/Open Banking API (preferred), or
- an approved RPA process with user-controlled login (last resort).

## Backend endpoints

All endpoints are behind JWT + Roles (`super_admin`, `accounting`).

- `POST /api/finance/bank-sync/manual`
  - Body: `{ cashAccountId, balance, asOfDate?, notes? }`
  - Stores a `BankSyncRun` (source = `manual`) and updates `CashAccount.balance`.

- `POST /api/finance/bank-sync/upload`
  - `multipart/form-data`: `cashAccountId`, optional `asOfDate`, optional `notes`, file field `file`
  - CSV must include a **Balance** column. The service takes the last numeric value in that column as the ending balance.

- `GET /api/finance/bank-sync/runs?cashAccountId=...`
  - Returns last 50 sync runs (audit trail).

## Frontend UI

Finance → Cash → Accounts:
- For `type=bank` rows, action **Sync Balance**
  - **Manual** tab: enter “Actual bank balance”
  - **CSV Upload** tab: upload statement CSV

## Prisma

Adds:
- enum `BankSyncSource` (`manual`, `csv_upload`)
- model `BankSyncRun`


