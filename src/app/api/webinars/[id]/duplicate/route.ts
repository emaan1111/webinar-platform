import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/webinars/[id]/duplicate - Duplicate a webinar
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get the original webinar with all related data
    const originalWebinar = await prisma.webinar.findFirst({
      where: {
        id,
        hostId: user.id
      },
      include: {
        schedules: true,
        offers: true,
        chatMessages: true,
        reactions: true,
        faqs: true,
        bonusResources: true
      }
    })

    if (!originalWebinar) {
      return NextResponse.json({ error: 'Webinar not found or unauthorized' }, { status: 404 })
    }

    // Generate a unique slug for the duplicate
    const baseSlug = originalWebinar.slug || originalWebinar.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    let newSlug = `${baseSlug}-copy`
    let slugCounter = 1
    
    // Check if slug exists and make it unique
    while (await prisma.webinar.findUnique({ where: { slug: newSlug } })) {
      newSlug = `${baseSlug}-copy-${slugCounter}`
      slugCounter++
    }

    // Prepare data for duplication
    const webinarData: any = {
      title: `${originalWebinar.title} (Copy)`,
      slug: newSlug,
      description: originalWebinar.description,
      duration: originalWebinar.duration,
      status: 'DRAFT', // Always start as draft
      thumbnail: originalWebinar.thumbnail,
      vimeoVideoId: originalWebinar.vimeoVideoId,
      videoUrl: originalWebinar.videoUrl,
      videoDuration: originalWebinar.videoDuration,
      hasReplay: originalWebinar.hasReplay,
      hasOffers: originalWebinar.hasOffers,
      hasChat: originalWebinar.hasChat,
      hasReactions: originalWebinar.hasReactions,
      hostId: user.id,
      
      // Registration Settings
      maxSchedulesToShow: originalWebinar.maxSchedulesToShow,
      registrationPageId: originalWebinar.registrationPageId,
      thankYouTemplateId: originalWebinar.thankYouTemplateId,
      countdownPageId: originalWebinar.countdownPageId,
      
      // A/B Testing Configuration
      enableABTesting: originalWebinar.enableABTesting,
      trafficSplitPercent: originalWebinar.trafficSplitPercent,
      testRegistrationPage: originalWebinar.testRegistrationPage,
      regPageAId: originalWebinar.regPageAId,
      regPageBId: originalWebinar.regPageBId,
      testSchedule: originalWebinar.testSchedule,
      scheduleAIds: originalWebinar.scheduleAIds,
      scheduleBIds: originalWebinar.scheduleBIds,
      testOffer: originalWebinar.testOffer,
      offerAId: originalWebinar.offerAId,
      offerBId: originalWebinar.offerBId,
      testVideo: originalWebinar.testVideo,
      videoAId: originalWebinar.videoAId,
      videoBId: originalWebinar.videoBId,
    }

    // Copy schedules if they exist
    if (originalWebinar.schedules && originalWebinar.schedules.length > 0) {
      webinarData.schedules = {
        create: originalWebinar.schedules.map((schedule: any) => ({
          scheduleType: schedule.scheduleType,
          scheduledAt: schedule.scheduledAt ? new Date(new Date(schedule.scheduledAt).getTime() + 7 * 24 * 60 * 60 * 1000) : null,
          timezone: schedule.timezone,
          useUserTimezone: schedule.useUserTimezone,
          minutesFromReg: schedule.minutesFromReg,
          recurringPattern: schedule.recurringPattern,
          isActive: schedule.isActive
        }))
      }
    }

    // Copy offers if they exist
    if (originalWebinar.offers && originalWebinar.offers.length > 0) {
      webinarData.offers = {
        create: originalWebinar.offers.map((offer: any) => ({
          title: offer.title,
          description: offer.description,
          price: offer.price,
          ctaText: offer.ctaText,
          ctaUrl: offer.ctaUrl,
          videoTimestamp: offer.videoTimestamp,
          hideAfter: offer.hideAfter,
          isActive: offer.isActive
        }))
      }
    }

    // Copy chat messages if they exist
    if (originalWebinar.chatMessages && originalWebinar.chatMessages.length > 0) {
      webinarData.chatMessages = {
        create: originalWebinar.chatMessages.map((message: any) => ({
          message: message.message,
          videoTimestamp: message.videoTimestamp,
          isScripted: message.isScripted || false,
          isHidden: message.isHidden || false,
          userName: message.userName,
          userId: message.userId
        }))
      }
    }

    // Copy reactions if they exist
    if (originalWebinar.reactions && originalWebinar.reactions.length > 0) {
      webinarData.reactions = {
        create: originalWebinar.reactions.map((reaction: any) => ({
          type: reaction.type,
          videoTimestamp: reaction.videoTimestamp,
          isScripted: reaction.isScripted || false,
          isHidden: reaction.isHidden || false,
          userName: reaction.userName,
          userId: reaction.userId
        }))
      }
    }

    // Copy FAQs if they exist
    if (originalWebinar.faqs && originalWebinar.faqs.length > 0) {
      webinarData.faqs = {
        create: originalWebinar.faqs.map((faq: any) => ({
          question: faq.question,
          answer: faq.answer,
          sortOrder: faq.sortOrder
        }))
      }
    }

    // Create duplicate webinar
    const duplicatedWebinar = await prisma.webinar.create({
      data: webinarData,
      include: {
        schedules: true,
        offers: true,
        chatMessages: true,
        reactions: true,
        faqs: true
      }
    })

    return NextResponse.json({ 
      webinar: duplicatedWebinar,
      message: 'Webinar duplicated successfully'
    }, { status: 201 })

  } catch (error: any) {
    console.error('Duplicate webinar error:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    })
    return NextResponse.json(
      { 
        error: 'Failed to duplicate webinar',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
