import { describe, it, expect } from 'vitest'
import { buildRawMessage } from '../email'

const base = {
  from: '"Emaan Power" <support@emaanpower.com>',
  to: 'someone@example.com',
  subject: 'Your webinar starts soon',
  htmlBody: '<p>Hello <b>there</b></p>',
}

function headerBlock(raw: string): string {
  return raw.split('\r\n\r\n')[0]
}

describe('buildRawMessage', () => {
  it('adds RFC 8058 one-click headers when an unsubscribe URL is given', () => {
    const raw = buildRawMessage({ ...base, unsubscribeUrl: 'https://emaanpowerclasses.com/api/unsubscribe/abc123' })
    const headers = headerBlock(raw)
    expect(headers).toContain('List-Unsubscribe: <https://emaanpowerclasses.com/api/unsubscribe/abc123>')
    expect(headers).toContain('List-Unsubscribe-Post: List-Unsubscribe=One-Click')
  })

  it('omits the headers when no unsubscribe URL is given', () => {
    const raw = buildRawMessage(base)
    expect(raw).not.toContain('List-Unsubscribe')
  })

  it('always includes a text alternative, derived from the HTML when absent', () => {
    const raw = buildRawMessage(base)
    expect(raw).toContain('Content-Type: text/plain; charset=UTF-8')
    expect(raw).toContain('Content-Type: text/html; charset=UTF-8')
    // "Hello there" base64-encoded appears in the text part
    expect(raw).toContain(Buffer.from('Hello there').toString('base64'))
  })

  it('encodes non-ASCII subjects and keeps every line under the SMTP limit', () => {
    const raw = buildRawMessage({
      ...base,
      subject: 'Assalamu alaikum — تذكير',
      htmlBody: '<p>' + 'x'.repeat(5000) + '</p>',
    })
    expect(headerBlock(raw)).toMatch(/^Subject: =\?UTF-8\?B\?[A-Za-z0-9+/=]+\?=$/m)
    for (const line of raw.split('\r\n')) expect(line.length).toBeLessThanOrEqual(998)
  })

  it('wraps attachments in multipart/mixed around the alternative part', () => {
    const raw = buildRawMessage({
      ...base,
      attachments: [{ filename: 'invite.ics', content: Buffer.from('BEGIN:VCALENDAR').toString('base64'), contentType: 'text/calendar' }],
    })
    expect(raw).toContain('Content-Type: multipart/mixed;')
    expect(raw).toContain('Content-Type: multipart/alternative;')
    expect(raw).toContain('Content-Disposition: attachment; filename="invite.ics"')
  })
})
