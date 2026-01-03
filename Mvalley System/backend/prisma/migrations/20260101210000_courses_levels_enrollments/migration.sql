-- Courses, levels, enrollments + backfill from existing classes/students

-- 1) Create courses table
CREATE TABLE IF NOT EXISTS "courses" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3)
);

-- 2) Create course_levels table
CREATE TABLE IF NOT EXISTS "course_levels" (
  "id" TEXT PRIMARY KEY,
  "courseId" TEXT NOT NULL REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "name" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 1,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "course_levels_courseId_name_key" UNIQUE ("courseId","name")
);

CREATE INDEX IF NOT EXISTS "course_levels_courseId_idx" ON "course_levels"("courseId");

-- 3) Add columns to classes
ALTER TABLE "classes" ADD COLUMN IF NOT EXISTS "locationName" TEXT;
ALTER TABLE "classes" ADD COLUMN IF NOT EXISTS "courseLevelId" TEXT;

-- Backfill locationName from enum location text
UPDATE "classes"
SET "locationName" = COALESCE("locationName", "location"::text)
WHERE "locationName" IS NULL;

-- 4) Backfill courses/levels from existing classes.name (safe, idempotent-ish)
-- Insert unique courses from class names
INSERT INTO "courses" ("id","name","isActive","createdAt","updatedAt")
SELECT uuid_generate_v4()::text, c."name", TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (
  SELECT DISTINCT "name" FROM "classes" WHERE "deletedAt" IS NULL
) c
ON CONFLICT ("name") DO NOTHING;

-- Insert default "Level 1" for each course
INSERT INTO "course_levels" ("id","courseId","name","sortOrder","isActive","createdAt","updatedAt")
SELECT uuid_generate_v4()::text, co."id", 'Level 1', 1, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "courses" co
LEFT JOIN "course_levels" cl ON cl."courseId" = co."id" AND cl."name" = 'Level 1'
WHERE cl."id" IS NULL;

-- Set classes.courseLevelId based on matching course.name = class.name and default Level 1
UPDATE "classes" c
SET "courseLevelId" = cl."id"
FROM "courses" co
JOIN "course_levels" cl ON cl."courseId" = co."id" AND cl."name" = 'Level 1'
WHERE c."courseLevelId" IS NULL
  AND co."name" = c."name";

-- Add FK now that data is backfilled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'classes_courseLevelId_fkey'
  ) THEN
    ALTER TABLE "classes"
      ADD CONSTRAINT "classes_courseLevelId_fkey"
      FOREIGN KEY ("courseLevelId") REFERENCES "course_levels"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "classes_courseLevelId_idx" ON "classes"("courseLevelId");

-- 5) Create student_enrollments table
CREATE TABLE IF NOT EXISTS "student_enrollments" (
  "id" TEXT PRIMARY KEY,
  "studentId" TEXT NOT NULL REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "courseLevelId" TEXT NOT NULL REFERENCES "course_levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "classId" TEXT REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "status" TEXT NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "student_enrollments_studentId_courseLevelId_key" UNIQUE ("studentId","courseLevelId")
);

CREATE INDEX IF NOT EXISTS "student_enrollments_studentId_idx" ON "student_enrollments"("studentId");
CREATE INDEX IF NOT EXISTS "student_enrollments_courseLevelId_idx" ON "student_enrollments"("courseLevelId");
CREATE INDEX IF NOT EXISTS "student_enrollments_classId_idx" ON "student_enrollments"("classId");

-- Backfill enrollments from existing students.classId -> classes.courseLevelId
INSERT INTO "student_enrollments" ("id","studentId","courseLevelId","classId","status","createdAt","updatedAt")
SELECT
  uuid_generate_v4()::text,
  s."id",
  c."courseLevelId",
  s."classId",
  'active',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "students" s
JOIN "classes" c ON c."id" = s."classId"
WHERE s."deletedAt" IS NULL
  AND s."classId" IS NOT NULL
  AND c."courseLevelId" IS NOT NULL
ON CONFLICT ("studentId","courseLevelId") DO NOTHING;


