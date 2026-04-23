-- CreateEnum
CREATE TYPE "ContractStage" AS ENUM ('NOT_GENERATED', 'LINK_SENT', 'FORM_FILLED', 'MINUTA_SENT', 'SIGNING_SENT', 'SIGNED');

-- CreateTable
CREATE TABLE "niches" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "niches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "niches_name_key" ON "niches"("name");

-- CreateIndex
CREATE UNIQUE INDEX "plans_name_key" ON "plans"("name");

-- AlterTable
ALTER TABLE "deals" ADD COLUMN "niche_id" TEXT;
ALTER TABLE "deals" ADD COLUMN "plan_id" TEXT;
ALTER TABLE "deals" ADD COLUMN "contract_stage" "ContractStage" NOT NULL DEFAULT 'NOT_GENERATED';

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_niche_id_fkey" FOREIGN KEY ("niche_id") REFERENCES "niches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
