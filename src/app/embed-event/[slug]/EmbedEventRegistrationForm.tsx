'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Video, Check, ArrowRight, ArrowLeft, Loader2, Globe } from 'lucide-react';
import { countryCodes } from '@/lib/country-codes'; // Import country codes

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
  recurringPattern?: string;
}

interface BundledWebinar {
  id: string;
  title: string;
  slug: string;
  description?: string;
  duration: number;
  roundJITTo15Minutes?: boolean;
  maxSchedulesToShow?: number;
  schedules: WebinarSchedule[];
}

interface Event {
  id: string;
  title: string;
  slug: string;
  description?: string;
  hostName?: string;
  requirePhone: boolean;
  smsReminderEnabled: boolean;
  maxAttendees?: number;
  bundleDescription?: string;
  webinarOptional: boolean;
  thankYouPageUrl?: string; // Added field
  thankYouTemplateId?: string; // Added field
  schedules: EventSchedule[];
  bundledWebinar: BundledWebinar | null;
}

interface Props {
  event: Event;
}

// Schedule slot for display
interface ScheduleSlot {
  id: string;
  time: Date;
  schedule: WebinarSchedule;
  isRecurring: boolean;
  displayLabel?: string;
}

// Helper to round to nearest 15 minutes
function roundToNearest15Minutes(date: Date): Date {
  const ms = 1000 * 60 * 15;
  return new Date(Math.ceil(date.getTime() / ms) * ms);
}

// Generate recurring slots from pattern
function generateRecurringSlots(schedule: WebinarSchedule, count: number = 5): { id: string; time: Date; baseScheduleId: string }[] {
  const slots: { id: string; time: Date; baseScheduleId: string }[] = [];
  if (!schedule.recurringPattern) return slots;
  
  try {
    const pattern = JSON.parse(schedule.recurringPattern);
    const now = new Date();
    
    if (pattern.interval === 'daily') {
      const [hours, minutes] = pattern.time.split(':').map(Number);
      for (let i = 0; i < count + 5; i++) {
        const slotDate = new Date();
        slotDate.setDate(now.getDate() + i);
        slotDate.setHours(hours, minutes, 0, 0);
        if (slotDate > now && slots.length < count) {
          slots.push({ id: `${schedule.id}-slot-${slots.length}`, time: slotDate, baseScheduleId: schedule.id });
        }
      }
    } else if (pattern.interval === 'weekly' && pattern.daysOfWeek) {
      const daysMap: Record<string, number> = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };
      const [hours, minutes] = pattern.time.split(':').map(Number);
      const targetDays = pattern.daysOfWeek.map((d: any) => typeof d === 'number' ? d : daysMap[d]).sort((a: number, b: number) => a - b);
      
      let currentDate = new Date(now);
      for (let week = 0; week < 20 && slots.length < count; week++) {
        for (const targetDay of targetDays) {
          if (slots.length >= count) break;
          const slotDate = new Date(currentDate);
          const currentDay = slotDate.getDay();
          const daysUntilTarget = (targetDay - currentDay + 7) % 7;
          slotDate.setDate(slotDate.getDate() + daysUntilTarget + (week > 0 ? 7 * week : 0));
          slotDate.setHours(hours, minutes, 0, 0);
          if (slotDate > now) {
            slots.push({ id: `${schedule.id}-slot-${slots.length}`, time: slotDate, baseScheduleId: schedule.id });
          }
        }
      }
    }
  } catch (e) {
    console.error('Error parsing recurring pattern:', e);
  }
  
  return slots;
}

