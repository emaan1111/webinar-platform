'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { WebinarPollData } from '@/lib/webinarPoll'
import { POLL_MOUNT_ID } from '@/lib/webinarPoll'

interface WebinarPollProps {
  poll: WebinarPollData
  externalWebinarId: string
  registrationId?: string
  respondentName?: string
  respondentEmail?: string
  source: 'thank_you' | 'countdown'
}

interface StoredState {
  responseId: string | null
  done: boolean
}

const SERIF = "'Source Serif 4', Georgia, 'Times New Roman', serif"

/**
 * Post-registration poll for the external thank-you / countdown pages.
 *
 * An invitation card sits in the page; the questions themselves open in a modal so the
 * poll never pushes the template's own content around. Answers are saved question by
 * question (the countdown page can redirect into the live room mid-poll, so a partial
 * run still counts), and the response is remembered per registrant so answering on the
 * thank-you page doesn't ask again on the countdown page.
 *
 * Styling is inline on purpose: these pages render arbitrary template CSS that would
 * otherwise bleed into class-based styles.
 */
export default function WebinarPoll({
  poll,
  externalWebinarId,
  registrationId,
  respondentName,
  respondentEmail,
  source,
}: WebinarPollProps) {
  const { surveyId, questions, primaryColor } = poll
  const storageKey = `webinar-poll:${surveyId}:${registrationId || 'anon'}`

  const [mounted, setMounted] = useState(false)
  const [mountNode, setMountNode] = useState<Element | null>(null)
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [done, setDone] = useState(false)
  const [saving, setSaving] = useState(false)
  const responseIdRef = useRef<string | null>(null)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (raw) {
        const stored = JSON.parse(raw) as StoredState
        responseIdRef.current = stored.responseId ?? null
        if (stored.done) setDone(true)
      }
    } catch {
      // Private mode / blocked storage — the poll just starts fresh.
    }
    setMountNode(document.getElementById(POLL_MOUNT_ID))
    setMounted(true)
  }, [storageKey])

  // Esc closes the modal, and the page behind it shouldn't scroll while it's up.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  const remember = useCallback(
    (state: StoredState) => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(state))
      } catch {
        // Nothing to do — the answers are already on the server.
      }
    },
    [storageKey],
  )

  const save = useCallback(
    async (questionId: string, value: string | string[]) => {
      try {
        const res = await fetch(`/api/surveys/${surveyId}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answers: { [questionId]: value },
            responseId: responseIdRef.current,
            externalWebinarId,
            registrationId,
            name: respondentName,
            email: respondentEmail,
            source,
          }),
        })
        if (res.ok) {
          const data = await res.json()
          if (data.responseId) {
            responseIdRef.current = data.responseId
            remember({ responseId: data.responseId, done: false })
          }
        }
      } catch {
        // Offline / blocked — keep the poll moving rather than trapping the registrant.
      }
    },
    [surveyId, externalWebinarId, registrationId, respondentName, respondentEmail, source, remember],
  )

  const question = questions[index]
  const total = questions.length
  const selected = question ? answers[question.id] : undefined
  const canProceed =
    question?.type === 'multi' ? ((selected as string[]) || []).length > 0 : Boolean(selected)

  const advance = useCallback(
    async (value: string | string[]) => {
      if (!question || saving) return
      setSaving(true)
      await save(question.id, value)
      setSaving(false)
      if (index < total - 1) {
        setIndex(index + 1)
      } else {
        setDone(true)
        remember({ responseId: responseIdRef.current, done: true })
      }
    },
    [question, saving, save, index, total, remember],
  )

  const pickSingle = (option: string) => {
    if (!question || saving) return
    setAnswers((prev) => ({ ...prev, [question.id]: option }))
    void advance(option)
  }

  const toggleMulti = (option: string) => {
    if (!question) return
    setAnswers((prev) => {
      const current = (prev[question.id] as string[]) || []
      if (current.includes(option)) {
        return { ...prev, [question.id]: current.filter((o) => o !== option) }
      }
      if (current.length >= question.max) return prev
      return { ...prev, [question.id]: [...current, option] }
    })
  }

  if (!mounted || !question) return null

  const plainThankYouBody = poll.thankYouBody
    ? poll.thankYouBody.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    : ''

  /* ---------- the invitation that sits in the page ---------- */
  const invite = (
    <section
      style={{
        boxSizing: 'border-box',
        width: '100%',
        padding: '36px 20px',
        background: '#faf9f6',
        fontFamily: SERIF,
        color: '#2d2a26',
      }}
    >
      <div
        style={{
          boxSizing: 'border-box',
          maxWidth: '620px',
          margin: '0 auto',
          background: '#fff',
          border: '1px solid #e2ddd5',
          borderRadius: '18px',
          padding: '26px 24px',
          textAlign: 'center',
          boxShadow: '0 6px 24px rgba(45, 42, 38, 0.07)',
        }}
      >
        {done ? (
          <>
            <div style={{ fontSize: '30px', lineHeight: 1, marginBottom: '10px' }}>🤲</div>
            <h3 style={{ margin: '0 0 8px', fontSize: '19px', fontWeight: 600, color: primaryColor, lineHeight: 1.35 }}>
              {poll.thankYouTitle}
            </h3>
            <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.6, color: '#5f5950' }}>
              {plainThankYouBody || 'Your answers are saved — thank you.'}
            </p>
          </>
        ) : (
          <>
            <p
              style={{
                margin: '0 0 8px',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '1.6px',
                textTransform: 'uppercase',
                color: primaryColor,
              }}
            >
              Before we begin
            </p>
            <h3 style={{ margin: '0 0 10px', fontSize: '21px', fontWeight: 600, lineHeight: 1.35 }}>
              {poll.title}
            </h3>
            <p style={{ margin: '0 auto 20px', maxWidth: '440px', fontSize: '15px', lineHeight: 1.65, color: '#5f5950' }}>
              {poll.description ||
                `${total} quick questions so we can shape the masterclass around what you actually need.`}
            </p>
            <button
              type="button"
              onClick={() => setOpen(true)}
              style={{
                padding: '13px 30px',
                borderRadius: '10px',
                border: 'none',
                background: primaryColor,
                color: '#fff',
                font: 'inherit',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Answer {total} quick question{total === 1 ? '' : 's'} →
            </button>
            <p style={{ margin: '12px 0 0', fontSize: '12.5px', color: '#9b9590' }}>
              Takes less than a minute
            </p>
          </>
        )}
      </div>
    </section>
  )

  /* ---------- the modal the questions live in ---------- */
  const modal = open ? (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={poll.title}
      onClick={() => setOpen(false)}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2147483000,
        background: 'rgba(28, 25, 22, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box',
        fontFamily: SERIF,
        color: '#2d2a26',
        overflowY: 'auto',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          boxSizing: 'border-box',
          position: 'relative',
          width: '100%',
          maxWidth: '560px',
          maxHeight: 'calc(100vh - 32px)',
          overflowY: 'auto',
          background: '#fff',
          borderRadius: '18px',
          padding: '30px 26px 26px',
          boxShadow: '0 24px 60px rgba(20, 18, 16, 0.35)',
        }}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: 'none',
            background: '#f1eee9',
            color: '#6b6560',
            font: 'inherit',
            fontSize: '17px',
            lineHeight: 1,
            cursor: 'pointer',
          }}
        >
          ×
        </button>

        {done ? (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ fontSize: '40px', lineHeight: 1, marginBottom: '14px' }}>🤲</div>
            <h3 style={{ margin: '0 0 10px', fontSize: '21px', fontWeight: 600, color: primaryColor, lineHeight: 1.35 }}>
              {poll.thankYouTitle}
            </h3>
            <p style={{ margin: '0 0 22px', fontSize: '15px', lineHeight: 1.65, color: '#5f5950' }}>
              {plainThankYouBody ||
                'Your answers help us shape the masterclass around what you actually need.'}
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{
                padding: '11px 28px',
                borderRadius: '8px',
                border: 'none',
                background: primaryColor,
                color: '#fff',
                font: 'inherit',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '2px 0 20px', paddingRight: '34px' }}>
              <div style={{ flex: 1, height: '4px', background: '#e8e4de', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.round((index / total) * 100)}%`,
                    height: '100%',
                    background: primaryColor,
                    borderRadius: '4px',
                    transition: 'width 0.35s ease',
                  }}
                />
              </div>
              <span style={{ fontSize: '12px', color: '#9b9590', fontVariantNumeric: 'tabular-nums' }}>
                {index + 1}/{total}
              </span>
            </div>

            <h3 style={{ margin: '0 0 4px', fontSize: '19px', fontWeight: 600, lineHeight: 1.4 }}>
              {question.question}
            </h3>
            {question.type === 'multi' ? (
              <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#9b9590' }}>
                {question.max >= 99 ? 'Select all that apply' : `Select up to ${question.max}`}
              </p>
            ) : null}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '18px' }}>
              {question.options.map((option) => {
                const isSelected =
                  question.type === 'multi'
                    ? ((selected as string[]) || []).includes(option)
                    : selected === option
                return (
                  <button
                    key={option}
                    type="button"
                    disabled={saving}
                    onClick={() => (question.type === 'multi' ? toggleMulti(option) : pickSingle(option))}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '13px 16px',
                      borderRadius: '12px',
                      border: isSelected ? `2px solid ${primaryColor}` : '1.5px solid #d4cfc7',
                      background: isSelected ? '#f2f7f4' : '#faf9f6',
                      cursor: saving ? 'progress' : 'pointer',
                      textAlign: 'left',
                      font: 'inherit',
                      fontSize: '15px',
                      lineHeight: 1.5,
                      color: '#2d2a26',
                      transition: 'border-color 0.2s ease, background 0.2s ease',
                    }}
                  >
                    <span
                      style={{
                        width: '19px',
                        height: '19px',
                        minWidth: '19px',
                        marginTop: '2px',
                        borderRadius: question.type === 'multi' ? '6px' : '50%',
                        border: isSelected
                          ? question.type === 'multi'
                            ? 'none'
                            : `6px solid ${primaryColor}`
                          : '2px solid #b8b0a4',
                        background: isSelected && question.type === 'multi' ? primaryColor : '#fff',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {isSelected && question.type === 'multi' ? '✓' : ''}
                    </span>
                    <span>{option}</span>
                  </button>
                )
              })}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '18px',
                gap: '12px',
              }}
            >
              <button
                type="button"
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                disabled={index === 0 || saving}
                style={{
                  padding: '9px 16px',
                  borderRadius: '8px',
                  border: '1px solid #ded8d0',
                  background: 'transparent',
                  font: 'inherit',
                  fontSize: '14px',
                  color: '#6b6560',
                  cursor: 'pointer',
                  visibility: index === 0 ? 'hidden' : 'visible',
                }}
              >
                ← Back
              </button>
              {question.type === 'multi' ? (
                <button
                  type="button"
                  onClick={() => void advance(answers[question.id])}
                  disabled={!canProceed || saving}
                  style={{
                    padding: '11px 26px',
                    borderRadius: '8px',
                    border: 'none',
                    background: canProceed ? primaryColor : '#ded8d0',
                    color: canProceed ? '#fff' : '#9b9590',
                    font: 'inherit',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: canProceed && !saving ? 'pointer' : 'default',
                  }}
                >
                  {saving ? 'Saving…' : index === total - 1 ? 'Done' : 'Next →'}
                </button>
              ) : (
                <span style={{ fontSize: '13px', color: '#9b9590' }}>
                  {saving ? 'Saving…' : 'Tap an answer to continue'}
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  ) : null

  return (
    <>
      {mountNode ? createPortal(invite, mountNode) : invite}
      {modal ? createPortal(modal, document.body) : null}
    </>
  )
}
