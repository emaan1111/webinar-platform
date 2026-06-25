-- Admin-created live Zoom sessions, linked to external and/or internal webinars.
-- Additive only: two new tables, no changes to existing tables.

CREATE TABLE IF NOT EXISTS "zoom_sessions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "zoomLink" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "zoom_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "zoom_session_webinars" (
    "id" TEXT NOT NULL,
    "zoomSessionId" TEXT NOT NULL,
    "webinarType" TEXT NOT NULL,
    "externalWebinarId" TEXT,
    "webinarId" TEXT,

    CONSTRAINT "zoom_session_webinars_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "zoom_sessions_scheduledAt_idx" ON "zoom_sessions"("scheduledAt");
CREATE INDEX IF NOT EXISTS "zoom_session_webinars_zoomSessionId_idx" ON "zoom_session_webinars"("zoomSessionId");
CREATE UNIQUE INDEX IF NOT EXISTS "zoom_session_webinars_zoomSessionId_externalWebinarId_key" ON "zoom_session_webinars"("zoomSessionId", "externalWebinarId");
CREATE UNIQUE INDEX IF NOT EXISTS "zoom_session_webinars_zoomSessionId_webinarId_key" ON "zoom_session_webinars"("zoomSessionId", "webinarId");

DO $$ BEGIN
    ALTER TABLE "zoom_session_webinars" ADD CONSTRAINT "zoom_session_webinars_zoomSessionId_fkey" FOREIGN KEY ("zoomSessionId") REFERENCES "zoom_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "zoom_session_webinars" ADD CONSTRAINT "zoom_session_webinars_externalWebinarId_fkey" FOREIGN KEY ("externalWebinarId") REFERENCES "external_webinars"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "zoom_session_webinars" ADD CONSTRAINT "zoom_session_webinars_webinarId_fkey" FOREIGN KEY ("webinarId") REFERENCES "webinars"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
