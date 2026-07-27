-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('student', 'admin_office', 'library', 'accounts_office', 'shop_staff');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'suspended');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('deposit', 'shop_payment', 'fine_payment', 'fee_payment', 'prepaid_purchase', 'postpaid_settlement', 'refund', 'waiver_adjustment', 'mass_payment');

-- CreateEnum
CREATE TYPE "TransactionDirection" AS ENUM ('credit', 'debit');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('pending', 'success', 'failed');

-- CreateEnum
CREATE TYPE "ReferenceType" AS ENUM ('shop', 'semester_fee', 'library_fine', 'admin_fine', 'prepaid_plan', 'postpaid_tab');

-- CreateEnum
CREATE TYPE "ShopCategory" AS ENUM ('food_beverage', 'stationery', 'printing', 'other');

-- CreateEnum
CREATE TYPE "ShopStatus" AS ENUM ('active', 'suspended', 'removed');

-- CreateEnum
CREATE TYPE "DueStatus" AS ENUM ('pending', 'paid', 'waived');

-- CreateEnum
CREATE TYPE "LibraryFineType" AS ENUM ('late', 'lost');

-- CreateEnum
CREATE TYPE "FineSource" AS ENUM ('library', 'admin');

-- CreateEnum
CREATE TYPE "WaiverStatus" AS ENUM ('pending', 'approved', 'reduced', 'rejected');

-- CreateEnum
CREATE TYPE "PrepaidBalanceStatus" AS ENUM ('active', 'expired');

