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

interface ClickFunnelsOrderProduct {
  id?: string | number;
  name?: string;
  price?: number | string;
  amount?: number | string;
}

interface ClickFunnelsOrderDetails {
  id: string;
  status?: string;
  payment_status?: string;
  total?: number | string;
  total_amount?: number | string;
  amount?: number | string;
  currency?: string;
  currency_code?: string;
  currency_iso?: string;
  order_form_id?: string;
  order_form_name?: string;
  order_form?: {
    id?: string;
    name?: string;
  };
  products?: ClickFunnelsOrderProduct[];
  created_at?: string;
  updated_at?: string;
}

interface ClickFunnelsWebhookPayload {
  id: string;
  type: string; // 'contact.created', 'contact.updated', 'order.created', etc.
  contact?: ClickFunnelsContact;
  custom_fields?: Record<string, any>;
  customFields?: Record<string, any>;
  created_at?: string;
  data?: any;
  order?: ClickFunnelsOrderDetails;
}

export async function POST(request: NextRequest) {
  try {
    // Get the webhook payload
    const payload: ClickFunnelsWebhookPayload = await request.json();
    
    console.log('ClickFunnels Webhook Received:', {
      type: payload.type,
      contactId: payload.contact?.id,
      email: payload.contact?.email,
      orderId: getOrderIdFromPayload(payload)
    });

    if (payload.type === 'order.created') {
      return await handleOrderCreated(payload);
    }

    // Only process contact creation/update events
    if (!['contact.created', 'contact.updated'].includes(payload.type)) {
      return NextResponse.json({ 
        message: 'Event type not supported',
        type: payload.type 
      }, { status: 200 });
    }

    // Extract contact information
    const contact = payload.contact;
    if (!contact?.email) {
      return NextResponse.json({ 
        error: 'Invalid contact data - email required' 
      }, { status: 400 });
    }

    const customFields = extractCustomFields(payload);
    const webinarId = customFields.webinar_id || customFields.webinarId;
    const scheduleId = customFields.schedule_id || customFields.scheduleId;
    const webinarSlug = customFields.webinar_slug || customFields.webinarSlug;

    // Find webinar by ID or slug
    const webinar = await findWebinarByIdentifier({ webinarId, webinarSlug }, true);

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
      const activeSchedule = webinar.schedules.find((s: any) => s.isActive);
      selectedScheduleId = activeSchedule?.id || webinar.schedules[0].id;
    }

    // Get schedule for calculating start time
    const schedule = webinar.schedules.find((s: any) => s.id === selectedScheduleId);
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

async function handleOrderCreated(payload: ClickFunnelsWebhookPayload) {
  const normalizedEmail = extractEmailFromPayload(payload);

  if (!normalizedEmail) {
    console.error('Order event missing email reference');
    return NextResponse.json(
      { error: 'Order event missing email reference' },
      { status: 400 }
    );
  }

  const customFields = extractCustomFields(payload);
  const webinarId = customFields.webinar_id || customFields.webinarId;
  const webinarSlug = customFields.webinar_slug || customFields.webinarSlug;
  let webinar = await findWebinarByIdentifier({ webinarId, webinarSlug }, false);

  const registration = await findRegistrationForEmail(normalizedEmail, webinar?.id);

  if (!webinar && registration?.webinar) {
    webinar = registration.webinar;
  }

  if (!webinar) {
    console.error('Unable to match sale to webinar', {
      email: normalizedEmail,
      customFields,
    });
    return NextResponse.json(
      {
        success: false,
        message: 'Sale received but webinar could not be determined',
        email: normalizedEmail,
      },
      { status: 200 }
    );
  }

  const order = extractOrderDetails(payload);

  if (!order?.id) {
    console.error('Order payload missing identifier');
    return NextResponse.json(
      { error: 'Order payload missing identifier' },
      { status: 400 }
    );
  }

  const orderId = String(order.id);
  const amount = parseCurrencyAmount(order.total_amount ?? order.total ?? order.amount);
  const currency =
    order.currency ||
    order.currency_code ||
    order.currency_iso ||
    'USD';
  const orderFormId = order.order_form_id || order.order_form?.id;
  const orderFormName = order.order_form_name || order.order_form?.name;
  const purchasedAt = order.created_at
    ? new Date(order.created_at)
    : payload.created_at
      ? new Date(payload.created_at)
      : new Date();
  const productName =
    order.products?.map((product) => product?.name).filter(Boolean).join(', ') || null;

  const saleData = {
    webinarId: webinar.id,
    registrationId: registration?.id ?? null,
    email: normalizedEmail,
    orderFormId: orderFormId || null,
    orderFormName: orderFormName || null,
    productName,
    status: order.status || order.payment_status || null,
    amount: amount ?? null,
    currency,
    contactId: payload.contact?.id || null,
    purchasedAt,
    rawPayload: payload as any,
  };

  let sale;
  const existingSale = await prisma.webinarSale.findUnique({
    where: { orderId },
  });

  if (existingSale) {
    sale = await prisma.webinarSale.update({
      where: { orderId },
      data: saleData,
    });
  } else {
    sale = await prisma.webinarSale.create({
      data: {
        ...saleData,
        orderId,
      },
    });
  }

  if (registration) {
    await prisma.offerAnalytics
      .updateMany({
        where: {
          registrationId: registration.id,
          webinarId: webinar.id,
          converted: false,
        },
        data: {
          converted: true,
          convertedAt: new Date(),
        },
      })
      .catch((error) => {
        console.error('Failed to update offer analytics for sale', error);
      });
  }

  return NextResponse.json(
    {
      success: true,
      message: existingSale ? 'Sale updated' : 'Sale recorded',
      saleId: sale.id,
      webinarId: webinar.id,
      registrationId: sale.registrationId,
    },
    { status: existingSale ? 200 : 201 }
  );
}

function extractCustomFields(payload: ClickFunnelsWebhookPayload): Record<string, any> {
  return (
    payload.custom_fields ||
    payload.customFields ||
    payload.data?.custom_fields ||
    payload.data?.customFields ||
    {}
  );
}

function extractOrderDetails(payload: ClickFunnelsWebhookPayload): ClickFunnelsOrderDetails | null {
  if (payload.order) {
    return payload.order;
  }

  if (payload.data?.order) {
    return payload.data.order;
  }

  if (payload.data?.attributes) {
    return payload.data.attributes as ClickFunnelsOrderDetails;
  }

  if (payload.data && typeof payload.data === 'object' && 'id' in payload.data) {
    return payload.data as ClickFunnelsOrderDetails;
  }

  return null;
}

function parseCurrencyAmount(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.replace(/[^0-9.-]/g, '');
    if (!normalized) {
      return null;
    }
    const parsed = Number(normalized);
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
}

async function findWebinarByIdentifier(
  identifiers: { webinarId?: string; webinarSlug?: string },
  includeSchedules?: boolean
): Promise<any> {
  if (identifiers.webinarId) {
    return prisma.webinar.findUnique({
      where: { id: identifiers.webinarId },
      include: includeSchedules ? { schedules: true } : undefined,
    });
  }

  if (identifiers.webinarSlug) {
    return prisma.webinar.findUnique({
      where: { slug: identifiers.webinarSlug },
      include: includeSchedules ? { schedules: true } : undefined,
    });
  }

  return null;
}

async function findRegistrationForEmail(email: string, webinarId?: string) {
  return prisma.registration.findFirst({
    where: {
      email,
      ...(webinarId ? { webinarId } : {}),
    },
    orderBy: { registeredAt: 'desc' },
    include: {
      webinar: true,
    },
  });
}

function extractEmailFromPayload(payload: ClickFunnelsWebhookPayload): string | null {
  const candidates = [
    payload.contact?.email,
    payload.data?.contact?.email,
    payload.data?.email,
    (payload.order as any)?.customer_email,
    (payload.order as any)?.email,
  ];

  for (const candidate of candidates) {
    if (candidate && typeof candidate === 'string') {
      return candidate.trim().toLowerCase();
    }
  }

  return null;
}

function getOrderIdFromPayload(payload: ClickFunnelsWebhookPayload): string | null {
  const order = extractOrderDetails(payload);
  return order?.id ? String(order.id) : null;
}
