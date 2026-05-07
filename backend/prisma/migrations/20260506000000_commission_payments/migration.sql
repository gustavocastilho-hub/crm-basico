-- AlterEnum: adiciona PARTIALLY_PAID
ALTER TYPE "CommissionStatus" ADD VALUE IF NOT EXISTS 'PARTIALLY_PAID';

-- CreateTable CommissionPayment
CREATE TABLE "commission_payments" (
    "id" TEXT NOT NULL,
    "commission_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "paid_at" TIMESTAMP(3) NOT NULL,
    "receipt_url" TEXT,
    "receipt_name" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commission_payments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "commission_payments_commission_id_idx" ON "commission_payments"("commission_id");

ALTER TABLE "commission_payments" ADD CONSTRAINT "commission_payments_commission_id_fkey"
    FOREIGN KEY ("commission_id") REFERENCES "commissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: comissões já marcadas como PAID viram um pagamento integral
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

INSERT INTO "commission_payments" ("id", "commission_id", "amount", "paid_at", "created_at")
SELECT
  gen_random_uuid()::text,
  c."id",
  COALESCE(c."paid_amount", c."calculated_amount"),
  COALESCE(c."paid_at", c."updated_at"),
  c."updated_at"
FROM "commissions" c
WHERE c."status" = 'PAID';