export default function EmbedEventRegistrationForm({ event }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [webinarScheduleSlots, setWebinarScheduleSlots] = useState<ScheduleSlot[]>([]);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    phoneCode: '+1',
    studentName: '',
    studentAge: '',
    eventScheduleId: '',
    webinarScheduleId: '',
    webinarScheduledTime: '',
    skipWebinar: false,
    privacyConsent: true,
    marketingConsent: false,
    gdprConsent: false,
  });

  const [userTimezone, setUserTimezone] = useState<string>('');

  useEffect(() => {
    // Detect user's timezone on mount
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    setUserTimezone(tz);
  }, []);

  const [registrationResult, setRegistrationResult] = useState<{
    eventTitle: string;
    eventDate: string;
    webinarTitle?: string;
    webinarDate?: string;
  } | null>(null);

  // Generate webinar schedule slots
  useEffect(() => {
    if (!event.bundledWebinar?.schedules) return;

    const maxSchedulesToShow = event.bundledWebinar.maxSchedulesToShow ?? 5;
    const roundJIT = event.bundledWebinar.roundJITTo15Minutes ?? true;
    const allTimeSlots: ScheduleSlot[] = [];
    const now = new Date();

    event.bundledWebinar.schedules.forEach((schedule) => {
      if (schedule.scheduleType === 'specific' && schedule.scheduledAt) {
        const scheduleTime = new Date(schedule.scheduledAt);
        if (scheduleTime > now) {
          allTimeSlots.push({ id: schedule.id, time: scheduleTime, schedule, isRecurring: false });
        }
      } else if (schedule.scheduleType === 'justInTime') {
        const jitTime = new Date();
        jitTime.setMinutes(jitTime.getMinutes() + (schedule.minutesFromReg || 5));
        const finalJitTime = roundJIT ? roundToNearest15Minutes(jitTime) : jitTime;
        allTimeSlots.push({ 
          id: schedule.id, 
          time: finalJitTime, 
          schedule, 
          isRecurring: false,
          displayLabel: 'Watch Now'
        });
      } else if (schedule.scheduleType === 'recurring' && schedule.recurringPattern) {
        const slots = generateRecurringSlots(schedule, maxSchedulesToShow * 3);
        slots.forEach((slot) => {
          allTimeSlots.push({ id: slot.id, time: slot.time, schedule, isRecurring: true });
        });
      }
    });

    // Remove duplicates (within 1 minute)
    const uniqueSlots = allTimeSlots.filter((slot, index, self) => {
      const duplicateIndex = self.findIndex(s => Math.abs(s.time.getTime() - slot.time.getTime()) < 60000);
      return duplicateIndex === index;
    });

    uniqueSlots.sort((a, b) => a.time.getTime() - b.time.getTime());
    setWebinarScheduleSlots(uniqueSlots.slice(0, maxSchedulesToShow));
  }, [event.bundledWebinar]);

  // Default select first available event schedule
  useEffect(() => {
    if (event.schedules && event.schedules.length > 0 && !form.eventScheduleId) {
      const firstAvailable = event.schedules.find(s => !s.isFull);
      if (firstAvailable) {
        setForm(prev => ({ ...prev, eventScheduleId: firstAvailable.id }));
      }
    }
  }, [event.schedules]);

  // Default select first available webinar schedule (when slots are generated)
  useEffect(() => {
    // Only auto-select if user is on step 2 (or prepared for it) and hasn't made a choice yet
    if (webinarScheduleSlots.length > 0 && !form.webinarScheduleId && !form.skipWebinar) {
      const first = webinarScheduleSlots[0];
      setForm(prev => ({ 
        ...prev, 
        webinarScheduleId: first.id,
        webinarScheduledTime: first.time.toISOString(),
      }));
    }
  }, [webinarScheduleSlots]);

  // Get friendly timezone name
  const getTimezoneFriendlyName = (tz: string) => {
    const tzNames: Record<string, string> = {
      'America/New_York': 'Eastern Time',
      'America/Chicago': 'Central Time',
      'America/Denver': 'Mountain Time',
      'America/Los_Angeles': 'Pacific Time',
      'America/Toronto': 'Eastern Time',
      'Europe/London': 'GMT',
      'Europe/Paris': 'Central European Time',
      'Asia/Dubai': 'Gulf Time',
      'Asia/Karachi': 'Pakistan Time',
      'Asia/Kolkata': 'India Time',
      'Asia/Singapore': 'Singapore Time',
      'Australia/Sydney': 'Australian Eastern Time',
      'UTC': 'UTC',
    };
    return tzNames[tz] || tz.replace(/_/g, ' ').split('/').pop() || tz;
  };

  const formatDate = (dateStr: string, tz?: string) => {
    const timezone = tz && tz.trim() ? tz : (userTimezone && userTimezone.trim()) ? userTimezone : undefined;
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: timezone,
    });
  };

  const formatTime = (dateStr: string, tz?: string) => {
    const timezone = tz && tz.trim() ? tz : (userTimezone && userTimezone.trim()) ? userTimezone : undefined;
    const timeStr = new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: timezone,
    });
    const tzName = timezone ? getTimezoneFriendlyName(timezone) : '';
    return tzName ? `${timeStr} (${tzName})` : timeStr;
  };

  // Format Date object directly (for generated slots)
  const formatDateFromDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTimeFromDate = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
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

    // If skipWebinar is unchecked but no time selected, treat as skip (implicit skip)
    // The user requested: "if someone doesn't select a webinar time and doesn't tick skip for now, consider it a skip"
    const implicitSkip = !form.skipWebinar && !form.webinarScheduleId;

    handleFinalSubmit(implicitSkip);
  };

  const handleFinalSubmit = async (forceSkipWebinar?: boolean) => {
    setSubmitting(true);
    setError('');

    // Determine effective skip state
    const effectiveSkipWebinar = forceSkipWebinar !== undefined ? forceSkipWebinar : form.skipWebinar;

    try {
      const res = await fetch(`/api/events/${event.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone ? `${form.phoneCode} ${form.phone}` : undefined,
          studentName: form.studentName,
          eventScheduleId: form.eventScheduleId,
          webinarScheduleId: effectiveSkipWebinar ? undefined : form.webinarScheduleId,
          webinarScheduledTime: effectiveSkipWebinar ? undefined : form.webinarScheduledTime || undefined,
          skipWebinar: effectiveSkipWebinar,
          privacyConsent: form.privacyConsent,
          marketingConsent: form.marketingConsent,
          gdprConsent: form.gdprConsent,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        
        // Priority 1: Redirect to custom thank you page URL if configured
        if (event.thankYouPageUrl) {
          const thankYouUrl = event.thankYouPageUrl.startsWith('http') 
            ? event.thankYouPageUrl 
            : event.thankYouPageUrl;
          window.top!.location.href = thankYouUrl; // Use window.top for embed
          return;
        }
        
        // Priority 2: Redirect to thank you template page if template is configured
        if (event.thankYouTemplateId) {
          const templateUrl = `/event-thank-you/${event.slug}?r=${data.registration.id}&s=${form.eventScheduleId}`;
          window.top!.location.href = templateUrl; // Use window.top for embed
          return;
        }

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
            <h2 className="text-lg font-semibold mb-1 text-gray-900">{event.title}</h2>
            {event.hostName && <p className="text-gray-500 text-sm mb-4">Hosted by {event.hostName}</p>}

            <form onSubmit={handleStep1Submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900">Select Date & Time *</label>
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
                            <div className="font-medium text-gray-900">{formatDate(schedule.startTime, userTimezone)}</div>
                            <div className="text-xs text-gray-500">
                              {formatTime(schedule.startTime, userTimezone)}
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

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900">Name *</label>
                <input
                  type="text"
                  required
                  className="w-full p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900"
                  placeholder="Your name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900">Email *</label>
                <input
                  type="email"
                  required
                  className="w-full p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900">
                  Phone {(event.requirePhone || event.smsReminderEnabled) ? '*' : '(Optional)'}
                </label>
                <div className="flex gap-2">
                  <div className="w-1/3 min-w-[100px]">
                    <select
                      className="w-full p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900"
                      value={form.phoneCode}
                      onChange={(e) => setForm({ ...form, phoneCode: e.target.value })}
                    >
                      {countryCodes.map((c, i) => (
                        <option key={`${c.country}-${i}`} value={c.code}>
                          {c.iso ? c.iso : c.country.substring(0, 3).toUpperCase()} {c.code}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-2/3">
                    <input
                      type="tel"
                      required={event.requirePhone || event.smsReminderEnabled}
                      className="w-full p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900"
                      placeholder="000-000-0000"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Student Information */}
              <div className="pt-2 border-t border-gray-200 mt-2">
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">Student Info</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-900">Student Name *</label>
                    <input
                      type="text"
                      required
                      className="w-full p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900"
                      placeholder="Enter student's name"
                      value={form.studentName}
                      onChange={(e) => setForm({ ...form, studentName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-900">Student Age *</label>
                    <input
                      type="number"
                      required
                      min="9"
                      max="16"
                      className="w-full p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900"
                      placeholder="9-16 years"
                      value={form.studentAge}
                      onChange={(e) => setForm({ ...form, studentAge: e.target.value })}
                    />
                    <p className="text-xs text-amber-600 font-medium mt-1">⚠️ Class is for students aged 9-16 only</p>
                  </div>
                </div>
              </div>

              {event.bundledWebinar && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm mb-4">
                  <div className="flex items-center gap-1 text-purple-700 font-medium">
                    <Video className="w-4 h-4" />
                    Includes: {event.bundledWebinar.title}
                  </div>
                </div>
              )}

              <div className="relative z-10 flex items-start gap-3 py-3 my-2 bg-gray-50/50 rounded-lg px-3 border border-gray-100">
                <input
                  type="checkbox"
                  id="privacyConsent"
                  checked={form.privacyConsent}
                  onChange={(e) => setForm({ ...form, privacyConsent: e.target.checked })}
                  className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="privacyConsent" className="text-xs text-gray-600 leading-snug cursor-pointer select-none">
                  I agree to the <a href="#" className="text-indigo-600 hover:text-indigo-800 font-medium underline">Privacy Policy</a> and <a href="#" className="text-indigo-600 hover:text-indigo-800 font-medium underline">Terms of Service</a>.
                </label>
              </div>

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
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
            {/* Decorative Header with Gradient */}
            <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 px-6 py-6 relative overflow-hidden">
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-24 -mb-24"></div>
              <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></div>
              <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-pink-300 rounded-full animate-pulse delay-150"></div>
              
              <div className="relative z-10 text-center">
                {/* Bonus Text */}
                <div className="inline-block bg-yellow-400 text-yellow-900 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-3">
                  🎁 BONUS: FREE CLASS FOR PARENTS
                </div>
                
                {/* Webinar Title */}
                <h2 className="text-xl font-extrabold text-white mb-2 leading-tight">
                  {event.bundledWebinar.title}
                </h2>
                
                {/* Instructor */}
                <p className="text-purple-100 text-sm font-medium mb-3">
                  Taught by <span className="text-white font-bold">Ustadha Ariba Farheen</span>
                </p>
                
                {/* Webinar Description */}
                {event.bundledWebinar.description && (
                  <p className="text-purple-100 text-xs max-w-md mx-auto mb-3 line-clamp-2">
                    {event.bundledWebinar.description}
                  </p>
                )}
                
                {/* Duration Badge */}
                {/* Duration removed as requested */}
              </div>
            </div>

            {/* Form Content */}
            <div className="px-6 py-6">
              <form onSubmit={handleStep2Submit} className="space-y-4">
                {/* Timezone Info */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3 flex items-center gap-3">
                  <div className="bg-blue-100 rounded-full p-1.5">
                    <Globe className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-800">
                      Times shown in your timezone
                    </p>
                    <p className="text-[10px] text-gray-600">
                      {userTimezone}
                    </p>
                  </div>
                </div>

                {/* Schedule Dropdown Selection */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-purple-600" />
                    Select Your Preferred Time
                  </label>
                  <select
                    value={form.webinarScheduleId}
                    onChange={(e) => {
                      const selectedSlot = webinarScheduleSlots.find(s => s.id === e.target.value);
                      setForm({ 
                        ...form, 
                        webinarScheduleId: e.target.value,
                        webinarScheduledTime: selectedSlot ? selectedSlot.time.toISOString() : '',
                        skipWebinar: false 
                      });
                    }}
                    className={`w-full px-3 py-3 border-2 rounded-xl text-sm font-medium transition-all appearance-none cursor-pointer bg-white ${
                      form.webinarScheduleId 
                        ? 'border-purple-500 bg-purple-50 text-purple-900' 
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.75rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.25em 1.25em',
                    }}
                  >
                    <option value="">✨ Choose your preferred time...</option>
                    {webinarScheduleSlots.map(slot => (
                      <option key={slot.id} value={slot.id}>
                        {slot.displayLabel 
                          ? `${slot.displayLabel} - ${formatTimeFromDate(slot.time)}`
                          : `${formatDateFromDate(slot.time)} at ${formatTimeFromDate(slot.time)}`
                        }
                        {slot.schedule.scheduleType === 'justInTime' ? ' ⚡ Starts Soon!' : ''}
                      </option>
                    ))}
                  </select>

                  {webinarScheduleSlots.length === 0 && (
                    <div className="mt-4 text-center py-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                      <Video className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">No available webinar times at the moment</p>
                    </div>
                  )}
                </div>

                {/* Skip Option */}
                {event.webinarOptional && (
                  <div className="flex justify-center pt-1">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.skipWebinar}
                        onChange={(e) => setForm({ ...form, skipWebinar: e.target.checked, webinarScheduleId: '' })}
                        className="w-3.5 h-3.5 rounded border-gray-300 text-gray-400 focus:ring-gray-400"
                      />
                      <span className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                        Skip webinar for now
                      </span>
                    </label>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition flex items-center justify-center gap-2 text-sm"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-bold hover:from-purple-700 hover:to-indigo-700 transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-sm"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Registering...
                      </>
                    ) : (
                      <>
                        Complete <Check className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
