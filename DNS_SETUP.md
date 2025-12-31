# DNS Configuration for mv-os.mvalley-eg.com

## Step 1: SSL Certificate Validation

To enable HTTPS, you need to add a DNS validation record to your domain's DNS settings.

**Add this CNAME record to your DNS provider (where mvalley-eg.com is hosted):**

```
Type: CNAME
Name: _ed2d0521161de0d0c3f327b0df306ea9.mv-os
Value: _501911b481281aa9eac78d730de31bd5.jkddzztszm.acm-validations.aws.
TTL: 300 (or default)
```

**Full record name:** `_ed2d0521161de0d0c3f327b0df306ea9.mv-os.mvalley-eg.com`

After adding this record, AWS will validate the certificate (usually takes 5-30 minutes). You can check the status with:
```bash
aws acm describe-certificate --certificate-arn arn:aws:acm:us-east-1:149959196988:certificate/cb03dec3-89a8-41f7-b9a2-5dfdd46462eb --query 'Certificate.Status' --output text
```

## Step 2: Point Domain to Global Accelerator

Once the certificate is validated, add this DNS record to point your domain to the Global Accelerator:

**Add this CNAME record:**

```
Type: CNAME
Name: mv-os
Value: aa38cd22fa59e1daf.awsglobalaccelerator.com
TTL: 300 (or default)
```

**Full record name:** `mv-os.mvalley-eg.com` → `aa38cd22fa59e1daf.awsglobalaccelerator.com`

## Step 3: Add HTTPS Listener (After Certificate Validation)

After the certificate status changes to "ISSUED", run this command to add the HTTPS listener:

```bash
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:us-east-1:149959196988:loadbalancer/app/mv-os-alb/6c617888ad27aebf \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:us-east-1:149959196988:certificate/cb03dec3-89a8-41f7-b9a2-5dfdd46462eb \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:us-east-1:149959196988:targetgroup/mv-os-frontend-tg/c90a2eb23bb5a723
```

## Current Infrastructure

- **ALB DNS:** mv-os-alb-2106082881.us-east-1.elb.amazonaws.com
- **Global Accelerator DNS:** aa38cd22fa59e1daf.awsglobalaccelerator.com
- **SSL Certificate ARN:** arn:aws:acm:us-east-1:149959196988:certificate/cb03dec3-89a8-41f7-b9a2-5dfdd46462eb
- **HTTP Listener:** Configured to redirect to HTTPS (port 443)

## Notes

- The HTTP listener (port 80) is already configured to redirect to HTTPS
- Once the certificate is validated and HTTPS listener is added, your site will be accessible at https://mv-os.mvalley-eg.com
- DNS propagation can take up to 48 hours, but usually happens within a few minutes to hours










