#!/bin/bash

echo "🔐 Creating IAM Role for App Runner Secrets Access"
echo ""

# Trust policy for App Runner (INSTANCE ROLE must be assumed by tasks.apprunner.amazonaws.com)
cat > /tmp/trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
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

# Policy for Secrets Manager access
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

# Create or update role trust policy
echo "Creating/updating IAM role..."
aws iam create-role \
    --role-name AppRunnerSecretsRole \
    --assume-role-policy-document file:///tmp/trust-policy.json \
    --description "Allows App Runner to access Secrets Manager" \
    > /dev/null 2>&1 || true

aws iam update-assume-role-policy \
    --role-name AppRunnerSecretsRole \
    --policy-document file:///tmp/trust-policy.json \
    > /dev/null 2>&1 || true

# Attach policy
echo "Attaching Secrets Manager policy..."
aws iam put-role-policy \
    --role-name AppRunnerSecretsRole \
    --policy-name SecretsManagerAccess \
    --policy-document file:///tmp/secrets-policy.json \
    > /dev/null 2>&1

echo "✅ IAM Role created: AppRunnerSecretsRole"
echo "   ARN: arn:aws:iam::149959196988:role/AppRunnerSecretsRole"

rm -f /tmp/trust-policy.json /tmp/secrets-policy.json

