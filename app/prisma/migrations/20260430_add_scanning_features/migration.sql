-- Safe idempotent migration (handles partial db push state)

-- CreateEnum (safe if already exists)
DO $$ BEGIN
  CREATE TYPE "ScanType" AS ENUM ('RECEIVE', 'REMOVE', 'AUDIT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ImportStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable Container
CREATE TABLE IF NOT EXISTS "Container" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "capacity" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Container_pkey" PRIMARY KEY ("id")
);

-- CreateTable ScanLog
CREATE TABLE IF NOT EXISTS "ScanLog" (
    "id" TEXT NOT NULL,
    "tireId" TEXT,
    "scannedValue" TEXT NOT NULL,
    "scanType" "ScanType" NOT NULL,
    "location" TEXT,
    "userId" TEXT,
    "userEmail" TEXT,
    "qtyBefore" INTEGER,
    "qtyAfter" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScanLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable ImportJob
CREATE TABLE IF NOT EXISTS "ImportJob" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "status" "ImportStatus" NOT NULL DEFAULT 'PENDING',
    "importType" TEXT NOT NULL,
    "rowsProcessed" INTEGER NOT NULL DEFAULT 0,
    "rowsSuccess" INTEGER NOT NULL DEFAULT 0,
    "rowsError" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "uploadedBy" TEXT,
    "columnMapping" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportJob_pkey" PRIMARY KEY ("id")
);

-- AlterTable Tire: add sku (safe)
DO $$ BEGIN
  ALTER TABLE "Tire" ADD COLUMN "sku" TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- AlterTable Tire: add containerId (safe)
DO $$ BEGIN
  ALTER TABLE "Tire" ADD COLUMN "containerId" TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Indexes (all safe)
CREATE UNIQUE INDEX IF NOT EXISTS "Container_name_key" ON "Container"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "Tire_sku_key" ON "Tire"("sku");
CREATE INDEX IF NOT EXISTS "Tire_sku_idx" ON "Tire"("sku");
CREATE INDEX IF NOT EXISTS "ScanLog_tireId_idx" ON "ScanLog"("tireId");
CREATE INDEX IF NOT EXISTS "ScanLog_createdAt_idx" ON "ScanLog"("createdAt");
CREATE INDEX IF NOT EXISTS "ScanLog_scanType_idx" ON "ScanLog"("scanType");
CREATE INDEX IF NOT EXISTS "ScanLog_success_idx" ON "ScanLog"("success");
CREATE INDEX IF NOT EXISTS "ImportJob_status_idx" ON "ImportJob"("status");
CREATE INDEX IF NOT EXISTS "ImportJob_createdAt_idx" ON "ImportJob"("createdAt");

-- Foreign keys (safe)
DO $$ BEGIN
  ALTER TABLE "Tire" ADD CONSTRAINT "Tire_containerId_fkey"
    FOREIGN KEY ("containerId") REFERENCES "Container"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ScanLog" ADD CONSTRAINT "ScanLog_tireId_fkey"
    FOREIGN KEY ("tireId") REFERENCES "Tire"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
