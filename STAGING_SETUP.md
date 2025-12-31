## MV-OS Staging Setup (AWS)

Goal: create a **separate staging environment** that is safe and isolated from production:
- Separate RDS instance
- Separate Secrets Manager secrets
- Separate App Runner service

This avoids using production data/credentials for staging.

## 1) One-time staging infrastructure

From repo root:

```bash
chmod +x cloud-deployment/setup-staging.sh
./cloud-deployment/setup-staging.sh
```

This creates/updates:
- RDS: `mv-os-db-staging`
- Secrets:
  - `mv-os/staging/database-url`
  - `mv-os/staging/jwt-secret`

## 2) Deploy backend to staging (App Runner)

Build an image with CodeBuild, then deploy staging App Runner:

```bash
aws codebuild start-build --project-name mv-os-backend-build

ENV=staging \
SERVICE_NAME=mv-os-backend-staging \
DB_SECRET_NAME=mv-os/staging/database-url \
JWT_SECRET_NAME=mv-os/staging/jwt-secret \
./cloud-deployment/create-or-update-app-runner-from-ecr.sh
```

## 3) Frontend staging

Recommended:
- Use Amplify branch = `develop` for staging frontend
- Set `NEXT_PUBLIC_API_URL` to the **staging App Runner URL**

## Notes / Safety
- Never point local `.env` to staging or production RDS.
- Staging must use **test** integration credentials only.
- Production secrets are:
  - `mv-os/database-url`
  - `mv-os/jwt-secret`


