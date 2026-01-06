-- Add optional instructor profile fields
ALTER TABLE "instructors"
ADD COLUMN IF NOT EXISTS "age" INTEGER,
ADD COLUMN IF NOT EXISTS "educationLevel" TEXT,
ADD COLUMN IF NOT EXISTS "livingArea" TEXT;


