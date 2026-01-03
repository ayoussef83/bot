# 🔧 Fixing App Runner Build Error

## Problem
Build failed with: "Failed to execute 'build' command"

## Solution Options

### Option 1: Use apprunner.yaml (Recommended)

I've created `apprunner.yaml` in the root directory. This file will be automatically used by App Runner if you select "Use a configuration file" in Step 2.

**Steps:**
1. Commit and push `apprunner.yaml` to your GitHub repository
2. In App Runner console, go to your service
3. Edit the service
4. In Step 2 (Configure build), select **"Use a configuration file"**
5. Save and redeploy

### Option 2: Fix Build Command in Console

If you want to keep using "Configure all settings here", update the build command:

**Current (failing):**
```
cd backend && npm install && npm run build
```

**Updated (try this):**
```
cd backend && npm install --legacy-peer-deps && npx prisma generate && npm run build
```

Or even simpler:
```
cd backend && npm ci && npm run build
```

### Option 3: Check Build Logs

1. Go to App Runner console
2. Click on your service
3. Go to "Logs" tab
4. Check the exact error message
5. Common issues:
   - Missing dependencies
   - Prisma client not generated
   - TypeScript compilation errors
   - Missing environment variables during build

## Recommended: Use apprunner.yaml

The `apprunner.yaml` file I created handles:
- ✅ Proper dependency installation
- ✅ Prisma client generation (with fallback if DB not available)
- ✅ Build process
- ✅ Runtime configuration

**To use it:**
1. Commit and push to GitHub:
   ```bash
   git add apprunner.yaml
   git commit -m "Add App Runner configuration"
   git push
   ```

2. Update App Runner service:
   - Edit service
   - Step 2: Select "Use a configuration file"
   - Save and redeploy

## Quick Fix Commands

If you want to update the build command in console:

**Build command:**
```
cd backend && npm install --legacy-peer-deps && npm run build
```

**Start command:**
```
cd backend && npm run start:prod
```

**Port:** `3000`

## Verify Build Locally

Test the build command locally to ensure it works:

```bash
cd backend
npm install --legacy-peer-deps
npm run build
```

If this works locally, it should work in App Runner.












