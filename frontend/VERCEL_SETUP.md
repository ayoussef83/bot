# MV-OS Frontend Vercel Setup

## ✅ Deployment Status

**Deployed to Vercel:**
- **Vercel URL:** https://mv-os-frontend.vercel.app
- **Project:** https://vercel.com/ahmed-youssefs-projects-d9ddf088/mv-os-frontend
- **Subdomain:** mv-os.mvalley-eg.com (DNS setup required)

## 🔧 Environment Variables

Set these in Vercel dashboard:
https://vercel.com/ahmed-youssefs-projects-d9ddf088/mv-os-frontend/settings/environment-variables

### Required Variables:

1. **NEXT_PUBLIC_API_URL**
   - **Value:** Your backend API URL (e.g., `https://your-backend-url.com/api`)
   - **Example:** `https://mzmeyp2cw9.us-east-1.awsapprunner.com/api` (if using AWS App Runner)
   - **Note:** This should point to your deployed NestJS backend

## 🌐 Subdomain Setup

### Step 1: Add Domain in Vercel

1. Go to: https://vercel.com/ahmed-youssefs-projects-d9ddf088/mv-os-frontend/settings/domains
2. Click "Add Domain"
3. Enter: `mv-os.mvalley-eg.com`
4. Click "Add"

### Step 2: Configure DNS in GoDaddy

1. Log in to GoDaddy
2. Go to **DNS Management** for `mvalley-eg.com`
3. Add CNAME record:
   - **Type:** CNAME
   - **Name:** mv-os
   - **Value:** `cname.vercel-dns.com.` (or the value Vercel provides)
   - **TTL:** 600 (or default)

### Step 3: Wait for DNS Propagation

- Usually takes 5-60 minutes
- Vercel will automatically verify the domain
- SSL certificate will be issued automatically

### Step 4: Test

Visit: `https://mv-os.mvalley-eg.com`

## 🔗 Update Marketing Website

After the subdomain is set up, update the marketing website's portal page:

1. Go to: `/Users/ahmedyoussef/MindValley Website/app/portal/page.tsx`
2. Update `NEXT_PUBLIC_MVOS_URL` environment variable to: `https://mv-os.mvalley-eg.com`

Or set it in Vercel dashboard for the marketing website project.

## 📝 Notes

- The frontend expects the backend API to be accessible at the URL specified in `NEXT_PUBLIC_API_URL`
- Make sure your backend has CORS configured to allow requests from `mv-os.mvalley-eg.com`
- The frontend will automatically use `/api` in production if `NEXT_PUBLIC_API_URL` is not set, but it's better to explicitly set it






