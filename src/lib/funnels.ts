import { prisma } from '@/lib/prisma'
import type { FunnelStep } from '@prisma/client'

export async function getFunnelBySlug(slug: string) {
  return prisma.funnel.findUnique({
    where: { slug },
    include: {
      steps: {
        include: { product: true },
        orderBy: { order: 'asc' },
      },
    },
  })
}

export async function getFunnelById(id: string) {
  return prisma.funnel.findUnique({
    where: { id },
    include: {
      steps: {
        include: { product: true },
        orderBy: { order: 'asc' },
      },
    },
  })
}

/**
 * Compute the next step for a user given the current step and their answer.
 * - "yes" / initial purchase: advance to step.order + 1
 * - "no" / decline: jump to declineNextOrder if set, else step.order + 1
 * Returns null if there is no next step (funnel complete -> confirmation).
 */
export function resolveNextStep(
  steps: FunnelStep[],
  currentOrder: number,
  declined: boolean
): FunnelStep | null {
  const current = steps.find((s) => s.order === currentOrder)
  if (!current) return null

  let targetOrder: number
  if (declined && current.declineNextOrder != null) {
    targetOrder = current.declineNextOrder
  } else {
    targetOrder = currentOrder + 1
  }

  return steps.find((s) => s.order === targetOrder) ?? null
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}
