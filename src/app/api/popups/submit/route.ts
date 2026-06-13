import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders })
}

const TRUTHY_CHECKBOX_VALUES = new Set([true, 'true', 'on', 'yes', 'checked', 1, '1'] as any[])

// POST the captured lead to the popup's configured webhook URL.
// Field values are keyed by field label; checkbox fields are always sent as true/false.
async function sendLeadWebhook(popup: { id: string; name: string; slug: string; webhookUrl: string | null; fields: unknown }, lead: { id: string; data: unknown; pageUrl: string | null; createdAt: Date }) {
  if (!popup.webhookUrl) return

  const fields = Array.isArray(popup.fields) ? (popup.fields as any[]) : []
  const data = (lead.data || {}) as Record<string, any>

  const payloadFields: Record<string, any> = {}
  const mappedIds = new Set<string>()
  for (const field of fields) {
    const key = field.label || field.id
    mappedIds.add(field.id)
    if (field.type === 'checkbox') {
      payloadFields[key] = TRUTHY_CHECKBOX_VALUES.has(data[field.id])
    } else if (data[field.id] !== undefined) {
      payloadFields[key] = data[field.id]
    }
  }
  // Pass through any submitted keys not in the field config (e.g. from custom HTML)
  for (const [key, value] of Object.entries(data)) {
    if (!mappedIds.has(key)) payloadFields[key] = value
  }

  const res = await fetch(popup.webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'popup.lead.created',
      leadId: lead.id,
      popupId: popup.id,
      popupName: popup.name,
      popupSlug: popup.slug,
      pageUrl: lead.pageUrl,
      submittedAt: lead.createdAt,
      fields: payloadFields,
    }),
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) {
    throw new Error(`Webhook responded with status ${res.status}`)
  }
}

// POST /api/popups/submit - Public endpoint for popup form submissions
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { popupSlug, data } = body

    if (!popupSlug || !data || typeof data !== 'object') {
      return NextResponse.json({ error: 'popupSlug and data are required' }, { status: 400, headers: corsHeaders })
    }

    const popup = await prisma.popup.findUnique({
      where: { slug: popupSlug },
    })

    if (!popup || !popup.isActive) {
      return NextResponse.json({ error: 'Popup not found or inactive' }, { status: 404, headers: corsHeaders })
    }

    // Validate required fields
    const fields = popup.fields as any[]
    for (const field of fields) {
      if (field.required && (!data[field.id] || String(data[field.id]).trim() === '')) {
        return NextResponse.json(
          { error: `${field.label} is required` },
          { status: 400, headers: corsHeaders }
        )
      }
    }

    const headers = request.headers
    const lead = await prisma.popupLead.create({
      data: {
        popupId: popup.id,
        data,
        ip: headers.get('x-forwarded-for') || headers.get('x-real-ip') || null,
        userAgent: headers.get('user-agent') || null,
        referrer: headers.get('referer') || null,
        pageUrl: body.pageUrl || null,
      },
    })

    if (popup.webhookUrl) {
      try {
        await sendLeadWebhook(popup, lead)
      } catch (err) {
        // Never fail the lead capture because the webhook is down
        console.error(`Popup webhook delivery failed for popup ${popup.id}:`, err)
      }
    }

    return NextResponse.json({
      success: true,
      leadId: lead.id,
      redirectUrl: popup.redirectUrl || null,
      successMessage: popup.successMessage,
    }, { headers: corsHeaders })
  } catch (error) {
    console.error('Popup submit error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders })
  }
}
