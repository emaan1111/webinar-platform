'use client'

import { useState } from 'react'

interface Question {
  id: string
  section: string
  question: string
  type: 'single' | 'multi'
  options: string[]
  max: number
}

interface SurveyClientProps {
  surveyId: string
  title: string
  description: string | null
  thankYouTitle: string
  thankYouBody: string | null
  primaryColor: string
  questions: Question[]
}

function RadioOption({ selected, label, onClick, color }: { selected: boolean; label: string; onClick: () => void; color: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '14px 18px',
        borderRadius: '12px',
        border: selected ? `2px solid ${color}` : '1.5px solid #d4cfc7',
        background: selected ? `${color}11` : '#faf9f6',
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        transition: 'all 0.2s ease',
        boxShadow: selected ? `0 0 0 1px ${color}` : 'none',
      }}
    >
      <span
        style={{
          width: '20px',
          height: '20px',
          minWidth: '20px',
          borderRadius: '50%',
          border: selected ? `6px solid ${color}` : '2px solid #b8b0a4',
          background: '#fff',
          marginTop: '1px',
          transition: 'all 0.2s ease',
        }}
      />
      <span style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '15px', lineHeight: '1.5', color: '#2d2a26' }}>
        {label}
      </span>
    </button>
  )
}

function CheckboxOption({ selected, label, onClick, color }: { selected: boolean; label: string; onClick: () => void; color: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '14px 18px',
        borderRadius: '12px',
        border: selected ? `2px solid ${color}` : '1.5px solid #d4cfc7',
        background: selected ? `${color}11` : '#faf9f6',
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        transition: 'all 0.2s ease',
        boxShadow: selected ? `0 0 0 1px ${color}` : 'none',
      }}
    >
      <span
        style={{
          width: '20px',
          height: '20px',
          minWidth: '20px',
          borderRadius: '6px',
          border: selected ? 'none' : '2px solid #b8b0a4',
          background: selected ? color : '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: '1px',
          transition: 'all 0.2s ease',
          color: '#fff',
          fontSize: '13px',
          fontWeight: 'bold',
        }}
      >
        {selected ? '✓' : ''}
      </span>
      <span style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '15px', lineHeight: '1.5', color: '#2d2a26' }}>
        {label}
      </span>
    </button>
  )
}

