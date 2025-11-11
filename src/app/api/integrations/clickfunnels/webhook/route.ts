import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * ClickFunnels 2.0 Webhook Integration
 * 
 * POST /api/integrations/clickfunnels/webhook
 * 
 * Handles incoming webhook events from ClickFunnels 2.0
 * Automatically registers users for webinars when they submit forms
 */

interface ClickFunnelsContact {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  time_zone?: string;
  country?: string;
}

interface ClickFunnelsWebhookPayload {
  id: string;
  type: string; // 'contact.created', 'contact.updated', 'order.created', etc.
  contact: ClickFunnelsContact;
  custom_fields?: Record<string, any>;
  created_at: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get the webhook payload
    const payload: ClickFunnelsWebhookPayload = await request.json();
    
    console.log('ClickFunnels Webhook Received:', {
      type: payload.type,
      contactId: payload.contact?.id,
      email: payload.contact?.email
    });

    // Only process contact creation/update events
    if (!['contact.created', 'contact.updated', 'order.created'].includes(payload.type)) {
      return NextResponse.json({ 
        message: 'Event type not supported',
        type: payload.type 
      }, { status: 200 });
    }

    // Extract contact information
    const contact = payload.contact;
    if (!contact || !contact.email) {
      return NextResponse.json({ 
        error: 'Invalid contact data - email required' 
      }, { status: 400 });
    }

    // Extract custom fields that should contain webinar info
    const customFields = payload.custom_fields || {};
    const webinarId = customFields.webinar_id || customFields.webinarId;
    const scheduleId = customFields.schedule_id || customFields.scheduleId;
    const webinarSlug = customFields.webinar_slug || customFields.webinarSlug;

    // Find webinar by ID or slug
    let webinar;
    if (webinarId) {
      webinar = await prisma.webinar.findUnique({
        where: { id: webinarId },
        include: { schedules: true }
      });
    } else if (webinarSlug) {
      webinar = await prisma.webinar.findUnique({
        where: { slug: webinarSlug },
        include: { schedules: true }
      });
    }

    if (!webinar) {
      console.error('Webinar not found:', { webinarId, webinarSlug });
      return NextResponse.json({ 
        error: 'Webinar not found',
        webinarId,
        webinarSlug
      }, { status: 404 });
    }

    // Check if registration already exists
    const existingRegistration = await prisma.registration.findFirst({
      where: {
        email: contact.email.toLowerCase(),
        webinarId: webinar.id
      }
    });

    if (existingRegistration) {
      console.log('Registration already exists:', existingRegistration.id);
      return NextResponse.json({ 
        message: 'Registration already exists',
        registrationId: existingRegistration.id
      }, { status: 200 });
    }

    // Determine which schedule to use
    let selectedScheduleId = scheduleId;
    if (!selectedScheduleId && webinar.schedules.length > 0) {
      // Default to first active schedule
      const activeSchedule = webinar.schedules.find(s => s.isActive);
      selectedScheduleId = activeSchedule?.id || webinar.schedules[0].id;
    }

    // Get schedule for calculating start time
    const schedule = webinar.schedules.find(s => s.id === selectedScheduleId);
    let scheduledStartTime: Date | null = null;

    if (schedule) {
      if (schedule.scheduleType === 'specific' && schedule.scheduledAt) {
        scheduledStartTime = schedule.scheduledAt;
      } else if (schedule.scheduleType === 'justInTime' && schedule.minutesFromReg) {
        scheduledStartTime = new Date(Date.now() + schedule.minutesFromReg * 60 * 1000);
      }
    }

    // Create name from first_name and last_name
    const name = [contact.first_name, contact.last_name]
      .filter(Boolean)
      .join(' ') || 'ClickFunnels User';

    // Create registration
    const registration = await prisma.registration.create({
      data: {
        webinarId: webinar.id,
        scheduleId: selectedScheduleId,
        name: name,
        email: contact.email.toLowerCase(),
        phone: contact.phone || null,
        timezone: contact.time_zone || null,
        country: contact.country || null,
        privacyConsent: true, // Assume consent via ClickFunnels form
        marketingConsent: customFields.marketing_consent === 'true' || false,
        scheduledStartTime: scheduledStartTime,
      }
    });

    console.log('Registration created:', registration.id);

    // Track the page visit for analytics
    const visitorId = `cf_${contact.id}`;
    await prisma.pageVisit.create({
      data: {
        webinarId: webinar.id,
        pageType: 'registration',
        pageId: webinar.registrationPageId,
        visitorId: visitorId,
        registrationId: registration.id,
        device: 'desktop', // ClickFunnels doesn't provide this
        enteredAt: new Date(),
      }
    }).catch(err => {
      console.error('Failed to track page visit:', err);
      // Don't fail the registration if tracking fails
    });

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Registration created successfully',
      registration: {
        id: registration.id,
        name: registration.name,
        email: registration.email,
        webinarId: webinar.id,
        webinarTitle: webinar.title,
        scheduleId: selectedScheduleId,
        scheduledStartTime: scheduledStartTime
      }
    }, { status: 201 });

  } catch (error) {
    console.error('ClickFunnels webhook error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint for webhook verification (optional)
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'ClickFunnels 2.0 Webhook Endpoint',
    status: 'active',
    supported_events: [
      'contact.created',
      'contact.updated',
      'order.created'
    ],
    required_custom_fields: [
      'webinar_id OR webinar_slug (required)',
      'schedule_id (optional)',
      'marketing_consent (optional)'
    ],
    documentation: '/docs/clickfunnels-integration'
  });
}
