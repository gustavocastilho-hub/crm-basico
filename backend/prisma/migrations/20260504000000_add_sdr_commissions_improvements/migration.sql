-- CreateTable
CREATE TABLE "sdr_contacts" (
    "id" TEXT NOT NULL,
    "contact_date" DATE NOT NULL,
    "contact_time" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "whatsapp" TEXT,
    "summary" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sdr_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sdr_contacts_contact_date_idx" ON "sdr_contacts"("contact_date");

-- CreateIndex
CREATE INDEX "sdr_contacts_user_id_idx" ON "sdr_contacts"("user_id");

-- AddForeignKey
ALTER TABLE "sdr_contacts" ADD CONSTRAINT "sdr_contacts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "commissions" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "commissions_deal_id_user_id_key" ON "commissions"("deal_id", "user_id");

-- CreateIndex
CREATE INDEX "commissions_user_id_idx" ON "commissions"("user_id");

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "improvement_requests" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "user_id" TEXT NOT NULL,
    "implemented" BOOLEAN NOT NULL DEFAULT false,
    "implemented_at" TIMESTAMP(3),
    "implemented_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "improvement_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "improvement_requests_user_id_idx" ON "improvement_requests"("user_id");

-- CreateIndex
CREATE INDEX "improvement_requests_implemented_idx" ON "improvement_requests"("implemented");

-- AddForeignKey
ALTER TABLE "improvement_requests" ADD CONSTRAINT "improvement_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "improvement_requests" ADD CONSTRAINT "improvement_requests_implemented_by_id_fkey" FOREIGN KEY ("implemented_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
