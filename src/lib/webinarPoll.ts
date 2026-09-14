import { prisma } from '@/lib/prisma'

/**
 * The poll shown on the external thank-you and countdown pages.
 *
 * It reuses the Survey models so the questions stay editable in /dashboard/surveys
 * and the answers land on the existing stats + CSV export pages — no bespoke storage.
 *
 * A survey opts in with the "Show on webinar pages" toggle in its Settings tab; it also
 * has to be Active. If several are toggled on, the most recently updated one wins, so
 * flipping the switch on a new poll swaps it over without needing to find the old one.
 */

/** Placeholder templates can use to place the poll exactly; otherwise it renders below. */
export const POLL_MOUNT_ID = 'webinar-poll-mount'

/** Swap a `{{poll}}` token in template HTML for the node the poll portals into. */
export function replacePollPlaceholder(html: string) {
  return html.replace(/\{\{\s*poll\s*\}\}/g, `<div id="${POLL_MOUNT_ID}"></div>`)
}

export interface WebinarPollQuestion {
  id: string
  question: string
  type: 'single' | 'multi'
  options: string[]
  max: number
}

export interface WebinarPollData {
  surveyId: string
  title: string
  description: string | null
  thankYouTitle: string
  thankYouBody: string | null
  primaryColor: string
  questions: WebinarPollQuestion[]
}

export async function getWebinarPoll(): Promise<WebinarPollData | null> {
  const survey = await prisma.survey.findFirst({
    where: { isActive: true, showOnWebinarPages: true },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      description: true,
      thankYouTitle: true,
      thankYouBody: true,
      primaryColor: true,
      questions: {
        where: { hidden: false },
        orderBy: { position: 'asc' },
        select: { id: true, question: true, type: true, options: true, maxSelect: true },
      },
    },
  })
  if (!survey) return null

  const questions: WebinarPollQuestion[] = survey.questions.map((q): WebinarPollQuestion => {
    let options: string[] = []
    try {
      const parsed = JSON.parse(q.options)
      if (Array.isArray(parsed)) options = parsed.map(String)
    } catch {
      // A malformed options blob just means that question has nothing to show.
    }
    return {
      id: q.id,
      question: q.question,
      type: q.type === 'multi' ? 'multi' : 'single',
      options,
      max: q.maxSelect || 1,
    }
  }).filter((q) => q.options.length > 0)

  if (questions.length === 0) return null

  return {
    surveyId: survey.id,
    title: survey.title,
    description: survey.description,
    thankYouTitle: survey.thankYouTitle,
    thankYouBody: survey.thankYouBody,
    primaryColor: survey.primaryColor,
    questions,
  }
}
