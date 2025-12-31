# Cost Optimization Plan: Target $30-40/month

## Current Cost: ~$75-95/month
## Target Cost: $30-40/month
## Savings Needed: ~$35-55/month

## Optimization Steps

### 1. Remove Global Accelerator ✅ (Saves $18-30/month)
   - **Action**: Point DNS directly to ALB
   - **Savings**: $18-30/month
   - **Impact**: Lose static IPs, but ALB provides stable DNS

### 2. Optimize ECS Resources (Saves $2-4/month)
   - **Current**: 0.25 vCPU, 512 MB per service
   - **Action**: Monitor and potentially reduce if over-provisioned
   - **Savings**: $2-4/month

### 3. CloudWatch Logs Retention (Saves $1/month)
   - **Action**: Set retention to 7-14 days
   - **Savings**: $1/month

### 4. Consider RDS Reserved Instance (Future: Saves $3-5/month)
   - **Action**: Purchase 1-year reserved instance
   - **Savings**: $3-5/month (one-time commitment)

## New Cost Breakdown (After Optimization)

### Without Global Accelerator:
- ECS Fargate: $18.00
- RDS: $15.00
- ALB: $18-22
- ECR: $0.50
- Secrets Manager: $0.40
- CloudWatch: $1-2
- Data Transfer: $1-2
- **Total: ~$54-60/month**

### Additional Optimizations Needed:
To reach $30-40/month, we need to save another $14-30/month:

**Option A: Reduce ALB to NLB** (Saves $5-10/month)
- Network Load Balancer is cheaper
- **New Total: ~$45-50/month**

**Option B: Use App Runner instead of ECS** (Saves $5-8/month)
- App Runner is simpler and slightly cheaper
- **New Total: ~$50-55/month**

**Option C: Use smaller RDS instance** (Not recommended - may impact performance)

**Option D: Use Aurora Serverless v2** (May save $2-5/month, but more complex)

## Recommended Approach

1. **Remove Global Accelerator** → Save $18-30/month
2. **Keep current setup** → Cost: ~$54-60/month
3. **Monitor actual usage** → Optimize based on real metrics

If you need to get to $30-40/month, consider:
- Using App Runner for backend (saves ~$5/month)
- Using CloudFront + S3 for frontend (saves ~$5-8/month)
- Using smaller RDS instance (not recommended)

## Next Steps

1. Update DNS to point to ALB
2. Disable/Delete Global Accelerator
3. Monitor costs for 1 month
4. Further optimize based on actual usage










