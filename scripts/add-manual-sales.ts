/**
 * Record sales given as a bare list of emails — buyers reported outside the
 * Emaan list export, so there is no CSV row and no list-add timestamp.
 *
 * Each entry names the registration it links to explicitly rather than letting
 * a nearest-in-time heuristic choose: the set is small enough to verify by hand,
 * and one of these buyers has three registrations across two funnels.
 *
 * Dry run by default. Pass --commit to write.
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const AMOUNT = 297
const CURRENCY = 'USD'
const PRODUCT = 'Ultimate Mother'
const COMMIT = process.argv.includes('--commit')

/**
 * Purchase date. These three registered for and attended the 14 Sep session
 * (30-84 minutes each), so they saw the pitch that day; the sale is dated to it.
 * Reports attribute sales by registration day regardless, so this only affects
 * the Sales page ordering.
 */
const PURCHASED_AT = new Date('2026-09-14T12:00:00.000Z')

type Entry = { email: string; externalRegistrationId: string; who: string }

const ENTRIES: Entry[] = [
  { email: 'shadya36@gmail.com',      externalRegistrationId: 'cmu1cp88e002tqg2ij17gy7hy', who: 'Shadya Kabir' },
  // Also has an internal registration and a Nov 2025 external one; this is the
  // 14 Sep external row from the same funnel as the others (83 min watched).
  { email: 'nisha12773@yahoo.com',    externalRegistrationId: 'cmu1e8xsv0059qg2ip8r92ylx', who: 'Taslima Sultana' },
  { email: 'salwaumair369@gmail.com', externalRegistrationId: 'cmu1cyj6s003nqg2ihs54wcr9', who: 'salwa Umair' },
  { email: 'sanusimodinat19@gmail.com', externalRegistrationId: 'cmu1pof1c00xtqg2iq3gmrvcv', who: 'Modinat Sanusi' },
]

async function main() {
  console.log(`${COMMIT ? '🟢 COMMIT' : '🔵 DRY RUN'} — ${ENTRIES.length} sales at $${AMOUNT}\n`)
  let written = 0, skipped = 0

  for (const e of ENTRIES) {
    const existing = await prisma.webinarSale.findFirst({
      where: { email: { equals: e.email, mode: 'insensitive' } },
    })
    if (existing) {
      console.log(`⏭  ${e.email} — already has a sale (${existing.orderId})`)
      skipped++
      continue
    }

    const reg = await prisma.externalWebinarRegistration.findUnique({
      where: { id: e.externalRegistrationId },
      include: { externalWebinar: { select: { name: true } } },
    })
    if (!reg) {
      console.log(`❌ ${e.email} — registration ${e.externalRegistrationId} not found, skipping`)
      skipped++
      continue
    }
    if (reg.email.toLowerCase() !== e.email.toLowerCase()) {
      // Guards against a transcription slip in the ids above.
      console.log(`❌ ${e.email} — id belongs to ${reg.email}, skipping`)
      skipped++
      continue
    }

    const orderId = `manual-${PURCHASED_AT.toISOString().slice(0, 10)}-${e.email.toLowerCase()}`
    console.log(
      `✅ ${e.email} (${reg.name})\n` +
      `     → ${reg.externalWebinar.name.slice(0, 50)} · registered ${reg.registeredAt.toISOString().slice(0, 16)}` +
      ` · attended=${reg.attended} ${reg.watchTimeMinutes}min\n` +
      `     → $${AMOUNT} on ${PURCHASED_AT.toISOString().slice(0, 10)} · ${orderId}`
    )

    if (COMMIT) {
      await prisma.$transaction(async (tx) => {
        await tx.webinarSale.create({
          data: {
            externalWebinarId: reg.externalWebinarId,
            externalRegistrationId: reg.id,
            email: e.email,
            orderId,
            productName: PRODUCT,
            amount: AMOUNT,
            currency: CURRENCY,
            status: 'paid',
            purchasedAt: PURCHASED_AT,
            rawPayload: { source: 'manual_email_list', reportedAs: e.who },
          },
        })
        await tx.externalWebinarRegistration.update({
          where: { id: reg.id },
          data: { hasPurchased: true },
        })
      })
    }
    written++
  }

  console.log(`\n===== ${COMMIT ? 'WRITTEN' : 'WOULD WRITE'} =====`)
  console.log(`sales:   ${written}  ($${(written * AMOUNT).toLocaleString()})`)
  console.log(`skipped: ${skipped}`)
  if (!COMMIT) console.log(`\nRe-run with --commit to write.`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
