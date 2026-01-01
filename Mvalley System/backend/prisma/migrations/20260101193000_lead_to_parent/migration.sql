-- Add Lead -> Parent conversion link
ALTER TABLE "leads" ADD COLUMN "convertedToParentId" TEXT;

-- CreateIndex
CREATE INDEX "leads_convertedToParentId_idx" ON "leads"("convertedToParentId");

-- AddForeignKey
ALTER TABLE "leads"
ADD CONSTRAINT "leads_convertedToParentId_fkey"
FOREIGN KEY ("convertedToParentId") REFERENCES "parents"("id")
ON DELETE SET NULL ON UPDATE CASCADE;


