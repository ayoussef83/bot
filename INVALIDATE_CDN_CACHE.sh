#!/bin/bash
# Invalidate CloudFront CDN cache for Amplify app

set -e

APP_ID="du3m4x9j7wlp6"
REGION="us-east-1"

echo "🔄 Invalidating CloudFront CDN Cache"
echo "===================================="
echo ""

# Get Amplify app domain
DOMAIN=$(aws amplify get-app --app-id $APP_ID --region $REGION --query "app.defaultDomain" --output text 2>/dev/null || echo "")

if [ -z "$DOMAIN" ]; then
    echo "❌ Could not get Amplify app domain"
    exit 1
fi

echo "📋 App Domain: $DOMAIN"
echo ""

# Find CloudFront distribution
echo "🔍 Finding CloudFront distribution..."
DIST_ID=$(aws cloudfront list-distributions \
    --query "DistributionList.Items[?contains(Aliases.Items[0], '$APP_ID') || contains(Origins.Items[0].DomainName, '$APP_ID')].Id" \
    --output text 2>&1 | head -1)

if [ -z "$DIST_ID" ] || [ "$DIST_ID" == "None" ]; then
    echo "⚠️  Could not find CloudFront distribution automatically"
    echo ""
    echo "💡 Manual Steps:"
    echo "   1. Go to: https://console.aws.amazon.com/cloudfront"
    echo "   2. Find distribution for: $DOMAIN"
    echo "   3. Go to 'Invalidations' tab"
    echo "   4. Create invalidation with path: /*"
    echo "   5. Wait 2-5 minutes"
    exit 0
fi

echo "✅ Found distribution: $DIST_ID"
echo ""

# Create invalidation
echo "🔄 Creating cache invalidation..."
INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id "$DIST_ID" \
    --paths "/*" \
    --query "Invalidation.Id" \
    --output text 2>&1)

if [ -n "$INVALIDATION_ID" ] && [ "$INVALIDATION_ID" != "None" ]; then
    echo "✅ Invalidation created: $INVALIDATION_ID"
    echo ""
    echo "⏱️  Cache will be cleared in 2-5 minutes"
    echo ""
    echo "📊 Monitor:"
    echo "   https://console.aws.amazon.com/cloudfront/home?region=$REGION#/distributions/$DIST_ID/invalidations"
else
    echo "⚠️  Could not create invalidation automatically"
    echo ""
    echo "💡 Please invalidate manually via AWS Console"
fi

echo ""
echo "💡 After cache clears (2-5 min):"
echo "   1. Hard refresh browser: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)"
echo "   2. Or test in incognito window"
echo "   3. Changes should now be visible!"

