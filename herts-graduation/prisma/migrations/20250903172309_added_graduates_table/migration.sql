/*
  Warnings:

  - The values [EXPIRED,REVOKED] on the enum `QRStatus` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[graduateId]` on the table `qr_codes` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."QRCodeType" AS ENUM ('GUEST', 'GRADUATE');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."QRStatus_new" AS ENUM ('VALID', 'USED');
ALTER TABLE "public"."qr_codes" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."qr_codes" ALTER COLUMN "status" TYPE "public"."QRStatus_new" USING ("status"::text::"public"."QRStatus_new");
ALTER TYPE "public"."QRStatus" RENAME TO "QRStatus_old";
ALTER TYPE "public"."QRStatus_new" RENAME TO "QRStatus";
DROP TYPE "public"."QRStatus_old";
ALTER TABLE "public"."qr_codes" ALTER COLUMN "status" SET DEFAULT 'VALID';
COMMIT;

-- AlterTable
ALTER TABLE "public"."qr_codes" ADD COLUMN     "graduateId" TEXT,
ADD COLUMN     "type" "public"."QRCodeType" NOT NULL DEFAULT 'GUEST',
ALTER COLUMN "guestId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "public"."graduates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "major" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "gafIdNumber" TEXT NOT NULL,
    "governmentId" TEXT NOT NULL,
    "idImageUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "graduates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "graduates_userId_key" ON "public"."graduates"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "qr_codes_graduateId_key" ON "public"."qr_codes"("graduateId");

-- AddForeignKey
ALTER TABLE "public"."qr_codes" ADD CONSTRAINT "qr_codes_graduateId_fkey" FOREIGN KEY ("graduateId") REFERENCES "public"."graduates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."graduates" ADD CONSTRAINT "graduates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
