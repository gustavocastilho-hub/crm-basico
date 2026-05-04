-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('SDR', 'NON_SDR', 'OTHER');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('UNPAID', 'PAID');

-- AlterTable Deal
ALTER TABLE "deals" ADD COLUMN "contract_exited_at" TIMESTAMP(3);

-- AlterTable Commission
ALTER TABLE "commissions" ADD COLUMN "reference_month" TEXT;
ALTER TABLE "commissions" ADD COLUMN "type" "CommissionType" NOT NULL DEFAULT 'OTHER';
ALTER TABLE "commissions" ADD COLUMN "implementation_fee" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "commissions" ADD COLUMN "calculated_amount" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "commissions" ADD COLUMN "paid_amount" DECIMAL(12,2);
ALTER TABLE "commissions" ADD COLUMN "status" "CommissionStatus" NOT NULL DEFAULT 'UNPAID';
ALTER TABLE "commissions" ADD COLUMN "paid_at" TIMESTAMP(3);

-- Backfill reference_month + calculated_amount for existing rows
UPDATE "commissions" c
SET
  "reference_month" = TO_CHAR(c."created_at", 'YYYY-MM'),
  "calculated_amount" = COALESCE(
    (SELECT d."value" * c."percentage" / 100 FROM "deals" d WHERE d."id" = c."deal_id"),
    0
  ),
  "implementation_fee" = COALESCE(
    (SELECT d."value" FROM "deals" d WHERE d."id" = c."deal_id"),
    0
  );

ALTER TABLE "commissions" ALTER COLUMN "reference_month" SET NOT NULL;

-- Backfill contract_exited_at for deals that already passed Contrato
UPDATE "deals" d
SET "contract_exited_at" = COALESCE(
  (SELECT MIN(a."created_at") FROM "activities" a
   WHERE a."deal_id" = d."id"
     AND a."type" = 'STAGE_CHANGE'
     AND a."content" ILIKE 'movido de Contrato para%'),
  CASE
    WHEN EXISTS (
      SELECT 1 FROM "stages" s_curr, "stages" s_contrato
      WHERE s_curr."id" = d."stage_id"
        AND LOWER(s_contrato."label") = 'contrato'
        AND s_curr."position" > s_contrato."position"
    ) THEN d."updated_at"
    ELSE NULL
  END
);

-- Replace unique index on (deal_id, user_id) with (deal_id, reference_month)
DROP INDEX IF EXISTS "commissions_deal_id_user_id_key";
CREATE UNIQUE INDEX "commissions_deal_id_reference_month_key" ON "commissions"("deal_id", "reference_month");
CREATE INDEX "commissions_reference_month_idx" ON "commissions"("reference_month");

-- CreateTable AppSetting
CREATE TABLE "app_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key")
);
