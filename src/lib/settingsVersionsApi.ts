import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  WebinarScope,
  listSettingsVersions,
  restoreSettingsVersion,
} from '@/lib/webinarSettingsVersions'

/**
 * Shared request handlers behind /api/webinars/[id]/settings-versions and
 * /api/external-webinars/[id]/settings-versions. Both webinar kinds share one
 * history format, so they share one implementation and the UI can talk to
 * either with the same code.
 */

/**
 * The history table is created by `prisma db push`, which this project runs
 * separately from the code deploy. If a deploy lands first, say so plainly
 * instead of failing the settings screen — an unexplained error here has cost
 * real debugging time before (schema drift reads as a mysterious empty state).
 */
function isMissingTable(error: any): boolean {
  return error?.code === 'P2021' || error?.code === 'P2022'
}

export async function handleListSettingsVersions(scope: WebinarScope, id: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const versions = await listSettingsVersions(scope, id)
    return NextResponse.json({ versions })
  } catch (error: any) {
    if (isMissingTable(error)) {
      return NextResponse.json({
        versions: [],
        unavailable: true,
        message:
          'Settings history is not set up on this database yet. Run `npx prisma db push` to create the webinar_settings_versions table.',
      })
    }
    console.error('Failed to list webinar settings versions:', error)
    return NextResponse.json({ error: 'Failed to load settings history' }, { status: 500 })
  }
}

export async function handleRestoreSettingsVersion(
  scope: WebinarScope,
  id: string,
  request: Request
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const versionId = typeof body?.versionId === 'string' ? body.versionId.trim() : ''
    if (!versionId) {
      return NextResponse.json({ error: 'versionId is required' }, { status: 400 })
    }

    const settings = await restoreSettingsVersion({
      scope,
      id,
      versionId,
      comment: body?.comment,
      author: {
        id: (session.user as any)?.id || null,
        email: session.user?.email || null,
      },
    })

    return NextResponse.json({ success: true, settings })
  } catch (error: any) {
    if (error?.message === 'Version not found for this webinar') {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    // A restored slug can collide with one another webinar has taken since.
    if (error?.code === 'P2002') {
      const fields = Array.isArray(error?.meta?.target) ? error.meta.target.join(', ') : 'a field'
      return NextResponse.json(
        { error: `Cannot restore: ${fields} is already used by another webinar. Change it there first.` },
        { status: 409 }
      )
    }
    if (isMissingTable(error)) {
      return NextResponse.json(
        { error: 'Settings history is not set up on this database yet. Run `npx prisma db push`.' },
        { status: 503 }
      )
    }
    console.error('Failed to restore webinar settings version:', error)
    return NextResponse.json({ error: 'Failed to restore settings version' }, { status: 500 })
  }
}
