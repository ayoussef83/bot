## Goal
Local-first development for MV-OS:
- Develop and test **locally**
- Use cloud deployments **only** for **staging** and **production**
- Never use production data/credentials locally

This repo contains **frontend (Next.js)**, **backend (NestJS)**, and **PostgreSQL** (Prisma).

## Local setup (recommended)

### Prereqs
- Node.js 18+
- Docker Desktop

### 1) Start local PostgreSQL

From repo root:

```bash
docker compose up -d
docker compose ps
```

Postgres will be available at:
- host: `localhost`
- port: `5432`
- db: `mv_os`
- user: `postgres`
- pass: `postgres`

### 2) Backend env (local-safe)

Create backend env file from template:

```bash
cp env/backend.env.local.example backend/.env
```

Critical local rules:
- `NODE_ENV=local` (forces **mock providers**)
- `DATABASE_URL` must point to the **local** Docker Postgres

### 3) Run Prisma + seed

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
```

### 4) Start backend

```bash
cd backend
npm run start:dev
```

Backend runs on: `http://localhost:3000/api`

### 5) Frontend env (local)

```bash
cp env/frontend.env.local.example frontend/.env.local
```

### 6) Start frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: `http://localhost:3001`

## Local integrations (safe)

Local must never send real messages.
In local mode (`NODE_ENV=local`) the backend uses:
- Mock Email provider
- Mock SMS provider
- Mock WhatsApp provider
- Mock Meta Messenger provider

Mocks just log to the console and return success.

## Local webhook testing

Use one of:
- ngrok
- Cloudflare Tunnel

Recommended flow:
1. Run backend locally.
2. Expose the local port:

```bash
ngrok http 3000
```

3. Configure Meta/WhatsApp webhook callback URL to:
`https://<your-tunnel-domain>/api/webhooks/...`

4. Use replay scripts in `scripts/webhooks/` to test handlers safely.

## “Do not do” rules
- Never point local `DATABASE_URL` to RDS.
- Never put production secrets in `.env.local`.
- Never debug by deploying to App Runner.
- Never use production credentials in staging.


