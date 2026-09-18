-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "pushEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "BillingEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BillingEvent_eventId_key" ON "BillingEvent"("eventId");

-- CreateIndex
CREATE INDEX "BillingEvent_provider_processedAt_idx" ON "BillingEvent"("provider", "processedAt");
