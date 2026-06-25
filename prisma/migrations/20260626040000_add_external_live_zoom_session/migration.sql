-- Let an external webinar's live Zoom session be driven by a shared ZoomSession.
-- Additive: one nullable FK column on external_webinars.

ALTER TABLE "external_webinars" ADD COLUMN IF NOT EXISTS "liveZoomSessionId" TEXT;

DO $$ BEGIN
    ALTER TABLE "external_webinars" ADD CONSTRAINT "external_webinars_liveZoomSessionId_fkey" FOREIGN KEY ("liveZoomSessionId") REFERENCES "zoom_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
