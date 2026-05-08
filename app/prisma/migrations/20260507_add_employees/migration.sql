CREATE TYPE "PayType" AS ENUM ('HOURLY', 'SALARY');
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "PayRecordType" AS ENUM ('PAYROLL', 'BONUS', 'EXPENSE', 'DEDUCTION');

CREATE TABLE "Employee" (
    "id"        TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "role"      TEXT,
    "phone"     TEXT,
    "email"     TEXT,
    "payType"   "PayType"        NOT NULL DEFAULT 'HOURLY',
    "payRate"   DECIMAL(10,2)    NOT NULL,
    "startDate" TIMESTAMP(3),
    "status"    "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes"     TEXT,
    "createdAt" TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3)     NOT NULL,
    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PayRecord" (
    "id"          TEXT NOT NULL,
    "employeeId"  TEXT NOT NULL,
    "type"        "PayRecordType" NOT NULL DEFAULT 'PAYROLL',
    "amount"      DECIMAL(10,2)  NOT NULL,
    "hours"       DECIMAL(8,2),
    "periodStart" TIMESTAMP(3),
    "periodEnd"   TIMESTAMP(3),
    "notes"       TEXT,
    "paidAt"      TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt"   TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PayRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Employee_status_idx" ON "Employee"("status");
CREATE INDEX "PayRecord_employeeId_idx" ON "PayRecord"("employeeId");
CREATE INDEX "PayRecord_paidAt_idx" ON "PayRecord"("paidAt");

ALTER TABLE "PayRecord" ADD CONSTRAINT "PayRecord_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
