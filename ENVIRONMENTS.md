## Environments

MV-OS runs in three environments:

### Local
- Runs on developer machine
- Uses **local Postgres** (Docker Compose)
- Uses **mock communication providers**
- No real integrations / no production credentials

### Staging
- Cloud deployed (AWS App Runner)
- Uses **test credentials** only
- Separate database from production
- Used for validation before production release

### Production
- Cloud deployed (AWS App Runner)
- Uses **live credentials**
- Real database

## Environment variables & secrets

We define environment templates (do not commit secrets):
- `env/backend.env.local.example`
- `env/backend.env.staging.example`
- `env/backend.env.production.example`
- `env/frontend.env.local.example`
- `env/frontend.env.staging.example`
- `env/frontend.env.production.example`

### Provider selection (critical)
Backend provider behavior is controlled by:
- `NODE_ENV=local` → **mock providers only**
- `NODE_ENV=staging` → real providers (test credentials)
- `NODE_ENV=production` → real providers (live credentials)

No backend code should call external APIs directly; it must go through a provider interface.

## Databases

### Local DB
- Postgres via `docker compose up -d`
- Connection string (default):
  - `postgresql://postgres:postgres@localhost:5432/mv_os?schema=public`

### Staging DB
- Separate RDS instance (recommended identifier: `mv-os-db-staging`)
- Separate Secrets Manager secret (recommended):
  - `mv-os/staging/database-url`

### Production DB
- RDS instance (current: `mv-os-db`)
- Secrets Manager secret (current):
  - `mv-os/database-url`

## Webhooks (safe + consistent)

Webhook handlers must be identical across environments.

### Local
- Expose local backend using `ngrok http 3000` (or Cloudflare Tunnel)
- Replay payloads using scripts under `scripts/webhooks/`

### Staging
- Use Meta/WhatsApp test apps and test phone numbers
- Verify signature validation and message ingestion

### Production
- Live apps + live credentials

## App Runner usage policy

App Runner is used **only** for:
- Staging deployments
- Production deployments

Never use App Runner for:
- Feature iteration
- UI testing
- Debugging business logic

## Branching strategy

- `develop` → staging
- `main` → production

Rules:
- Develop locally on feature branches → merge into `develop`
- Promote `develop` to staging App Runner for validation
- Merge `develop` → `main` only after staging approval

## Staging vs Production AWS layout (recommended)

- **Two App Runner services**
  - `mv-os-backend-staging` (NODE_ENV=staging)
  - `mv-os-backend` (NODE_ENV=production)
- **Two Secrets Manager secrets**
  - `mv-os/staging/database-url` (staging RDS)
  - `mv-os/database-url` (production RDS)
- **Two JWT secrets**
  - `mv-os/staging/jwt-secret`
  - `mv-os/jwt-secret`

This keeps credentials and data strictly isolated.


