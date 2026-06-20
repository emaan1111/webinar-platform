-- Make the seamless combined picker the default for external webinars (new + existing).

-- New external webinars default to the combined picker with a starting-soon option.
ALTER TABLE "external_webinars" ALTER COLUMN "combineScheduleSources" SET DEFAULT true;
ALTER TABLE "external_webinars" ALTER COLUMN "showJustInTime" SET DEFAULT true;
ALTER TABLE "external_webinars" ALTER COLUMN "recurringSlotsToShow" SET DEFAULT 2;

-- Backfill existing external webinars to the same setup. The WHERE clauses only touch rows
-- still on the old defaults, so webinars already configured (e.g. their Zoom/recurring counts)
-- are left untouched. Live Zoom is NOT enabled here — that's set per-webinar with a link.
UPDATE "external_webinars" SET "combineScheduleSources" = true WHERE "combineScheduleSources" = false;
UPDATE "external_webinars" SET "showJustInTime" = true WHERE "showJustInTime" = false;
UPDATE "external_webinars" SET "recurringSlotsToShow" = 2 WHERE "recurringSlotsToShow" IS NULL;
