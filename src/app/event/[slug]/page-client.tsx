'use client';

import { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, Users, Video, Check, ArrowRight, ArrowLeft, Globe } from 'lucide-react';
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
  thankYouPageUrl?: string;
  thankYouTemplateId?: string;
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

export default function EventRegistrationClient({ event }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Event schedule, 2: Webinar schedule (if bundle), 3: Success
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [webinarScheduleSlots, setWebinarScheduleSlots] = useState<ScheduleSlot[]>([]);
  
  // User timezone detection
  const [userTimezone, setUserTimezone] = useState<string>('');
  
  useEffect(() => {
    // Detect user's timezone on mount
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    setUserTimezone(tz);
  }, []);

  // Form state
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
    gdprConsent: false,
    privacyConsent: false,
    marketingConsent: false,
  });

  const [registrationResult, setRegistrationResult] = useState<{
    eventTitle: string;
    eventDate: string;
    webinarTitle?: string;
    webinarDate?: string;
  } | null>(null);

  // Generate webinar schedule slots (like RegistrationModal does)
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
          allTimeSlots.push({ 
            id: slot.id, 
            time: slot.time, 
            schedule, 
            isRecurring: true 
          });
        });
      }
    });

    // Remove duplicates (within 1 minute)
    const uniqueSlots = allTimeSlots.filter((slot, index, self) => {
      const duplicateIndex = self.findIndex(s => Math.abs(s.time.getTime() - slot.time.getTime()) < 60000);
      return duplicateIndex === index;
    });

    // Sort by time and limit
    uniqueSlots.sort((a, b) => a.time.getTime() - b.time.getTime());
    setWebinarScheduleSlots(uniqueSlots.slice(0, maxSchedulesToShow));
  }, [event.bundledWebinar]);

  const formatDate = (dateStr: string, tz?: string) => {
    // Use provided timezone, or undefined to use browser default
    const timezone = tz && tz.trim() ? tz : undefined;
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: timezone,
    });
  };

  const formatTime = (dateStr: string, tz?: string) => {
    // Use provided timezone, user's timezone, or undefined for browser default
    const timezone = (tz && tz.trim()) ? tz : (userTimezone && userTimezone.trim()) ? userTimezone : undefined;
    const timeStr = new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: timezone,
    });
    const tzName = timezone ? getTimezoneFriendlyName(timezone) : '';
    return tzName ? `${timeStr} (${tzName})` : timeStr;
  };

  // Format Date object directly (for generated slots) - uses user's timezone
  const formatDateFromDate = (date: Date) => {
    const timezone = userTimezone && userTimezone.trim() ? userTimezone : undefined;
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: timezone,
    });
  };

  const formatTimeFromDate = (date: Date) => {
    const timezone = userTimezone && userTimezone.trim() ? userTimezone : undefined;
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: timezone,
    });
    const tzName = timezone ? getTimezoneFriendlyName(timezone) : '';
    return tzName ? `${timeStr} (${tzName})` : timeStr;
  };
  
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
    
    if (!form.studentName || !form.studentAge) {
      setError('Please provide student name and age');
      return;
    }
    
    const age = parseInt(form.studentAge);
    if (isNaN(age) || age < 9 || age > 16) {
      setError('Student age must be between 9 and 16 years');
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
          phone: form.phone ? `${form.phoneCode} ${form.phone}` : undefined,
          studentName: form.studentName,
          studentAge: form.studentAge,
          eventScheduleId: form.eventScheduleId,
          webinarScheduleId: form.skipWebinar ? undefined : form.webinarScheduleId,
          webinarScheduledTime: form.skipWebinar ? undefined : form.webinarScheduledTime || undefined,
          skipWebinar: form.skipWebinar,
          privacyConsent: true, // Always true by default
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
          window.location.href = thankYouUrl;
          return;
        }
        
        // Priority 2: Redirect to thank you template page if template is configured
        if (event.thankYouTemplateId) {
          const templateUrl = `/event-thank-you/${event.slug}?r=${data.registration.id}&s=${form.eventScheduleId}`;
          window.location.href = templateUrl;
          return;
        }
        
        // Otherwise show built-in success step
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
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Phone Number {(event.requirePhone || event.smsReminderEnabled) ? '*' : '(Optional)'}
                  </label>
                  <div className="flex gap-2">
                    <div className="w-1/3 min-w-[100px]">
                      <select
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                        value={form.phoneCode}
                        onChange={(e) => setForm({ ...form, phoneCode: e.target.value })}
                      >
                        {countryCodes.map((c, i) => (
                           <option key={`${c.country}-${i}`} value={c.code}>
                             {c.code} {c.country.substring(0, 3).toUpperCase()}
                           </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-2/3">
                      <input
                        type="tel"
                        required={event.requirePhone || event.smsReminderEnabled}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="000-000-0000"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Student Information */}
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    Student Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Student Name *</label>
                      <input
                        type="text"
                        required
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter student's name"
                        value={form.studentName}
                        onChange={(e) => setForm({ ...form, studentName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Student Age *</label>
                      <input
                        type="number"
                        required
                        min="9"
                        max="16"
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="9-16 years"
                        value={form.studentAge}
                        onChange={(e) => setForm({ ...form, studentAge: e.target.value })}
                      />
                      <p className="text-xs text-amber-600 font-medium mt-1">⚠️ This class is for students aged 9-16 only</p>
                    </div>
                  </div>
                </div>
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
                            <div className="font-medium">{formatDate(schedule.startTime, userTimezone)}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(schedule.startTime)}
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

        {/* Step 2: Webinar Schedule Selection - FANCY VERSION */}
        {step === 2 && event.bundledWebinar && (
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Decorative Header with Gradient */}
            <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 px-8 py-8 relative overflow-hidden">
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-24 -mb-24"></div>
              <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></div>
              <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-pink-300 rounded-full animate-pulse delay-150"></div>
              
              <div className="relative z-10 text-center">
                {/* Bonus Text - More Prominent */}
                <div className="inline-block bg-yellow-400 text-yellow-900 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full mb-4">
                  🎁 BONUS: FREE CLASS FOR PARENTS
                </div>
                
                {/* Webinar Title - Grand Display */}
                <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3 leading-tight">
                  {event.bundledWebinar.title}
                </h2>
                
                {/* Instructor */}
                <p className="text-purple-100 text-sm md:text-base font-medium mb-4">
                  Taught by <span className="text-white font-bold">Ustadha Ariba Farheen</span>
                </p>
                
                {/* Webinar Description */}
                {event.bundledWebinar.description && (
                  <p className="text-purple-100 text-sm max-w-2xl mx-auto mb-4">
                    {event.bundledWebinar.description}
                  </p>
                )}
                
                {/* Duration Badge */}
                {event.bundledWebinar.duration && (
                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    <Clock className="w-4 h-4 text-white" />
                    <span className="text-white text-sm font-medium">{event.bundledWebinar.duration} Minutes</span>
                  </div>
                )}
              </div>
            </div>

            {/* Form Content */}
            <div className="px-8 py-8">
              <form onSubmit={handleStep2Submit} className="space-y-6">
                {/* Timezone Info */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
                  <div className="bg-blue-100 rounded-full p-2">
                    <Globe className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      Times shown in your timezone
                    </p>
                    <p className="text-xs text-gray-600">
                      {getTimezoneFriendlyName(userTimezone)} ({userTimezone})
                    </p>
                  </div>
                </div>
                
                {/* Schedule Dropdown Selection */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-600" />
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
                    className={`w-full px-4 py-4 border-2 rounded-xl text-base font-medium transition-all appearance-none cursor-pointer bg-white ${
                      form.webinarScheduleId 
                        ? 'border-purple-500 bg-purple-50 text-purple-900' 
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 1rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em',
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
                  <label
                    className={`block p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      form.skipWebinar
                        ? 'border-gray-400 bg-gray-100'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={form.skipWebinar}
                        onChange={(e) => setForm({ ...form, skipWebinar: e.target.checked, webinarScheduleId: '' })}
                        className="w-4 h-4 rounded"
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

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-200 transition flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-xl font-bold hover:from-purple-700 hover:to-indigo-700 transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Registering...
                      </>
                    ) : (
                      <>
                        Complete Registration <Check className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
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
