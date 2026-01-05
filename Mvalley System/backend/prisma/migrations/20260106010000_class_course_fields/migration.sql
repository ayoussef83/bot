-- Add course catalog-like metadata fields to classes (course groups)

ALTER TABLE "classes"
ADD COLUMN     "code" TEXT,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "ageMin" INTEGER,
ADD COLUMN     "ageMax" INTEGER,
ADD COLUMN     "price" DOUBLE PRECISION,
ADD COLUMN     "levelNumber" INTEGER,
ADD COLUMN     "plannedSessions" INTEGER,
ADD COLUMN     "description" TEXT;

CREATE INDEX "classes_code_idx" ON "classes"("code");


