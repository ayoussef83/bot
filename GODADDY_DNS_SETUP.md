# GoDaddy DNS Configuration for mv-os.mvalley-eg.com

## Step 1: Access GoDaddy DNS Management

1. Log in to your GoDaddy account
2. Go to **My Products** → Find **mvalley-eg.com** → Click **DNS** (or **Manage DNS**)

## Step 2: Add SSL Certificate Validation Record

You need to add a CNAME record for SSL certificate validation.

**In GoDaddy DNS Management:**

1. Click **"Add"** or **"Add Record"**
2. Select **Type: CNAME**
3. Enter the following:
   - **Name/Host:** `_ed2d0521161de0d0c3f327b0df306ea9.mv-os`
   - **Value/Points to:** `_501911b481281aa9eac78d730de31bd5.jkddzztszm.acm-validations.aws.`
   - **TTL:** 600 seconds (or 1 hour)
4. Click **Save**

**Important:** 
- The name should be exactly: `_ed2d0521161de0d0c3f327b0df306ea9.mv-os` (without `.mvalley-eg.com` - GoDaddy adds the domain automatically)
- The value must end with a dot (`.`)
- Wait 5-30 minutes for AWS to validate the certificate

## Step 3: Point Domain to Global Accelerator

After the SSL certificate is validated, add a CNAME record to point your subdomain to AWS Global Accelerator.

1. Click **"Add"** or **"Add Record"**
2. Select **Type: CNAME**
3. Enter the following:
   - **Name/Host:** `mv-os`
   - **Value/Points to:** `aa38cd22fa59e1daf.awsglobalaccelerator.com`
   - **TTL:** 600 seconds (or 1 hour)
4. Click **Save**

## Step 4: Verify Certificate Status

After adding the validation record, check if the certificate is validated:

```bash
aws acm describe-certificate \
  --certificate-arn arn:aws:acm:us-east-1:149959196988:certificate/cb03dec3-89a8-41f7-b9a2-5dfdd46462eb \
  --query 'Certificate.Status' \
  --output text
```

When it shows **"ISSUED"**, the certificate is ready.

## Step 5: Add HTTPS Listener (After Certificate is ISSUED)

Once the certificate status is "ISSUED", I'll add the HTTPS listener to your ALB. Or you can run:

```bash
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:us-east-1:149959196988:loadbalancer/app/mv-os-alb/6c617888ad27aebf \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:us-east-1:149959196988:certificate/cb03dec3-89a8-41f7-b9a2-5dfdd46462eb \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:us-east-1:149959196988:targetgroup/mv-os-frontend-tg/c90a2eb23bb5a723
```

## Summary of Records to Add in GoDaddy

| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | `_ed2d0521161de0d0c3f327b0df306ea9.mv-os` | `_501911b481281aa9eac78d730de31bd5.jkddzztszm.acm-validations.aws.` | 600 |
| CNAME | `mv-os` | `aa38cd22fa59e1daf.awsglobalaccelerator.com` | 600 |

## Notes

- DNS propagation can take 5 minutes to 48 hours (usually within 1-2 hours)
- The SSL validation record can be removed after the certificate is issued (optional)
- Your site will be accessible at `https://mv-os.mvalley-eg.com` once everything is configured
- HTTP requests will automatically redirect to HTTPS

## Troubleshooting

If the certificate doesn't validate:
1. Verify the CNAME record name and value are exactly correct (including the trailing dot)
2. Wait a few more minutes and check again
3. Use `dig` or `nslookup` to verify the DNS record is resolving:
   ```bash
   dig _ed2d0521161de0d0c3f327b0df306ea9.mv-os.mvalley-eg.com CNAME
   ```











