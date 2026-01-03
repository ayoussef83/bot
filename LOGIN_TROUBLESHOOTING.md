# Login Failed - Troubleshooting Guide

## Common Causes

### 1. Frontend API URL Not Configured

**Problem:** The frontend is trying to call `/api` (same domain) but backend is on AWS.

**Solution:** Set `NEXT_PUBLIC_API_URL` in your AWS deployment:

**For AWS Amplify:**
1. Go to: https://console.aws.amazon.com/amplify
2. Select your MV-OS frontend app
3. Go to **Environment variables**
4. Add:
   - **Key:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://mzmeyp2cw9.us-east-1.awsapprunner.com/api`
5. **Redeploy** the app

**For CloudFront/Other:**
- Set the environment variable in your deployment configuration
- Make sure it's available at build time

### 2. Database Not Seeded

**Problem:** The default users don't exist in the database.

**Solution:** Run the seed script on your backend:

```bash
# Connect to your backend (SSH or via AWS Systems Manager)
cd backend
npx prisma db seed
```

Or run it via AWS:
- Use AWS Systems Manager Session Manager
- Or connect via SSH if you have access
- Or run migrations/seeds through your deployment pipeline

### 3. CORS Configuration

**Problem:** Backend is blocking requests from frontend domain.

**Solution:** Update backend CORS to allow your frontend domain:

In your NestJS backend `main.ts`, ensure CORS allows:
- `https://mv-os.mvalley-eg.com`
- `https://mvalley-eg.com`
- Your frontend domain

### 4. Backend Not Accessible

**Test:** Try accessing the backend directly:
```bash
curl https://mzmeyp2cw9.us-east-1.awsapprunner.com/api/health
```

Should return: `{"status":"ok"}`

If it fails:
- Check backend is running
- Check security groups allow traffic
- Verify the URL is correct

## Quick Fix Checklist

- [ ] Set `NEXT_PUBLIC_API_URL` in AWS Amplify/CloudFront
- [ ] Redeploy frontend after setting environment variable
- [ ] Verify backend is accessible: `https://mzmeyp2cw9.us-east-1.awsapprunner.com/api/health`
- [ ] Run database seed: `npx prisma db seed` (on backend)
- [ ] Check CORS configuration in backend
- [ ] Verify credentials: `admin@mindvalley.eg` / `admin123`

## Testing

1. **Test Backend API:**
   ```bash
   curl -X POST https://mzmeyp2cw9.us-east-1.awsapprunner.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@mindvalley.eg","password":"admin123"}'
   ```

2. **Check Browser Console:**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Try logging in
   - Check the login request - what URL is it calling?
   - Check the response - what error is returned?

3. **Check Frontend Environment:**
   - In browser console, type: `process.env.NEXT_PUBLIC_API_URL`
   - Should show your backend URL

## Most Likely Issue

Based on the code, the frontend in production tries to use `/api` (relative URL) unless `NEXT_PUBLIC_API_URL` is set. 

**Most likely fix:** Set `NEXT_PUBLIC_API_URL` in your AWS deployment and redeploy.











