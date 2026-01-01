-- CreateEnum
CREATE TYPE "BankSyncSource" AS ENUM ('manual', 'csv_upload');

-- CreateTable
CREATE TABLE "bank_sync_runs" (
    "id" TEXT NOT NULL,
    "cashAccountId" TEXT NOT NULL,
    "source" "BankSyncSource" NOT NULL,
    "asOfDate" TIMESTAMP(3) NOT NULL,
    "endingBalance" DOUBLE PRECISION NOT NULL,
    "fileName" TEXT,
    "rowCount" INTEGER,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_sync_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bank_sync_runs_cashAccountId_idx" ON "bank_sync_runs"("cashAccountId");
CREATE INDEX "bank_sync_runs_asOfDate_idx" ON "bank_sync_runs"("asOfDate");

-- AddForeignKey
ALTER TABLE "bank_sync_runs" ADD CONSTRAINT "bank_sync_runs_cashAccountId_fkey" FOREIGN KEY ("cashAccountId") REFERENCES "cash_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


