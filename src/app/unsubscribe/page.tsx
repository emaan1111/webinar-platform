import Link from 'next/link'
import { unsubscribeRegistration } from '@/lib/unsubscribe'

export const dynamic = 'force-dynamic'

function Card({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-20">
      <div className="mx-auto max-w-xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">{children}</div>
    </main>
  )
}

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ r?: string }>
}) {
  const { r } = await searchParams

  if (!r) {
    return (
      <Card>
        <h1 className="text-2xl font-bold text-gray-900">Invalid unsubscribe link</h1>
        <p className="mt-3 text-sm text-gray-600">This unsubscribe link is missing the attendee reference.</p>
      </Card>
    )
  }

  // Handles both internal and external (WebinarJam/EverWebinar) registrations —
  // external registrants previously landed on "Link not recognized".
  const result = await unsubscribeRegistration(r)

  if (!result) {
    return (
      <Card>
        <h1 className="text-2xl font-bold text-gray-900">Link not recognized</h1>
        <p className="mt-3 text-sm text-gray-600">We couldn&apos;t find the webinar registration tied to this unsubscribe link.</p>
      </Card>
    )
  }

  return (
    <Card>
      <div className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
        Unsubscribed
      </div>
      <h1 className="mt-4 text-3xl font-bold text-gray-900">You&apos;re unsubscribed</h1>
      <p className="mt-3 text-sm leading-6 text-gray-600">
        {result.name || result.email}, you will no longer receive webinar reminder and follow-up emails for{' '}
        <strong>{result.webinarTitle}</strong>.
      </p>
      <p className="mt-3 text-sm leading-6 text-gray-600">
        Transactional messages required to complete your registration may still be delivered.
      </p>
      {result.unsubscribedAt && (
        <p className="mt-3 text-xs text-gray-500">
          Unsubscribed on {result.unsubscribedAt.toLocaleString()}
        </p>
      )}
      {result.webinarSlug && (
        <div className="mt-6">
          <Link
            href={`/w/${result.webinarSlug}`}
            className="inline-flex items-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Back to webinar page
          </Link>
        </div>
      )}
    </Card>
  )
}
