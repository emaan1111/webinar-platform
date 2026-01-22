'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Gift, Clock, CheckCircle, X, AlertCircle, Globe } from 'lucide-react'
import RegistrationPageTracker from '@/components/tracking/RegistrationPageTracker'
import LegacyRegistrationPage from '@/components/registration-pages/LegacyRegistrationPage'
import { roundToNearest15Minutes } from '@/lib/webinarSchedule'

interface Schedule {
  id: string
  scheduleType: string
  scheduledAt: string | null
  minutesFromReg: number | null
  timezone: string | null
  useUserTimezone: boolean
  recurringPattern: string | null
}

interface Webinar {
  id: string
  slug: string | null
  maxSchedulesToShow?: number
  enableABTesting?: boolean
  testGroup?: 'A' | 'B' | null
  roundJITTo15Minutes?: boolean
  activeElements?: Array<{ element: 'registration' | 'schedule' | 'offer' | 'video'; variantShown: string }>
}

interface RegistrationPage {
  id: string
  name: string
  htmlCode: string
  collectPhone?: boolean
  collectCompany?: boolean
  collectCustom1?: boolean
  customField1Label?: string | null
  collectCustom2?: boolean
  customField2Label?: string | null
  showHostInfo?: boolean
  showBenefits?: boolean
  showTestimonials?: boolean
  showCountdown?: boolean
  showSocialProof?: boolean
  showVideo?: boolean
  videoUrl?: string | null
  videoTitle?: string | null
  videoAutoplay?: boolean
  primaryColor?: string | null
  secondaryColor?: string | null
  backgroundColor?: string | null
  textColor?: string | null
  ctaButtonText?: string | null
  ctaButtonStyle?: string | null
}

