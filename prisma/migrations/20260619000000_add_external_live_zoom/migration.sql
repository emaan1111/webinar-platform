-- Combined seamless picker for external (EverWebinar/WebinarJam) webinars:
-- mix one real LIVE Zoom session with a just-in-time option and recurring evergreen times.

-- Master toggle: when true the schedules API builds a combined, sorted, local-time list
-- from all enabled sources. When false, behaviour is unchanged (legacy either/or).
ALTER TABLE "external_webinars" ADD COLUMN IF NOT EXISTS "combineScheduleSources" BOOLEAN NOT NULL DEFAULT false;

-- One real live Zoom session, shown indistinguishably among the evergreen options.
ALTER TABLE "external_webinars" ADD COLUMN IF NOT EXISTS "liveZoomEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "external_webinars" ADD COLUMN IF NOT EXISTS "liveZoomLink" TEXT;
ALTER TABLE "external_webinars" ADD COLUMN IF NOT EXISTS "liveZoomAt" TIMESTAMP(3);
ALTER TABLE "external_webinars" ADD COLUMN IF NOT EXISTS "liveZoomTimezone" TEXT;

-- A single "starting soon" just-in-time option (registers into EverWebinar's JIT session).
ALTER TABLE "external_webinars" ADD COLUMN IF NOT EXISTS "showJustInTime" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "external_webinars" ADD COLUMN IF NOT EXISTS "jitLeadMinutes" INTEGER NOT NULL DEFAULT 15;

-- How many upcoming recurring EverWebinar sessions (e.g. daily 11 AM) to show. NULL = all upcoming.
ALTER TABLE "external_webinars" ADD COLUMN IF NOT EXISTS "recurringSlotsToShow" INTEGER;

COMMENT ON COLUMN "external_webinars"."combineScheduleSources" IS 'When true, schedules API merges live Zoom + JIT + recurring into one seamless list';
COMMENT ON COLUMN "external_webinars"."liveZoomEnabled" IS 'Show one real live Zoom session mixed into the picker';
COMMENT ON COLUMN "external_webinars"."liveZoomLink" IS 'Zoom join URL the registrant is sent to for the live session';
COMMENT ON COLUMN "external_webinars"."liveZoomAt" IS 'Start time of the live Zoom session (UTC)';
COMMENT ON COLUMN "external_webinars"."showJustInTime" IS 'Show a single starting-soon just-in-time option';
COMMENT ON COLUMN "external_webinars"."jitLeadMinutes" IS 'Minutes from now the JIT option starts';
COMMENT ON COLUMN "external_webinars"."recurringSlotsToShow" IS 'How many upcoming recurring EverWebinar sessions to show; NULL = all';
