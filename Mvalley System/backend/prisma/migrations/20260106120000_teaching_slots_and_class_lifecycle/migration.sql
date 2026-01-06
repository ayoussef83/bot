-- TeachingSlot-driven allocation: slots + class lifecycle + profitability + student availability

-- Enums (safe create)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TeachingSlotStatus') THEN
    CREATE TYPE "TeachingSlotStatus" AS ENUM ('open','reserved','occupied','inactive');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ClassLifecycleStatus') THEN
    CREATE TYPE "ClassLifecycleStatus" AS ENUM ('draft','filling','confirmed','active','completed');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProfitabilityStatus') THEN
    CREATE TYPE "ProfitabilityStatus" AS ENUM ('red','yellow','green');
  END IF;
END $$;

-- Student availability (JSON)
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "availability" JSONB;

-- Teaching slots table
CREATE TABLE IF NOT EXISTS "teaching_slots" (
  "id" TEXT PRIMARY KEY,
  "status" "TeachingSlotStatus" NOT NULL DEFAULT 'open',
  "courseLevelId" TEXT NOT NULL,
  "instructorId" TEXT NOT NULL,
  "roomId" TEXT NOT NULL,
  "dayOfWeek" INTEGER NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "effectiveFrom" TIMESTAMP(3),
  "effectiveTo" TIMESTAMP(3),
  "minCapacity" INTEGER NOT NULL,
  "maxCapacity" INTEGER NOT NULL,
  "plannedSessions" INTEGER NOT NULL,
  "sessionDurationMins" INTEGER NOT NULL,
  "pricePerStudent" DOUBLE PRECISION NOT NULL,
  "minMarginPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'EGP',
  "currentClassId" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "teaching_slots_courseLevelId_fkey" FOREIGN KEY ("courseLevelId") REFERENCES "course_levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "teaching_slots_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "instructors"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "teaching_slots_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "teaching_slots_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "teaching_slots_status_idx" ON "teaching_slots"("status");
CREATE INDEX IF NOT EXISTS "teaching_slots_courseLevelId_idx" ON "teaching_slots"("courseLevelId");
CREATE INDEX IF NOT EXISTS "teaching_slots_instructorId_idx" ON "teaching_slots"("instructorId");
CREATE INDEX IF NOT EXISTS "teaching_slots_roomId_idx" ON "teaching_slots"("roomId");
CREATE INDEX IF NOT EXISTS "teaching_slots_dayOfWeek_idx" ON "teaching_slots"("dayOfWeek");
CREATE INDEX IF NOT EXISTS "teaching_slots_deletedAt_idx" ON "teaching_slots"("deletedAt");

-- Add lifecycle/profitability fields to classes
ALTER TABLE "classes" ADD COLUMN IF NOT EXISTS "teachingSlotId" TEXT;
ALTER TABLE "classes" ADD COLUMN IF NOT EXISTS "lifecycleStatus" "ClassLifecycleStatus" NOT NULL DEFAULT 'active';
ALTER TABLE "classes" ADD COLUMN IF NOT EXISTS "profitabilityStatus" "ProfitabilityStatus" NOT NULL DEFAULT 'red';
ALTER TABLE "classes" ADD COLUMN IF NOT EXISTS "expectedRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "classes" ADD COLUMN IF NOT EXISTS "expectedCost" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "classes" ADD COLUMN IF NOT EXISTS "expectedMargin" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "classes" ADD COLUMN IF NOT EXISTS "marginThresholdPct" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "classes" ADD COLUMN IF NOT EXISTS "confirmedAt" TIMESTAMP(3);
ALTER TABLE "classes" ADD COLUMN IF NOT EXISTS "confirmedById" TEXT;
ALTER TABLE "classes" ADD COLUMN IF NOT EXISTS "confirmReason" TEXT;

CREATE INDEX IF NOT EXISTS "classes_teachingSlotId_idx" ON "classes"("teachingSlotId");
CREATE INDEX IF NOT EXISTS "classes_lifecycleStatus_idx" ON "classes"("lifecycleStatus");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'classes_teachingSlotId_fkey') THEN
    ALTER TABLE "classes"
      ADD CONSTRAINT "classes_teachingSlotId_fkey"
      FOREIGN KEY ("teachingSlotId") REFERENCES "teaching_slots"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'classes_confirmedById_fkey') THEN
    ALTER TABLE "classes"
      ADD CONSTRAINT "classes_confirmedById_fkey"
      FOREIGN KEY ("confirmedById") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- TeachingSlot current class FK (must exist after classes_teachingSlotId)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'teaching_slots_currentClassId_fkey') THEN
    ALTER TABLE "teaching_slots"
      ADD CONSTRAINT "teaching_slots_currentClassId_fkey"
      FOREIGN KEY ("currentClassId") REFERENCES "classes"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;


