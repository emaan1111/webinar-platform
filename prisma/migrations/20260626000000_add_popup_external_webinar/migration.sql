-- Link a popup to an external (EverWebinar) webinar so it can be a webinar registration popup.
ALTER TABLE "popups" ADD COLUMN IF NOT EXISTS "externalWebinarId" TEXT;
