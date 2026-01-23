'use client';

import { useState } from 'react';
import { Calendar, Clock, Users, Video, Check, ArrowRight, ArrowLeft } from 'lucide-react';

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

export default function EventRegistrationClient({ event }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Event schedule, 2: Webinar schedule (if bundle), 3: Success
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form state
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

    // If there's a bundled webinar, go to step 2
    if (event.bundledWebinar) {
      setStep(2);
    } else {
      // No bundle, submit directly
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
        const data = await res.json();
        const selectedEventSchedule = event.schedules.find(s => s.id === form.eventScheduleId);
        const selectedWebinarSchedule = event.bundledWebinar?.schedules.find(s => s.id === form.webinarScheduleId);

        setRegistrationResult({
          eventTitle: event.title,
          eventDate: selectedEventSchedule ? formatDate(selectedEventSchedule.startTime) + ' at ' + formatTime(selectedEventSchedule.startTime) : '',
          webinarTitle: event.bundledWebinar?.title,
          webinarDate: selectedWebinarSchedule?.scheduledAt 
            ? formatDate(selectedWebinarSchedule.scheduledAt) + ' at ' + formatTime(selectedWebinarSchedule.scheduledAt)
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

  // Step Indicator
  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
        1
      </div>
      {event.bundledWebinar && (
        <>
          <div className={`w-12 h-1 ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-200'}`} />
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
            2
          </div>
        </>
      )}
      <div className={`w-12 h-1 ${step === 3 ? 'bg-indigo-600' : 'bg-gray-200'}`} />
      <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${step === 3 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
        <Check className="w-4 h-4" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{event.title}</h1>
          {event.hostName && <p className="text-gray-500">Hosted by {event.hostName}</p>}
          {event.description && <p className="text-gray-600 mt-4">{event.description}</p>}
        </div>

        <StepIndicator />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Step 1: Event Schedule Selection */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              Step 1: Select Your Event Time
            </h2>

            <form onSubmit={handleStep1Submit} className="space-y-6">
              {/* Contact Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter your full name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                {event.requirePhone && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="+1 (555) 000-0000"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                )}
              </div>

              {/* Schedule Selection */}
              <div>
                <label className="block text-sm font-medium mb-3">Select a Date & Time *</label>
                <div className="space-y-3">
                  {event.schedules.map(schedule => (
                    <label
                      key={schedule.id}
                      className={`block p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        form.eventScheduleId === schedule.id
                          ? 'border-indigo-600 bg-indigo-50'
                          : schedule.isFull
                          ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                          : 'border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
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
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(schedule.startTime, schedule.timezone)}
                            </div>
                          </div>
                        </div>
                        {schedule.spotsLeft !== null && (
                          <div className="text-sm">
                            {schedule.isFull ? (
                              <span className="text-red-600 font-medium">Full</span>
                            ) : (
                              <span className="text-gray-500 flex items-center gap-1">
                                <Users className="w-3 h-3" /> {schedule.spotsLeft} spots left
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Privacy Consent */}
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={form.privacyConsent}
                  onChange={(e) => setForm({ ...form, privacyConsent: e.target.checked })}
                  className="mt-1 rounded"
                />
                <span className="text-sm text-gray-600">
                  I agree to the privacy policy and consent to receive event communications.
                </span>
              </label>

              {/* Bundle Preview */}
              {event.bundledWebinar && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-purple-700 font-medium mb-2">
                    <Video className="w-4 h-4" />
                    Bonus: Free Webinar Included!
                  </div>
                  <p className="text-sm text-purple-600 mb-1">
                    This event includes access to: <strong>{event.bundledWebinar.title}</strong>
                  </p>
                  {event.bundleDescription && (
                    <p className="text-sm text-gray-600">{event.bundleDescription}</p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2"
              >
                {event.bundledWebinar ? (
                  <>
                    Continue to Webinar Selection <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  submitting ? 'Registering...' : 'Complete Registration'
                )}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Webinar Schedule Selection */}
        {step === 2 && event.bundledWebinar && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
              <Video className="w-5 h-5 text-purple-600" />
              Step 2: Select Webinar Time
            </h2>
            <p className="text-gray-600 mb-6">
              Choose when you'd like to attend: <strong>{event.bundledWebinar.title}</strong>
            </p>

            <form onSubmit={handleStep2Submit} className="space-y-6">
              {/* Webinar Schedule Selection */}
              <div className="space-y-3">
                {event.bundledWebinar.schedules
                  .filter(s => s.scheduleType === 'specific' && s.scheduledAt)
                  .map(schedule => (
                    <label
                      key={schedule.id}
                      className={`block p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        form.webinarScheduleId === schedule.id
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="webinarSchedule"
                          value={schedule.id}
                          checked={form.webinarScheduleId === schedule.id}
                          onChange={(e) => setForm({ ...form, webinarScheduleId: e.target.value, skipWebinar: false })}
                          className="w-4 h-4 text-purple-600"
                        />
                        <div>
                          <div className="font-medium">{formatDate(schedule.scheduledAt!, schedule.timezone)}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(schedule.scheduledAt!, schedule.timezone)}
                            {event.bundledWebinar?.duration && (
                              <span className="text-gray-400"> • {event.bundledWebinar.duration} min</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}

                {/* Just-in-time schedules */}
                {event.bundledWebinar.schedules
                  .filter(s => s.scheduleType === 'justInTime')
                  .map(schedule => (
                    <label
                      key={schedule.id}
                      className={`block p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        form.webinarScheduleId === schedule.id
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="webinarSchedule"
                          value={schedule.id}
                          checked={form.webinarScheduleId === schedule.id}
                          onChange={(e) => setForm({ ...form, webinarScheduleId: e.target.value, skipWebinar: false })}
                          className="w-4 h-4 text-purple-600"
                        />
                        <div>
                          <div className="font-medium">Watch Now</div>
                          <div className="text-sm text-gray-500">
                            Start within {schedule.minutesFromReg} minutes
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
              </div>

              {/* Skip Option */}
              {event.webinarOptional && (
                <label
                  className={`block p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    form.skipWebinar
                      ? 'border-gray-400 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={form.skipWebinar}
                      onChange={(e) => setForm({ ...form, skipWebinar: e.target.checked, webinarScheduleId: '' })}
                      className="w-4 h-4"
                    />
                    <div>
                      <div className="font-medium text-gray-600">Skip webinar for now</div>
                      <div className="text-sm text-gray-500">
                        I'll register for the webinar later
                      </div>
                    </div>
                  </div>
                </label>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
                >
                  {submitting ? 'Registering...' : 'Complete Registration'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && registrationResult && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">You're Registered!</h2>
            <p className="text-gray-600 mb-8">Check your email for confirmation and Zoom details.</p>

            <div className="space-y-4 text-left bg-gray-50 rounded-xl p-6">
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Event</div>
                <div className="font-semibold">{registrationResult.eventTitle}</div>
                <div className="text-sm text-gray-600">{registrationResult.eventDate}</div>
              </div>

              {registrationResult.webinarTitle && registrationResult.webinarDate && (
                <div className="pt-4 border-t">
                  <div className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1">
                    <Video className="w-3 h-3" /> Webinar
                  </div>
                  <div className="font-semibold">{registrationResult.webinarTitle}</div>
                  <div className="text-sm text-gray-600">{registrationResult.webinarDate}</div>
                </div>
              )}
            </div>

            <p className="text-sm text-gray-500 mt-6">
              A confirmation email with all the details has been sent to your inbox.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
