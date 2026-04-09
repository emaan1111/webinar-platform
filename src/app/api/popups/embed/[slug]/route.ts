import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/popups/embed/[slug] - Public endpoint to load popup config for embedding
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const popup = await prisma.popup.findUnique({
    where: { slug: params.slug },
  })

  if (!popup || !popup.isActive) {
    return NextResponse.json({ error: 'Popup not found' }, { status: 404 })
  }

  // Return only what the embed needs
  return NextResponse.json({
    id: popup.id,
    slug: popup.slug,
    name: popup.name,
    fields: popup.fields,
    layout: popup.layout,
    styles: popup.styles,
    customHtml: popup.useCustomHtml ? popup.customHtml : null,
    useCustomHtml: popup.useCustomHtml,
    submitText: popup.submitText,
    successMessage: popup.successMessage,
    redirectUrl: popup.redirectUrl,
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
