import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import EmbedRegistrationForm from './EmbedRegistrationForm'

interface PageProps {
  params: {
    slug: string
  }
}

export default async function EmbedPage({ params }: PageProps) {
  const { slug } = params

  const webinar = await prisma.webinar.findUnique({
    where: { slug },
    include: {
      schedules: {
        where: { isActive: true },
        orderBy: { scheduledAt: 'asc' }
      },
      host: {
        select: {
          name: true,
          email: true
        }
      }
    }
  })

  if (!webinar) {
    notFound()
  }

  return <EmbedRegistrationForm webinar={webinar} />
}
