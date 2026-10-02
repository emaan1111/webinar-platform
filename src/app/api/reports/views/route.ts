import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { readStoredViews, updateStoredViews } from '@/lib/reports/savedViewsStore'
import { ViewsActionError } from '@/lib/reports/state'

export const dynamic = 'force-dynamic'

/**
 * The signed-in user's saved report views and starred default view.
 *
 * GET  /api/reports/views → { views, defaultViewId }
 * POST /api/reports/views → apply one change, respond with the new { views, defaultViewId }
 *   { action: 'save', view }            create, or update columns + filters
 *   { action: 'rename', id, name }
 *   { action: 'delete', id }
 *   { action: 'setDefault', id }
 *   { action: 'import', views, defaultViewId }   views from the browser's old localStorage
 */

async function currentUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions)
  return session?.user?.id || null
}

export async function GET() {
  const userId = await currentUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    return NextResponse.json(await readStoredViews(userId))
  } catch (error) {
    console.error('Failed to load saved report views:', error)
    return NextResponse.json({ error: 'Unable to load saved views' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const userId = await currentUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let action: unknown
  try {
    action = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body must be JSON' }, { status: 400 })
  }

  try {
    return NextResponse.json(await updateStoredViews(userId, action))
  } catch (error) {
    if (error instanceof ViewsActionError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('Failed to save report views:', error)
    return NextResponse.json({ error: 'Unable to save views' }, { status: 500 })
  }
}
