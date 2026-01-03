#!/bin/bash
# Invalidate CloudFront cache for Amplify app

set -e

APP_ID="du3m4x9j7wlp6"
REGION="us-east-1"
DOMAIN="du3m4x9j7wlp6.amplifyapp.com"

echo "🔄 Invalidating CloudFront Cache for Amplify App"
echo "================================================"
echo ""
echo "App: $APP_ID"
echo "Domain: $DOMAIN"
echo ""

# Method 1: Find by domain
echo "🔍 Method 1: Finding distribution by domain..."
DIST_ID=$(aws cloudfront list-distributions \
    --query "DistributionList.Items[?contains(Aliases.Items[0], '$APP_ID') || contains(Origins.Items[0].DomainName, 'amplify')].Id" \
    --output text 2>&1 | head -1)

if [ -z "$DIST_ID" ] || [ "$DIST_ID" == "None" ]; then
    echo "⚠️  Could not find distribution automatically"
    echo ""
    echo "💡 Manual Steps:"
    echo "   1. Go to: https://console.aws.amazon.com/cloudfront"
    echo "   2. Find distribution for: $DOMAIN"
    echo "   3. Go to 'Invalidations' tab"
    echo "   4. Create invalidation with path: /*"
    echo "   5. Wait 2-5 minutes"
    echo ""
    echo "   OR use Amplify Console:"
    echo "   1. Go to: https://console.aws.amazon.com/amplify/home?region=$REGION#/$APP_ID/main"
    echo "   2. Click 'Rewrites and redirects'"
    echo "   3. This might trigger a cache refresh"
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
    echo "⚠️  Could not create invalidation"
    echo ""
    echo "💡 Please invalidate manually:"
    echo "   https://console.aws.amazon.com/cloudfront/home?region=$REGION"
fi

echo ""
echo "💡 After cache clears (2-5 min):"
echo "   1. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)"
echo "   2. Or test in incognito window"
echo "   3. Changes should now be visible!"

