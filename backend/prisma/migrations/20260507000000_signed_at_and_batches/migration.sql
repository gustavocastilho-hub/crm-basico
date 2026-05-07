-- AlterTable Deal: nova coluna contract_signed_at
ALTER TABLE "deals" ADD COLUMN "contract_signed_at" TIMESTAMP(3);

-- Backfill: usar contract_exited_at como aproximacao para deals que ja sairam de Contrato
UPDATE "deals" SET "contract_signed_at" = "contract_exited_at" WHERE "contract_exited_at" IS NOT NULL;

-- AlterTable CommissionPayment: nova coluna batch_id
ALTER TABLE "commission_payments" ADD COLUMN "batch_id" TEXT;

CREATE INDEX "commission_payments_batch_id_idx" ON "commission_payments"("batch_id");
