'use client';

import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar, CheckCircle, AlertCircle, Globe } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { roundToNearest15Minutes } from '@/lib/webinarSchedule';

interface Props {
  onClose: () => void;
  webinar: any;
  countryCodes: Array<{ code: string; country: string; pattern: RegExp }>;
  splitTestId?: string;
  variantId?: string;
  leadPageId?: string;
}

export default function RegistrationModal({ onClose, webinar, countryCodes, splitTestId, variantId, leadPageId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedSchedule, setSelectedSchedule] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneCode: '+1',
    phoneNumber: '',
    privacyConsent: true
  });
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState('');
  
  // State to hold tracking parameters from parent or URL
  const [trackingParams, setTrackingParams] = useState<{ st?: string | null, v?: string | null, lp?: string | null }>({
    st: splitTestId || searchParams.get('st'),
    v: variantId || searchParams.get('v'),
    lp: leadPageId || searchParams.get('leadPageId') || searchParams.get('lp')
  });

  useEffect(() => {
    console.log('RegistrationModal Initialization:', {
      props: { splitTestId, variantId, leadPageId },
      searchParams: {
        st: searchParams.get('st'),
        v: searchParams.get('v'),
        lp: searchParams.get('lp'),
        leadPageId: searchParams.get('leadPageId')
      },
      trackingParams
    });
  }, []);

  const [selectedTimezone, setSelectedTimezone] = useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    } catch {
      return 'UTC'
    }
  })
  const [showTimezoneSelector, setShowTimezoneSelector] = useState(false)
  const [scheduleOptions, setScheduleOptions] = useState<any[]>([])

  // Helpers copied from page-client.tsx
  const getTimezoneFriendlyName = (timezoneValue: string): string => {
    // Basic implementation since we don't have the full list here yet
    // In a real refactor, move this to a shared util
    return timezoneValue.split('/').pop()?.replace(/_/g, ' ') || timezoneValue
  }

  const generateRecurringSlots = (schedule: any, count: number = 5) => {
    const slots: { id: string; time: Date; baseScheduleId: string }[] = []
    const pattern = JSON.parse(schedule.recurringPattern || '{}')
    const now = new Date()
    
    if (pattern.interval === 'daily') {
      const [hours, minutes] = pattern.time.split(':').map(Number)
      for (let i = 0; i < count; i++) {
        const slotDate = new Date()
        slotDate.setDate(now.getDate() + i)
        slotDate.setHours(hours, minutes, 0, 0)
        if (slotDate > now) {
          slots.push({ id: `${schedule.id}-slot-${i}`, time: slotDate, baseScheduleId: schedule.id })
        } else if (i === 0) {
          const tomorrow = new Date()
          tomorrow.setDate(now.getDate() + 1)
          tomorrow.setHours(hours, minutes, 0, 0)
          slots.push({ id: `${schedule.id}-slot-${i}`, time: tomorrow, baseScheduleId: schedule.id })
        }
      }
      while (slots.length < count) {
        const lastSlot = slots[slots.length - 1]
        const nextSlot = new Date(lastSlot.time)
        nextSlot.setDate(nextSlot.getDate() + 1)
        slots.push({ id: `${schedule.id}-slot-${slots.length}`, time: nextSlot, baseScheduleId: schedule.id })
      }
    } else if (pattern.interval === 'weekly' && pattern.daysOfWeek) {
      const daysMap: Record<string, number> = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 }
      const [hours, minutes] = pattern.time.split(':').map(Number)
      const targetDays = pattern.daysOfWeek.map((d: any) => typeof d === 'number' ? d : daysMap[d]).sort((a: number, b: number) => a - b)
      
      let currentDate = new Date(now)
      let slotsGenerated = 0
      for (let week = 0; week < 20 && slotsGenerated < count; week++) {
        for (const targetDay of targetDays) {
          if (slotsGenerated >= count) break
          const slotDate = new Date(currentDate)
          const currentDay = slotDate.getDay()
          const daysUntilTarget = (targetDay - currentDay + 7) % 7
          if (week === 0 && daysUntilTarget === 0) {
            slotDate.setHours(hours, minutes, 0, 0)
            if (slotDate > now) {
              slots.push({ id: `${schedule.id}-slot-${slotsGenerated}`, time: slotDate, baseScheduleId: schedule.id })
              slotsGenerated++
            }
          } else {
            slotDate.setDate(slotDate.getDate() + daysUntilTarget + (week > 0 ? 7 * week : 0))
            slotDate.setHours(hours, minutes, 0, 0)
            if (slotDate > now) {
              slots.push({ id: `${schedule.id}-slot-${slotsGenerated}`, time: slotDate, baseScheduleId: schedule.id })
              slotsGenerated++
            }
          }
        }
        if (week === 0) currentDate.setDate(currentDate.getDate() + 7)
      }
    }
    return slots
  }

  const formatScheduleTime = (schedule: any, slotTime?: Date) => {
    const tz = selectedTimezone
    const tzFriendly = getTimezoneFriendlyName(tz)
    
    if (slotTime) {
      const dateStr = slotTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', timeZone: tz })
      const timeStr = slotTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: tz })
      return `${dateStr}, ${timeStr} • ${tzFriendly}`
    }
    
    if (schedule.scheduleType === 'justInTime') {
      const futureTime = new Date()
      futureTime.setMinutes(futureTime.getMinutes() + (schedule.minutesFromReg || 0))
      const shouldRound = webinar?.roundJITTo15Minutes !== false
      const finalTime = shouldRound ? roundToNearest15Minutes(futureTime) : futureTime
      const dateStr = finalTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', timeZone: tz })
      const timeStr = finalTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: tz })
      return `${dateStr}, ${timeStr} • ${tzFriendly}`
    }

    if (schedule.scheduleType === 'specific' && schedule.scheduledAt) {
        const date = new Date(schedule.scheduledAt)
        const dateStr = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', timeZone: tz })
        const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: tz })
        return `${dateStr}, ${timeStr} • ${tzFriendly}`
    }
    
    return 'Schedule to be determined'
  }

  // Pre-calculate slots on mount
  useEffect(() => {
    if (!webinar || !webinar.schedules) return

    const maxSchedulesToShow = webinar.maxSchedulesToShow || 5
    const allTimeSlots: any[] = []
    const now = new Date()

    webinar.schedules.forEach((schedule: any) => {
      if (schedule.scheduleType === 'specific' && schedule.scheduledAt) {
        const scheduleTime = new Date(schedule.scheduledAt)
        if (scheduleTime > now) {
          allTimeSlots.push({ id: schedule.id, time: scheduleTime, schedule, isRecurring: false })
        }
      } else if (schedule.scheduleType === 'justInTime') {
        const jitTime = new Date()
        jitTime.setMinutes(jitTime.getMinutes() + (schedule.minutesFromReg || 5))
        const shouldRound = webinar.roundJITTo15Minutes !== false
        const finalJitTime = shouldRound ? roundToNearest15Minutes(jitTime) : jitTime
        allTimeSlots.push({ id: schedule.id, time: finalJitTime, schedule, isRecurring: false })
      } else if (schedule.scheduleType === 'recurring') {
        const slots = generateRecurringSlots(schedule, maxSchedulesToShow * 3)
        slots.forEach((slot) => {
          allTimeSlots.push({ id: slot.id, time: slot.time, schedule, isRecurring: true })
        })
      }
    })

    const uniqueSlots = allTimeSlots.filter((slot, index, self) => {
      const duplicateIndex = self.findIndex(s => Math.abs(s.time.getTime() - slot.time.getTime()) < 60000)
      return duplicateIndex === index
    })

    uniqueSlots.sort((a, b) => a.time.getTime() - b.time.getTime())
    const finalSlots = uniqueSlots.slice(0, maxSchedulesToShow)
    setScheduleOptions(finalSlots)
    
    if (finalSlots.length > 0) {
      setSelectedSchedule(finalSlots[0].id)
    }
  }, [webinar])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setRegistering(true);

    try {
      if (!selectedSchedule) {
        throw new Error('Please select a time');
      }

      // Logic from page-client.tsx to pinpoint start time
      let scheduleId = selectedSchedule
      let scheduleData = scheduleOptions.find(s => s.id === selectedSchedule)
      let selectedDateTime = scheduleData?.time.toISOString()
      let scheduledStartTime = selectedDateTime

      // Handling recurring vs specific logic (simplified)
      // If the ID contains -slot-, it's recurring specific instance
      if (scheduleId.includes('-slot-')) {
          const parts = scheduleId.split('-slot-')
          scheduleId = parts[0]
      } else if (scheduleData?.schedule.scheduleType === 'justInTime') {
          // Keep the ID but use calculated time
      }

      if (!scheduledStartTime) {
         // Fallback
         scheduledStartTime = new Date().toISOString()
      }

      // Check if webinar starts within 15 minutes
      const now = Date.now()
      const startTime = new Date(scheduledStartTime).getTime()
      const minutesUntilStart = (startTime - now) / (1000 * 60)
      const shouldRedirectToCountdown = minutesUntilStart <= 15 && minutesUntilStart > 0

      // Format phone number if provided
      const fullPhone = formData.phoneNumber 
        ? `${formData.phoneCode} ${formData.phoneNumber.replace(/\D/g, '')}`
        : '';

      const res = await fetch(`/api/webinars/${webinar!.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: formData.name.trim(),
            email: formData.email.trim().toLowerCase(),
            phone: fullPhone.trim(),
            scheduleId: scheduleId,
            selectedDateTime: selectedDateTime,
            scheduledStartTime: scheduledStartTime,
            timezone: selectedTimezone,
            privacyConsent: formData.privacyConsent,
            country: 'US', // TODO: Get actual country
            splitTestId: trackingParams.st,
            variantId: trackingParams.v,
            leadPageId: trackingParams.lp
        }),
      });

      // Check content type
      const contentType = res.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned an invalid response (not JSON)')
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Handle "already registered" case - redirect to countdown/room with their existing registration
      if (data.alreadyRegistered) {
        console.log('📋 User already registered - redirecting to countdown page...')
        const redirectUrl = data.links?.countdown || `/countdown/${webinar!.slug}?r=${data.registrationId}`
        try {
          if (window.top && window.top !== window) {
            window.top.location.href = redirectUrl;
          } else {
            window.location.href = redirectUrl;
          }
        } catch (e) {
          window.location.href = redirectUrl;
        }
        return;
      }

      console.log('Registration successful, attempting tracking with:', trackingParams);

      // Track Split Test conversion
      if (trackingParams.st && trackingParams.v && data.registrationId) {
         try {
           const payload = JSON.stringify({
             splitTestId: trackingParams.st,
             variantId: trackingParams.v,
             registrationId: data.registrationId,
           })
           
           if (navigator.sendBeacon) {
             const blob = new Blob([payload], { type: 'application/json' })
             navigator.sendBeacon('/api/split-tests/track-conversion', blob)
           } else {
             fetch('/api/split-tests/track-conversion', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: payload,
               keepalive: true
             }).catch(() => {})
           }
         } catch (e) {
           console.error('Failed to track split test conversion', e);
         }
      } 
      // Track Standalone Lead Page Conversion
      else if (trackingParams.lp && data.registrationId) {
         try {
           const payload = JSON.stringify({
             leadPageId: trackingParams.lp,
             registrationId: data.registrationId,
           })
           
           if (navigator.sendBeacon) {
             const blob = new Blob([payload], { type: 'application/json' })
             navigator.sendBeacon('/api/lead-pages/track-conversion', blob)
           } else {
             fetch('/api/lead-pages/track-conversion', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: payload,
               keepalive: true
             }).catch(() => {})
           }
         } catch (e) {
           console.error('Failed to track lead page conversion', e);
         }
      }
      
      // Success Redirect Logic
      let redirectUrl: string
      if (shouldRedirectToCountdown) {
        redirectUrl = `/countdown/${webinar!.slug}?r=${data.registrationId}`
      } else {
        redirectUrl = `/thank-you/${webinar!.slug}?r=${data.registrationId}&s=${scheduleId}`
      }
      
      // Ensure we redirect the parent window if we are inside an iframe
      try {
        if (window.top && window.top !== window) {
           window.top.location.href = redirectUrl;
        } else {
           window.location.href = redirectUrl;
        }
      } catch (e) {
        // Fallback if cross-origin access is strictly blocked
        window.location.href = redirectUrl;
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message);
      setRegistering(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Effect to grab params from window.parent if available (same-origin fix)
  useEffect(() => {
    // If we already have them from props or searchParams (iframe URL), skip
    if (trackingParams.st && trackingParams.v) return;

    try {
       // Check if we are in an iframe
       if (window.self !== window.top) {
          // Try to access parent - this works if same-origin (e.g. platform Lead Page -> Embed Modal)
          const parentUrl = new URL(window.parent.location.href);
          const parentParams = parentUrl.searchParams;
          const st = parentParams.get('st');
          const v = parentParams.get('v');
          const lp = parentParams.get('lp') || parentParams.get('leadPageId');
          
          if (st || v || lp) {
            setTrackingParams(prev => ({
              st: st || prev.st,
              v: v || prev.v,
              lp: lp || prev.lp
            }));
            console.log('🔗 [RegistrationModal] Captured tracking params from parent window', { st, v, lp });
          }
       }
    } catch (e) {
      // Cross-origin access blocked - expected for external embeds
      // In that case, we can't get the params unless passed via postMessage or src
      // console.log('Cross-origin parent access blocked');
    }
    
    // Also listen for postMessage (External embeds using our script)
    const handleMessage = (event: MessageEvent) => {
       if (event.data?.type === 'WEBINAR_TRACKING_PARAMS') {
          setTrackingParams(prev => ({
              st: event.data.st || prev.st,
              v: event.data.v || prev.v,
              lp: event.data.lp || event.data.leadPageId || prev.lp
          }));
       }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all w-full max-w-lg mx-4">
             {/* Gradient Header */}
             <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-4 relative overflow-hidden">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/80 hover:text-white focus:outline-none z-10"
                >
                    <X className="h-6 w-6" />
                </button>
                
                {/* Decorative circles */}
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-30 h-30 bg-blue-400 opacity-20 rounded-full blur-xl"></div>
                
                <h3 className="text-2xl font-extrabold text-white mb-1 tracking-tight relative z-10">Secure Your Spot!</h3>
                <p className="text-purple-100 text-sm font-medium relative z-10">Join thousands who've already registered</p>
                
                <div className="flex items-center gap-4 mt-3 relative z-10">
                    <div className="flex items-center gap-1.5 bg-white/10 px-2 py-0.5 rounded text-xs text-white font-medium backdrop-blur-sm border border-white/10">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                    <span>100% Secure</span>
                    </div>
                </div>
            </div>

            <div className="px-8 py-6">
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-800">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name */}
                    <div>
                        <input
                            type="text"
                            name="name"
                            required
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-gray-900 placeholder-gray-400 font-medium shadow-sm"
                            placeholder="Enter your full name *"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <input
                            type="email"
                            name="email"
                            required
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-gray-900 placeholder-gray-400 font-medium shadow-sm"
                            placeholder="Enter your email address *"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    {/* Phone */}
                    <div className="flex gap-2">
                         <div className="w-1/3 min-w-[120px]">
                            <select
                                className="w-full px-3 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-gray-900 font-medium shadow-sm appearance-none"
                                value={formData.phoneCode}
                                onChange={(e) => setFormData({ ...formData, phoneCode: e.target.value })}
                            >
                                {countryCodes.map((c, i) => (
                                    <option key={`${c.country}-${i}`} value={c.code}>
                                        {c.code} {c.country.substring(0, 10)}...
                                    </option>
                                ))}
                            </select>
                         </div>
                        <div className="w-2/3">
                            <input
                                type="tel"
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-gray-900 placeholder-gray-400 font-medium shadow-sm"
                                placeholder="Phone number (optional)"
                                value={formData.phoneNumber}
                                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Schedule */}
                    <div>
                        <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-800">
                             <Clock className="w-4 h-4 text-purple-600" />
                             Select Webinar Time <span className="text-red-500">*</span>
                        </div>
                        <select
                            value={selectedSchedule}
                            onChange={(e) => setSelectedSchedule(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-gray-900 font-medium shadow-sm cursor-pointer appearance-none"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em`, paddingRight: `2.5rem` }}
                        >
                            <option value="">Choose your preferred time...</option>
                            {scheduleOptions.map((slot: any) => (
                                <option key={slot.id} value={slot.id}>
                                    {formatScheduleTime(slot.schedule, slot.time)}
                                </option>
                            ))}
                        </select>
                        
                        {/* Timezone Info */}
                         <div className="mt-2 flex items-center justify-between">
                            <p className="text-xs text-gray-600 flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                Times shown in {getTimezoneFriendlyName(selectedTimezone)}
                            </p>
                            <button
                                type="button"
                                onClick={() => setShowTimezoneSelector(!showTimezoneSelector)}
                                className="text-xs text-purple-600 hover:text-purple-700 font-semibold underline"
                            >
                                Change
                            </button>
                        </div>
                    </div>

                    {/* Consent */}
                    <div className="flex items-start gap-3 mt-4">
                         <input
                            type="checkbox"
                            checked={formData.privacyConsent}
                            onChange={(e) => setFormData({ ...formData, privacyConsent: e.target.checked })}
                            className="mt-1 h-5 w-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                        />
                         <label className="text-sm text-gray-700 leading-snug">
                            I agree to the <a href="/privacy" target="_blank" className="text-purple-600 hover:underline">Privacy Policy</a> and <a href="/terms" target="_blank" className="text-purple-600 hover:underline">Terms of Service</a>. <span className="text-red-500">*</span>
                        </label>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                         <button
                            type="button"
                            onClick={onClose}
                            disabled={registering}
                            className="w-1/3 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-colors shadow-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={registering}
                            className="w-2/3 py-3 rounded-xl text-white font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            style={{
                                background: 'linear-gradient(135deg, #ff6b6b 0%, #ff8787 100%)',
                                boxShadow: '0 4px 14px rgba(255, 107, 107, 0.4)'
                            }}
                        >
                            {registering ? 'Registering...' : 'Complete Registration'}
                        </button>
                    </div>

                    {/* Footer Trust */}
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-start gap-3">
                         <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                         <div>
                            <p className="text-sm font-bold text-gray-900">Your information is safe with us</p>
                            <p className="text-xs text-gray-500 mt-0.5">We respect your privacy and never share your data with third parties.</p>
                         </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
  );
}
