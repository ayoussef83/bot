-- Create Groups table (operational cohorts) and attach groupId to student_enrollments

-- CreateTable
CREATE TABLE "groups" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "courseLevelId" TEXT NOT NULL,
  "defaultClassId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- AddColumn
ALTER TABLE "student_enrollments" ADD COLUMN "groupId" TEXT;

-- Indexes
CREATE INDEX "groups_courseLevelId_idx" ON "groups"("courseLevelId");
CREATE INDEX "groups_defaultClassId_idx" ON "groups"("defaultClassId");
CREATE INDEX "groups_deletedAt_idx" ON "groups"("deletedAt");
CREATE INDEX "student_enrollments_groupId_idx" ON "student_enrollments"("groupId");

-- Foreign keys
ALTER TABLE "groups"
ADD CONSTRAINT "groups_courseLevelId_fkey"
FOREIGN KEY ("courseLevelId") REFERENCES "course_levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "groups"
ADD CONSTRAINT "groups_defaultClassId_fkey"
FOREIGN KEY ("defaultClassId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "student_enrollments"
ADD CONSTRAINT "student_enrollments_groupId_fkey"
FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;