// Constants kept outside the component to avoid re-allocating large arrays on every render
const countryCodes = [
  // North America
  { code: '+1', country: 'United States', pattern: /^\d{10}$/ },
  { code: '+1', country: 'Canada', pattern: /^\d{10}$/ },
  { code: '+52', country: 'Mexico', pattern: /^\d{10}$/ },
  
  // Central America & Caribbean
  { code: '+502', country: 'Guatemala', pattern: /^\d{8}$/ },
  { code: '+503', country: 'El Salvador', pattern: /^\d{8}$/ },
  { code: '+504', country: 'Honduras', pattern: /^\d{8}$/ },
  { code: '+505', country: 'Nicaragua', pattern: /^\d{8}$/ },
  { code: '+506', country: 'Costa Rica', pattern: /^\d{8}$/ },
  { code: '+507', country: 'Panama', pattern: /^\d{8}$/ },
  { code: '+509', country: 'Haiti', pattern: /^\d{8}$/ },
  { code: '+1-876', country: 'Jamaica', pattern: /^\d{10}$/ },
  { code: '+1-809', country: 'Dominican Republic', pattern: /^\d{10}$/ },
  { code: '+1-868', country: 'Trinidad and Tobago', pattern: /^\d{10}$/ },
  
  // South America
  { code: '+54', country: 'Argentina', pattern: /^\d{10}$/ },
  { code: '+55', country: 'Brazil', pattern: /^\d{11}$/ },
  { code: '+56', country: 'Chile', pattern: /^\d{9}$/ },
  { code: '+57', country: 'Colombia', pattern: /^\d{10}$/ },
  { code: '+58', country: 'Venezuela', pattern: /^\d{10}$/ },
  { code: '+51', country: 'Peru', pattern: /^\d{9}$/ },
  { code: '+593', country: 'Ecuador', pattern: /^\d{9}$/ },
  { code: '+591', country: 'Bolivia', pattern: /^\d{8}$/ },
  { code: '+595', country: 'Paraguay', pattern: /^\d{9}$/ },
  { code: '+598', country: 'Uruguay', pattern: /^\d{8}$/ },
  { code: '+594', country: 'French Guiana', pattern: /^\d{9}$/ },
  { code: '+597', country: 'Suriname', pattern: /^\d{7}$/ },
  { code: '+592', country: 'Guyana', pattern: /^\d{7}$/ },
  
  // Europe - Western
  { code: '+44', country: 'United Kingdom', pattern: /^\d{10,11}$/ },
  { code: '+353', country: 'Ireland', pattern: /^\d{9}$/ },
  { code: '+33', country: 'France', pattern: /^\d{9}$/ },
  { code: '+32', country: 'Belgium', pattern: /^\d{9}$/ },
  { code: '+31', country: 'Netherlands', pattern: /^\d{9}$/ },
  { code: '+352', country: 'Luxembourg', pattern: /^\d{9}$/ },
  { code: '+41', country: 'Switzerland', pattern: /^\d{9}$/ },
  { code: '+43', country: 'Austria', pattern: /^\d{10,13}$/ },
  { code: '+49', country: 'Germany', pattern: /^\d{10,11}$/ },
  
  // Europe - Southern
  { code: '+34', country: 'Spain', pattern: /^\d{9}$/ },
  { code: '+351', country: 'Portugal', pattern: /^\d{9}$/ },
  { code: '+39', country: 'Italy', pattern: /^\d{10}$/ },
  { code: '+378', country: 'San Marino', pattern: /^\d{10}$/ },
  { code: '+379', country: 'Vatican City', pattern: /^\d{10}$/ },
  { code: '+30', country: 'Greece', pattern: /^\d{10}$/ },
  { code: '+356', country: 'Malta', pattern: /^\d{8}$/ },
  { code: '+357', country: 'Cyprus', pattern: /^\d{8}$/ },
  
  // Europe - Northern
  { code: '+45', country: 'Denmark', pattern: /^\d{8}$/ },
  { code: '+46', country: 'Sweden', pattern: /^\d{9}$/ },
  { code: '+47', country: 'Norway', pattern: /^\d{8}$/ },
  { code: '+358', country: 'Finland', pattern: /^\d{9,10}$/ },
  { code: '+354', country: 'Iceland', pattern: /^\d{7}$/ },
  
  // Europe - Eastern
  { code: '+48', country: 'Poland', pattern: /^\d{9}$/ },
  { code: '+420', country: 'Czech Republic', pattern: /^\d{9}$/ },
  { code: '+421', country: 'Slovakia', pattern: /^\d{9}$/ },
  { code: '+36', country: 'Hungary', pattern: /^\d{9}$/ },
  { code: '+40', country: 'Romania', pattern: /^\d{10}$/ },
  { code: '+359', country: 'Bulgaria', pattern: /^\d{9}$/ },
  { code: '+7', country: 'Russia', pattern: /^\d{10}$/ },
  { code: '+380', country: 'Ukraine', pattern: /^\d{9}$/ },
  { code: '+375', country: 'Belarus', pattern: /^\d{9}$/ },
  { code: '+370', country: 'Lithuania', pattern: /^\d{8}$/ },
  { code: '+371', country: 'Latvia', pattern: /^\d{8}$/ },
  { code: '+372', country: 'Estonia', pattern: /^\d{7,8}$/ },
  { code: '+373', country: 'Moldova', pattern: /^\d{8}$/ },
  { code: '+381', country: 'Serbia', pattern: /^\d{9}$/ },
  { code: '+385', country: 'Croatia', pattern: /^\d{9}$/ },
  { code: '+386', country: 'Slovenia', pattern: /^\d{8}$/ },
  { code: '+387', country: 'Bosnia and Herzegovina', pattern: /^\d{8}$/ },
  { code: '+382', country: 'Montenegro', pattern: /^\d{8}$/ },
  { code: '+389', country: 'North Macedonia', pattern: /^\d{8}$/ },
  { code: '+355', country: 'Albania', pattern: /^\d{9}$/ },
  
  // Middle East
  { code: '+90', country: 'Turkey', pattern: /^\d{10}$/ },
  { code: '+971', country: 'United Arab Emirates', pattern: /^\d{9}$/ },
  { code: '+966', country: 'Saudi Arabia', pattern: /^\d{9}$/ },
  { code: '+965', country: 'Kuwait', pattern: /^\d{8}$/ },
  { code: '+968', country: 'Oman', pattern: /^\d{8}$/ },
  { code: '+973', country: 'Bahrain', pattern: /^\d{8}$/ },
  { code: '+974', country: 'Qatar', pattern: /^\d{8}$/ },
  { code: '+962', country: 'Jordan', pattern: /^\d{9}$/ },
  { code: '+961', country: 'Lebanon', pattern: /^\d{8}$/ },
  { code: '+963', country: 'Syria', pattern: /^\d{9}$/ },
  { code: '+964', country: 'Iraq', pattern: /^\d{10}$/ },
  { code: '+98', country: 'Iran', pattern: /^\d{10}$/ },
  { code: '+972', country: 'Israel', pattern: /^\d{9}$/ },
  { code: '+970', country: 'Palestine', pattern: /^\d{9}$/ },
  { code: '+967', country: 'Yemen', pattern: /^\d{9}$/ },
  
  // Africa - Northern
  { code: '+20', country: 'Egypt', pattern: /^\d{10}$/ },
  { code: '+212', country: 'Morocco', pattern: /^\d{9}$/ },
  { code: '+213', country: 'Algeria', pattern: /^\d{9}$/ },
  { code: '+216', country: 'Tunisia', pattern: /^\d{8}$/ },
  { code: '+218', country: 'Libya', pattern: /^\d{9}$/ },
  { code: '+249', country: 'Sudan', pattern: /^\d{9}$/ },
  
  // Africa - Western
  { code: '+234', country: 'Nigeria', pattern: /^\d{10}$/ },
  { code: '+233', country: 'Ghana', pattern: /^\d{9}$/ },
  { code: '+225', country: 'Ivory Coast', pattern: /^\d{8}$/ },
  { code: '+221', country: 'Senegal', pattern: /^\d{9}$/ },
  { code: '+223', country: 'Mali', pattern: /^\d{8}$/ },
  { code: '+226', country: 'Burkina Faso', pattern: /^\d{8}$/ },
  { code: '+227', country: 'Niger', pattern: /^\d{8}$/ },
  { code: '+228', country: 'Togo', pattern: /^\d{8}$/ },
  { code: '+229', country: 'Benin', pattern: /^\d{8}$/ },
  { code: '+231', country: 'Liberia', pattern: /^\d{8}$/ },
  { code: '+232', country: 'Sierra Leone', pattern: /^\d{8}$/ },
  { code: '+224', country: 'Guinea', pattern: /^\d{9}$/ },
  { code: '+245', country: 'Guinea-Bissau', pattern: /^\d{7}$/ },
  { code: '+220', country: 'Gambia', pattern: /^\d{7}$/ },
  
  // Africa - Eastern
  { code: '+254', country: 'Kenya', pattern: /^\d{10}$/ },
  { code: '+255', country: 'Tanzania', pattern: /^\d{9}$/ },
  { code: '+256', country: 'Uganda', pattern: /^\d{9}$/ },
  { code: '+250', country: 'Rwanda', pattern: /^\d{9}$/ },
  { code: '+257', country: 'Burundi', pattern: /^\d{8}$/ },
  { code: '+251', country: 'Ethiopia', pattern: /^\d{9}$/ },
  { code: '+252', country: 'Somalia', pattern: /^\d{8}$/ },
  { code: '+253', country: 'Djibouti', pattern: /^\d{8}$/ },
  
  // Africa - Southern
  { code: '+27', country: 'South Africa', pattern: /^\d{9}$/ },
  { code: '+264', country: 'Namibia', pattern: /^\d{9}$/ },
  { code: '+267', country: 'Botswana', pattern: /^\d{8}$/ },
  { code: '+268', country: 'Eswatini', pattern: /^\d{8}$/ },
  { code: '+266', country: 'Lesotho', pattern: /^\d{8}$/ },
  { code: '+263', country: 'Zimbabwe', pattern: /^\d{9}$/ },
  { code: '+260', country: 'Zambia', pattern: /^\d{9}$/ },
  { code: '+265', country: 'Malawi', pattern: /^\d{9}$/ },
  { code: '+258', country: 'Mozambique', pattern: /^\d{9}$/ },
  { code: '+261', country: 'Madagascar', pattern: /^\d{9}$/ },
  { code: '+262', country: 'Réunion', pattern: /^\d{9}$/ },
  { code: '+230', country: 'Mauritius', pattern: /^\d{8}$/ },
  
  // Africa - Central
  { code: '+237', country: 'Cameroon', pattern: /^\d{9}$/ },
  { code: '+236', country: 'Central African Republic', pattern: /^\d{8}$/ },
  { code: '+235', country: 'Chad', pattern: /^\d{8}$/ },
  { code: '+242', country: 'Republic of Congo', pattern: /^\d{9}$/ },
  { code: '+243', country: 'Democratic Republic of Congo', pattern: /^\d{9}$/ },
  { code: '+240', country: 'Equatorial Guinea', pattern: /^\d{9}$/ },
  { code: '+241', country: 'Gabon', pattern: /^\d{7}$/ },
  
  // Asia - South
  { code: '+91', country: 'India', pattern: /^\d{10}$/ },
  { code: '+92', country: 'Pakistan', pattern: /^\d{10}$/ },
  { code: '+880', country: 'Bangladesh', pattern: /^\d{10}$/ },
  { code: '+94', country: 'Sri Lanka', pattern: /^\d{9}$/ },
  { code: '+977', country: 'Nepal', pattern: /^\d{10}$/ },
  { code: '+975', country: 'Bhutan', pattern: /^\d{8}$/ },
  { code: '+960', country: 'Maldives', pattern: /^\d{7}$/ },
  { code: '+93', country: 'Afghanistan', pattern: /^\d{9}$/ },
  
  // Asia - Southeast
  { code: '+62', country: 'Indonesia', pattern: /^\d{10,12}$/ },
  { code: '+60', country: 'Malaysia', pattern: /^\d{9,10}$/ },
  { code: '+65', country: 'Singapore', pattern: /^\d{8}$/ },
  { code: '+66', country: 'Thailand', pattern: /^\d{9}$/ },
  { code: '+63', country: 'Philippines', pattern: /^\d{10}$/ },
  { code: '+84', country: 'Vietnam', pattern: /^\d{9,10}$/ },
  { code: '+95', country: 'Myanmar', pattern: /^\d{9,10}$/ },
  { code: '+855', country: 'Cambodia', pattern: /^\d{9}$/ },
  { code: '+856', country: 'Laos', pattern: /^\d{9,10}$/ },
  { code: '+673', country: 'Brunei', pattern: /^\d{7}$/ },
  { code: '+670', country: 'East Timor', pattern: /^\d{8}$/ },
  
  // Asia - East
  { code: '+86', country: 'China', pattern: /^\d{11}$/ },
  { code: '+81', country: 'Japan', pattern: /^\d{10}$/ },
  { code: '+82', country: 'South Korea', pattern: /^\d{10,11}$/ },
  { code: '+850', country: 'North Korea', pattern: /^\d{10}$/ },
  { code: '+852', country: 'Hong Kong', pattern: /^\d{8}$/ },
  { code: '+853', country: 'Macau', pattern: /^\d{8}$/ },
  { code: '+886', country: 'Taiwan', pattern: /^\d{9}$/ },
  { code: '+976', country: 'Mongolia', pattern: /^\d{8}$/ },
  
  // Asia - Central
  { code: '+992', country: 'Tajikistan', pattern: /^\d{9}$/ },
  { code: '+996', country: 'Kyrgyzstan', pattern: /^\d{9}$/ },
  { code: '+998', country: 'Uzbekistan', pattern: /^\d{9}$/ },
  { code: '+993', country: 'Turkmenistan', pattern: /^\d{8}$/ },
  { code: '+7', country: 'Kazakhstan', pattern: /^\d{10}$/ },
  
  // Oceania
  { code: '+61', country: 'Australia', pattern: /^\d{9}$/ },
  { code: '+64', country: 'New Zealand', pattern: /^\d{9,10}$/ },
  { code: '+679', country: 'Fiji', pattern: /^\d{7}$/ },
  { code: '+675', country: 'Papua New Guinea', pattern: /^\d{8}$/ },
  { code: '+677', country: 'Solomon Islands', pattern: /^\d{7}$/ },
  { code: '+678', country: 'Vanuatu', pattern: /^\d{7}$/ },
  { code: '+685', country: 'Samoa', pattern: /^\d{7}$/ },
  { code: '+686', country: 'Kiribati', pattern: /^\d{8}$/ },
  { code: '+687', country: 'New Caledonia', pattern: /^\d{6}$/ },
  { code: '+689', country: 'French Polynesia', pattern: /^\d{8}$/ },
  { code: '+691', country: 'Micronesia', pattern: /^\d{7}$/ },
  { code: '+692', country: 'Marshall Islands', pattern: /^\d{7}$/ },
  { code: '+680', country: 'Palau', pattern: /^\d{7}$/ },
  { code: '+676', country: 'Tonga', pattern: /^\d{5}$/ },
  { code: '+688', country: 'Tuvalu', pattern: /^\d{5}$/ },
  { code: '+683', country: 'Niue', pattern: /^\d{4}$/ },
  { code: '+690', country: 'Tokelau', pattern: /^\d{4}$/ },
]

