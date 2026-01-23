'use client';

import { useState } from 'react';
import { Calendar, Clock, Users, Video, Check, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';

interface EventSchedule {
  id: string;
  startTime: string;
  endTime?: string;
  timezone: string;
  spotsLeft: number | null;
  isFull: boolean;
}

interface WebinarSchedule {
  id: string;
  scheduledAt?: string;
  scheduleType: string;
  minutesFromReg?: number;
  timezone?: string;
}

interface BundledWebinar {
  id: string;
  title: string;
  slug: string;
  description?: string;
  duration: number;
  schedules: WebinarSchedule[];
}

interface Event {
  id: string;
  title: string;
  slug: string;
  description?: string;
  hostName?: string;
  requirePhone: boolean;
  maxAttendees?: number;
  bundleDescription?: string;
  webinarOptional: boolean;
  schedules: EventSchedule[];
  bundledWebinar: BundledWebinar | null;
}

interface Props {
  event: Event;
}

export default function EmbedEventRegistrationForm({ event }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    eventScheduleId: '',
    webinarScheduleId: '',
    skipWebinar: false,
    privacyConsent: false,
  });

  const [registrationResult, setRegistrationResult] = useState<{
    eventTitle: string;
    eventDate: string;
    webinarTitle?: string;
    webinarDate?: string;
  } | null>(null);

  const formatDate = (dateStr: string, tz?: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: tz,
    });
  };

  const formatTime = (dateStr: string, tz?: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
      timeZone: tz,
    });
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name || !form.email || !form.eventScheduleId) {
      setError('Please fill in all required fields');
      return;
    }

    if (event.requirePhone && !form.phone) {
      setError('Phone number is required');
      return;
    }

    if (!form.privacyConsent) {
      setError('Please accept the privacy policy');
      return;
    }

    if (event.bundledWebinar) {
      setStep(2);
    } else {
      handleFinalSubmit();
    }
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.skipWebinar && !form.webinarScheduleId) {
      setError('Please select a webinar time or skip');
      return;
    }

    handleFinalSubmit();
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/events/${event.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          eventScheduleId: form.eventScheduleId,
          webinarScheduleId: form.skipWebinar ? undefined : form.webinarScheduleId,
          skipWebinar: form.skipWebinar,
          privacyConsent: form.privacyConsent,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });

      if (res.ok) {
        const selectedEventSchedule = event.schedules.find((s) => s.id === form.eventScheduleId);
        const selectedWebinarSchedule = event.bundledWebinar?.schedules.find(
          (s) => s.id === form.webinarScheduleId
        );

        setRegistrationResult({
          eventTitle: event.title,
          eventDate: selectedEventSchedule
            ? formatDate(selectedEventSchedule.startTime) +
              ' at ' +
              formatTime(selectedEventSchedule.startTime)
            : '',
          webinarTitle: event.bundledWebinar?.title,
          webinarDate: selectedWebinarSchedule?.scheduledAt
            ? formatDate(selectedWebinarSchedule.scheduledAt) +
              ' at ' +
              formatTime(selectedWebinarSchedule.scheduledAt)
            : undefined,
        });
        setStep(3);
      } else {
        const data = await res.json();
        setError(data.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Success state
  if (step === 3 && registrationResult) {
    return (
      <>
        <style jsx global>{`
          body {
            margin: 0;
            padding: 0;
            background: transparent !important;
            font-family: system-ui, -apple-system, sans-serif;
          }
        `}</style>
        <div className="p-6 bg-white rounded-2xl shadow-lg max-w-lg mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">You're Registered!</h2>
            <p className="text-gray-600 mb-6">Check your email for confirmation details.</p>

            <div className="bg-gray-50 rounded-xl p-4 text-left space-y-3">
              <div>
                <div className="text-sm text-gray-500">Event</div>
                <div className="font-medium">{registrationResult.eventTitle}</div>
                <div className="text-sm text-gray-600">{registrationResult.eventDate}</div>
              </div>
              {registrationResult.webinarTitle && registrationResult.webinarDate && (
                <div className="border-t pt-3">
                  <div className="text-sm text-gray-500">Bonus Webinar</div>
                  <div className="font-medium">{registrationResult.webinarTitle}</div>
                  <div className="text-sm text-gray-600">{registrationResult.webinarDate}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
          background: transparent !important;
          font-family: system-ui, -apple-system, sans-serif;
        }
        * {
          box-sizing: border-box;
        }
      `}</style>

      <div className="p-4 max-w-lg mx-auto">
        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-6">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
              step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}
          >
            1
          </div>
          {event.bundledWebinar && (
            <>
              <div className={`w-10 h-1 ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-200'}`} />
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                  step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}
              >
                2
              </div>
            </>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Step 1: Event Schedule Selection */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-1">{event.title}</h2>
            {event.hostName && <p className="text-gray-500 text-sm mb-4">Hosted by {event.hostName}</p>}

            <form onSubmit={handleStep1Submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  required
                  className="w-full p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Your name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input
                  type="email"
                  required
                  className="w-full p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              {event.requirePhone && (
                <div>
                  <label className="block text-sm font-medium mb-1">Phone *</label>
                  <input
                    type="tel"
                    required
                    className="w-full p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="+1 (555) 000-0000"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Select Date & Time *</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {event.schedules.map((schedule) => (
                    <label
                      key={schedule.id}
                      className={`block p-3 border-2 rounded-lg cursor-pointer transition-all text-sm ${
                        form.eventScheduleId === schedule.id
                          ? 'border-indigo-600 bg-indigo-50'
                          : schedule.isFull
                          ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                          : 'border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="eventSchedule"
                            value={schedule.id}
                            checked={form.eventScheduleId === schedule.id}
                            onChange={(e) => setForm({ ...form, eventScheduleId: e.target.value })}
                            disabled={schedule.isFull}
                            className="w-4 h-4 text-indigo-600"
                          />
                          <div>
                            <div className="font-medium">{formatDate(schedule.startTime, schedule.timezone)}</div>
                            <div className="text-xs text-gray-500">
                              {formatTime(schedule.startTime, schedule.timezone)}
                            </div>
                          </div>
                        </div>
                        {schedule.spotsLeft !== null && (
                          <span
                            className={`text-xs ${schedule.isFull ? 'text-red-600' : 'text-gray-500'}`}
                          >
                            {schedule.isFull ? 'Full' : `${schedule.spotsLeft} spots`}
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.privacyConsent}
                  onChange={(e) => setForm({ ...form, privacyConsent: e.target.checked })}
                  className="mt-0.5 rounded"
                />
                <span className="text-gray-600">I agree to the privacy policy</span>
              </label>

              {event.bundledWebinar && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm">
                  <div className="flex items-center gap-1 text-purple-700 font-medium">
                    <Video className="w-4 h-4" />
                    Includes: {event.bundledWebinar.title}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2 text-sm"
              >
                {event.bundledWebinar ? (
                  <>
                    Continue <ArrowRight className="w-4 h-4" />
                  </>
                ) : submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Registering...
                  </>
                ) : (
                  'Register Now'
                )}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Webinar Schedule Selection */}
        {step === 2 && event.bundledWebinar && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <button
              onClick={() => setStep(1)}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-4"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <h2 className="text-lg font-semibold mb-1">Select Webinar Time</h2>
            <p className="text-gray-500 text-sm mb-4">{event.bundledWebinar.title}</p>

            <form onSubmit={handleStep2Submit} className="space-y-4">
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {/* Specific schedules */}
                {event.bundledWebinar.schedules
                  .filter((s) => s.scheduleType === 'specific' && s.scheduledAt)
                  .map((schedule) => (
                    <label
                      key={schedule.id}
                      className={`block p-3 border-2 rounded-lg cursor-pointer transition-all text-sm ${
                        form.webinarScheduleId === schedule.id
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="webinarSchedule"
                          value={schedule.id}
                          checked={form.webinarScheduleId === schedule.id}
                          onChange={(e) =>
                            setForm({ ...form, webinarScheduleId: e.target.value, skipWebinar: false })
                          }
                          className="w-4 h-4 text-purple-600"
                        />
                        <div>
                          <div className="font-medium">
                            {formatDate(schedule.scheduledAt!, schedule.timezone)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatTime(schedule.scheduledAt!, schedule.timezone)}
                            {event.bundledWebinar?.duration && ` • ${event.bundledWebinar.duration} min`}
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}

                {/* Just-in-time schedules */}
                {event.bundledWebinar.schedules
                  .filter((s) => s.scheduleType === 'justInTime')
                  .map((schedule) => (
                    <label
                      key={schedule.id}
                      className={`block p-3 border-2 rounded-lg cursor-pointer transition-all text-sm ${
                        form.webinarScheduleId === schedule.id
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="webinarSchedule"
                          value={schedule.id}
                          checked={form.webinarScheduleId === schedule.id}
                          onChange={(e) =>
                            setForm({ ...form, webinarScheduleId: e.target.value, skipWebinar: false })
                          }
                          className="w-4 h-4 text-purple-600"
                        />
                        <div>
                          <div className="font-medium">Watch Immediately</div>
                          <div className="text-xs text-gray-500">
                            Starts {schedule.minutesFromReg || 15} min after registration
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
              </div>

              {/* Skip option if webinar is optional */}
              {event.webinarOptional && (
                <label
                  className={`block p-3 border-2 rounded-lg cursor-pointer transition-all text-sm ${
                    form.skipWebinar
                      ? 'border-gray-600 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="webinarSchedule"
                      checked={form.skipWebinar}
                      onChange={() => setForm({ ...form, webinarScheduleId: '', skipWebinar: true })}
                      className="w-4 h-4"
                    />
                    <span className="font-medium">Skip webinar for now</span>
                  </div>
                </label>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-purple-600 text-white py-2.5 rounded-lg font-semibold hover:bg-purple-700 transition flex items-center justify-center gap-2 text-sm"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Registering...
                  </>
                ) : (
                  'Complete Registration'
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
