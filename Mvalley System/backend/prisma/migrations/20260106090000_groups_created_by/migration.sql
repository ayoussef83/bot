-- Add createdById to groups for auditing
ALTER TABLE "groups" ADD COLUMN IF NOT EXISTS "createdById" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'groups_createdById_fkey'
  ) THEN
    ALTER TABLE "groups"
      ADD CONSTRAINT "groups_createdById_fkey"
      FOREIGN KEY ("createdById") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "groups_createdById_idx" ON "groups"("createdById");


