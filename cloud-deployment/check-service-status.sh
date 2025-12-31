#!/bin/bash

SERVICE_ARN=$(aws apprunner list-services --query "ServiceSummaryList[?ServiceName=='mv-os-backend'].ServiceArn" --output text 2>/dev/null || echo "arn:aws:apprunner:us-east-1:149959196988:service/mv-os-backend/063ead0fb55e4631bff87033abb5499c")

echo "🔍 Checking App Runner Service Status..."
echo ""

STATUS=$(aws apprunner describe-service \
    --service-arn "$SERVICE_ARN" \
    --query 'Service.Status' \
    --output text)

SERVICE_URL=$(aws apprunner describe-service \
    --service-arn "$SERVICE_ARN" \
    --query 'Service.ServiceUrl' \
    --output text)

echo "Status: $STATUS"
echo "Service URL: https://$SERVICE_URL"
echo ""

if [ "$STATUS" = "RUNNING" ]; then
    echo "✅ Service is RUNNING!"
    echo ""
    echo "Testing health endpoint..."
    curl -s "https://$SERVICE_URL/api/health" | jq . || curl -s "https://$SERVICE_URL/api/health"
    echo ""
    echo ""
    echo "✅ Backend is ready!"
    echo ""
    echo "Next steps:"
    echo "1. Run database migrations (see NEXT_STEPS_AFTER_DEPLOYMENT.md)"
    echo "2. Deploy frontend to Amplify"
    echo "3. Update frontend API URL: NEXT_PUBLIC_API_URL=https://$SERVICE_URL/api"
elif [ "$STATUS" = "OPERATION_IN_PROGRESS" ] || [ "$STATUS" = "CREATE_FAILED" ]; then
    echo "⏳ Service is still deploying or had an issue"
    echo ""
    echo "Check logs in AWS Console:"
    echo "https://console.aws.amazon.com/apprunner/home?region=us-east-1#/services/mv-os-backend"
else
    echo "Status: $STATUS"
    echo "Check AWS Console for details"
fi

