import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import WebinarFaqManagerClient from './page-client';

interface PageProps {
  params: { id: string };
}

export default async function WebinarFaqManagerPage({ params }: PageProps) {
  const webinar = await prisma.webinar.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      title: true,
      faqs: {
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          question: true,
          answer: true,
          sortOrder: true,
        },
      },
    },
  });

  if (!webinar) {
    notFound();
  }

  const faqs = webinar.faqs.map((faq) => ({
    id: faq.id,
    question: faq.question,
    answer: faq.answer,
    sortOrder: faq.sortOrder,
  }));

  return (
    <WebinarFaqManagerClient
      webinarId={webinar.id}
      webinarTitle={webinar.title}
      initialFaqs={faqs}
    />
  );
}
