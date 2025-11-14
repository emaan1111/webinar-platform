/**
 * Performance optimization utilities
 */

/**
 * Debounce function for search inputs and API calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function for scroll and resize events
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * Cache wrapper for expensive computations
 */
export class SimpleCache<T> {
  private cache: Map<string, { data: T; timestamp: number }> = new Map()
  private ttl: number

  constructor(ttlSeconds: number = 60) {
    this.ttl = ttlSeconds * 1000
  }

  get(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  set(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  clear(): void {
    this.cache.clear()
  }
}

/**
 * API response cache with stale-while-revalidate
 */
export async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  cacheTime: number = 60
): Promise<T> {
  const cache = new SimpleCache<T>(cacheTime)
  const cached = cache.get(key)

  if (cached) {
    // Return cached data and revalidate in background
    fetcher().then((fresh) => cache.set(key, fresh)).catch(console.error)
    return cached
  }

  const fresh = await fetcher()
  cache.set(key, fresh)
  return fresh
}

/**
 * Batch multiple Prisma queries
 */
export async function batchQueries<T>(
  queries: Array<() => Promise<T>>
): Promise<T[]> {
  return Promise.all(queries.map((query) => query()))
}

/**
 * Lazy load component (use with React.lazy)
 */
export function lazyWithPreload<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  const Component = React.lazy(factory)
  ;(Component as any).preload = factory
  return Component
}

/**
 * Format large numbers for display
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

/**
 * Measure function execution time (dev only)
 */
export async function measureTime<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  if (process.env.NODE_ENV === 'production') return fn()

  const start = performance.now()
  try {
    const result = await fn()
    const end = performance.now()
    console.log(`⏱️  ${label}: ${(end - start).toFixed(2)}ms`)
    return result
  } catch (error) {
    const end = performance.now()
    console.log(`⏱️  ${label} (failed): ${(end - start).toFixed(2)}ms`)
    throw error
  }
}

/**
 * Pagination helper
 */
export function getPaginationParams(
  page: number = 1,
  limit: number = 10
): { skip: number; take: number } {
  const normalizedPage = Math.max(1, page)
  const normalizedLimit = Math.min(100, Math.max(1, limit))

  return {
    skip: (normalizedPage - 1) * normalizedLimit,
    take: normalizedLimit,
  }
}

/**
 * Generate cache headers for API routes
 */
export function getCacheHeaders(maxAge: number = 60, staleWhileRevalidate: number = 300) {
  return {
    'Cache-Control': `public, s-maxage=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
  }
}

import React from 'react'
