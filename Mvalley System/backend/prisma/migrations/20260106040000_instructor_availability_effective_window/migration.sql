-- Add optional effective window to instructor availability slots
ALTER TABLE "instructor_availabilities"
ADD COLUMN IF NOT EXISTS "effectiveFrom" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "effectiveTo" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "instructor_availabilities_effectiveFrom_idx" ON "instructor_availabilities"("effectiveFrom");
CREATE INDEX IF NOT EXISTS "instructor_availabilities_effectiveTo_idx" ON "instructor_availabilities"("effectiveTo");


