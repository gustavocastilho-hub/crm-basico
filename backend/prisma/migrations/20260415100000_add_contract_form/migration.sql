-- AlterTable
ALTER TABLE "clients"
  ADD COLUMN "legal_name" TEXT,
  ADD COLUMN "cnpj" TEXT,
  ADD COLUMN "address" TEXT,
  ADD COLUMN "city_state" TEXT,
  ADD COLUMN "cep" TEXT,
  ADD COLUMN "signer_name" TEXT,
  ADD COLUMN "signer_cpf" TEXT,
  ADD COLUMN "signer_email" TEXT,
  ADD COLUMN "billing_contact" TEXT,
  ADD COLUMN "form_token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "clients_form_token_key" ON "clients"("form_token");

-- CreateTable
CREATE TABLE "contract_submissions" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "legal_name" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city_state" TEXT NOT NULL,
    "cep" TEXT NOT NULL,
    "signer_name" TEXT NOT NULL,
    "signer_cpf" TEXT NOT NULL,
    "signer_email" TEXT NOT NULL,
    "billing_contact" TEXT NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contract_submissions_client_id_idx" ON "contract_submissions"("client_id");

-- AddForeignKey
ALTER TABLE "contract_submissions" ADD CONSTRAINT "contract_submissions_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
