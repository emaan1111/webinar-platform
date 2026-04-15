import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import SurveyClient from './SurveyClient'

export default async function SurveyPage({ params }: { params: { slug: string } }) {
  const survey = await prisma.survey.findUnique({
    where: { slug: params.slug },
    include: {
      questions: { orderBy: { position: 'asc' } },
    },
  })

  if (!survey || !survey.isActive) notFound()

  const questions = survey.questions.map((q) => ({
    id: q.id,
    section: q.section,
    question: q.question,
    type: q.type as 'single' | 'multi',
    options: JSON.parse(q.options) as string[],
    max: q.maxSelect,
  }))

  return (
    <SurveyClient
      surveyId={survey.id}
      title={survey.title}
      description={survey.description}
      thankYouTitle={survey.thankYouTitle}
      thankYouBody={survey.thankYouBody}
      primaryColor={survey.primaryColor}
      giftTitle={survey.giftTitle}
      giftUrl={survey.giftUrl}
      questions={questions}
    />
  )
}
