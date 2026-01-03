# MV-OS Frontend - AWS Amplify Deployment

## Architecture

- **Marketing Website**: Vercel → `mvalley-eg.com`
- **MV-OS Backend**: AWS App Runner → `https://mzmeyp2cw9.us-east-1.awsapprunner.com/api`
- **MV-OS Frontend**: AWS Amplify → `mv-os.mvalley-eg.com` (subdomain)

## Prerequisites

1. AWS Account with access to Amplify
2. Backend already deployed on AWS App Runner
3. Domain `mvalley-eg.com` managed in GoDaddy

## Step 1: Install Amplify CLI

```bash
npm install -g @aws-amplify/cli
```

## Step 2: Initialize Amplify in Frontend

```bash
cd "/Users/ahmedyoussef/Mvalley System/frontend"
amplify init
```

**Follow the prompts:**
- **Enter a name for the project:** `mv-os-frontend`
- **Initialize the project with the above configuration?** `Yes`
- **Select the authentication method:** Choose your preferred method
- **Do you want to configure an AWS Profile?** `Yes`
- **Please choose the profile you want to use:** Select your AWS profile
- **Enter a name for the environment:** `production`
- **Choose your default editor:** (your choice)
- **Choose the type of app that you're building:** `javascript`
- **What javascript framework are you using:** `react`
- **Source Directory Path:** `.`
- **Distribution Directory Path:** `.next`
- **Build Command:** `npm run build`
- **Start Command:** `npm start`
- **Do you want to use an AWS profile?** `Yes`

## Step 3: Add Hosting

```bash
amplify add hosting
```

**Select:**
- **Select the plugin module to execute:** `Hosting with Amplify Console`
- **Choose a type:** `Manual deployment`

## Step 4: Configure Environment Variables

Set the backend API URL:

```bash
amplify env add
```

Or set it in Amplify Console after deployment:
- Go to: AWS Amplify Console → Your App → Environment variables
- Add: `NEXT_PUBLIC_API_URL` = `https://mzmeyp2cw9.us-east-1.awsapprunner.com/api`

## Step 5: Publish to Amplify

```bash
amplify publish
```

This will:
1. Build your Next.js app
2. Deploy to AWS Amplify
3. Provide you with a deployment URL

## Step 6: Configure Custom Domain

### In AWS Amplify Console:

1. Go to: https://console.aws.amazon.com/amplify
2. Select your app: `mv-os-frontend`
3. Go to **Domain management**
4. Click **Add domain**
5. Enter: `mvalley-eg.com`
6. Click **Configure domain**
7. Add subdomain: `mv-os`
8. Amplify will provide DNS records

### In GoDaddy DNS:

1. Log in to GoDaddy
2. Go to **DNS Management** for `mvalley-eg.com`
3. Add the CNAME record Amplify provides:
   - **Type:** CNAME
   - **Name:** mv-os
   - **Value:** (Amplify will provide this, e.g., `xxxxx.amplifyapp.com`)
   - **TTL:** 600

### Wait for DNS Propagation

- Usually 5-60 minutes
- Amplify will automatically issue SSL certificate
- Your app will be available at: `https://mv-os.mvalley-eg.com`

## Step 7: Update Marketing Website

Update the marketing website's portal page to point to the new subdomain:

1. Go to Vercel dashboard for marketing website
2. Add environment variable:
   - `NEXT_PUBLIC_MVOS_URL` = `https://mv-os.mvalley-eg.com`

Or update in code:
- File: `/Users/ahmedyoussef/MindValley Website/app/portal/page.tsx`
- Change default URL to: `https://mv-os.mvalley-eg.com`

## Step 8: Configure CORS on Backend

Make sure your backend allows requests from the frontend domain:

In your NestJS backend, update CORS configuration to allow:
- `https://mv-os.mvalley-eg.com`
- `https://mvalley-eg.com` (for marketing website API calls)

## Verification

1. **Frontend:** Visit `https://mv-os.mvalley-eg.com`
2. **Backend API:** Visit `https://mzmeyp2cw9.us-east-1.awsapprunner.com/api/health`
3. **Marketing Website:** Visit `https://mvalley-eg.com/portal`

## Troubleshooting

### Frontend can't connect to backend
- Check `NEXT_PUBLIC_API_URL` is set correctly in Amplify
- Verify backend CORS allows `mv-os.mvalley-eg.com`
- Check backend health endpoint

### Domain not working
- Verify DNS records in GoDaddy
- Wait longer for DNS propagation (up to 48 hours)
- Check Amplify domain status in console

### Build errors
- Check Amplify build logs
- Verify all dependencies in `package.json`
- Ensure `next.config.js` is correct

## Quick Reference

- **Amplify Console:** https://console.aws.amazon.com/amplify
- **Backend URL:** https://mzmeyp2cw9.us-east-1.awsapprunner.com/api
- **Frontend URL:** https://mv-os.mvalley-eg.com (after setup)
- **Marketing Website:** https://mvalley-eg.com







