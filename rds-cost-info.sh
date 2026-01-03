#!/bin/bash

echo "💰 AWS RDS Cost Information"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Get instance details
INSTANCE_CLASS=$(aws rds describe-db-instances \
    --db-instance-identifier mv-os-db \
    --query "DBInstances[0].DBInstanceClass" \
    --output text 2>/dev/null)

STORAGE=$(aws rds describe-db-instances \
    --db-instance-identifier mv-os-db \
    --query "DBInstances[0].AllocatedStorage" \
    --output text 2>/dev/null)

REGION=$(aws rds describe-db-instances \
    --db-instance-identifier mv-os-db \
    --query "DBInstances[0].AvailabilityZone" \
    --output text 2>/dev/null | sed 's/[a-z]$//')

MULTI_AZ=$(aws rds describe-db-instances \
    --db-instance-identifier mv-os-db \
    --query "DBInstances[0].MultiAZ" \
    --output text 2>/dev/null)

ENGINE=$(aws rds describe-db-instances \
    --db-instance-identifier mv-os-db \
    --query "DBInstances[0].Engine" \
    --output text 2>/dev/null)

echo "📊 Instance Details:"
echo "   Instance Class: $INSTANCE_CLASS"
echo "   Storage: $STORAGE GB"
echo "   Region: $REGION"
echo "   Multi-AZ: $MULTI_AZ"
echo "   Engine: $ENGINE"
echo ""

# Calculate estimated costs
echo "💰 Estimated Monthly Costs:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Instance pricing (approximate, as of 2024)
case $INSTANCE_CLASS in
    db.t3.micro)
        INSTANCE_HOURLY=0.017
        INSTANCE_MONTHLY=$(echo "scale=2; $INSTANCE_HOURLY * 730" | bc)
        echo "   Instance (db.t3.micro):"
        echo "      Hourly: \$$INSTANCE_HOURLY"
        echo "      Monthly (~730 hours): \$$INSTANCE_MONTHLY"
        ;;
    db.t3.small)
        INSTANCE_HOURLY=0.034
        INSTANCE_MONTHLY=$(echo "scale=2; $INSTANCE_HOURLY * 730" | bc)
        echo "   Instance (db.t3.small):"
        echo "      Hourly: \$$INSTANCE_HOURLY"
        echo "      Monthly (~730 hours): \$$INSTANCE_MONTHLY"
        ;;
    *)
        echo "   Instance ($INSTANCE_CLASS): Check AWS Pricing Calculator"
        INSTANCE_MONTHLY=0
        ;;
esac

# Storage pricing (gp3, $0.115 per GB/month)
STORAGE_COST=$(echo "scale=2; $STORAGE * 0.115" | bc)
echo ""
echo "   Storage ($STORAGE GB gp3):"
echo "      Cost: \$$STORAGE_COST/month"

# Backup storage (first 20 GB free, then $0.095/GB)
BACKUP_RETENTION=$(aws rds describe-db-instances \
    --db-instance-identifier mv-os-db \
    --query "DBInstances[0].BackupRetentionPeriod" \
    --output text 2>/dev/null)

if [ "$BACKUP_RETENTION" -gt 0 ]; then
    # Estimate backup storage (typically 20-30% of allocated storage)
    ESTIMATED_BACKUP=$(echo "scale=2; $STORAGE * 0.25" | bc)
    BACKUP_COST=$(echo "scale=2; ($ESTIMATED_BACKUP - 20) * 0.095" | bc)
    if (( $(echo "$BACKUP_COST < 0" | bc -l) )); then
        BACKUP_COST=0
    fi
    echo ""
    echo "   Backup Storage (~${ESTIMATED_BACKUP} GB, first 20 GB free):"
    echo "      Cost: \$$BACKUP_COST/month"
else
    BACKUP_COST=0
fi

# Data transfer (first 100 GB free, then varies)
echo ""
echo "   Data Transfer:"
echo "      First 100 GB/month: Free"
echo "      Additional: ~\$0.09/GB (varies by region)"

# Total estimate
TOTAL=$(echo "scale=2; $INSTANCE_MONTHLY + $STORAGE_COST + $BACKUP_COST" | bc)
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Estimated Total (without data transfer):"
echo "   ~\$$TOTAL/month"
echo ""

# Free tier check
echo "💡 Free Tier Information:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "If your AWS account is less than 12 months old:"
echo "   ✅ 750 hours/month of db.t2.micro or db.t3.micro: FREE"
echo "   ✅ 20 GB General Purpose SSD storage: FREE"
echo "   ✅ 20 GB backup storage: FREE"
echo ""
echo "If eligible, your cost could be: \$0/month for the first year!"
echo ""

# Cost optimization tips
echo "💡 Cost Optimization Tips:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Stop instance when not in use (saves instance cost)"
echo "2. Use Reserved Instances for production (save up to 75%)"
echo "3. Monitor with AWS Cost Explorer"
echo "4. Right-size instance based on actual usage"
echo "5. Use automated backups only when needed"
echo ""

# Get actual billing info if available
echo "📊 To see actual costs:"
echo "   • AWS Cost Explorer: https://console.aws.amazon.com/cost-management/home"
echo "   • AWS Pricing Calculator: https://calculator.aws"
echo ""