const euCountries = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'GB', 'UK'
]

const timezones = [
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris, Berlin, Rome' },
  { value: 'Europe/Moscow', label: 'Moscow' },
  { value: 'Asia/Dubai', label: 'Dubai' },
  { value: 'Asia/Kolkata', label: 'India' },
  { value: 'Asia/Calcutta', label: 'India' }, // Alias for Kolkata
  { value: 'Asia/Shanghai', label: 'China' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Asia/Singapore', label: 'Singapore' },
  { value: 'Australia/Sydney', label: 'Sydney' },
  { value: 'Pacific/Auckland', label: 'New Zealand' },
  { value: 'UTC', label: 'UTC' },
]

interface WebinarRegisterPageProps {
  webinarData: Webinar
  registrationPage?: RegistrationPage | null
  leadPageId?: string | null
  splitTestId?: string | null
  variantId?: string | null
}

// Popup Theme Configurations
const popupThemes = {
  purple: {
    headerBg: 'bg-gradient-to-r from-purple-600 to-blue-600',
    headerText: 'text-white',
    headerSubtext: 'text-purple-100',
    buttonBg: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
    buttonShadow: '0 4px 14px rgba(139, 92, 246, 0.4)',
    focusRing: 'focus:ring-purple-500 focus:border-purple-500',
  },
  blue: {
    headerBg: 'bg-gradient-to-r from-blue-600 to-cyan-500',
    headerText: 'text-white',
    headerSubtext: 'text-blue-100',
    buttonBg: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
    buttonShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
    focusRing: 'focus:ring-blue-500 focus:border-blue-500',
  },
  green: {
    headerBg: 'bg-gradient-to-r from-green-600 to-emerald-500',
    headerText: 'text-white',
    headerSubtext: 'text-green-100',
    buttonBg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    buttonShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
    focusRing: 'focus:ring-green-500 focus:border-green-500',
  },
  red: {
    headerBg: 'bg-gradient-to-r from-red-600 to-pink-500',
    headerText: 'text-white',
    headerSubtext: 'text-red-100',
    buttonBg: 'linear-gradient(135deg, #ef4444 0%, #ec4899 100%)',
    buttonShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
    focusRing: 'focus:ring-red-500 focus:border-red-500',
  },
  orange: {
    headerBg: 'bg-gradient-to-r from-orange-600 to-yellow-500',
    headerText: 'text-white',
    headerSubtext: 'text-orange-100',
    buttonBg: 'linear-gradient(135deg, #f97316 0%, #eab308 100%)',
    buttonShadow: '0 4px 14px rgba(249, 115, 22, 0.4)',
    focusRing: 'focus:ring-orange-500 focus:border-orange-500',
  },
  dark: {
    headerBg: 'bg-gradient-to-r from-gray-900 to-gray-700',
    headerText: 'text-white',
    headerSubtext: 'text-gray-300',
    buttonBg: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
    buttonShadow: '0 4px 14px rgba(31, 41, 55, 0.4)',
    focusRing: 'focus:ring-gray-500 focus:border-gray-500',
  },
}

export default function WebinarRegisterPage({ webinarData, registrationPage, leadPageId, splitTestId, variantId }: WebinarRegisterPageProps) {
  const searchParams = useSearchParams()
  const webinar = webinarData
  
  // Use props first, fall back to URL params for tracking
  const effectiveSplitTestId = splitTestId || searchParams.get('st')
  const effectiveVariantId = variantId || searchParams.get('v')
  
  // Debug logging for tracking
  console.log('📊 WebinarRegisterPage Tracking:', {
    props: { splitTestId, variantId, leadPageId },
    searchParams: { st: searchParams.get('st'), v: searchParams.get('v') },
    effective: { effectiveSplitTestId, effectiveVariantId }
  })
  
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [schedulesLoading, setSchedulesLoading] = useState(false)
  const [userTimezone, setUserTimezone] = useState(() => {
    // Initialize with browser timezone immediately
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    } catch {
      return 'UTC'
    }
  })
  const [selectedTimezone, setSelectedTimezone] = useState(() => {
    // Initialize with browser timezone immediately
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    } catch {
      return 'UTC'
    }
  })
  const [userCountry, setUserCountry] = useState('')
  const [isEU, setIsEU] = useState(false)
  const [registering, setRegistering] = useState(false)
  const [registered, setRegistered] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showTimezoneSelector, setShowTimezoneSelector] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    countryCode: '+1',
    privacyConsent: true
  })

  useEffect(() => {
    // Client-side A/B Test Tracking
    if (webinar.enableABTesting && webinar.activeElements && webinar.activeElements.length > 0) {
      const trackView = async () => {
        try {
          await fetch('/api/ab-test/track-view', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              webinarId: webinar.id,
              testGroup: webinar.testGroup,
              elements: webinar.activeElements,
              referrer: document.referrer
            }),
          });
        } catch (e) {
          console.error('Failed to track A/B view', e);
        }
      };
      
      // Small delay to ensure not blocking main thread initialization
      const timer = setTimeout(trackView, 1000);
      return () => clearTimeout(timer);
    }
  }, [webinar.id, webinar.enableABTesting, webinar.testGroup, webinar.activeElements])

  // Helper function to get friendly timezone name
  const getTimezoneFriendlyName = (timezoneValue: string): string => {
    const timezone = timezones.find(tz => tz.value === timezoneValue)
    if (timezone) {
      return timezone.label
    }
    // Fallback: parse the timezone value
    return timezoneValue.split('/').pop()?.replace(/_/g, ' ') || timezoneValue
  }

  // Detect browser timezone immediately - non-blocking
  useEffect(() => {
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    setUserTimezone(detectedTimezone)
    setSelectedTimezone(detectedTimezone)
  }, [])

  // Fetch country info after the first paint so slow geo requests never block rendering
  useEffect(() => {
    const controller = new AbortController()
    const fetchCountry = () => {
      fetch('https://ipapi.co/json/', { signal: controller.signal })
        .then(res => res.json())
        .then(data => {
          const country = data.country_code
          setUserCountry(country)
          setIsEU(euCountries.includes(country))
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setIsEU(true)
          }
        })
    }

    let idleId: any;
    let timeoutId: NodeJS.Timeout | undefined;

    if ('requestIdleCallback' in window) {
      idleId = (window as any).requestIdleCallback(() => {
        fetchCountry()
      }, { timeout: 1000 })
    } else {
      timeoutId = setTimeout(fetchCountry, 0)
    }

    return () => {
      controller.abort()
      if (idleId) {
        ;(window as any).cancelIdleCallback?.(idleId)
      }
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [])

  // Load schedules immediately on page load (not lazy) to avoid delay when modal opens
  useEffect(() => {
    if (schedules.length === 0 && !schedulesLoading) {
      setSchedulesLoading(true)
      fetch(`/api/webinars/${webinar.id}/schedules`)
        .then(res => res.json())
        .then(data => {
          setSchedules(data.schedules || [])
          setSchedulesLoading(false)
        })
        .catch(err => {
          console.error('Failed to load schedules:', err)
          setSchedulesLoading(false)
        })
    }
  }, [webinar.id, schedules.length, schedulesLoading])

  // Setup global modal functions and button listeners for custom templates
  useEffect(() => {
    if (!registrationPage || registered || !webinar) {
      console.log('[Registration] Setup skipped:', { hasPage: !!registrationPage, registered, hasWebinar: !!webinar })
      return;
    }

    console.log('[Registration] Setting up global modal functions...')
    
    // Define handler functions
    const handleOpenModal = () => {
      console.log('[Registration] openModal() called')
      setShowScheduleModal(true)
    }
    
    const handleCloseModal = () => {
      console.log('[Registration] closeModal() called')
      setShowScheduleModal(false)
    }
    
    const handleSelectSchedule = (e: any) => {
      const scheduleId = e.detail?.scheduleId
      if (scheduleId && webinar) {
        // Look in local state 'schedules' as 'webinar.schedules' is no longer populated
        const schedule = schedules.find(s => s.id === scheduleId)
        if (schedule) {
          setSelectedSchedule(schedule)
        }
      }
    }
    
    // Expose global functions for inline onclick handlers in custom templates
    (window as any).openModal = handleOpenModal;
    (window as any).closeModal = handleCloseModal;
    (window as any).openRegistrationModal = handleOpenModal;
    
    // Setup event listeners
    window.addEventListener('openRegistrationModal', handleOpenModal)
    window.addEventListener('selectSchedule', handleSelectSchedule as EventListener)

    // Also setup event listeners as fallback
    const timer = setTimeout(() => {
      console.log('[Registration] Setting up button listeners...')
      
      // Gather all possible CTA triggers
      const buttonsByAction = Array.from(document.querySelectorAll('[data-action="register"]'))
      const buttonsByTrigger = Array.from(document.querySelectorAll('[data-webinar-trigger]'))
      const buttonsByClass = Array.from(document.querySelectorAll('.cta-button, .register-button, .btn-register, .signup-button'))
      const buttonsByHref = Array.from(document.querySelectorAll('a[href="#register"], a[href="#registration"], a[href="#signup"]'))
      const textCandidates = Array.from(document.querySelectorAll('button, a[href], [role="button"]')).filter((el) => {
        const text = (el.textContent || '').toLowerCase().trim()
        return text.includes('register') || text.includes('sign up') || text.includes('reserve') || text.includes('save my spot') || text.includes('join now') || text.includes('claim')
      })

      console.log('[Registration] Found buttons:', {
        byAction: buttonsByAction.length,
        byTrigger: buttonsByTrigger.length,
        byClass: buttonsByClass.length,
        byHref: buttonsByHref.length,
        byText: textCandidates.length
      })

      const allButtons = Array.from(new Set([...buttonsByAction, ...buttonsByTrigger, ...buttonsByClass, ...buttonsByHref, ...textCandidates]))

      console.log('[Registration] Total unique buttons:', allButtons.length)

      if (allButtons.length === 0) {
        console.warn('[Registration] No buttons found via selectors, but openModal() is available globally')
        return
      }

      allButtons.forEach((button, index) => {
        // Skip buttons that already have onclick="openModal()"
        const hasOnClick = button.getAttribute('onclick')
        if (hasOnClick && hasOnClick.includes('openModal')) {
          console.log(`[Registration] Button ${index + 1} already has onclick, skipping`)
          return
        }
        
        const buttonInfo = {
          index,
          tag: button.tagName,
          id: (button as HTMLElement).id,
          classes: (button as HTMLElement).className,
          text: button.textContent?.trim().substring(0, 50)
        }
        console.log(`[Registration] Setting up button ${index + 1}:`, buttonInfo)
        
        const clickHandler = (e: Event) => {
          console.log(`[Registration] 🎯 BUTTON CLICKED:`, buttonInfo)
          e.preventDefault()
          e.stopPropagation()
          e.stopImmediatePropagation()
          console.log('[Registration] Opening modal...')
          setShowScheduleModal(true)
        }
        
        // Try multiple event listeners to ensure one works
        button.addEventListener('click', clickHandler, true) // Capture phase
        button.addEventListener('click', clickHandler, false) // Bubble phase
        
        // Also try with pointer events
        button.addEventListener('pointerdown', () => {
          console.log(`[Registration] Pointer down on button ${index + 1}`)
        })
      })

      // Also handle schedule items if present
      const scheduleItems = document.querySelectorAll('[data-schedule-id], .schedule-item')
      
      scheduleItems.forEach((item) => {
        item.addEventListener('click', function(this: HTMLElement) {
          const scheduleId = this.getAttribute('data-schedule-id')
          if (scheduleId && webinar) {
            // Look in local state 'schedules'
            const schedule = schedules.find(s => s.id === scheduleId)
            if (schedule) {
              setSelectedSchedule(schedule)
            }
            setShowScheduleModal(true)
          }
        })
      })
    }, 500) // Increased delay to ensure template is rendered
    
    return () => {
      clearTimeout(timer)
      window.removeEventListener('openRegistrationModal', handleOpenModal)
      window.removeEventListener('selectSchedule', handleSelectSchedule as EventListener)
      // Clean up global functions
      delete (window as any).openModal
      delete (window as any).closeModal
      delete (window as any).openRegistrationModal
    }
  }, [registrationPage, registered, webinar])

  // Generate multiple upcoming time slots for recurring schedules
  const generateRecurringSlots = (schedule: Schedule, count: number = 5) => {
    const slots: { id: string; time: Date; baseScheduleId: string }[] = []

    const pattern = JSON.parse(schedule.recurringPattern || '{}')

    const now = new Date()
    
    if (pattern.interval === 'daily') {
      const [hours, minutes] = pattern.time.split(':').map(Number)
      
      for (let i = 0; i < count; i++) {
        const slotDate = new Date()
        slotDate.setDate(now.getDate() + i)
        slotDate.setHours(hours, minutes, 0, 0)
        
        // Skip if time has already passed today
        if (slotDate > now) {
          slots.push({
            id: `${schedule.id}-slot-${i}`,
            time: slotDate,
            baseScheduleId: schedule.id
          })
        } else if (i === 0) {
          // If today's time passed, start from tomorrow
          const tomorrow = new Date()
          tomorrow.setDate(now.getDate() + 1)
          tomorrow.setHours(hours, minutes, 0, 0)
          slots.push({
            id: `${schedule.id}-slot-${i}`,
            time: tomorrow,
            baseScheduleId: schedule.id
          })
        }
      }
      
      // Fill remaining slots if we skipped today
      while (slots.length < count) {
        const lastSlot = slots[slots.length - 1]
        const nextSlot = new Date(lastSlot.time)
        nextSlot.setDate(nextSlot.getDate() + 1)
        slots.push({
          id: `${schedule.id}-slot-${slots.length}`,
          time: nextSlot,
          baseScheduleId: schedule.id
        })
      }
    } else if (pattern.interval === 'weekly' && pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
      const daysMap: Record<string, number> = {
        'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
        'Thursday': 4, 'Friday': 5, 'Saturday': 6
      }
      
      const [hours, minutes] = pattern.time.split(':').map(Number)
      
      // Handle both numeric days (e.g., [1]) and string days (e.g., ["Monday"])
      const targetDays = pattern.daysOfWeek.map((day: string | number) => {
        if (typeof day === 'number') {
          return day // Already numeric
        }
        return daysMap[day] // Convert string to number
      }).filter((day: number) => day !== undefined).sort((a: number, b: number) => a - b)
      
      let currentDate = new Date(now)
      let slotsGenerated = 0
      
      // Look ahead up to 20 weeks to find enough slots (supports up to 20 occurrences)
      for (let week = 0; week < 20 && slotsGenerated < count; week++) {
        for (const targetDay of targetDays) {
          if (slotsGenerated >= count) break
          
          const slotDate = new Date(currentDate)
          const currentDay = slotDate.getDay()
          const daysUntilTarget = (targetDay - currentDay + 7) % 7
          
          if (week === 0 && daysUntilTarget === 0) {
            // Same day - check if time hasn't passed
            slotDate.setHours(hours, minutes, 0, 0)
            if (slotDate > now) {
              slots.push({
                id: `${schedule.id}-slot-${slotsGenerated}`,
                time: slotDate,
                baseScheduleId: schedule.id
              })
              slotsGenerated++
            }
          } else {
            slotDate.setDate(slotDate.getDate() + daysUntilTarget + (week > 0 ? 7 * week : 0))
            slotDate.setHours(hours, minutes, 0, 0)
            if (slotDate > now) {
              slots.push({
                id: `${schedule.id}-slot-${slotsGenerated}`,
                time: slotDate,
                baseScheduleId: schedule.id
              })
              slotsGenerated++
            }
          }
        }
        if (week === 0) currentDate.setDate(currentDate.getDate() + 7)
      }
    } else {
      console.warn('⚠️ Unknown or incomplete pattern:', pattern)
      // Fallback: if pattern is invalid but scheduledAt exists, treat as single occurrence
      if (schedule.scheduledAt) {
        const scheduledTime = new Date(schedule.scheduledAt)
        if (scheduledTime > now) {
          slots.push({
            id: schedule.id, // Use original ID, not slot style
            time: scheduledTime,
            baseScheduleId: schedule.id
          })
        }
      }
    }

    return slots
  }

  // Helper function to parse schedule time with proper timezone handling
  const parseScheduleTime = (schedule: Schedule): Date | null => {
    if (!schedule.scheduledAt) return null
    
    // The scheduledAt from database should be a UTC timestamp
    // However, if it was saved incorrectly (without timezone conversion),
    // we need to handle it based on the schedule's timezone field
    
    const date = new Date(schedule.scheduledAt)
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', schedule.scheduledAt)
      return null
    }
    
    return date
  }

  const formatScheduleTime = (schedule: Schedule, slotTime?: Date) => {
    // Ensure we always have a valid timezone
    const tz = selectedTimezone || userTimezone || 'UTC'
    
    // Get friendly timezone name
    const tzFriendly = getTimezoneFriendlyName(tz)
    
    // If a specific slot time is provided, format that
    if (slotTime) {
      const dateStr = slotTime.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        timeZone: tz
      })
      const timeStr = slotTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: tz
      })
      return `${dateStr}, ${timeStr} • ${tzFriendly}`
    }
    
    if (schedule.scheduleType === 'justInTime') {
      // Calculate exact time based on current time + minutes
      const futureTime = new Date()
      futureTime.setMinutes(futureTime.getMinutes() + (schedule.minutesFromReg || 0))
      // Optionally round to nearest 15 min based on webinar setting
      const shouldRound = webinar?.roundJITTo15Minutes !== false // Default to true
      const finalTime = shouldRound ? roundToNearest15Minutes(futureTime) : futureTime
      
      const dateStr = finalTime.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        timeZone: tz
      })
      const timeStr = finalTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: tz
      })
      return `${dateStr}, ${timeStr} • ${tzFriendly}`
    }
    
    if (schedule.scheduleType === 'recurring') {
      // If recurringPattern is missing or empty, check if there's a scheduledAt fallback
      if (!schedule.recurringPattern || schedule.recurringPattern.trim() === '') {
        if (schedule.scheduledAt) {
          // Use scheduledAt as fallback
          const date = parseScheduleTime(schedule)
          if (date) {
            const dateStr = date.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
              timeZone: tz
            })
            const timeStr = date.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              timeZone: tz
            })
            return `${dateStr}, ${timeStr} • ${tzFriendly}`
          }
        }
        // If no valid data, return a clear message
        return 'Schedule to be determined'
      }
      
      const pattern = JSON.parse(schedule.recurringPattern || '{}')
      
      // Validate pattern has required fields
      if (!pattern.interval || !pattern.time) {
        if (schedule.scheduledAt) {
          // Use scheduledAt as fallback
          const date = parseScheduleTime(schedule)
          if (date) {
            const dateStr = date.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
              timeZone: tz
            })
            const timeStr = date.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              timeZone: tz
            })
            return `${dateStr}, ${timeStr} • ${tzFriendly}`
          }
        }
        return 'Schedule to be determined'
      }
      
      // Calculate next occurrence based on pattern
      const now = new Date()
      let nextDate = new Date()
      
      if (pattern.interval === 'daily') {
        // Set to today at the specified time
        const [hours, minutes] = pattern.time.split(':').map(Number)
        nextDate.setHours(hours, minutes, 0, 0)
        
        // If time has passed today, move to tomorrow
        if (nextDate <= now) {
          nextDate.setDate(nextDate.getDate() + 1)
        }
      } else if (pattern.interval === 'weekly' && pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
        // Find next occurrence based on day of week
        const daysMap: Record<string, number> = {
          'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
          'Thursday': 4, 'Friday': 5, 'Saturday': 6
        }
        
        const [hours, minutes] = pattern.time.split(':').map(Number)
        const currentDay = now.getDay()
        const targetDays = pattern.daysOfWeek.map((day: string) => daysMap[day]).sort((a: number, b: number) => a - b)
        
        // Find next day of week
        let nextDay = targetDays.find((d: number) => d > currentDay)
        if (nextDay === undefined) {
          nextDay = targetDays[0]
          nextDate.setDate(nextDate.getDate() + (7 - currentDay + nextDay))
        } else {
          nextDate.setDate(nextDate.getDate() + (nextDay - currentDay))
        }
        
        nextDate.setHours(hours, minutes, 0, 0)
      }
      
      const dateStr = nextDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        timeZone: tz
      })
      const timeStr = nextDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: tz
      })
      return `${dateStr}, ${timeStr} • ${tzFriendly}`
    }
    
    if (schedule.scheduleType === 'specific' && schedule.scheduledAt) {
      // Get the date from database
      const date = parseScheduleTime(schedule)
      if (!date) {
        return 'Invalid schedule time'
      }
      
      // Format the date and time in the user's selected timezone
      // The toLocaleString with timeZone parameter will automatically convert
      // from UTC (database storage) to the user's timezone
      const dateStr = date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        timeZone: tz
      })
      const timeStr = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: tz
      })
      return `${dateStr}, ${timeStr} • ${tzFriendly}`
    }
    
    return 'Schedule to be determined'
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = 'Please enter your full name (at least 2 characters)'
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Phone is optional, but if provided, validate it based on country code
    const selectedCountry = countryCodes.find(c => c.code === formData.countryCode)
    if (formData.phone.trim()) {
      if (selectedCountry && !selectedCountry.pattern.test(formData.phone.replace(/[\s\-]/g, ''))) {
        newErrors.phone = `Please enter a valid ${selectedCountry.country} phone number`
      } else if (!/^\d[\d\s\-]*\d$/.test(formData.phone.trim())) {
        newErrors.phone = 'Phone number can only contain digits, spaces, and hyphens'
      }
    }

    if (!formData.privacyConsent) {
      newErrors.privacyConsent = 'You must agree to the privacy policy'
    }

    if (!selectedSchedule) {
      newErrors.schedule = 'Please select a schedule'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleRegister = async () => {
    if (!validateForm()) {
      return
    }

    setRegistering(true)
    
    // Show optimistic success message immediately
    const optimisticTimeout = setTimeout(() => {
      // If API takes longer than 800ms, show a brief "almost there" state
      // This keeps user engaged without showing errors
    }, 800)

    try {
      // Calculate the exact start time for this registration
      let scheduleId = selectedSchedule!.id
      let selectedDateTime = selectedSchedule!.scheduledAt
      let scheduledStartTime: string | null = null
      
      // Check if this is a generated slot (contains "-slot-")
      if (scheduleId.includes('-slot-') && webinar) {
        const baseScheduleId = scheduleId.split('-slot-')[0]
        const baseSchedule = schedules.find(s => s.id === baseScheduleId)
        
        if (baseSchedule && baseSchedule.scheduleType === 'recurring') {
          // Find the slot to get the exact datetime
          const maxSlots = webinar.maxSchedulesToShow || 5
          const slots = generateRecurringSlots(baseSchedule, maxSlots * 2)
          const selectedSlot = slots.find(s => s.id === scheduleId)
          
          if (selectedSlot) {
            scheduleId = baseScheduleId
            selectedDateTime = selectedSlot.time.toISOString()
            scheduledStartTime = selectedSlot.time.toISOString() // Store the exact slot time
          }
        }
      } else if (selectedSchedule!.scheduleType === 'specific') {
        // Specific schedule - use the scheduled time
        scheduledStartTime = selectedSchedule!.scheduledAt
      } else if (selectedSchedule!.scheduleType === 'justInTime') {
        // Just-in-time - calculate from now and optionally round to nearest 15 minutes
        const minutesFromReg = selectedSchedule!.minutesFromReg || 5
        const calculatedTime = new Date(Date.now() + minutesFromReg * 60000)
        const shouldRound = webinar?.roundJITTo15Minutes !== false // Default to true
        scheduledStartTime = shouldRound 
          ? roundToNearest15Minutes(calculatedTime).toISOString()
          : calculatedTime.toISOString()
      }
      
      // Check if webinar starts within 15 minutes
      const now = Date.now()
      const startTime = scheduledStartTime ? new Date(scheduledStartTime).getTime() : now
      const minutesUntilStart = (startTime - now) / (1000 * 60)
      const shouldRedirectToCountdown = minutesUntilStart <= 15 && minutesUntilStart > 0
      
      // Debug log before registration
      console.log('📝 Submitting registration with tracking:', {
        effectiveSplitTestId,
        effectiveVariantId,
        leadPageId,
        email: formData.email.trim().toLowerCase()
      })
      
      // Fire registration request
      const registrationPromise = fetch(`/api/webinars/${webinar!.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: `${formData.countryCode} ${formData.phone.trim()}`,
          scheduleId: scheduleId,
          selectedDateTime: selectedDateTime,
          scheduledStartTime: scheduledStartTime,
          timezone: selectedTimezone,
          privacyConsent: formData.privacyConsent,
          country: userCountry,
          referralCode: searchParams.get('ref') || undefined,
          splitTestId: effectiveSplitTestId,
          variantId: effectiveVariantId,
          leadPageId: leadPageId
        })
      })

      // Wait for API response
      const response = await registrationPromise
      clearTimeout(optimisticTimeout)

      // Validate content-type before parsing JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned an invalid response. Please try again.')
      }

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Registration failed')
      }

      const registrationData = await response.json()
      
      // Track A/B test conversion (fire-and-forget, doesn't block redirect)
      if (webinar?.enableABTesting && registrationData.registrationId) {
        const payload = JSON.stringify({
          webinarId: webinar.id,
          registrationId: registrationData.registrationId,
        })

        if (navigator.sendBeacon) {
          const blob = new Blob([payload], { type: 'application/json' })
          navigator.sendBeacon('/api/ab-test/track-conversion', blob)
        } else {
          fetch('/api/ab-test/track-conversion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            keepalive: true
          }).catch(() => {})
        }
      }

      // Track Split Test conversion (from independent lead pages)
      // Note: Server-side tracking is now primary, but keeping client-side as fallback
      if (effectiveSplitTestId && effectiveVariantId && registrationData.registrationId) {
        const payload = JSON.stringify({
          splitTestId: effectiveSplitTestId,
          variantId: effectiveVariantId,
          registrationId: registrationData.registrationId,
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
      }
      // Track Standalone Lead Page conversion (if not a split test)
      else if (leadPageId && registrationData.registrationId) {
         const payload = JSON.stringify({
          leadPageId: leadPageId,
          registrationId: registrationData.registrationId,
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
      }

      // Immediate redirect - don't wait for anything else
      let redirectUrl: string
      if (shouldRedirectToCountdown) {
        redirectUrl = `/countdown/${webinar!.slug}?r=${registrationData.registrationId}`
      } else {
        redirectUrl = `/thank-you/${webinar!.slug}?r=${registrationData.registrationId}&s=${scheduleId}`
      }
      
      // Instant redirect
      window.location.href = redirectUrl
      
    } catch (error: any) {
      clearTimeout(optimisticTimeout)
      console.error('Registration error:', error)
      setErrors({ submit: error.message || 'Registration failed. Please try again.' })
      setRegistering(false)
    }
  }

  if (!webinar) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-xl text-gray-600">Webinar not found</p>
        </div>
      </div>
    )
  }

  // If custom template is provided, render it with registration functionality
  if (registrationPage) {
    // Check if this is the Legacy React Component based on the special marker
    const isLegacyReact = registrationPage.htmlCode?.includes('<!-- USE_REACT_COMPONENT: LEGACY_REGISTRATION -->')

    // Track registration page visit
    const pageId = registrationPage.id
    const variantGroup = webinar.testGroup || null
    
    // For Legacy React Component, we don't need to process template HTML
    if (isLegacyReact) {
      return (
        <div className="custom-template-container">
          {/* Track registration page visit */}
          <RegistrationPageTracker
            webinarId={webinar.id}
            pageId={pageId}
            variant={variantGroup}
            templateName={registrationPage.name}
          />
          
          <LegacyRegistrationPage 
            webinar={webinar} 
            onRegister={() => setShowScheduleModal(true)} 
          />
          
          {/* Registration Modal */}
          {showScheduleModal && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex min-h-screen items-center justify-center p-4">
                <div 
                  className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" 
                  onClick={() => setShowScheduleModal(false)}
                ></div>
                
                <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border-4 border-white/20" style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                {/* Compact Header with gradient background */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-4 relative overflow-hidden">
                  {/* Decorative elements */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-24 -mb-24"></div>
                  
                  <div className="relative z-10 flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-2xl font-extrabold text-white mb-1 tracking-tight">Secure Your Spot!</h3>
                      <p className="text-purple-100 text-sm font-medium">Join thousands who've already registered</p>
                      
                      {/* Trust Badges - inline with text */}
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1.5 text-white/90">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-xs font-semibold">100% Secure</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-white/90">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                          </svg>
                          <span className="text-xs font-semibold">No Spam</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowScheduleModal(false)}
                      className="text-white hover:bg-white/20 transition-all duration-200 rounded-full p-2 hover:rotate-90 transform"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Scrollable Form Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-140px)] px-8 py-6 space-y-5 bg-gradient-to-b from-gray-50 to-white">
                  {/* Name Field */}
                  <div>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium ${
                        errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      placeholder="Enter your full name *"
                    />
                    {errors.name && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium ${
                        errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      placeholder="Enter your email address *"
                    />
                    {errors.email && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Phone Field */}
                  <div>
                    <div className="flex gap-2">
                      <select
                        value={formData.countryCode}
                        onChange={(e) => setFormData({ ...formData, countryCode: e.target.value, phone: '' })}
                        className="px-3 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium hover:border-gray-300 bg-white"
                        style={{ width: '130px' }}
                      >
                        {countryCodes.map((cc) => (
                          <option key={cc.code} value={cc.code}>
                            {cc.code} {cc.country}
                          </option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^\d\s\-]/g, '')
                          setFormData({ ...formData, phone: value })
                        }}
                        className={`flex-1 px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium ${
                          errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                        placeholder={formData.countryCode === '+1' ? 'Phone number (optional)' : 'Phone number (optional)'}
                      />
                    </div>
                    {errors.phone && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  {/* Schedule Dropdown Selection */}
                  <div>
                    <label htmlFor="schedule-custom" className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-600" />
                      Select Webinar Time <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="schedule-custom"
                      value={selectedSchedule?.id || ''}
                      onChange={(e) => {
                        const value = e.target.value
                        // Check if it's a slot ID (contains "-slot-")
                        if (value.includes('-slot-')) {
                          const baseScheduleId = value.split('-slot-')[0]
                          const baseSchedule = schedules.find(s => s.id === baseScheduleId)
                          if (baseSchedule) {
                            // Store the base schedule with the slot ID for later use
                            setSelectedSchedule({ ...baseSchedule, id: value } as any)
                          }
                        } else {
                          const schedule = schedules.find(s => s.id === value)
                          setSelectedSchedule(schedule || null)
                        }
                      }}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium ${
                        errors.schedule ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                      } bg-white`}
                      disabled={schedulesLoading}
                    >
                      {schedulesLoading ? (
                        <option value="">⏳ Loading available times...</option>
                      ) : (
                        <option value="">Choose your preferred time...</option>
                      )}
                      {!schedulesLoading && (() => {
                        const maxSchedulesToShow = webinar.maxSchedulesToShow || 5
                        
                        // Collect all time slots with their dates for sorting
                        interface TimeSlot {
                          id: string
                          time: Date
                          schedule: Schedule
                          isRecurring: boolean
                        }
                        
                        const allTimeSlots: TimeSlot[] = []
                        const now = new Date()
                        
                        // STEP 1: Add specific and just-in-time schedules (only future dates)
                        schedules.forEach((schedule) => {
                          if (schedule.scheduleType === 'specific' && schedule.scheduledAt) {
                            // Parse the schedule time - it's already in UTC from the database
                            const scheduleTime = new Date(schedule.scheduledAt)
                            
                            // Only add if schedule is in the future
                            if (scheduleTime > now) {
                              allTimeSlots.push({
                                id: schedule.id,
                                time: scheduleTime,
                                schedule,
                                isRecurring: false
                              })
                            }
                          } else if (schedule.scheduleType === 'justInTime') {
                            // Calculate JIT time: current time + minutes from registration
                            const jitTime = new Date()
                            jitTime.setMinutes(jitTime.getMinutes() + (schedule.minutesFromReg || 5))
                            const shouldRound = webinar.roundJITTo15Minutes !== false; const finalJitTime = shouldRound ? roundToNearest15Minutes(jitTime) : jitTime
                            allTimeSlots.push({
                              id: schedule.id,
                              time: finalJitTime,
                              schedule,
                              isRecurring: false
                            })
                          }
                        })
                        
                        // STEP 2: Generate slots from ALL recurring schedules (generate more than needed)
                        const recurringSchedules = schedules.filter(s => s.scheduleType === 'recurring')
                        recurringSchedules.forEach((schedule) => {
                          // Generate plenty of slots (we'll sort and limit later)
                          const slots = generateRecurringSlots(schedule, maxSchedulesToShow * 3)
                          slots.forEach((slot) => {
                            allTimeSlots.push({
                              id: slot.id,
                              time: slot.time,
                              schedule,
                              isRecurring: true
                            })
                          })
                        })
                        
                        // STEP 3: Remove duplicate time slots (same time within 1 minute window)
                        const uniqueSlots = allTimeSlots.filter((slot, index, self) => {
                          // Find if there's an earlier slot with same/similar time
                          const duplicateIndex = self.findIndex(s => 
                            Math.abs(s.time.getTime() - slot.time.getTime()) < 60000 // Within 1 minute
                          )
                          // Keep only the first occurrence
                          return duplicateIndex === index
                        })
                        
                        // STEP 4: Sort all slots by time (earliest first)
                        uniqueSlots.sort((a, b) => a.time.getTime() - b.time.getTime())
                        
                        // STEP 5: Take the first N slots and convert to options
                        const finalSlots = uniqueSlots.slice(0, maxSchedulesToShow)
                        const allScheduleOptions = finalSlots.map((slot) => (
                          <option key={slot.id} value={slot.id}>
                            {slot.isRecurring 
                              ? formatScheduleTime(slot.schedule, slot.time)
                              : formatScheduleTime(slot.schedule)
                            }
                          </option>
                        ))
                        
                        return allScheduleOptions
                      })()}
                    </select>
                    {errors.schedule && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.schedule}
                      </p>
                    )}
                    
                    {/* Timezone Info with Change Link */}
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

                    {/* Collapsible Timezone Selector */}
                    {showTimezoneSelector && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <label htmlFor="timezone-custom" className="block text-xs font-semibold text-gray-700 mb-2">
                          Select Your Timezone
                        </label>
                        <select
                          id="timezone-custom"
                          value={selectedTimezone}
                          onChange={(e) => {
                            setSelectedTimezone(e.target.value)
                            setShowTimezoneSelector(false)
                          }}
                          className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white"
                        >
                          {timezones.map((tz) => (
                            <option key={tz.value} value={tz.value}>
                              {tz.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Privacy Policy Consent */}
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="privacyConsent"
                      checked={formData.privacyConsent}
                      onChange={(e) => setFormData({ ...formData, privacyConsent: e.target.checked })}
                      className="mt-1 w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                    <label htmlFor="privacyConsent" className="text-xs text-gray-500 leading-snug cursor-pointer">
                      I agree to the <a href="#" className="underline hover:text-purple-600">Privacy Policy</a> and <a href="#" className="underline hover:text-purple-600">Terms of Service</a>. <span className="text-red-500">*</span>
                    </label>
                  </div>
                  {errors.privacyConsent && (
                    <p className="text-sm text-red-600 flex items-center gap-1 ml-8">
                      <AlertCircle className="w-4 h-4" />
                      {errors.privacyConsent}
                    </p>
                  )}
                </div>

                {/* Footer / CTA Button */}
                <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-4">
                  <button
                    onClick={() => setShowScheduleModal(false)}
                    className="flex-1 px-4 py-4 border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-100 hover:border-gray-400 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRegister}
                    disabled={registering}
                    className="flex-[2] px-6 py-4 bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold text-lg rounded-xl shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                    style={{
                      background: 'linear-gradient(135deg, #f43f5e 0%, #ec4899 100%)',
                      boxShadow: '0 4px 14px rgba(244, 63, 94, 0.4)'
                    }}
                  >
                    {registering ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Complete Registration
                      </>
                    )}
                  </button>
                </div>
                
                {/* Security Note */}
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-400 font-medium">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span>Your information is safe with us</span>
                  </div>
                </div>
              </div>
              </div>
            </div>
          )}
        </div>
      )
    }
    
    // For custom HTML templates, process and render
    const processedHtml = registrationPage.htmlCode.replace(
      /\{\{schedules\}\}/g, 
      '<div id="schedules-placeholder">Loading times...</div>'
    )
    
    return (
      <div className="custom-template-container">
        {/* Track registration page visit */}
        <RegistrationPageTracker
          webinarId={webinar.id}
          pageId={pageId}
          variant={variantGroup}
          templateName={registrationPage.name}
        />
        
        <div dangerouslySetInnerHTML={{ __html: processedHtml }} />
        
        {/* Registration Modal */}
        {showScheduleModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" 
                onClick={() => setShowScheduleModal(false)}
              ></div>
              
              <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border-4 border-white/20" style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                {/* Compact Header with gradient background */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-4 relative overflow-hidden">
                  {/* Decorative elements */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-24 -mb-24"></div>
                  
                  <div className="relative z-10 flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-2xl font-extrabold text-white mb-1 tracking-tight">Secure Your Spot!</h3>
                      <p className="text-purple-100 text-sm font-medium">Join thousands who've already registered</p>
                      
                      {/* Trust Badges - inline with text */}
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1.5 text-white/90">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-xs font-semibold">100% Secure</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-white/90">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                          </svg>
                          <span className="text-xs font-semibold">No Spam</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowScheduleModal(false)}
                      className="text-white hover:bg-white/20 transition-all duration-200 rounded-full p-2 hover:rotate-90 transform"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Scrollable Form Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-140px)] px-8 py-6 space-y-5 bg-gradient-to-b from-gray-50 to-white">
                  {/* Name Field */}
                  <div>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium ${
                        errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      placeholder="Enter your full name *"
                    />
                    {errors.name && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium ${
                        errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      placeholder="Enter your email address *"
                    />
                    {errors.email && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Phone Field */}
                  <div>
                    <div className="flex gap-2">
                      <select
                        value={formData.countryCode}
                        onChange={(e) => setFormData({ ...formData, countryCode: e.target.value, phone: '' })}
                        className="px-3 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium hover:border-gray-300 bg-white"
                        style={{ width: '130px' }}
                      >
                        {countryCodes.map((cc) => (
                          <option key={cc.code} value={cc.code}>
                            {cc.code} {cc.country}
                          </option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^\d\s\-]/g, '')
                          setFormData({ ...formData, phone: value })
                        }}
                        className={`flex-1 px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium ${
                          errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                        placeholder={formData.countryCode === '+1' ? 'Phone number (optional)' : 'Phone number (optional)'}
                      />
                    </div>
                    {errors.phone && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  {/* Schedule Dropdown Selection */}
                  <div>
                    <label htmlFor="schedule-custom" className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-600" />
                      Select Webinar Time <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="schedule-custom"
                      value={selectedSchedule?.id || ''}
                      onChange={(e) => {
                        const value = e.target.value
                        // Check if it's a slot ID (contains "-slot-")
                        if (value.includes('-slot-')) {
                          const baseScheduleId = value.split('-slot-')[0]
                          const baseSchedule = schedules.find(s => s.id === baseScheduleId)
                          if (baseSchedule) {
                            // Store the base schedule with the slot ID for later use
                            setSelectedSchedule({ ...baseSchedule, id: value } as any)
                          }
                        } else {
                          const schedule = schedules.find(s => s.id === value)
                          setSelectedSchedule(schedule || null)
                        }
                      }}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium ${
                        errors.schedule ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                      } bg-white`}
                      disabled={schedulesLoading}
                    >
                      {schedulesLoading ? (
                        <option value="">⏳ Loading available times...</option>
                      ) : (
                        <option value="">Choose your preferred time...</option>
                      )}
                      {!schedulesLoading && (() => {
                        const maxSchedulesToShow = webinar.maxSchedulesToShow || 5
                        
                        // Collect all time slots with their dates for sorting
                        interface TimeSlot {
                          id: string
                          time: Date
                          schedule: Schedule
                          isRecurring: boolean
                        }
                        
                        const allTimeSlots: TimeSlot[] = []
                        const now = new Date()
                        
                        // STEP 1: Add specific and just-in-time schedules (only future dates)
                        schedules.forEach((schedule) => {
                          if (schedule.scheduleType === 'specific' && schedule.scheduledAt) {
                            // Parse the schedule time - it's already in UTC from the database
                            const scheduleTime = new Date(schedule.scheduledAt)
                            
                            // Only add if schedule is in the future
                            if (scheduleTime > now) {
                              allTimeSlots.push({
                                id: schedule.id,
                                time: scheduleTime,
                                schedule,
                                isRecurring: false
                              })
                            }
                          } else if (schedule.scheduleType === 'justInTime') {
                            // Calculate JIT time: current time + minutes from registration
                            const jitTime = new Date()
                            jitTime.setMinutes(jitTime.getMinutes() + (schedule.minutesFromReg || 5))
                            const shouldRound = webinar.roundJITTo15Minutes !== false; const finalJitTime = shouldRound ? roundToNearest15Minutes(jitTime) : jitTime
                            allTimeSlots.push({
                              id: schedule.id,
                              time: finalJitTime,
                              schedule,
                              isRecurring: false
                            })
                          }
                        })
                        
                        // STEP 2: Generate slots from ALL recurring schedules (generate more than needed)
                        const recurringSchedules = schedules.filter(s => s.scheduleType === 'recurring')
                        recurringSchedules.forEach((schedule) => {
                          // Generate plenty of slots (we'll sort and limit later)
                          const slots = generateRecurringSlots(schedule, maxSchedulesToShow * 3)
                          slots.forEach((slot) => {
                            allTimeSlots.push({
                              id: slot.id,
                              time: slot.time,
                              schedule,
                              isRecurring: true
                            })
                          })
                        })
                        
                        // STEP 3: Remove duplicate time slots (same time within 1 minute window)
                        const uniqueSlots = allTimeSlots.filter((slot, index, self) => {
                          // Find if there's an earlier slot with same/similar time
                          const duplicateIndex = self.findIndex(s => 
                            Math.abs(s.time.getTime() - slot.time.getTime()) < 60000 // Within 1 minute
                          )
                          // Keep only the first occurrence
                          return duplicateIndex === index
                        })
                        
                        // STEP 4: Sort all slots by time (earliest first)
                        uniqueSlots.sort((a, b) => a.time.getTime() - b.time.getTime())
                        
                        // STEP 5: Take the first N slots and convert to options
                        const finalSlots = uniqueSlots.slice(0, maxSchedulesToShow)
                        const allScheduleOptions = finalSlots.map((slot) => (
                          <option key={slot.id} value={slot.id}>
                            {slot.isRecurring 
                              ? formatScheduleTime(slot.schedule, slot.time)
                              : formatScheduleTime(slot.schedule)
                            }
                          </option>
                        ))
                        
                        return allScheduleOptions
                      })()}
                    </select>
                    {errors.schedule && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.schedule}
                      </p>
                    )}
                    
                    {/* Timezone Info with Change Link */}
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

                    {/* Collapsible Timezone Selector */}
                    {showTimezoneSelector && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <label htmlFor="timezone-custom" className="block text-xs font-semibold text-gray-700 mb-2">
                          Select Your Timezone
                        </label>
                        <select
                          id="timezone-custom"
                          value={selectedTimezone}
                          onChange={(e) => {
                            setSelectedTimezone(e.target.value)
                            setShowTimezoneSelector(false)
                          }}
                          className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white"
                        >
                          {timezones.map((tz) => (
                            <option key={tz.value} value={tz.value}>
                              {tz.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Privacy Policy Consent */}
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="privacyConsent"
                      checked={formData.privacyConsent}
                      onChange={(e) => setFormData({ ...formData, privacyConsent: e.target.checked })}
                      className="mt-1 h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <label htmlFor="privacyConsent" className="text-sm text-gray-700">
                      I agree to the <a href="/privacy" target="_blank" className="text-purple-600 hover:underline">Privacy Policy</a> and <a href="/terms" target="_blank" className="text-purple-600 hover:underline">Terms of Service</a>. <span className="text-red-500">*</span>
                    </label>
                  </div>
                  {errors.privacyConsent && (
                    <p className="text-sm text-red-600">{errors.privacyConsent}</p>
                  )}

                  {/* Submit Error */}
                  {errors.submit && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-800">{errors.submit}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowScheduleModal(false)}
                      disabled={registering}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleRegister}
                      disabled={registering}
                      className="px-6 py-2 rounded-lg text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: 'linear-gradient(135deg, #ff6b6b 0%, #ff8787 100%)',
                        boxShadow: '0 4px 8px rgba(255, 107, 107, 0.3)'
                      }}
                    >
                      {registering ? 'Registering...' : 'Complete Registration'}
                    </button>
                  </div>

                  {/* Privacy Statement */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Your information is safe with us</p>
                        <p className="text-xs text-gray-600 mt-1">We respect your privacy and never share your data with third parties.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-t-2 border-gray-200">
                  {/* Trust indicators */}
                  <div className="flex items-center justify-center gap-6 mb-4 pb-4 border-b border-gray-300">
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-semibold">SSL Encrypted</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-semibold">GDPR Compliant</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-semibold">100% Free</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setShowScheduleModal(false)}
                      disabled={registering}
                      className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-white transition-all hover:shadow-md hover:border-gray-400"
                    >
                      Maybe Later
                    </button>
                    <button
                      type="button"
                      onClick={handleRegister}
                      disabled={registering}
                      className="flex-1 px-8 py-4 rounded-xl text-white font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
                      style={{
                        // Use local theme or fallback
                        background: '#4f46e5',
                        boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4)'
                      }}
                    >
                      {/* Button glow effect */}
                      <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                      
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {registering ? (
                          <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Securing your spot...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                            Yes, Reserve My Spot Now!
                          </>
                        )}
                      </span>
                    </button>
                  </div>
                  
                  {/* Guarantee text */}
                  <p className="text-center text-xs text-gray-500 mt-4">
                    <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    Your information is 100% secure and will never be shared
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
  
  // If no registration page, return not found
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-xl text-gray-600">Registration page not configured</p>
      </div>
    </div>
  )
}
