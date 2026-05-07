-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('PROSPECT', 'ACTIVE', 'CANCELLED');

-- AlterTable
ALTER TABLE "clients" ADD COLUMN "status" "ClientStatus" NOT NULL DEFAULT 'PROSPECT',
ADD COLUMN "activated_at" TIMESTAMP(3),
ADD COLUMN "cancelled_at" TIMESTAMP(3);
