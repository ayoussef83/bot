#!/bin/bash

# Script to wait for SSL certificate validation and add HTTPS listener

CERT_ARN="arn:aws:acm:us-east-1:149959196988:certificate/cb03dec3-89a8-41f7-b9a2-5dfdd46462eb"
ALB_ARN="arn:aws:elasticloadbalancing:us-east-1:149959196988:loadbalancer/app/mv-os-alb/6c617888ad27aebf"
TG_ARN="arn:aws:elasticloadbalancing:us-east-1:149959196988:targetgroup/mv-os-frontend-tg/c90a2eb23bb5a723"

echo "Checking certificate status..."
STATUS=$(aws acm describe-certificate --certificate-arn "$CERT_ARN" --query 'Certificate.Status' --output text)

if [ "$STATUS" = "ISSUED" ]; then
    echo "✓ Certificate is validated! Adding HTTPS listener..."
    
    aws elbv2 create-listener \
        --load-balancer-arn "$ALB_ARN" \
        --protocol HTTPS \
        --port 443 \
        --certificates "CertificateArn=$CERT_ARN" \
        --default-actions "Type=forward,TargetGroupArn=$TG_ARN" \
        --query 'Listeners[0].{Port:Port,Protocol:Protocol,ListenerArn:ListenerArn}' \
        --output json
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✓ HTTPS listener added successfully!"
        echo "Your site will be accessible at: https://mv-os.mvalley-eg.com"
    else
        echo "✗ Failed to add HTTPS listener"
        exit 1
    fi
else
    echo "Certificate status: $STATUS"
    echo "Waiting for validation... This can take 5-30 minutes after DNS records are added."
    echo ""
    echo "To check status manually, run:"
    echo "aws acm describe-certificate --certificate-arn $CERT_ARN --query 'Certificate.Status' --output text"
    echo ""
    echo "Once it shows 'ISSUED', run this script again or add the listener manually:"
    echo "aws elbv2 create-listener --load-balancer-arn $ALB_ARN --protocol HTTPS --port 443 --certificates CertificateArn=$CERT_ARN --default-actions Type=forward,TargetGroupArn=$TG_ARN"
    exit 0
fi











