import { prisma } from '@/lib/prisma'
import {
  EXTERNAL_SETTINGS_FIELDS,
  INTERNAL_SETTINGS_FIELDS,
  SCHEDULE_FIELDS,
  SettingsSnapshot,
  VersionAuthor,
  WebinarScope,
  diffSettings,
  pickSettings,
  toWritableValue,
} from '@/lib/webinarSettingsFields'

/**
 * Version control for webinar settings — the database side.
 *
 * Every save on a webinar settings screen — internal or external — stores a full
 * snapshot of the settings as they ended up, together with the host's comment
 * about why. Restoring a version writes that snapshot straight back, so there is
 * no diff replay to get wrong.
 *
 * Two rules make the history trustworthy:
 *  - A save that changed nothing records nothing (no empty rows to scroll past).
 *  - Before recording a change, if the live settings don't match the newest
 *    snapshot, the live state is captured first as a "checkpoint". That covers
 *    both the very first save on an existing webinar (which would otherwise have
 *    nothing to roll back to) and any change made outside these screens.
 */

export * from '@/lib/webinarSettingsFields'

/** Read the current settings of an internal webinar, schedules included. */
export async function snapshotInternalSettings(webinarId: string): Promise<SettingsSnapshot | null> {
  const webinar = await prisma.webinar.findUnique({
    where: { id: webinarId },
    include: {
      schedules: {
        orderBy: [{ scheduleType: 'asc' }, { scheduledAt: 'asc' }, { id: 'asc' }],
      },
    },
  })
  if (!webinar) return null

  const snapshot = pickSettings(webinar as any, INTERNAL_SETTINGS_FIELDS)
  snapshot.schedules = (webinar as any).schedules.map((schedule: any) =>
    pickSettings(schedule, SCHEDULE_FIELDS)
  )
  return snapshot
}

/** Read the current settings of an external webinar, linked Zoom sessions included. */
export async function snapshotExternalSettings(externalWebinarId: string): Promise<SettingsSnapshot | null> {
  const webinar = await prisma.externalWebinar.findUnique({
    where: { id: externalWebinarId },
    include: {
      zoomSessionLinks: { select: { zoomSessionId: true } },
    },
  })
  if (!webinar) return null

  const snapshot = pickSettings(webinar as any, EXTERNAL_SETTINGS_FIELDS)
  snapshot.zoomSessionIds = (webinar as any).zoomSessionLinks
    .map((link: any) => link.zoomSessionId)
    .sort()
  return snapshot
}

export function snapshotSettings(scope: WebinarScope, id: string) {
  return scope === 'internal' ? snapshotInternalSettings(id) : snapshotExternalSettings(id)
}

function writableFields(snapshot: SettingsSnapshot, fields: readonly string[]) {
  const data: Record<string, unknown> = {}
  for (const field of fields) {
    if (!(field in snapshot)) continue
    data[field] = toWritableValue(field, snapshot[field])
  }
  return data
}

/**
 * Overwrite a webinar's live settings with a snapshot. Schedules and Zoom links
 * are replaced wholesale in the same transaction as the field write, matching
 * how a normal save treats them — a half-applied restore would be worse than no
 * restore at all.
 */
export async function applySettingsSnapshot(
  scope: WebinarScope,
  id: string,
  snapshot: SettingsSnapshot
): Promise<void> {
  if (scope === 'internal') {
    const data = writableFields(snapshot, INTERNAL_SETTINGS_FIELDS)
    const schedules = Array.isArray(snapshot.schedules) ? (snapshot.schedules as any[]) : null

    await prisma.$transaction(async (tx) => {
      await tx.webinar.update({ where: { id }, data: data as any })

      if (schedules) {
        await tx.webinarSchedule.deleteMany({ where: { webinarId: id } })
        if (schedules.length > 0) {
          await tx.webinarSchedule.createMany({
            data: schedules.map((schedule) => ({
              webinarId: id,
              scheduleType: schedule.scheduleType,
              scheduledAt: toWritableValue('scheduledAt', schedule.scheduledAt) as Date | null,
              timezone: schedule.timezone ?? null,
              useUserTimezone: !!schedule.useUserTimezone,
              minutesFromReg: schedule.minutesFromReg ?? null,
              recurringPattern: schedule.recurringPattern ?? null,
              isZoomSession: !!schedule.isZoomSession,
              zoomLink: schedule.zoomLink ?? null,
              isActive: schedule.isActive ?? true,
            })),
          })
        }
      }
    })
    return
  }

  const data = writableFields(snapshot, EXTERNAL_SETTINGS_FIELDS)
  const requested = Array.isArray(snapshot.zoomSessionIds)
    ? (snapshot.zoomSessionIds as string[]).filter((v) => typeof v === 'string' && v)
    : null

  // Zoom sessions deleted since the snapshot was taken can't be re-linked; drop
  // them rather than failing the whole restore on a foreign key.
  let validSessionIds: string[] | null = null
  if (requested) {
    const found = await prisma.zoomSession.findMany({
      where: { id: { in: requested } },
      select: { id: true },
    })
    validSessionIds = found.map((s) => s.id)
    if (data.liveZoomSessionId && !validSessionIds.includes(data.liveZoomSessionId as string)) {
      data.liveZoomSessionId = null
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.externalWebinar.update({
      where: { id },
      data: { ...(data as any), updatedAt: new Date() },
    })

    if (validSessionIds) {
      await tx.zoomSessionWebinar.deleteMany({
        where: { externalWebinarId: id, zoomSessionId: { notIn: validSessionIds } },
      })
      if (validSessionIds.length > 0) {
        await tx.zoomSessionWebinar.createMany({
          data: validSessionIds.map((zoomSessionId) => ({
            zoomSessionId,
            externalWebinarId: id,
            webinarType: 'external',
          })),
          skipDuplicates: true,
        })
      }
    }
  })
}

