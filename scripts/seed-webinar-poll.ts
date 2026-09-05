/**
 * Seed (or refresh) the poll shown on the external thank-you and countdown pages.
 *
 * Optional convenience — the same thing can be built by hand at /dashboard/surveys
 * (create the survey, add the questions, tick "Show as the poll on webinar pages").
 * This just saves typing the 15 options out. Either way it stays editable there, and
 * its answers land on the existing stats + CSV export pages.
 *
 * Re-runnable: the survey is upserted by slug and each question is matched by position,
 * so running it again updates wording without orphaning existing answers.
 *
 *   npx tsx -r dotenv/config scripts/seed-webinar-poll.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const SLUG = 'webinar-poll'

const QUESTIONS = [
  {
    section: 'Right Now',
    question: 'What worries you most about your child’s relationship with Islam right now?',
    options: [
      'Salah is becoming a struggle',
      'They seem less interested in Qur’an / Islamic learning',
      'Phones, friends or the outside world have too much influence',
      'I’m constantly reminding and it’s exhausting',
      'They’re still okay now, but I’m worried about the future',
    ],
  },
  {
    section: 'What You Do',
    question: 'When your child resists, what do you usually find yourself doing?',
    options: [
      'Reminding again and again',
      'Explaining / reasoning with them',
      'Becoming stricter',
      'Backing off because I don’t want to force',
      'A mixture of all of these 😅',
    ],
  },
  {
    section: 'What You Need',
    question: 'If this masterclass could help you with ONE thing today, what would you choose?',
    options: [
      'Help my child want Salah without constant reminders',
      'Help them care more about Islam from within',
      'Know when to push and when to step back',
      'Learn how to influence without damaging our relationship',
      'Feel more confident about how I’m raising them',
    ],
  },
]

async function main() {
  const survey = await prisma.survey.upsert({
    where: { slug: SLUG },
    update: { isActive: true, showOnWebinarPages: true },
    create: {
      slug: SLUG,
      title: 'Before the masterclass',
      description: '3 quick questions — your answers shape what we cover live.',
      thankYouTitle: 'JazakAllahu khayran',
      thankYouBody: 'Your answers help us shape the masterclass around what you actually need.',
      primaryColor: '#1a5c3a',
      isActive: true,
      showOnWebinarPages: true,
    },
  })

  for (const [position, q] of QUESTIONS.entries()) {
    const existing = await prisma.surveyQuestion.findFirst({
      where: { surveyId: survey.id, position },
    })
    const data = {
      section: q.section,
      question: q.question,
      type: 'single',
      options: JSON.stringify(q.options),
      maxSelect: 1,
      position,
      hidden: false,
    }
    if (existing) {
      await prisma.surveyQuestion.update({ where: { id: existing.id }, data })
      console.log(`updated Q${position + 1}: ${q.question}`)
    } else {
      await prisma.surveyQuestion.create({ data: { ...data, surveyId: survey.id } })
      console.log(`created Q${position + 1}: ${q.question}`)
    }
  }

  const extra = await prisma.surveyQuestion.count({
    where: { surveyId: survey.id, position: { gte: QUESTIONS.length } },
  })
  if (extra > 0) {
    console.log(`note: ${extra} extra question(s) beyond this script are left untouched`)
  }

  console.log(`\nPoll ready — survey ${survey.id} (/dashboard/surveys/${survey.id})`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
