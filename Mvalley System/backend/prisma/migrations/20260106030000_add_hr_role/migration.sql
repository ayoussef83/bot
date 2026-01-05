-- Add HR role to the UserRole enum (Postgres).
-- Safe to re-run due to IF NOT EXISTS.

ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'hr';


