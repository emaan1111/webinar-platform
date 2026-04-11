import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 1x1 transparent PNG pixel
const TRACKING_PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
)

function detectDevice(ua: string): string {
  if (!ua) return 'unknown'
  const lower = ua.toLowerCase()
  // Tablet checks before mobile since some tablets include "mobile"
  if (
    /ipad|tablet|playbook|silk|kindle|sm-t|gt-p/i.test(lower) ||
    (/android/i.test(lower) && !/mobile/i.test(lower))
  ) {
    return 'tablet'
  }
  if (
    /iphone|ipod|android.*mobile|windows phone|blackberry|bb10|opera mini|opera mobi|iemobile|mobile safari|samsung|lg-|htc|nokia|mot-|symbian|webos|palm|phone/i.test(lower)
  ) {
    return 'mobile'
  }
  return 'desktop'
}

// Apple Mail Privacy Protection and Gmail proxy prefetch send automated requests.
// We still count them - the user opened the email client at minimum.
function isImageProxy(ua: string): boolean {
  if (!ua) return false
  return /GoogleImageProxy|Outlookbot|YahooMailProxy/i.test(ua)
}

export async function GET(
  _request: Request,
  { params }: { params: { sendId: string } }
) {
  const { sendId } = params
  const url = new URL(_request.url)
  const emailType = url.searchParams.get('type') || 'confirmation'

  // Extract tracking context
  const userAgent = _request.headers.get('user-agent') || ''
  const ip =
    _request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    _request.headers.get('x-real-ip') ||
    null
  const deviceType = detectDevice(userAgent)

  // Fire-and-forget — never block the pixel response
  ;(async () => {
    try {
      if (emailType === 'reminder') {
        const send = await prisma.reminderEmailSend.findUnique({
          where: { id: sendId },
          select: { id: true },
        })
        if (!send) return

        await prisma.$transaction([
          prisma.emailTrackingEvent.create({
            data: {
              type: 'OPEN',
              emailType: 'reminder',
              reminderEmailSendId: sendId,
              userAgent,
              ipAddress: ip,
              deviceType,
            },
          }),
          prisma.reminderEmailSend.update({
            where: { id: sendId },
            data: {
              openedAt: new Date(),
              openCount: { increment: 1 },
              userAgent: userAgent || undefined,
            },
          }),
        ])
      } else if (emailType === 'followup') {
        const send = await prisma.followUpEmailSend.findUnique({
          where: { id: sendId },
          select: { id: true },
        })
        if (!send) return

        await prisma.$transaction([
          prisma.emailTrackingEvent.create({
            data: {
              type: 'OPEN',
              emailType: 'followup',
              followUpEmailSendId: sendId,
              userAgent,
              ipAddress: ip,
              deviceType,
            },
          }),
          prisma.followUpEmailSend.update({
            where: { id: sendId },
            data: {
              openedAt: new Date(),
              openCount: { increment: 1 },
              userAgent: userAgent || undefined,
            },
          }),
        ])
      } else {
        // Default: confirmation email (backwards compatible)
        const send = await prisma.confirmationEmailSend.findUnique({
          where: { id: sendId },
          select: { id: true },
        })
        if (!send) return

        await prisma.$transaction([
          prisma.emailTrackingEvent.create({
            data: {
              sendId,
              type: 'OPEN',
              emailType: 'confirmation',
              userAgent,
              ipAddress: ip,
              deviceType,
            },
          }),
          prisma.confirmationEmailSend.update({
            where: { id: sendId },
            data: {
              openedAt: new Date(),
              openCount: { increment: 1 },
              userAgent: userAgent || undefined,
            },
          }),
        ])
      }
    } catch (err) {
      console.error('Email open tracking error:', err)
    }
  })()

  // Return the pixel immediately with aggressive no-cache headers
  // to encourage real opens rather than cached responses
  return new NextResponse(TRACKING_PIXEL, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Content-Length': String(TRACKING_PIXEL.length),
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      Pragma: 'no-cache',
      Expires: '0',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
