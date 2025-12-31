## Summary
Describe what changed and why.

## Environment & safety checklist
- [ ] Developed and tested **locally** (no App Runner debugging)
- [ ] **No production credentials/data** used locally
- [ ] No real `.env` files committed (only `env/*.example`)
- [ ] If integrations touched: local uses **mock providers** (`NODE_ENV=local`)

## Release flow
- **Feature branches** → PR into `develop` (staging)
- Only after staging approval: **PR `develop` → `main`** (production)

## How to test
Steps for reviewer to verify in staging.