export default function SurveyClient({ surveyId, title, description, thankYouTitle, thankYouBody, primaryColor, questions }: SurveyClientProps) {
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const q = questions[currentQ]
  const totalQ = questions.length
  const progress = (currentQ / totalQ) * 100

  const handleSingle = (option: string) => {
    setAnswers({ ...answers, [q.id]: option })
  }

  const handleMulti = (option: string) => {
    const current = (answers[q.id] as string[]) || []
    if (current.includes(option)) {
      setAnswers({ ...answers, [q.id]: current.filter((o) => o !== option) })
    } else if (current.length < q.max) {
      setAnswers({ ...answers, [q.id]: [...current, option] })
    }
  }

  const canProceed = q.type === 'single' ? !!answers[q.id] : ((answers[q.id] as string[]) || []).length > 0

  const goNext = async () => {
    if (currentQ < totalQ - 1) {
      setCurrentQ(currentQ + 1)
    } else {
      setSubmitting(true)
      try {
        await fetch(`/api/surveys/${surveyId}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers }),
        })
      } catch {
        // Still show thank you even if submit fails
      }
      setSubmitting(false)
      setSubmitted(true)
    }
  }

  const goBack = () => {
    if (currentQ > 0) setCurrentQ(currentQ - 1)
  }

  const sectionColors: Record<string, string> = {
    "How You're Feeling Right Now": '#8b6914',
    "Your Children's Spiritual Development": '#1a5c3a',
    "What You're Seeing In Your Children": '#5c3a1a',
    'The Guilt Question': '#6b2d3e',
    'What You Need Most': '#2d4a6b',
    'About Your Family': '#4a4a4a',
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: "'Source Serif 4', Georgia, serif" }}>
        <div style={{ maxWidth: '560px', width: '100%', textAlign: 'center', padding: '48px 32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '24px' }}>🤲</div>
          <h2 style={{ fontSize: '28px', fontWeight: '600', color: primaryColor, marginBottom: '16px', lineHeight: '1.3' }}>
            {thankYouTitle}
          </h2>
          {thankYouBody && (
            <div
              style={{ fontSize: '17px', lineHeight: '1.7', color: '#4a4540', marginBottom: '24px' }}
              dangerouslySetInnerHTML={{ __html: thankYouBody }}
            />
          )}
          <div style={{ marginTop: '40px', padding: '20px', borderRadius: '12px', background: `${primaryColor}11`, border: `1px solid ${primaryColor}33` }}>
            <p style={{ fontSize: '14px', color: primaryColor, fontWeight: '600', marginBottom: '4px' }}>
              Your responses have been recorded
            </p>
            <p style={{ fontSize: '13px', color: '#6b6560' }}>
              {totalQ} questions answered • {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Source Serif 4', Georgia, serif" }}>
      {/* Header */}
      <div style={{ padding: '24px 24px 20px', borderBottom: '1px solid #e8e4de' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          {currentQ === 0 && (
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <p style={{ fontSize: '13px', fontWeight: '600', letterSpacing: '2px', textTransform: 'uppercase', color: primaryColor, marginBottom: '8px' }}>
                Emaan Power
              </p>
              <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#2d2a26', lineHeight: '1.3', marginBottom: '8px' }}>
                {title}
              </h1>
              {description && (
                <p style={{ fontSize: '15px', color: '#6b6560', lineHeight: '1.6', maxWidth: '480px', margin: '0 auto' }}>
                  {description}
                </p>
              )}
            </div>
          )}

          {/* Progress */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ flex: 1, height: '4px', background: '#e8e4de', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: primaryColor, borderRadius: '4px', transition: 'width 0.4s ease' }} />
            </div>
            <span style={{ fontSize: '13px', color: '#9b9590', fontVariantNumeric: 'tabular-nums', minWidth: '40px' }}>
              {currentQ + 1}/{totalQ}
            </span>
          </div>
        </div>
      </div>

      {/* Question */}
      <div style={{ flex: 1, padding: '32px 24px', overflowY: 'auto' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <p style={{
            fontSize: '11px', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase',
            color: sectionColors[q.section] || primaryColor, marginBottom: '12px',
          }}>
            {q.section}
          </p>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#2d2a26', lineHeight: '1.4', marginBottom: '8px' }}>
            {q.question}
          </h2>
          {q.type === 'multi' && q.max < 99 && (
            <p style={{ fontSize: '13px', color: '#9b9590', marginBottom: '8px' }}>Select up to {q.max}</p>
          )}
          {q.type === 'multi' && q.max >= 99 && (
            <p style={{ fontSize: '13px', color: '#9b9590', marginBottom: '8px' }}>Select all that apply</p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
            {q.options.map((option) =>
              q.type === 'single' ? (
                <RadioOption
                  key={option}
                  label={option}
                  selected={answers[q.id] === option}
                  onClick={() => handleSingle(option)}
                  color={primaryColor}
                />
              ) : (
                <CheckboxOption
                  key={option}
                  label={option}
                  selected={((answers[q.id] as string[]) || []).includes(option)}
                  onClick={() => handleMulti(option)}
                  color={primaryColor}
                />
              )
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '16px 24px 24px', borderTop: '1px solid #e8e4de' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={goBack}
            disabled={currentQ === 0}
            style={{
              padding: '10px 20px', borderRadius: '8px', border: '1px solid #d4cfc7', background: 'transparent',
              color: currentQ === 0 ? '#ccc' : '#6b6560', cursor: currentQ === 0 ? 'default' : 'pointer',
              fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '14px',
            }}
          >
            ← Back
          </button>
          <button
            onClick={goNext}
            disabled={!canProceed || submitting}
            style={{
              padding: '12px 32px', borderRadius: '8px', border: 'none',
              background: canProceed ? primaryColor : '#d4cfc7',
              color: canProceed ? '#fff' : '#9b9590',
              cursor: canProceed && !submitting ? 'pointer' : 'default',
              fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '15px', fontWeight: '600',
              transition: 'all 0.2s ease',
            }}
          >
            {submitting ? 'Submitting...' : currentQ === totalQ - 1 ? 'Submit' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  )
}
