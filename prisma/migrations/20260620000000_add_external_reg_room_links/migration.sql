-- Capture the join links at registration so the external countdown page can auto-enter the room.
ALTER TABLE "external_webinar_registrations" ADD COLUMN IF NOT EXISTS "liveRoomUrl" TEXT;
ALTER TABLE "external_webinar_registrations" ADD COLUMN IF NOT EXISTS "replayRoomUrl" TEXT;

COMMENT ON COLUMN "external_webinar_registrations"."liveRoomUrl" IS 'EverWebinar live room (or Zoom link) captured at registration';
