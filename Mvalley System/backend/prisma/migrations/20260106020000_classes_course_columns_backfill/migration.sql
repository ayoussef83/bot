-- Backfill migration: ensure columns exist even if an earlier migration was already applied.
-- Uses IF NOT EXISTS to be safe across environments.

ALTER TABLE "classes"
ADD COLUMN IF NOT EXISTS "code" TEXT,
ADD COLUMN IF NOT EXISTS "logoUrl" TEXT,
ADD COLUMN IF NOT EXISTS "ageMin" INTEGER,
ADD COLUMN IF NOT EXISTS "ageMax" INTEGER,
ADD COLUMN IF NOT EXISTS "price" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "levelNumber" INTEGER,
ADD COLUMN IF NOT EXISTS "plannedSessions" INTEGER,
ADD COLUMN IF NOT EXISTS "description" TEXT,
ADD COLUMN IF NOT EXISTS "minCapacity" INTEGER,
ADD COLUMN IF NOT EXISTS "maxCapacity" INTEGER;

CREATE INDEX IF NOT EXISTS "classes_code_idx" ON "classes"("code");


