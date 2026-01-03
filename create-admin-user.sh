#!/bin/bash

# Script to create admin@mvalley.eg user in production database
# This will connect to the database and create/update the user

echo "🔐 Getting database connection string from Secrets Manager..."

DB_URL=$(aws secretsmanager get-secret-value \
  --secret-id mv-os/database-url \
  --query SecretString \
  --output text)

if [ -z "$DB_URL" ]; then
  echo "❌ Failed to get database URL from Secrets Manager"
  exit 1
fi

echo "✅ Got database URL"
echo ""
echo "🔧 Creating admin@mvalley.eg user..."

# Generate password hash using Node.js (bcrypt)
cd backend
PASSWORD_HASH=$(node -e "
const bcrypt = require('bcrypt');
bcrypt.hash('admin123', 10).then(hash => {
  console.log(hash);
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
")

if [ -z "$PASSWORD_HASH" ]; then
  echo "❌ Failed to generate password hash"
  exit 1
fi

echo "✅ Generated password hash"
echo ""
echo "📝 Creating/updating user in database..."

# Use psql to insert/update user
psql "$DB_URL" <<EOF
INSERT INTO users (id, email, password, "firstName", "lastName", role, status, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@mvalley.eg',
  '$PASSWORD_HASH',
  'Super',
  'Admin',
  'super_admin',
  'active',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET 
  password = EXCLUDED.password,
  "updatedAt" = NOW();

SELECT email, role, status FROM users WHERE email = 'admin@mvalley.eg';
EOF

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ User created/updated successfully!"
  echo ""
  echo "📝 Login credentials:"
  echo "   Email: admin@mvalley.eg"
  echo "   Password: admin123"
else
  echo "❌ Failed to create user"
  exit 1
fi










