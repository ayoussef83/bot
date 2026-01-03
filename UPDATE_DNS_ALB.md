# Update DNS to Point Directly to ALB

## Current Setup
- Domain: `mv-os.mvalley-eg.com`
- Currently points to: `aa38cd22fa59e1daf.awsglobalaccelerator.com` (Global Accelerator)
- **Cost**: $18-30/month

## New Setup (After Optimization)
- Domain: `mv-os.mvalley-eg.com`
- Will point to: `mv-os-alb-2106082881.us-east-1.elb.amazonaws.com` (ALB directly)
- **Cost**: $0 (ALB already in use)

## Steps to Update DNS in GoDaddy

1. **Log in to GoDaddy** → My Products → mvalley-eg.com → DNS

2. **Find the current CNAME record** for `mv-os` pointing to Global Accelerator

3. **Update the CNAME record**:
   - **Name**: `mv-os`
   - **Value**: `mv-os-alb-2106082881.us-east-1.elb.amazonaws.com`
   - **TTL**: 600 seconds (or 1 hour)

4. **Save the changes**

5. **Wait 5-15 minutes** for DNS propagation

## After DNS Update

- Your site will work exactly the same
- HTTPS will still work (SSL certificate is on ALB)
- You'll save $18-30/month
- No static IPs, but ALB DNS is stable

## Verify After Update

Once DNS propagates, test:
- `https://mv-os.mvalley-eg.com` should load
- Login should work
- API calls should work











