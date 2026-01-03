# Current AWS Infrastructure Costs

## Current Resources

### ECS Fargate Services
- **Frontend**: 0.25 vCPU, 512 MB RAM, 1 task
- **Backend**: 0.25 vCPU, 512 MB RAM, 1 task

### RDS Database
- **Instance**: db.t3.micro (PostgreSQL)
- **Storage**: 20 GB
- **Multi-AZ**: No

### Load Balancer
- **Type**: Application Load Balancer (ALB)
- **Scheme**: Internet-facing

### Global Accelerator
- **Status**: Enabled
- **Listeners**: HTTP (80) and HTTPS (443)

## Monthly Cost Breakdown

### 1. ECS Fargate (~$18-20/month)

**CPU Costs:**
- Frontend: 0.25 vCPU × $0.04048/vCPU-hour × 730 hours = **$7.39/month**
- Backend: 0.25 vCPU × $0.04048/vCPU-hour × 730 hours = **$7.39/month**
- **Subtotal CPU**: $14.78/month

**Memory Costs:**
- Frontend: 0.5 GB × $0.004445/GB-hour × 730 hours = **$1.62/month**
- Backend: 0.5 GB × $0.004445/GB-hour × 730 hours = **$1.62/month**
- **Subtotal Memory**: $3.24/month

**Total ECS Fargate**: **~$18/month**

### 2. RDS Database (~$15/month)

**Instance Cost:**
- db.t3.micro: **$12.41/month** (on-demand pricing)

**Storage Cost:**
- 20 GB × $0.115/GB = **$2.30/month**

**Backup Storage:**
- First 20 GB free, then $0.095/GB
- Estimated: **$0-1/month** (depends on backup retention)

**Total RDS**: **~$14.71-15.71/month**

### 3. Application Load Balancer (~$18-25/month)

**Base Cost:**
- $0.0225 per ALB-hour × 730 hours = **$16.43/month**

**LCU (Load Balancer Capacity Units) Costs:**
- ~$0.008 per LCU-hour
- Estimated: **$2-8/month** (depends on traffic)
- Low traffic: ~2-3 LCUs = $2-3/month
- Medium traffic: ~5-10 LCUs = $5-8/month

**Total ALB**: **~$18-25/month**

### 4. Global Accelerator (~$18-30/month)

**Fixed Cost:**
- $0.025 per hour × 730 hours = **$18.25/month**

**Data Transfer:**
- Outbound: $0.025 per GB (first 10 TB)
- Inbound: $0.01 per GB
- Estimated: **$0-12/month** (depends on traffic)
- Low traffic (100 GB/month): ~$2.50/month
- Medium traffic (500 GB/month): ~$12.50/month

**Total Global Accelerator**: **~$18-30/month**

### 5. ECR (Elastic Container Registry) (~$0.50/month)

**Storage:**
- $0.10 per GB/month
- Estimated: ~2-5 GB of images = **$0.20-0.50/month**

**Data Transfer:**
- Usually minimal (within same region)

**Total ECR**: **~$0.50/month**

### 6. Secrets Manager (~$0.40/month)

- $0.40 per secret per month
- Estimated: 1-2 secrets = **$0.40-0.80/month**

**Total Secrets Manager**: **~$0.40-0.80/month**

### 7. CloudWatch Logs (~$1-3/month)

**Ingestion:**
- First 5 GB free, then $0.50/GB

**Storage:**
- $0.03/GB/month

**Estimated**: **$1-3/month** (depends on log volume)

### 8. Data Transfer (~$0-5/month)

**Regional Data Transfer:**
- Usually minimal between services in same region

**Internet Data Transfer:**
- First 100 GB free, then $0.09/GB
- Estimated: **$0-5/month**

## Total Monthly Cost Estimate

### Low Traffic Scenario (~100 GB/month)
- ECS Fargate: $18.00
- RDS: $15.00
- ALB: $18.00
- Global Accelerator: $20.00
- ECR: $0.50
- Secrets Manager: $0.40
- CloudWatch: $1.00
- Data Transfer: $1.00
- **Total: ~$73-75/month**

### Medium Traffic Scenario (~500 GB/month)
- ECS Fargate: $18.00
- RDS: $15.00
- ALB: $22.00
- Global Accelerator: $30.00
- ECR: $0.50
- Secrets Manager: $0.40
- CloudWatch: $2.00
- Data Transfer: $3.00
- **Total: ~$91-95/month**

### High Traffic Scenario (~2 TB/month)
- ECS Fargate: $18.00
- RDS: $15.00
- ALB: $25.00
- Global Accelerator: $60.00
- ECR: $0.50
- Secrets Manager: $0.40
- CloudWatch: $3.00
- Data Transfer: $5.00
- **Total: ~$127-130/month**

## Cost Optimization Recommendations

### 1. **Remove Global Accelerator** (Save ~$18-30/month)
   - If you don't need static IPs, use ALB directly
   - Point DNS directly to ALB
   - **Savings: $18-30/month**

### 2. **Use Reserved Instances for RDS** (Save ~$3-5/month)
   - 1-year reserved: ~30% discount
   - **Savings: $3-5/month**

### 3. **Optimize ECS Resources** (Save ~$2-4/month)
   - Monitor actual usage
   - Right-size CPU/memory if over-provisioned
   - **Potential savings: $2-4/month**

### 4. **Use CloudWatch Logs Retention** (Save ~$1/month)
   - Set retention to 7-14 days instead of indefinite
   - **Savings: $1/month**

### 5. **Consider ALB to NLB** (Save ~$5-10/month)
   - Network Load Balancer is cheaper for simple routing
   - **Savings: $5-10/month** (but loses some ALB features)

## Current Estimated Cost: **~$75-95/month**

*Note: Actual costs may vary based on actual usage, traffic patterns, and AWS pricing changes.*










