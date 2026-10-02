import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { applyViewsAction, parseStoredViews, StoredViews } from './state'

/**
 * Each user's saved report views and starred default, one app_settings row
 * per user. They used to live only in the browser's localStorage, so clearing
 * site data (or switching browser) wiped them.
 */

const keyFor = (userId: string) => `reportViews:${userId}`

const MAX_ATTEMPTS = 5

export async function readStoredViews(userId: string): Promise<StoredViews> {
  const row = await prisma.appSetting.findUnique({ where: { key: keyFor(userId) } })
  return parseStoredViews(row?.value)
}

/**
 * Applies one change as a compare-and-swap on the row's updatedAt. When
 * another request (a second tab or device) writes in between, the change is
 * re-applied on top of that write instead of overwriting it.
 */
export async function updateStoredViews(userId: string, action: unknown): Promise<StoredViews> {
  const key = keyFor(userId)
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const row = await prisma.appSetting.findUnique({ where: { key } })
    const next = applyViewsAction(parseStoredViews(row?.value), action)
    // Round-trip drops undefined fields (e.g. a view never updated), which are not valid JSON values.
    const value = JSON.parse(JSON.stringify(next)) as Prisma.InputJsonValue

    if (!row) {
      try {
        await prisma.appSetting.create({ data: { key, value } })
        return next
      } catch (err) {
        // Someone else created the row first - start over from theirs.
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') continue
        throw err
      }
    }

    const { count } = await prisma.appSetting.updateMany({
      where: { key, updatedAt: row.updatedAt },
      data: { value },
    })
    if (count === 1) return next
  }
  throw new Error(`Saved report views kept changing underneath; gave up after ${MAX_ATTEMPTS} attempts`)
}
