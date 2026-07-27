/*
  Warnings:

  - You are about to drop the column `otp_code` on the `password_resets` table. All the data in the column will be lost.
  - Added the required column `otp_hash` to the `password_resets` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "password_resets" DROP COLUMN "otp_code",
ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "otp_hash" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email_verified" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "email_verifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "otp_hash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_verifications_user_id_idx" ON "email_verifications"("user_id");

-- AddForeignKey
ALTER TABLE "email_verifications" ADD CONSTRAINT "email_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
