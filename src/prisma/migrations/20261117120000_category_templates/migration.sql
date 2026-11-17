-- Category templates: description, icon, per-category template config, visibility and order
ALTER TABLE "BusinessCategory" ADD COLUMN "description" TEXT;
ALTER TABLE "BusinessCategory" ADD COLUMN "icon" TEXT;
ALTER TABLE "BusinessCategory" ADD COLUMN "config" JSONB;
ALTER TABLE "BusinessCategory" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "BusinessCategory" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;