function scopeWhere(scope: WebinarScope, id: string) {
  return scope === 'internal' ? { webinarId: id } : { externalWebinarId: id }
}

/** Newest recorded version for a webinar, or null when history is empty. */
async function latestVersion(scope: WebinarScope, id: string) {
  return prisma.webinarSettingsVersion.findFirst({
    where: scopeWhere(scope, id),
    orderBy: { createdAt: 'desc' },
    select: { id: true, settings: true },
  })
}

export interface RecordVersionInput {
  scope: WebinarScope
  id: string
  /** Settings as they were before the change. */
  before: SettingsSnapshot | null
  /** Settings as they are now. */
  after: SettingsSnapshot | null
  comment?: string | null
  source?: 'manual' | 'restore' | 'checkpoint'
  author?: VersionAuthor
}

/**
 * Record a settings change. Returns the created version, or null when nothing
 * actually changed (a save that only re-submitted the same values leaves no
 * trace, which keeps the history readable).
 */
export async function recordSettingsVersion({
  scope,
  id,
  before,
  after,
  comment,
  source = 'manual',
  author,
}: RecordVersionInput) {
  if (!after) return null

  const changedFields = before ? diffSettings(before, after) : Object.keys(after)
  if (before && changedFields.length === 0) return null

  const baseData = {
    webinarType: scope,
    webinarId: scope === 'internal' ? id : null,
    externalWebinarId: scope === 'external' ? id : null,
    createdById: author?.id || null,
    createdByEmail: author?.email || null,
  }

  // If the live settings had drifted away from the newest snapshot — the first
  // save on a webinar that predates this feature, or a change made through some
  // other code path — capture where things stood first, so this change has
  // something to be rolled back to.
  if (before) {
    const latest = await latestVersion(scope, id)
    const drifted = !latest || diffSettings((latest.settings as SettingsSnapshot) || {}, before).length > 0
    if (drifted) {
      await prisma.webinarSettingsVersion.create({
        data: {
          ...baseData,
          source: 'checkpoint',
          comment: latest
            ? 'Settings as they stood before this change (changed outside the settings screen)'
            : 'Settings as they stood before version history started',
          changedFields: [],
          settings: before as any,
        },
      })
    }
  }

  return prisma.webinarSettingsVersion.create({
    data: {
      ...baseData,
      source,
      comment: typeof comment === 'string' && comment.trim() ? comment.trim() : null,
      changedFields,
      settings: after as any,
    },
  })
}

/**
 * Record a change without letting a versioning failure break the save that
 * triggered it. Settings history is a nice-to-have; losing a host's actual
 * settings change because the history table is missing or slow is not
 * acceptable, so every failure here is logged and swallowed.
 */
export async function tryRecordSettingsVersion(input: RecordVersionInput) {
  try {
    return await recordSettingsVersion(input)
  } catch (error) {
    console.error('⚠️ Failed to record webinar settings version:', error)
    return null
  }
}

/**
 * Roll a webinar's settings back to a saved version. The current state is
 * captured first (via the same checkpoint rule as a normal save), so a restore
 * is itself undoable.
 */
export async function restoreSettingsVersion({
  scope,
  id,
  versionId,
  comment,
  author,
}: {
  scope: WebinarScope
  id: string
  versionId: string
  comment?: string | null
  author?: VersionAuthor
}) {
  const version = await prisma.webinarSettingsVersion.findUnique({ where: { id: versionId } })

  const belongsToWebinar =
    version &&
    (scope === 'internal' ? version.webinarId === id : version.externalWebinarId === id)

  if (!belongsToWebinar) {
    throw new Error('Version not found for this webinar')
  }

  const before = await snapshotSettings(scope, id)
  if (!before) throw new Error('Webinar not found')

  const target = (version!.settings as SettingsSnapshot) || {}
  await applySettingsSnapshot(scope, id, target)

  const after = await snapshotSettings(scope, id)

  // Rolling the schedule list back moves the session times, so the queued
  // reminder emails have to be re-timed against them — the same follow-up a
  // normal save does when its schedules change.
  if (scope === 'internal' && diffSettings(before, after || {}).includes('schedules')) {
    try {
      const { rescheduleReminderEmails } = await import('@/lib/emailScheduler')
      rescheduleReminderEmails(id).catch((err: any) =>
        console.error('\u26a0\ufe0f Failed to reschedule reminder emails after restore:', err)
      )
    } catch (err) {
      console.error('\u26a0\ufe0f Failed to import emailScheduler after restore:', err)
    }
  }

  await recordSettingsVersion({
    scope,
    id,
    before,
    after,
    source: 'restore',
    comment:
      typeof comment === 'string' && comment.trim()
        ? comment.trim()
        : `Restored the version saved ${new Date(version!.createdAt).toISOString()}`,
    author,
  })

  return after
}

/** History for a webinar, newest first. */
export async function listSettingsVersions(scope: WebinarScope, id: string, take = 50) {
  return prisma.webinarSettingsVersion.findMany({
    where: scopeWhere(scope, id),
    orderBy: { createdAt: 'desc' },
    take,
    select: {
      id: true,
      comment: true,
      source: true,
      changedFields: true,
      settings: true,
      createdByEmail: true,
      createdAt: true,
    },
  })
}
