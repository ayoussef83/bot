# Subdomain Setup: mv-os.mvalley-eg.com

## Current Setup

- ✅ **Marketing Website**: Vercel → `mvalley-eg.com` (working)
- ✅ **MV-OS Backend**: AWS App Runner → `https://mzmeyp2cw9.us-east-1.awsapprunner.com/api` (working)
- ✅ **MV-OS Frontend**: AWS (already deployed and working)

## Goal

Point `mv-os.mvalley-eg.com` to your existing AWS MV-OS frontend deployment.

## Step 1: Get Your AWS Frontend URL

Your MV-OS frontend is already deployed on AWS. You need to find its URL:

**Option A: AWS Amplify**
- Go to: https://console.aws.amazon.com/amplify
- Find your MV-OS frontend app
- Copy the app URL (e.g., `https://xxxxx.amplifyapp.com`)

**Option B: CloudFront Distribution**
- Go to: https://console.aws.amazon.com/cloudfront
- Find your MV-OS distribution
- Copy the CloudFront domain (e.g., `xxxxx.cloudfront.net`)

**Option C: Other AWS Service**
- Check your deployment documentation
- Look for the frontend URL in AWS Console

## Step 2: Configure Custom Domain in AWS

### If Using AWS Amplify:

1. Go to: https://console.aws.amazon.com/amplify
2. Select your MV-OS frontend app
3. Go to **Domain management** → **Add domain**
4. Enter: `mvalley-eg.com`
5. Add subdomain: `mv-os`
6. AWS will provide DNS records

### If Using CloudFront:

1. Go to: https://console.aws.amazon.com/cloudfront
2. Select your distribution
3. Go to **Behaviors** → **Alternate domain names (CNAMEs)**
4. Add: `mv-os.mvalley-eg.com`
5. Request SSL certificate in AWS Certificate Manager
6. Update distribution with certificate

## Step 3: Configure DNS in GoDaddy

1. Log in to GoDaddy
2. Go to **DNS Management** for `mvalley-eg.com`
3. Add CNAME record:
   - **Type:** CNAME
   - **Name:** mv-os
   - **Value:** (Use the value AWS provides - either Amplify domain or CloudFront domain)
   - **TTL:** 600

## Step 4: Wait for DNS Propagation

- Usually 5-60 minutes
- AWS will automatically issue SSL certificate
- Test: `https://mv-os.mvalley-eg.com`

## Step 5: Update Marketing Website Portal

Update the marketing website to point to the new subdomain:

1. Go to Vercel dashboard: https://vercel.com/ahmed-youssefs-projects-d9ddf088/website/settings/environment-variables
2. Add/Update environment variable:
   - **Name:** `NEXT_PUBLIC_MVOS_URL`
   - **Value:** `https://mv-os.mvalley-eg.com`
3. Redeploy the marketing website (or wait for auto-deploy)

## Verification

✅ Marketing website: `https://mvalley-eg.com`  
✅ MV-OS frontend: `https://mv-os.mvalley-eg.com`  
✅ MV-OS backend: `https://mzmeyp2cw9.us-east-1.awsapprunner.com/api`  
✅ Portal link: `https://mvalley-eg.com/portal` → redirects to `https://mv-os.mvalley-eg.com/login`

## Notes

- Don't modify any existing AWS deployments
- Only configure DNS and domain settings
- The backend API URL should already be configured in your frontend environment variables










