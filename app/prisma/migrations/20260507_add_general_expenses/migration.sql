CREATE TABLE "GeneralExpense" (
    "id"          TEXT         NOT NULL,
    "name"        TEXT         NOT NULL,
    "category"    TEXT         NOT NULL DEFAULT 'OTHER',
    "amount"      DECIMAL(10,2) NOT NULL,
    "isRecurring" BOOLEAN      NOT NULL DEFAULT false,
    "recurDay"    INTEGER,
    "notes"       TEXT,
    "paidAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GeneralExpense_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GeneralExpense_isRecurring_idx" ON "GeneralExpense"("isRecurring");
CREATE INDEX "GeneralExpense_paidAt_idx"      ON "GeneralExpense"("paidAt");
