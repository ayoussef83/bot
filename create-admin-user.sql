-- SQL script to create/update admin@mvalley.eg user
-- Run this directly on your production database

-- Note: Password hash is for 'admin123'
-- This uses bcrypt with 10 rounds

-- First, check if user exists and update, or create new
INSERT INTO users (id, email, password, "firstName", "lastName", role, status, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@mvalley.eg',
  '$2b$10$rOzJujq9vXVa5xJ5x5x5xO5x5x5x5x5x5x5x5x5x5x5x5x5x5x5x',  -- This is a placeholder - you need the actual bcrypt hash
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

-- Alternative: If you want to update existing admin@mindvalley.eg to admin@mvalley.eg
-- UPDATE users SET email = 'admin@mvalley.eg' WHERE email = 'admin@mindvalley.eg';










