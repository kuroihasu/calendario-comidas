-- CreateEnum
CREATE TYPE "DateRuleType" AS ENUM ('fixed', 'nth_weekday');

-- CreateEnum
CREATE TYPE "FoodCategory" AS ENUM ('sandwich', 'plato', 'dulce', 'bebida', 'otro');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('admin', 'editor');

-- CreateTable
CREATE TABLE "food_day" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "short_name" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image_url" TEXT,
    "category" "FoodCategory" NOT NULL,
    "layers" JSONB NOT NULL DEFAULT '[]',
    "date_rule_type" "DateRuleType" NOT NULL,
    "month" INTEGER NOT NULL,
    "day" INTEGER,
    "weekday" INTEGER,
    "week_of_month" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "source_note" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "food_day_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_day_occurrence" (
    "id" UUID NOT NULL,
    "food_day_id" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "is_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "food_day_occurrence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_user" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'editor',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "admin_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" UUID NOT NULL,
    "admin_id" UUID NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "diff" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "food_day_slug_key" ON "food_day"("slug");

-- CreateIndex
CREATE INDEX "food_day_occurrence_date_idx" ON "food_day_occurrence"("date");

-- CreateIndex
CREATE UNIQUE INDEX "food_day_occurrence_food_day_id_year_key" ON "food_day_occurrence"("food_day_id", "year");

-- CreateIndex
CREATE UNIQUE INDEX "admin_user_email_key" ON "admin_user"("email");

-- CreateIndex
CREATE INDEX "audit_log_entity_entity_id_idx" ON "audit_log"("entity", "entity_id");

-- AddForeignKey
ALTER TABLE "food_day_occurrence" ADD CONSTRAINT "food_day_occurrence_food_day_id_fkey" FOREIGN KEY ("food_day_id") REFERENCES "food_day"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admin_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
