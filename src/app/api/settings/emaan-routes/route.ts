import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  readEmaanRoutes,
  writeEmaanRoutes,
  EmaanGlobalRoute,
  EmaanScope,
  EmaanAppliesTo,
} from '@/lib/emaanSettings'

/**
 * Global Emaan routing rules.
 *
 * GET  /api/settings/emaan-routes  → { routes: [...] }
 * PUT  /api/settings/emaan-routes  → replace the whole list ({ routes: [...] })
 *
 * The UI holds the full array and saves it wholesale (like branding settings).
 */

const SCOPES: EmaanScope[] = ['ALL', 'ZOOM_ONLY']
const APPLIES_TO: EmaanAppliesTo[] = ['ALL', 'INTERNAL', 'EXTERNAL']

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false
  try {
    const u = new URL(value)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

/** Validate + normalize an incoming route; throws on bad input. */
function sanitizeRoute(raw: any): EmaanGlobalRoute {
  if (!raw || typeof raw !== 'object') throw new Error('invalid route object')

  const webhookUrl = String(raw.webhookUrl ?? '').trim()
  if (!isHttpUrl(webhookUrl)) {
    throw new Error('needs a valid http(s) webhook URL')
  }

  // Reject unknown scope/appliesTo rather than silently broadening the route
  // (e.g. a garbage scope must not turn a Zoom-only route into all-sessions).
  if (raw.scope !== undefined && !SCOPES.includes(raw.scope)) {
    throw new Error(`invalid scope "${raw.scope}"`)
  }
  if (raw.appliesTo !== undefined && !APPLIES_TO.includes(raw.appliesTo)) {
    throw new Error(`invalid "applies to" value "${raw.appliesTo}"`)
  }

  // A blank or UI-minted temporary id ("new-…") gets a real UUID.
  const hasRealId =
    typeof raw.id === 'string' && raw.id.trim() !== '' && !raw.id.startsWith('new-')

  return {
    id: hasRealId ? raw.id : randomUUID(),
    label: String(raw.label ?? '').trim().slice(0, 120),
    webhookUrl,
    scope: (raw.scope as EmaanScope) ?? 'ALL',
    appliesTo: (raw.appliesTo as EmaanAppliesTo) ?? 'ALL',
    isActive: raw.isActive !== false, // default true
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const routes = await readEmaanRoutes()
    return NextResponse.json({ routes })
  } catch (error) {
    console.error('Failed to load Emaan routes:', error)
    return NextResponse.json({ error: 'Unable to load Emaan routes' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const incoming = Array.isArray(body?.routes) ? body.routes : []

    let routes: EmaanGlobalRoute[]
    try {
      routes = incoming.map((raw: any, i: number) => {
        try {
          return sanitizeRoute(raw)
        } catch (e) {
          // Name the offending row so the user knows which one to fix.
          throw new Error(`Route ${i + 1}: ${e instanceof Error ? e.message : 'invalid'}`)
        }
      })
    } catch (validationErr) {
      return NextResponse.json(
        { error: validationErr instanceof Error ? validationErr.message : 'Invalid route data' },
        { status: 400 }
      )
    }

    await writeEmaanRoutes(routes)
    return NextResponse.json({ routes })
  } catch (error) {
    console.error('Failed to save Emaan routes:', error)
    return NextResponse.json({ error: 'Unable to save Emaan routes' }, { status: 500 })
  }
}
