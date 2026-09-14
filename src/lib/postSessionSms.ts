/**
 * Post-session SMS gate for external webinars.
 *
 * Decides whether a registrant is due their after-the-session SMS. Kept free
 * of Prisma/network so the rules are unit-testable; webinarjamSync calls this
 * once per synced registrant.
 */

export interface PostSessionSmsGate {
  /** ExternalWebinar.autoSendPostSessionSMS */
  autoSend: boolean
  /** Registrant already got this SMS (ExternalWebinarRegistration.postSessionSmsSent) */
  alreadySent: boolean
  /** Attended live OR replay — never SMS a no-show */
  attended: boolean
  /** When their session ended; null = unknown, never send */
  sessionEndTime: Date | null
  /** ExternalWebinar.postSessionSMSMinutesAfter — wait this long past session end */
  minutesAfter?: number | null
  /** Live + replay minutes from WebinarJam */
  watchTimeMinutes: number
  /** ExternalWebinar.postSessionSMSMinWatchedMinutes — null/0 = any attendance counts */
  minWatchedMinutes?: number | null
  now?: Date
}

/**
 * A registrant below the watch threshold is NOT a terminal skip: the sync must
 * leave postSessionSmsSent false so a later run can fire once replay minutes
 * push them past the threshold.
 */
export function shouldSendPostSessionSms(gate: PostSessionSmsGate): boolean {
  if (!gate.autoSend || gate.alreadySent || !gate.attended) return false
  if (!gate.sessionEndTime) return false

  const now = gate.now ?? new Date()
  const dueAt = gate.sessionEndTime.getTime() + (gate.minutesAfter ?? 0) * 60 * 1000
  if (now.getTime() <= dueAt) return false

  if (gate.minWatchedMinutes && gate.watchTimeMinutes < gate.minWatchedMinutes) return false

  return true
}
