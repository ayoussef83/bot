-- Groups: add planning fields (location/capacity/age) + keep backward compatibility

ALTER TABLE "groups" ADD COLUMN IF NOT EXISTS "location" "Location";
ALTER TABLE "groups" ADD COLUMN IF NOT EXISTS "minCapacity" INTEGER;
ALTER TABLE "groups" ADD COLUMN IF NOT EXISTS "maxCapacity" INTEGER;
ALTER TABLE "groups" ADD COLUMN IF NOT EXISTS "ageMin" INTEGER;
ALTER TABLE "groups" ADD COLUMN IF NOT EXISTS "ageMax" INTEGER;

CREATE INDEX IF NOT EXISTS "groups_location_idx" ON "groups"("location");


