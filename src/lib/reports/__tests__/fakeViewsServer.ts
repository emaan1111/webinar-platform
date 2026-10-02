import { act } from '@testing-library/react'
import { vi } from 'vitest'
import { applyViewsAction, EMPTY_STORED_VIEWS, StoredViews, ViewsAction } from '../state'

/**
 * Stands in for /api/reports/views, applying the same reducer the real route
 * does. Tests can reach in to play "another tab / device" (`stored`), take
 * the server down (`fail`), and see what the hook sent (`requests`).
 */
export function installFakeViewsServer(initial: StoredViews = EMPTY_STORED_VIEWS) {
  const server = {
    stored: initial,
    fail: false,
    requests: [] as ViewsAction[],
  }
  const respond = (status: number, body: unknown) => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => JSON.parse(JSON.stringify(body)),
  })
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url: string, init?: RequestInit) => {
      if (server.fail) return respond(500, { error: 'down' })
      if (init?.method === 'POST') {
        const action = JSON.parse(String(init.body)) as ViewsAction
        server.requests.push(action)
        server.stored = applyViewsAction(server.stored, action)
      }
      return respond(200, server.stored)
    })
  )
  return server
}

/** Lets every pending fetch and state update finish. */
export const flush = () => act(() => new Promise<void>(resolve => setTimeout(resolve, 0)))
