import { NextResponse } from 'next/server'
import { unsubscribeRegistration } from '@/lib/unsubscribe'

/**
 * RFC 8058 one-click unsubscribe.
 *
 * This URL goes in every email's `List-Unsubscribe` header alongside
 * `List-Unsubscribe-Post: List-Unsubscribe=One-Click`. Gmail/Yahoo POST to it
 * (form-encoded body `List-Unsubscribe=One-Click`, no cookies, no JS) when the
 * user clicks the "Unsubscribe" button in their mail client, and expect a 2xx
 * with no confirmation step — so the POST does the work and returns JSON.
 *
 * A human following the same URL in a browser gets a GET; send them to the
 * regular /unsubscribe page, which opts them out and shows a confirmation.
 */
export const dynamic = 'force-dynamic'

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const result = await unsubscribeRegistration(params.id)
  if (!result) {
    return NextResponse.json({ error: 'Unknown unsubscribe link' }, { status: 404 })
  }
  if (result.changed) {
    console.log(`📭 One-click unsubscribe: ${result.email} (${result.kind}, ${result.webinarTitle})`)
  }
  return NextResponse.json({ ok: true })
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const url = new URL(request.url)
  return NextResponse.redirect(new URL(`/unsubscribe?r=${encodeURIComponent(params.id)}`, url.origin), 302)
}
