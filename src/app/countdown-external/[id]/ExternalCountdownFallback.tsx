'use client'

import { useEffect, useState } from 'react'

/**
 * Simple built-in countdown shown when an external webinar has no Countdown template
 * selected. Props-driven (the server page loads the registration), counts down to the
 * registrant's start time and automatically enters the live room (EverWebinar live page,
 * or the Zoom link for a Zoom pick) when it starts.
 */

type Props = {
  startTime: string | null
  liveRoomUrl: string | null
  name: string
  webinarName: string
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export default function ExternalCountdownFallback({ startTime, liveRoomUrl, name, webinarName }: Props) {
  const [remaining, setRemaining] = useState<number | null>(null)
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    if (!startTime) return
    const startMs = new Date(startTime).getTime()

    const enter = () => {
      if (liveRoomUrl) {
        setJoining(true)
        window.location.href = liveRoomUrl
      }
    }

    const tick = () => {
      const diff = Math.floor((startMs - Date.now()) / 1000)
      setRemaining(diff)
      if (diff <= 0) {
        enter()
        return true
      }
      return false
    }

    if (tick()) return
    const t = setInterval(() => {
      if (tick()) clearInterval(t)
    }, 1000)
    return () => clearInterval(t)
  }, [startTime, liveRoomUrl])

  const firstName = name ? name.split(' ')[0] : ''

  let body: React.ReactNode
  if (!startTime) {
    body = (
      <>
        <h1 className="text-2xl font-bold">You&apos;re registered{firstName ? `, ${firstName}` : ''}!</h1>
        <p className="text-slate-300 mt-3">Check your email for the link to join.</p>
      </>
    )
  } else if (joining || (remaining !== null && remaining <= 0)) {
    body = (
      <>
        <h1 className="text-2xl font-bold">Your webinar is starting…</h1>
        <p className="text-slate-300 mt-3">Taking you into the room now.</p>
        {liveRoomUrl && (
          <a href={liveRoomUrl} className="inline-block mt-5 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold transition-colors">
            Enter the webinar
          </a>
        )}
      </>
    )
  } else {
    const r = remaining ?? 0
    const h = Math.floor(r / 3600)
    const m = Math.floor((r % 3600) / 60)
    const s = r % 60
    body = (
      <>
        <p className="text-blue-300 font-medium">{webinarName}</p>
        <h1 className="text-2xl font-bold mt-1">
          You&apos;re in{firstName ? `, ${firstName}` : ''}! Your webinar starts in
        </h1>
        <div className="mt-6 flex items-center justify-center gap-3 tabular-nums">
          {h > 0 && (
            <div className="flex flex-col items-center">
              <span className="text-5xl font-bold">{pad(h)}</span>
              <span className="text-xs text-slate-400 mt-1 uppercase tracking-wide">hours</span>
            </div>
          )}
          <div className="flex flex-col items-center">
            <span className="text-5xl font-bold">{pad(m)}</span>
            <span className="text-xs text-slate-400 mt-1 uppercase tracking-wide">min</span>
          </div>
          <span className="text-4xl font-bold text-slate-500">:</span>
          <div className="flex flex-col items-center">
            <span className="text-5xl font-bold">{pad(s)}</span>
            <span className="text-xs text-slate-400 mt-1 uppercase tracking-wide">sec</span>
          </div>
        </div>
        <p className="text-slate-400 text-sm mt-6">
          Keep this page open — you&apos;ll be taken into the room automatically when it starts.
        </p>
      </>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4">
      <div className="w-full max-w-lg text-center">{body}</div>
    </div>
  )
}
