# Quick Fix for Login Failed

## The Problem

The frontend is trying to call `/api` (same domain) but your backend is on AWS at a different URL.

## The Solution

### Option 1: Set Environment Variable in AWS (Recommended)

**If using AWS Amplify:**

1. Go to: https://console.aws.amazon.com/amplify
2. Select your MV-OS frontend app
3. Go to **App settings** → **Environment variables**
4. Click **Manage variables**
5. Add new variable:
   - **Key:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://mzmeyp2cw9.us-east-1.awsapprunner.com/api`
6. Click **Save**
7. Go to **Redeploy this version** or trigger a new deployment

**If using CloudFront/ECS/Other:**
- Set `NEXT_PUBLIC_API_URL` in your deployment configuration
- Make sure it's available at build time

### Option 2: Code Fix (Already Done)

I've updated the code to prioritize `NEXT_PUBLIC_API_URL` if it's set. After you redeploy with the environment variable, it should work.

## Also Check

1. **Database is seeded:**
   - Run `npx prisma db seed` on your backend
   - Or check if users exist in database

2. **Backend is accessible:**
   ```bash
   curl https://mzmeyp2cw9.us-east-1.awsapprunner.com/api/health
   ```

3. **CORS is configured:**
   - Backend should allow requests from your frontend domain

## After Fixing

1. Set `NEXT_PUBLIC_API_URL` in AWS
2. Redeploy frontend
3. Try logging in again with:
   - Email: `admin@mindvalley.eg`
   - Password: `admin123`

