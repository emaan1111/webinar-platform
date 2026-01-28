import { prisma } from '@/lib/prisma'
import { sendClickSendSMS } from '@/lib/clicksend'

// --- Helper Functions ---

function normalizePhoneNumber(phone?: string | null): string | null {
  if (!phone) {
    return null
  }
  const normalized = phone.trim().replace(/[^\d+]/g, '')
  if (!normalized) {
    return null
  }
  return normalized
}

function replacePlaceholders(
  text: string | null | undefined,
  placeholders: Record<string, string>
): string {
  if (!text) return ''
  let result = text
  for (const [key, value] of Object.entries(placeholders)) {
    // Replace all occurrences of {{key}}
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value || '')
  }
  return result
}

// --- Main Processing Function ---

export async function processEventReminders(): Promise<{
  processed: number
  sent: number
  failed: number
}> {
  const stats = { processed: 0, sent: 0, failed: 0 }
  const now = new Date()

  try {
    // Find pending SMS reminders
    const pending = await prisma.eventReminderSent.findMany({
        where: {
        status: 'PENDING',
        scheduledFor: { lte: now }
        },
        take: 50,
        include: {
            eventRegistration: {
                include: {
                    event: true
                }
            }
        }
    });

    if (pending.length === 0) {
        return stats;
    }

    console.log(`📬 Processing ${pending.length} pending EVENT reminders...`);

    for (const reminder of pending) {
        stats.processed++
        
        const phone = normalizePhoneNumber(reminder.sentTo);
        if (!phone) {
            await prisma.eventReminderSent.update({
                where: { id: reminder.id },
                data: { status: 'FAILED', error: 'Invalid Phone Number', sentAt: new Date() }
            });
            stats.failed++;
            continue;
        }

        // Build placeholders
        const placeholders = {
            eventTitle: reminder.eventRegistration.event.title,
            zoomLink: reminder.eventRegistration.event.zoomLink || '',
            attendeeName: reminder.eventRegistration.name
        };

        const finalMessage = replacePlaceholders(reminder.message, placeholders);

        // Send SMS
        const { success, error } = await sendClickSendSMS(
            phone, 
            finalMessage, 
            reminder.eventRegistration.timezone || undefined
        );

        if (success) {
            await prisma.eventReminderSent.update({
                where: { id: reminder.id },
                data: { status: 'SENT', sentAt: new Date(), error: null }
            });
            stats.sent++;
            console.log(`✅ Event SMS Sent to ${phone}`);
        } else {
            await prisma.eventReminderSent.update({
                where: { id: reminder.id },
                data: { 
                    status: 'FAILED', 
                    error: error || 'ClickSend Failure',
                    sentAt: new Date()
                }
            });
            stats.failed++;
            console.error(`❌ Event SMS Failed for ${phone}:`, error);
        }
    }
  } catch (error) {
      console.error('❌ Error processing event reminders:', error);
  }

  return stats;
}
