import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ r?: string }>
}) {
  const { r } = await searchParams

  if (!r) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-20">
        <div className="mx-auto max-w-xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">Invalid unsubscribe link</h1>
          <p className="mt-3 text-sm text-gray-600">This unsubscribe link is missing the attendee reference.</p>
        </div>
      </main>
    )
  }

  const registration = await prisma.registration.findUnique({
    where: { id: r },
    select: {
      id: true,
      name: true,
      email: true,
      emailUnsubscribed: true,
      emailUnsubscribedAt: true,
      webinar: {
        select: {
          title: true,
          slug: true,
        },
      },
    },
  })

  if (!registration) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-20">
        <div className="mx-auto max-w-xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">Link not recognized</h1>
          <p className="mt-3 text-sm text-gray-600">We couldn&apos;t find the webinar registration tied to this unsubscribe link.</p>
        </div>
      </main>
    )
  }

  if (!registration.emailUnsubscribed) {
    await prisma.registration.update({
      where: { id: registration.id },
      data: {
        emailUnsubscribed: true,
        emailUnsubscribedAt: new Date(),
      },
    })
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-20">
      <div className="mx-auto max-w-xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
          Unsubscribed
        </div>
        <h1 className="mt-4 text-3xl font-bold text-gray-900">You&apos;re unsubscribed</h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          {registration.name || registration.email}, you will no longer receive webinar reminder and follow-up emails for{' '}
          <strong>{registration.webinar.title}</strong>.
        </p>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          Transactional messages required to complete your registration may still be delivered.
        </p>
        {registration.emailUnsubscribedAt && (
          <p className="mt-3 text-xs text-gray-500">
            Unsubscribed on {registration.emailUnsubscribedAt.toLocaleString()}
          </p>
        )}
        {registration.webinar.slug && (
          <div className="mt-6">
            <Link
              href={`/w/${registration.webinar.slug}`}
              className="inline-flex items-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Back to webinar page
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}