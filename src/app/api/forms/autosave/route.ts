import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { formId, data, submissionId } = body
    const headers = req.headers
    const userAgent = headers.get('user-agent') || 'Unknown'
    const referrer = headers.get('referer') || 'Direct'

    let submission

    if (submissionId) {
      // Update existing
      submission = await prisma.formSubmission.update({
        where: { id: submissionId },
        data: {
          data: JSON.stringify(data),
          lastSavedAt: new Date()
        }
      })
    } else {
      // Create new partial submission
      submission = await prisma.formSubmission.create({
        data: {
          formId,
          data: JSON.stringify(data),
          status: 'PARTIAL',
          userAgent,
          referrer
        }
      })
    }

    return NextResponse.json({ 
      success: true, 
      submissionId: submission.id 
    })
  } catch (error) {
    console.error('Auto-save error:', error)
    return NextResponse.json({ success: false, error: 'Failed to save' }, { status: 500 })
  }
}
