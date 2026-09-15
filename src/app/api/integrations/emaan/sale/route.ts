import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseEmaanSalePayload } from '@/lib/emaanSale'

/**
 * Emaan sale → WebinarSale.
 *
 * POST /api/integrations/emaan/sale
 *
 * Emaan treats joining one configured contact list as a sale, and pushes each
 * new member here so the funnel's sales reporting lives in one place. Its
 * worker retries, so this endpoint has to be safe to call repeatedly: the sale
 * is keyed on Emaan's `orderId`, derived over there from (list, contact), so a
 * retry updates the existing row rather than minting a second sale.
 *
 * Attribution is decided by Emaan, not here. Only Emaan holds every session a
 * buyer registered for, so only Emaan can pick the last-touch winner; we get
 * the answer as `externalWebinarId` and resolve it to our own registration.
 *
 * A sale we cannot attribute is still recorded, unlinked — it counts in total
 * revenue and shows on the sales dashboard under "not linked to registration".
 * Dropping it instead would quietly understate the take, and the sale really
 * did happen. The same applies when Emaan names a webinar we don't have: that
 * is a mapping problem to fix, not a reason to lose the money.
 *
 * Machine-to-machine, so it takes the shared secret in an Authorization header
 * rather than a NextAuth session — matching the cron routes.
 *
 * Payload parsing lives in lib/emaanSale so it can be tested without a DB.
 */

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const secret = process.env.EMAAN_SALES_SECRET
  if (!secret) {
    console.error('❌ EMAAN_SALES_SECRET not configured; refusing Emaan sale push')
    return NextResponse.json(
      { error: 'Integration not configured' },
      // 503, not 4xx: Emaan retries a 5xx and gives up on a 4xx, and a missing
      // env var is a deploy problem that will be fixed — the sales should land
      // once it is, not be permanently dropped.
      { status: 503 }
    )
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = parseEmaanSalePayload(raw)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }
  const sale = parsed.value

  try {
    let externalWebinarId: string | null = null
    let externalRegistrationId: string | null = null
    let warning: string | null = null

    if (sale.externalWebinarId) {
      const webinar = await prisma.externalWebinar.findUnique({
        where: { id: sale.externalWebinarId },
        select: { id: true },
      })

      if (webinar) {
        externalWebinarId = webinar.id
        // Most recent registration wins: someone who re-registered for a later
        // session bought off that one, not the session they first signed up to.
        const registration = await prisma.externalWebinarRegistration.findFirst({
          where: {
            externalWebinarId: webinar.id,
            email: { equals: sale.email, mode: 'insensitive' },
          },
          orderBy: { registeredAt: 'desc' },
          select: { id: true },
        })
        externalRegistrationId = registration?.id ?? null
        if (!registration) {
          warning = 'webinar matched but no registration for this email; sale left unlinked'
        }
      } else {
        warning = `unknown externalWebinarId "${sale.externalWebinarId}"; sale recorded without a webinar`
        console.warn('⚠️ Emaan sale named an unknown webinar:', sale.externalWebinarId, sale.email)
      }
    }

    const saleData = {
      externalWebinarId,
      externalRegistrationId,
      // Emaan only ever attributes to external webinars, but be explicit: a
      // sale must never end up hanging off both sides of the link.
      webinarId: null,
      registrationId: null,
      email: sale.email,
      amount: sale.amount,
      currency: sale.currency,
      productName: sale.productName,
      status: 'paid',
      purchasedAt: sale.purchasedAt,
      // WebinarSale.updatedAt defaults to now() but isn't @updatedAt, so an
      // update has to set it or the row keeps its original timestamp.
      updatedAt: new Date(),
      rawPayload: {
        source: sale.source,
        name: sale.name,
        requestedWebinarId: sale.externalWebinarId,
        receivedAt: new Date().toISOString(),
      },
    }

    const existing = await prisma.webinarSale.findUnique({
      where: { orderId: sale.orderId },
      select: { id: true },
    })

    const saved = existing
      ? await prisma.webinarSale.update({ where: { orderId: sale.orderId }, data: saleData })
      : await prisma.webinarSale.create({ data: { ...saleData, orderId: sale.orderId } })

    if (externalRegistrationId) {
      await prisma.externalWebinarRegistration
        .update({
          where: { id: externalRegistrationId },
          data: { hasPurchased: true },
        })
        .catch((error: unknown) => {
          // The sale is already stored; failing the whole push over the flag
          // would make Emaan retry a write that succeeded.
          console.error('Failed to set hasPurchased on registration', error)
        })
    }

    return NextResponse.json(
      {
        success: true,
        saleId: saved.id,
        updated: Boolean(existing),
        externalWebinarId,
        externalRegistrationId,
        ...(warning ? { warning } : {}),
      },
      { status: existing ? 200 : 201 }
    )
  } catch (error) {
    console.error('❌ Failed to record Emaan sale:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
