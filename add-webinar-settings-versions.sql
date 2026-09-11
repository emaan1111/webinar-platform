-- Version control for webinar settings (internal + external).
--
-- One snapshot row per settings change, with the host's comment about why.
-- `settings` holds the full settings state AFTER the change, so restoring a
-- version is a plain overwrite rather than a replay of diffs.
--
-- Additive only: creates one new table and touches nothing that already exists.
-- Do NOT reach for `prisma db push` to apply this — this database currently has
-- columns that prisma/schema.prisma does not (reminder_email_templates.channel,
-- reminder_email_templates."smsBody", reminder_email_sends.channel and
-- sms_settings."allowedCountryCodes"), and a push would DROP them.

CREATE TABLE IF NOT EXISTS "webinar_settings_versions" (
    "id" TEXT NOT NULL,
    "webinarType" TEXT NOT NULL,
    "webinarId" TEXT,
    "externalWebinarId" TEXT,
    "comment" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "changedFields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "settings" JSONB NOT NULL,
    "createdById" TEXT,
    "createdByEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webinar_settings_versions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "webinar_settings_versions_webinarId_createdAt_idx"
    ON "webinar_settings_versions"("webinarId", "createdAt");

CREATE INDEX IF NOT EXISTS "webinar_settings_versions_externalWebinarId_createdAt_idx"
    ON "webinar_settings_versions"("externalWebinarId", "createdAt");

-- Foreign keys: history dies with the webinar it describes, but survives the
-- deletion of the user who made the change.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'webinar_settings_versions_webinarId_fkey'
    ) THEN
        ALTER TABLE "webinar_settings_versions"
            ADD CONSTRAINT "webinar_settings_versions_webinarId_fkey"
            FOREIGN KEY ("webinarId") REFERENCES "webinars"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'webinar_settings_versions_externalWebinarId_fkey'
    ) THEN
        ALTER TABLE "webinar_settings_versions"
            ADD CONSTRAINT "webinar_settings_versions_externalWebinarId_fkey"
            FOREIGN KEY ("externalWebinarId") REFERENCES "external_webinars"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'webinar_settings_versions_createdById_fkey'
    ) THEN
        ALTER TABLE "webinar_settings_versions"
            ADD CONSTRAINT "webinar_settings_versions_createdById_fkey"
            FOREIGN KEY ("createdById") REFERENCES "users"("id")
            ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END
$$;

COMMENT ON TABLE "webinar_settings_versions" IS 'Settings history for internal webinars (webinarId) and external ones (externalWebinarId); settings holds the full post-change state.';
COMMENT ON COLUMN "webinar_settings_versions"."comment" IS 'The host''s note about why this change was made.';
COMMENT ON COLUMN "webinar_settings_versions"."source" IS 'manual | checkpoint | restore';
