import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function detectDevice(ua: string): string {
  if (!ua) return 'unknown'
  const lower = ua.toLowerCase()
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

export async function GET(
  request: Request,
  { params }: { params: { sendId: string } }
) {
  const { sendId } = params
  const url = new URL(request.url)
  const targetUrl = url.searchParams.get('url')
  const emailType = url.searchParams.get('type') || 'confirmation'

  if (!targetUrl) {
    return NextResponse.redirect(
      process.env.NEXT_PUBLIC_APP_URL || 'https://emaanpowerclasses.com'
    )
  }

  // Validate the target URL to prevent open redirect vulnerabilities
  let parsedTarget: URL
  try {
    parsedTarget = new URL(targetUrl)
  } catch {
    return NextResponse.redirect(
      process.env.NEXT_PUBLIC_APP_URL || 'https://emaanpowerclasses.com'
    )
  }

  // Only allow http/https protocols
  if (!['http:', 'https:'].includes(parsedTarget.protocol)) {
    return NextResponse.redirect(
      process.env.NEXT_PUBLIC_APP_URL || 'https://emaanpowerclasses.com'
    )
  }

  const userAgent = request.headers.get('user-agent') || ''
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    null
  const deviceType = detectDevice(userAgent)

  // Fire-and-forget — never delay the redirect
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
              type: 'CLICK',
              url: targetUrl,
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
              clickedAt: new Date(),
              clickCount: { increment: 1 },
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
              type: 'CLICK',
              url: targetUrl,
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
              clickedAt: new Date(),
              clickCount: { increment: 1 },
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
              type: 'CLICK',
              url: targetUrl,
              emailType: 'confirmation',
              userAgent,
              ipAddress: ip,
              deviceType,
            },
          }),
          prisma.confirmationEmailSend.update({
            where: { id: sendId },
            data: {
              clickedAt: new Date(),
              clickCount: { increment: 1 },
            },
          }),
        ])
      }
    } catch (err) {
      console.error('Email click tracking error:', err)
    }
  })()

  return NextResponse.redirect(targetUrl, { status: 302 })
}
