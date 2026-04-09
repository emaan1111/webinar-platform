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
