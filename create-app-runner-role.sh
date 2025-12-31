#!/bin/bash

# Create IAM role for App Runner to access Secrets Manager

ROLE_NAME="AppRunner-mv-os-role"
POLICY_NAME="AppRunner-mv-os-secrets-policy"

echo "🔐 Creating IAM role for App Runner..."

# Trust policy for App Runner
cat > /tmp/trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "build.apprunner.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    },
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "tasks.apprunner.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create the role
aws iam create-role \
  --role-name "$ROLE_NAME" \
  --assume-role-policy-document file:///tmp/trust-policy.json \
  --query 'Role.Arn' \
  --output text 2>/dev/null || echo "Role may already exist"

# Create policy for Secrets Manager access
cat > /tmp/secrets-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": [
        "arn:aws:secretsmanager:us-east-1:149959196988:secret:mv-os/*"
      ]
    }
  ]
}
EOF

# Create the policy
POLICY_ARN=$(aws iam create-policy \
  --policy-name "$POLICY_NAME" \
  --policy-document file:///tmp/secrets-policy.json \
  --query 'Policy.Arn' \
  --output text 2>/dev/null || aws iam get-policy --policy-arn "arn:aws:iam::149959196988:policy/$POLICY_NAME" --query 'Policy.Arn' --output text 2>/dev/null || echo "")

if [ ! -z "$POLICY_ARN" ] && [ "$POLICY_ARN" != "null" ]; then
    echo "✅ Policy created: $POLICY_ARN"
    
    # Attach policy to role
    aws iam attach-role-policy \
      --role-name "$ROLE_NAME" \
      --policy-arn "$POLICY_ARN"
    
    echo "✅ Policy attached to role"
fi

# Get the role ARN
ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text)

echo ""
echo "✅ IAM Role created: $ROLE_ARN"
echo ""
echo "📝 Use this ARN in App Runner service configuration:"
echo "   $ROLE_ARN"










