-- Allocation Engine models + Rooms

-- Enums (safe create)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AllocationRunStatus') THEN
    CREATE TYPE "AllocationRunStatus" AS ENUM ('draft','running','completed','failed');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CandidateGroupStatus') THEN
    CREATE TYPE "CandidateGroupStatus" AS ENUM ('draft','blocked','held','confirmed','rejected');
  END IF;
END $$;

-- Rooms
CREATE TABLE IF NOT EXISTS "rooms" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "location" "Location" NOT NULL,
  "capacity" INTEGER NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3)
);

CREATE UNIQUE INDEX IF NOT EXISTS "rooms_name_location_key" ON "rooms"("name","location");
CREATE INDEX IF NOT EXISTS "rooms_location_idx" ON "rooms"("location");
CREATE INDEX IF NOT EXISTS "rooms_isActive_idx" ON "rooms"("isActive");
CREATE INDEX IF NOT EXISTS "rooms_deletedAt_idx" ON "rooms"("deletedAt");

CREATE TABLE IF NOT EXISTS "room_availabilities" (
  "id" TEXT PRIMARY KEY,
  "roomId" TEXT NOT NULL,
  "dayOfWeek" INTEGER NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "effectiveFrom" TIMESTAMP(3),
  "effectiveTo" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "room_availabilities_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "room_availabilities_roomId_idx" ON "room_availabilities"("roomId");
CREATE INDEX IF NOT EXISTS "room_availabilities_dayOfWeek_idx" ON "room_availabilities"("dayOfWeek");
CREATE INDEX IF NOT EXISTS "room_availabilities_deletedAt_idx" ON "room_availabilities"("deletedAt");

-- Add roomId to classes (optional)
ALTER TABLE "classes" ADD COLUMN IF NOT EXISTS "roomId" TEXT;
CREATE INDEX IF NOT EXISTS "classes_roomId_idx" ON "classes"("roomId");
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'classes_roomId_fkey') THEN
    ALTER TABLE "classes"
      ADD CONSTRAINT "classes_roomId_fkey"
      FOREIGN KEY ("roomId") REFERENCES "rooms"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Allocation runs
CREATE TABLE IF NOT EXISTS "allocation_runs" (
  "id" TEXT PRIMARY KEY,
  "status" "AllocationRunStatus" NOT NULL DEFAULT 'draft',
  "fromDate" TIMESTAMP(3) NOT NULL,
  "toDate" TIMESTAMP(3) NOT NULL,
  "notes" TEXT,
  "params" JSONB,
  "createdById" TEXT,
  "startedAt" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3),
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "allocation_runs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "allocation_runs_status_idx" ON "allocation_runs"("status");
CREATE INDEX IF NOT EXISTS "allocation_runs_createdById_idx" ON "allocation_runs"("createdById");
CREATE INDEX IF NOT EXISTS "allocation_runs_deletedAt_idx" ON "allocation_runs"("deletedAt");

-- Course demand
CREATE TABLE IF NOT EXISTS "course_demands" (
  "id" TEXT PRIMARY KEY,
  "runId" TEXT NOT NULL,
  "courseLevelId" TEXT NOT NULL,
  "studentIds" JSONB NOT NULL,
  "studentAvailability" JSONB,
  "requiredSkills" JSONB,
  "minCapacity" INTEGER NOT NULL,
  "maxCapacity" INTEGER NOT NULL,
  "plannedSessions" INTEGER NOT NULL,
  "sessionDurationMins" INTEGER NOT NULL,
  "pricePerStudent" DOUBLE PRECISION NOT NULL,
  "preferredLocation" "Location",
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "course_demands_runId_fkey" FOREIGN KEY ("runId") REFERENCES "allocation_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "course_demands_courseLevelId_fkey" FOREIGN KEY ("courseLevelId") REFERENCES "course_levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "course_demands_runId_idx" ON "course_demands"("runId");
CREATE INDEX IF NOT EXISTS "course_demands_courseLevelId_idx" ON "course_demands"("courseLevelId");
CREATE INDEX IF NOT EXISTS "course_demands_deletedAt_idx" ON "course_demands"("deletedAt");

-- Time clusters
CREATE TABLE IF NOT EXISTS "time_clusters" (
  "id" TEXT PRIMARY KEY,
  "runId" TEXT NOT NULL,
  "demandId" TEXT,
  "dayOfWeek" INTEGER NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "studentCount" INTEGER NOT NULL,
  "studentIds" JSONB NOT NULL,
  "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "explanation" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "time_clusters_runId_fkey" FOREIGN KEY ("runId") REFERENCES "allocation_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "time_clusters_demandId_fkey" FOREIGN KEY ("demandId") REFERENCES "course_demands"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "time_clusters_runId_idx" ON "time_clusters"("runId");
CREATE INDEX IF NOT EXISTS "time_clusters_demandId_idx" ON "time_clusters"("demandId");
CREATE INDEX IF NOT EXISTS "time_clusters_deletedAt_idx" ON "time_clusters"("deletedAt");

-- Candidate groups
CREATE TABLE IF NOT EXISTS "candidate_groups" (
  "id" TEXT PRIMARY KEY,
  "runId" TEXT NOT NULL,
  "demandId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "status" "CandidateGroupStatus" NOT NULL DEFAULT 'draft',
  "blockReason" TEXT,
  "courseLevelId" TEXT NOT NULL,
  "dayOfWeek" INTEGER NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3),
  "instructorId" TEXT,
  "roomId" TEXT,
  "studentCount" INTEGER NOT NULL,
  "studentIds" JSONB NOT NULL,
  "minCapacity" INTEGER NOT NULL,
  "maxCapacity" INTEGER NOT NULL,
  "expectedRevenue" DOUBLE PRECISION NOT NULL,
  "expectedCost" DOUBLE PRECISION NOT NULL,
  "expectedMargin" DOUBLE PRECISION NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'EGP',
  "explanation" JSONB,
  "lockedAt" TIMESTAMP(3),
  "lockedById" TEXT,
  "confirmedGroupId" TEXT,
  "confirmedClassId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "candidate_groups_runId_fkey" FOREIGN KEY ("runId") REFERENCES "allocation_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "candidate_groups_demandId_fkey" FOREIGN KEY ("demandId") REFERENCES "course_demands"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "candidate_groups_courseLevelId_fkey" FOREIGN KEY ("courseLevelId") REFERENCES "course_levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "candidate_groups_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "instructors"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "candidate_groups_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "candidate_groups_lockedById_fkey" FOREIGN KEY ("lockedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "candidate_groups_confirmedGroupId_fkey" FOREIGN KEY ("confirmedGroupId") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "candidate_groups_confirmedClassId_fkey" FOREIGN KEY ("confirmedClassId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "candidate_groups_runId_idx" ON "candidate_groups"("runId");
CREATE INDEX IF NOT EXISTS "candidate_groups_demandId_idx" ON "candidate_groups"("demandId");
CREATE INDEX IF NOT EXISTS "candidate_groups_courseLevelId_idx" ON "candidate_groups"("courseLevelId");
CREATE INDEX IF NOT EXISTS "candidate_groups_status_idx" ON "candidate_groups"("status");
CREATE INDEX IF NOT EXISTS "candidate_groups_instructorId_idx" ON "candidate_groups"("instructorId");
CREATE INDEX IF NOT EXISTS "candidate_groups_roomId_idx" ON "candidate_groups"("roomId");
CREATE INDEX IF NOT EXISTS "candidate_groups_deletedAt_idx" ON "candidate_groups"("deletedAt");


