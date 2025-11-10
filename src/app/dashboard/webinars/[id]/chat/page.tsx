import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ChatManagerClient from './page-client';

interface PageProps {
  params: { id: string };
}

export default async function ChatManagerPage({ params }: PageProps) {
  const webinar = await prisma.webinar.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      title: true,
      chatMessages: {
        orderBy: [
          { videoTimestamp: 'asc' },
          { createdAt: 'asc' },
        ],
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!webinar) {
    notFound();
  }

  const messages = webinar.chatMessages.map((msg) => ({
    id: msg.id,
    message: msg.message,
    videoTimestamp: msg.videoTimestamp,
    isScripted: msg.isScripted,
    isApproved: msg.isApproved || false,
    isHidden: msg.isHidden || false,
    createdAt: msg.createdAt.toISOString(),
    user: {
      name: msg.user.name,
      email: msg.user.email,
    },
  }));

  return (
    <ChatManagerClient
      webinarId={webinar.id}
      webinarTitle={webinar.title}
      initialMessages={messages}
    />
  );
}
