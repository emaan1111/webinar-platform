import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * Resolves the current session and returns null if the user is allowed,
 * or a NextResponse with the right status if not. Use:
 *
 *   const denied = await requireAdmin()
 *   if (denied) return denied
 *
 * Allowed: ADMIN, HOST. Denied: unauthenticated, ATTENDEE, anything else.
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const role = (session.user as any).role
  if (role !== 'ADMIN' && role !== 'HOST') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}