-- CreateEnum
CREATE TYPE "PostpaidTabStatus" AS ENUM ('open', 'billed', 'paid');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "role" "UserRole" NOT NULL,
    "student_id" VARCHAR(20),
    "employee_id" VARCHAR(20),
    "full_name" VARCHAR(150) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "phone" VARCHAR(20),
    "password_hash" TEXT NOT NULL,
    "department" VARCHAR(100),
    "batch" VARCHAR(20),
    "must_reset_password" BOOLEAN NOT NULL DEFAULT false,
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_resets" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "otp_code" VARCHAR(6) NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'BDT',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL,
    "wallet_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "TransactionType" NOT NULL,
    "direction" "TransactionDirection" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reference_type" "ReferenceType",
    "reference_id" UUID,
    "shop_id" UUID,
    "gateway" VARCHAR(20),
    "gateway_ref" VARCHAR(100),
    "status" "TransactionStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shops" (
    "id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "category" "ShopCategory" NOT NULL,
    "logo_url" TEXT,
    "rating" DECIMAL(2,1) NOT NULL DEFAULT 0,
    "status" "ShopStatus" NOT NULL DEFAULT 'active',
    "qr_token" VARCHAR(100) NOT NULL,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_staff" (
    "id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shop_staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "semester_fees" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "due_date" DATE,
    "status" "DueStatus" NOT NULL DEFAULT 'pending',
    "assigned_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "semester_fees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library_fines" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "fine_type" "LibraryFineType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "due_date" DATE,
    "status" "DueStatus" NOT NULL DEFAULT 'pending',
    "assigned_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "library_fines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_fines" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "reason" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "incident_date" DATE,
    "status" "DueStatus" NOT NULL DEFAULT 'pending',
    "assigned_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_fines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fine_waivers" (
    "id" UUID NOT NULL,
    "fine_source" "FineSource" NOT NULL,
    "fine_id" UUID NOT NULL,
    "requested_by" UUID NOT NULL,
    "reason" TEXT,
    "status" "WaiverStatus" NOT NULL DEFAULT 'pending',
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fine_waivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prepaid_plans" (
    "id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "validity_days" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prepaid_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prepaid_balances" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMPTZ,
    "status" "PrepaidBalanceStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "prepaid_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postpaid_tabs" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "shop_id" UUID NOT NULL,
    "month_period" VARCHAR(7) NOT NULL,
    "total_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "PostpaidTabStatus" NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "postpaid_tabs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postpaid_charges" (
    "id" UUID NOT NULL,
    "tab_id" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" VARCHAR(150),
    "authorized_via_qr" BOOLEAN NOT NULL DEFAULT true,
    "charged_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "postpaid_charges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" VARCHAR(30),
    "title" VARCHAR(150),
    "body" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_user_id" UUID,
    "action" VARCHAR(50) NOT NULL,
    "entity_type" VARCHAR(50),
    "entity_id" UUID,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_student_id_key" ON "users"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_employee_id_key" ON "users"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "password_resets_user_id_idx" ON "password_resets"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_user_id_key" ON "wallets"("user_id");

-- CreateIndex
CREATE INDEX "transactions_user_id_idx" ON "transactions"("user_id");

-- CreateIndex
CREATE INDEX "transactions_wallet_id_idx" ON "transactions"("wallet_id");

-- CreateIndex
CREATE INDEX "transactions_shop_id_idx" ON "transactions"("shop_id");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "transactions"("status");

-- CreateIndex
CREATE INDEX "transactions_created_at_idx" ON "transactions"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "shops_qr_token_key" ON "shops"("qr_token");

-- CreateIndex
CREATE INDEX "shops_status_idx" ON "shops"("status");

-- CreateIndex
CREATE INDEX "shops_category_idx" ON "shops"("category");

-- CreateIndex
CREATE INDEX "shop_staff_user_id_idx" ON "shop_staff"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "shop_staff_shop_id_user_id_key" ON "shop_staff"("shop_id", "user_id");

-- CreateIndex
CREATE INDEX "semester_fees_student_id_idx" ON "semester_fees"("student_id");

-- CreateIndex
CREATE INDEX "semester_fees_status_idx" ON "semester_fees"("status");

-- CreateIndex
CREATE INDEX "library_fines_student_id_idx" ON "library_fines"("student_id");

-- CreateIndex
CREATE INDEX "library_fines_status_idx" ON "library_fines"("status");

-- CreateIndex
CREATE INDEX "admin_fines_student_id_idx" ON "admin_fines"("student_id");

-- CreateIndex
CREATE INDEX "admin_fines_status_idx" ON "admin_fines"("status");

-- CreateIndex
CREATE INDEX "fine_waivers_fine_source_fine_id_idx" ON "fine_waivers"("fine_source", "fine_id");

-- CreateIndex
CREATE INDEX "fine_waivers_status_idx" ON "fine_waivers"("status");

-- CreateIndex
CREATE INDEX "prepaid_plans_shop_id_idx" ON "prepaid_plans"("shop_id");

-- CreateIndex
CREATE INDEX "prepaid_balances_student_id_shop_id_idx" ON "prepaid_balances"("student_id", "shop_id");

-- CreateIndex
CREATE INDEX "prepaid_balances_status_idx" ON "prepaid_balances"("status");

-- CreateIndex
CREATE INDEX "postpaid_tabs_status_idx" ON "postpaid_tabs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "postpaid_tabs_student_id_shop_id_month_period_key" ON "postpaid_tabs"("student_id", "shop_id", "month_period");

-- CreateIndex
CREATE INDEX "postpaid_charges_tab_id_idx" ON "postpaid_charges"("tab_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "audit_logs_actor_user_id_idx" ON "audit_logs"("actor_user_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shops" ADD CONSTRAINT "shops_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_staff" ADD CONSTRAINT "shop_staff_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_staff" ADD CONSTRAINT "shop_staff_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "semester_fees" ADD CONSTRAINT "semester_fees_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "semester_fees" ADD CONSTRAINT "semester_fees_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_fines" ADD CONSTRAINT "library_fines_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_fines" ADD CONSTRAINT "library_fines_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_fines" ADD CONSTRAINT "admin_fines_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_fines" ADD CONSTRAINT "admin_fines_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fine_waivers" ADD CONSTRAINT "fine_waivers_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fine_waivers" ADD CONSTRAINT "fine_waivers_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prepaid_plans" ADD CONSTRAINT "prepaid_plans_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prepaid_balances" ADD CONSTRAINT "prepaid_balances_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prepaid_balances" ADD CONSTRAINT "prepaid_balances_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prepaid_balances" ADD CONSTRAINT "prepaid_balances_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "prepaid_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postpaid_tabs" ADD CONSTRAINT "postpaid_tabs_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postpaid_tabs" ADD CONSTRAINT "postpaid_tabs_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postpaid_charges" ADD CONSTRAINT "postpaid_charges_tab_id_fkey" FOREIGN KEY ("tab_id") REFERENCES "postpaid_tabs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
