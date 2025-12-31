-- CreateEnum
CREATE TYPE "CustomFieldEntity" AS ENUM ('student', 'class', 'payment', 'lead');

-- CreateEnum
CREATE TYPE "CustomFieldType" AS ENUM ('text', 'number', 'boolean', 'date', 'select');

-- AlterTable
ALTER TABLE "classes" ADD COLUMN     "customData" JSONB;

-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "customData" JSONB;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "customData" JSONB;

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "customData" JSONB;

-- CreateTable
CREATE TABLE "custom_field_definitions" (
    "id" TEXT NOT NULL,
    "entity" "CustomFieldEntity" NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "CustomFieldType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "options" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "custom_field_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "custom_field_definitions_entity_isActive_idx" ON "custom_field_definitions"("entity", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "custom_field_definitions_entity_key_key" ON "custom_field_definitions"("entity", "key");
