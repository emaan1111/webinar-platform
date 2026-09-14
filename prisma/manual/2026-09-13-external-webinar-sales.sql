-- External-webinar sales linkage.
-- Applied directly (not via `prisma db push`): prod carries a `webinar_settings_versions`
-- table that no longer exists in schema.prisma, and a push would drop it.
-- Every statement below is additive and idempotent.

ALTER TABLE "external_webinar_registrations"
  ADD COLUMN IF NOT EXISTS "hasPurchased" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "webinar_sales"
  ADD COLUMN IF NOT EXISTS "externalWebinarId" TEXT,
  ADD COLUMN IF NOT EXISTS "externalRegistrationId" TEXT;

ALTER TABLE "webinar_sales" ALTER COLUMN "webinarId" DROP NOT NULL;

CREATE INDEX IF NOT EXISTS "webinar_sales_externalWebinarId_idx"
  ON "webinar_sales"("externalWebinarId");
CREATE INDEX IF NOT EXISTS "webinar_sales_externalRegistrationId_idx"
  ON "webinar_sales"("externalRegistrationId");

DO $$ BEGIN
  ALTER TABLE "webinar_sales" ADD CONSTRAINT "webinar_sales_externalWebinarId_fkey"
    FOREIGN KEY ("externalWebinarId") REFERENCES "external_webinars"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "webinar_sales" ADD CONSTRAINT "webinar_sales_externalRegistrationId_fkey"
    FOREIGN KEY ("externalRegistrationId") REFERENCES "external_webinar_registrations"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
