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
 * Each sale is dated to the session the buyer attended — they saw the pitch that
 * day — because these arrive without a transaction time. Reports attribute sales
 * by registration day regardless, so the date only affects Sales page ordering.
 */
type Entry = {
  email: string
  externalRegistrationId: string
  who: string
  /** Date of the session attended, as YYYY-MM-DD. */
  purchasedOn: string
}

const ENTRIES: Entry[] = [
  { email: 'shadya36@gmail.com',      externalRegistrationId: 'cmu1cp88e002tqg2ij17gy7hy', who: 'Shadya Kabir',   purchasedOn: '2026-09-14' },
  // Also has an internal registration and a Nov 2025 external one; this is the
  // 14 Sep external row from the same funnel as the others (83 min watched).
  { email: 'nisha12773@yahoo.com',    externalRegistrationId: 'cmu1e8xsv0059qg2ip8r92ylx', who: 'Taslima Sultana', purchasedOn: '2026-09-14' },
  { email: 'salwaumair369@gmail.com', externalRegistrationId: 'cmu1cyj6s003nqg2ihs54wcr9', who: 'salwa Umair',    purchasedOn: '2026-09-14' },
  { email: 'sanusimodinat19@gmail.com', externalRegistrationId: 'cmu1pof1c00xtqg2iq3gmrvcv', who: 'Modinat Sanusi', purchasedOn: '2026-09-14' },
  { email: 'gul-786@hotmail.co.uk',   externalRegistrationId: 'cmu2qrkis004fn12ib4f3sp8i', who: 'Gul Asif',       purchasedOn: '2026-09-15' },
  { email: 'rashmatth1@gmail.com',    externalRegistrationId: 'cmuac3tle188cqd2il0uaqcwe', who: 'Rasheeka Matthews', purchasedOn: '2026-09-20' },
  // Registration stored as bilsidraq…sidra_bilquees@yahoo.com…drasidra; the real
  // address is embedded and the name matches exactly. Operator confirmed the link.
  { email: 'sidra_bilquees@yahoo.com', externalRegistrationId: 'cmu67fn6k07a4qd2is3gm5hwb', who: 'Sidra Bilquees', purchasedOn: '2026-09-18' },
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
    // Guards against a transcription slip in the ids above. Containment, not
    // equality: one registration was stored with its address mangled by an
    // autofill glitch (name fragments interleaved around the real email), so the
    // true address survives only as a substring. A wrong id still fails here.
    const regEmail = reg.email.toLowerCase()
    const wantEmail = e.email.toLowerCase()
    if (!regEmail.includes(wantEmail)) {
      console.log(`❌ ${e.email} — id belongs to ${reg.email}, skipping`)
      skipped++
      continue
    }
    if (regEmail !== wantEmail) {
      console.log(`   ℹ️  registration email is corrupted (${reg.email}) — linking on the embedded address`)
    }

    const purchasedAt = new Date(`${e.purchasedOn}T12:00:00.000Z`)
    const orderId = `manual-${e.purchasedOn}-${e.email.toLowerCase()}`
    console.log(
      `✅ ${e.email} (${reg.name})\n` +
      `     → ${reg.externalWebinar.name.slice(0, 50)} · registered ${reg.registeredAt.toISOString().slice(0, 16)}` +
      ` · attended=${reg.attended} ${reg.watchTimeMinutes}min\n` +
      `     → $${AMOUNT} on ${e.purchasedOn} · ${orderId}`
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
            purchasedAt,
            rawPayload: { source: 'manual_email_list', reportedAs: e.who },
          },
        })
        await tx.externalWebinarRegistration.update({
          where: { id: reg.id },
          data: { hasPurchased: true },
        })
      },
      // The prod DB is behind a proxy and round-trips are slow; Prisma's 5s
      // default expires mid-transaction and rolls the pair back.
      { maxWait: 15_000, timeout: 30_000 })
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
