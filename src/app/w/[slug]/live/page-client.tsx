'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './WebinarLivePage.module.css';
import { WebinarTracker } from '@/lib/tracking';

// Declare Vimeo Player API types
declare global {
  interface Window {
    Vimeo?: {
      Player: new (iframe: HTMLIFrameElement) => {
        ready(): Promise<void>;
        play(): Promise<void>;
        pause(): Promise<void>;
        setCurrentTime(seconds: number): Promise<void>;
        getCurrentTime(): Promise<number>;
        getDuration(): Promise<number>;
        setVolume(volume: number): Promise<number>;
        getVolume(): Promise<number>;
        getMuted(): Promise<boolean>;
        setMuted(muted: boolean): Promise<boolean>;
        setPlaybackRate(rate: number): Promise<number>;
        getPlaybackRate(): Promise<number>;
        on(event: string, callback: () => void): void;
        off(event: string, callback?: () => void): void;
      };
    };
  }
}

type ReactionType = 'heart' | 'clap' | 'thumbsUp';

interface ChatMessage {
  id: string;
  clientId?: string; // Stable ID for React keys to prevent DOM thrashing
  userName: string;
  message: string;
  videoTimestamp: number | null;
  isScripted: boolean;
  createdAt: string;
  likes?: number;
  likedByMe?: boolean;
}

interface LiveOffer {
  id: string;
  title: string;
  description: string;
  price: number;
  ctaText: string;
  ctaUrl: string;
  videoTimestamp: number;
  hideAfter: number | null;
  countdownDuration: number | null;
  bulletPoints: string[];
  originalPrice: number | null;
  discountLabel: string | null;
}

interface ReactionEvent {
  id: string;
  type: ReactionType;
  userName: string;
  videoTimestamp: number;
}

interface ViewerInfo {
  id: string;
  name: string;
  email: string;
  lastWatchedPosition?: number;
}

interface TimingMeta {
  startTimeIso: string;
  nowIso: string;
  initialElapsedSeconds: number;
  videoDuration: number | null;
}

interface WebinarData {
  id: string;
  title: string;
  description: string;
  videoUrl?: string | null;
  vimeoVideoId?: string | null;
  videoDuration?: number | null;
  hasChat?: boolean;
  hasOffers?: boolean;
  hasReactions?: boolean;
  showElapsedTime?: boolean;
  replayEnabled?: boolean;
  replayExpiresAt?: string | null;
}

interface OfferContent {
  title: string;
  description: string;
  features: string[];
  price: number;
  originalPrice: number | null;
  discountLabel: string | null;
  countdownDuration: number | null;
  ctaText: string;
  ctaUrl: string;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

interface WebinarLiveClientProps {
  webinar: WebinarData;
  offers: LiveOffer[];
  faqs: FAQ[];
  chatMessages: ChatMessage[];
  reactionEvents: ReactionEvent[];
  viewer: ViewerInfo | null;
  timing: TimingMeta;
  isReplayMode?: boolean;
}

const defaultFaqs = [
  {
    id: 'default-1',
    question: 'What is included in the Motherhood Balance Program?',
    answer:
      "The program includes 8 weeks of comprehensive content covering Islamic parenting principles, self-care strategies, time management techniques, and access to our supportive community of Muslim mothers. You'll also receive downloadable resources and lifetime access to all materials.",
  },
  {
    id: 'default-2',
    question: 'Is this program suitable for new mothers?',
    answer:
      'Yes, absolutely! The program is designed for mothers at all stages, including new mothers. We provide specific guidance for different phases of motherhood and help you establish healthy routines from the beginning.',
  },
  {
    id: 'default-3',
    question: 'How much time do I need to commit each week?',
    answer:
      'We recommend 2-3 hours per week for the best results. The content is self-paced, so you can adjust according to your schedule. Many mothers complete the program while managing their regular responsibilities.',
  },
  {
    id: 'default-4',
    question: 'Can I access the content on my mobile device?',
    answer:
      'Yes, the program is fully mobile-responsive. You can access all content, including videos, worksheets, and community discussions, from your smartphone or tablet.',
  },
  {
    id: 'default-5',
    question: 'Is there a payment plan available?',
    answer:
      'Yes, we offer flexible payment plans to make the program accessible to all mothers. You can choose to pay in full for a discount or spread payments over 3 months.',
  },
];

const randomResponses = [
  { userName: 'Ruqayyah', message: 'JazakAllah khair for sharing!' },
  { userName: 'Sumayyah', message: "That's a great question!" },
  { userName: 'Asma', message: 'I was wondering the same thing.' },
  { userName: 'Layla', message: 'May Allah reward you for this.' },
  { userName: 'Halima', message: "That's very helpful, thank you." },
  { userName: 'Nusaybah', message: 'Loving these practical tips ❤️' },
  { userName: 'Sakinah', message: 'SubhanAllah, this is so insightful.' },
  { userName: 'Jamila', message: 'Taking notes right now!' },
];

const trustIndicators = [
  { icon: 'fas fa-shield-alt', label: 'Secure Payment' },
];

const defaultOfferFallback: OfferContent = {
  title: 'Motherhood Balance Program',
  description:
    'A transformative program designed for Muslim mothers seeking balance between faith, family, and personal growth.',
  features: [
    'Islamic parenting principles',
    'Self-care for mothers',
    'Time management strategies',
    'Supportive community',
  ],
  price: 49,
  originalPrice: 99,
  discountLabel: '50% OFF',
  countdownDuration: 180,
  ctaText: 'Join the Program',
  ctaUrl: '#',
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

// Helper function to log video errors to database
async function logVideoError(
  webinarId: string,
  registrationId: string | undefined,
  errorType: string,
  errorMessage: string,
  errorStack?: string,
  viewerInfo?: { name?: string; email?: string } // NEW: Optional viewer info
) {
  try {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    const deviceInfo = {
      isMobile,
      isDesktop: !isMobile, // NEW: Explicitly track desktop
      userAgent: navigator.userAgent,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      platform: navigator.platform,
      language: navigator.language,
    };

    // NEW: Include viewer information in the error log
    const errorData = {
      webinarId,
      registrationId,
      errorType,
      errorMessage,
      errorStack,
      userAgent: navigator.userAgent,
      deviceInfo: JSON.stringify(deviceInfo),
      timestamp: new Date().toISOString(),
      // NEW: Add viewer name and email
      viewerName: viewerInfo?.name || null,
      viewerEmail: viewerInfo?.email || null,
    };

    console.log('🚨 Logging video error:', {
      errorType,
      device: isMobile ? 'Mobile' : 'Desktop',
      viewer: viewerInfo?.name || 'Unknown',
      message: errorMessage,
    });

    await fetch('/api/video-errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorData),
    });
  } catch (err) {
    console.error('Failed to log video error:', err);
  }
}

function deriveEmbedUrl(webinar: WebinarData, isMobileDevice: boolean = false, isReplay: boolean = false) {
  // Detect mobile if not passed in
  const isMobile = isMobileDevice || (typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
  
  // Mobile optimization: Start with lower quality to reduce buffering
  // Desktop: Start with higher quality
  const qualityParam = isMobile ? '540p' : '720p';
  
  // Force controls for replay mode
  const controlsParam = isReplay ? '&controls=1' : '&controls=0';
  
  if (webinar.vimeoVideoId) {
    return `https://player.vimeo.com/video/${webinar.vimeoVideoId}?quality=${qualityParam}${controlsParam}`;
  }

  if (webinar.videoUrl) {
    const url = webinar.videoUrl;

    const youtubeMatch = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/i
    );
    if (youtubeMatch) {
      // YouTube controls=1 is default, controls=0 is hidden
      const ytControls = isReplay ? '&controls=1' : '&controls=0&showinfo=0&modestbranding=1';
      return `https://www.youtube.com/embed/${youtubeMatch[1]}?rel=0${ytControls}`;
    }

    const vimeoUrlMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoUrlMatch) {
       return `https://player.vimeo.com/video/${vimeoUrlMatch[1]}?quality=${qualityParam}${controlsParam}`;
    }

    return url;
  }

  return null;
}

function formatTimeLabel(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = (safeSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${secs}`;
}

function formatCountdown(seconds: number) {
  const safeSeconds = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  if (minutes <= 0) {
    return `${secs}s`;
  }
  return `${minutes}m ${secs.toString().padStart(2, '0')}s`;
}

function findOfferForElapsed(offers: LiveOffer[], elapsedSeconds: number) {
  let candidate: LiveOffer | null = null;
  for (const offer of offers) {
    if (offer.videoTimestamp > elapsedSeconds) {
      continue;
    }
    const hideAt =
      offer.hideAfter != null
        ? offer.videoTimestamp + offer.hideAfter
        : Number.POSITIVE_INFINITY;
    if (elapsedSeconds > hideAt) {
      continue;
    }
    if (!candidate || offer.videoTimestamp > candidate.videoTimestamp) {
      candidate = offer;
    }
  }
  return candidate;
}

function buildOfferContent(offer: LiveOffer | null): OfferContent | null {
  if (!offer) {
    return null;
  }

  const rawLines = (offer.description || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const description =
    rawLines[0] ||
    (offer.description ? offer.description.trim() : null) ||
    defaultOfferFallback.description;

  const leftoverLines = rawLines.slice(1);
  const features =
    offer.bulletPoints && offer.bulletPoints.length > 0
      ? offer.bulletPoints
      : leftoverLines;

  const countdownDurationValue =
    typeof offer.countdownDuration === 'number' &&
    Number.isFinite(offer.countdownDuration) &&
    offer.countdownDuration > 0
      ? offer.countdownDuration
      : null;

  return {
    title: offer.title || defaultOfferFallback.title,
    description,
    features,
    price: offer.price ?? defaultOfferFallback.price,
    originalPrice: offer.originalPrice ?? null,
    discountLabel: offer.discountLabel || null,
    countdownDuration: countdownDurationValue,
    ctaText: offer.ctaText || defaultOfferFallback.ctaText,
    ctaUrl: offer.ctaUrl || defaultOfferFallback.ctaUrl,
  };
}

export default function WebinarLiveClient({
  webinar,
  offers,
  faqs,
  chatMessages,
  reactionEvents,
  viewer,
  timing,
  isReplayMode = false,
}: WebinarLiveClientProps) {
  // Debug: Log viewer data on mount
  console.log('🎯 [WebinarLiveClient] Component mounted');
  console.log('🎯 [WebinarLiveClient] Viewer:', viewer);
  console.log('🎯 [WebinarLiveClient] Is replay mode:', isReplayMode);
  console.log('🎯 [WebinarLiveClient] Viewer lastWatchedPosition:', viewer?.lastWatchedPosition);
  
  const [isChatOpen, setIsChatOpen] = useState(true); // Changed to true - chat visible by default
  const [isChatMinimized, setIsChatMinimized] = useState(false); // New state for mobile minimization
  const [activeTab, setActiveTab] = useState<'chat' | 'faq'>('chat');
  const [chatInput, setChatInput] = useState('');
  const [openFaqs, setOpenFaqs] = useState<Set<number>>(new Set());
  const [isMobile, setIsMobile] = useState(false);
  // Initialize to false to avoid hydration mismatch, then update in useEffect
  const [broadcastStarted, setBroadcastStarted] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false); // Show loading state
  const [mounted, setMounted] = useState(false); // Track if component has mounted
  const [playerReady, setPlayerReady] = useState(false); // Track if Vimeo player is ready
  const [liveViewerCount, setLiveViewerCount] = useState(0); // Simulated live viewer count
  const [isTyping, setIsTyping] = useState(false); // Show "someone is typing" indicator
  const [isTabVisible, setIsTabVisible] = useState(true); // Track tab visibility
  const pausedTimeRef = useRef<number | null>(null); // Store elapsed time when tab becomes hidden
  const broadcastStartTimeRef = useRef<number>(0); // Track when broadcast actually started
  const trackerRef = useRef<WebinarTracker | null>(null); // Analytics tracker
  const [isFullscreen, setIsFullscreen] = useState(false); // Track fullscreen state
  const [videoError, setVideoError] = useState(false); // Track if video failed to load
  const [needsUserGesture, setNeedsUserGesture] = useState(false); // Track if we need fresh user interaction to play
  const [isMuted, setIsMuted] = useState(true); // Start muted for mobile compatibility
  const [showUnmuteHint, setShowUnmuteHint] = useState(false); // Show prominent unmute hint
  const [replayTimeRemaining, setReplayTimeRemaining] = useState<string | null>(null); // Countdown display
  const [seenOfferIds, setSeenOfferIds] = useState<Set<string>>(new Set()); // Track offers user has seen
  const [webinarEnded, setWebinarEnded] = useState(false); // Track if live webinar has ended
  const [showReplayPrompt, setShowReplayPrompt] = useState(false); // Show replay start prompt
  const [iframeKey, setIframeKey] = useState(0); // Force iframe recreation on retry
  const [showPausedOverlay, setShowPausedOverlay] = useState(false); // Show play button when video paused after tab switch
  const [playbackRate, setPlaybackRate] = useState(0.9); // Default to Slower (0.9x)

  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const offerRef = useRef<HTMLDivElement>(null);
  const vimeoPlayerRef = useRef<any>(null); // Vimeo Player API instance
  const startTimeRef = useRef<number>(0); // Store the elapsed time when broadcast starts
  const serverNowMs = useMemo(
    () => new Date(timing.nowIso).getTime(),
    [timing.nowIso]
  );
  const startTimeMs = useMemo(
    () => new Date(timing.startTimeIso).getTime(),
    [timing.startTimeIso]
  );
  const totalDuration =
    timing.videoDuration ?? webinar.videoDuration ?? 45 * 60;

  const serverOffsetRef = useRef<number>(Date.now() - serverNowMs);

  useEffect(() => {
    serverOffsetRef.current = Date.now() - serverNowMs;
  }, [serverNowMs]);

  const sortedMessages = useMemo(() => {
    const base = chatMessages;
    return base.slice().sort((a, b) => {
      const aTime =
        typeof a.videoTimestamp === 'number'
          ? a.videoTimestamp
          : Number.MAX_SAFE_INTEGER;
      const bTime =
        typeof b.videoTimestamp === 'number'
          ? b.videoTimestamp
          : Number.MAX_SAFE_INTEGER;
      if (aTime !== bTime) {
        return aTime - bTime;
      }
      return (
        new Date(a.createdAt).getTime() -
        new Date(b.createdAt).getTime()
      );
    });
  }, [chatMessages]);

  const initialMessages = useMemo(() => {
    const eligible = sortedMessages.filter((message) => {
      if (typeof message.videoTimestamp !== 'number') {
        return true;
      }
      return message.videoTimestamp <= timing.initialElapsedSeconds;
    });
    if (eligible.length > 0) {
      return eligible;
    }
    return sortedMessages.slice(0, Math.min(3, sortedMessages.length));
  }, [sortedMessages, timing.initialElapsedSeconds]);

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const displayedMessageIdsRef = useRef<Set<string>>(
    new Set(initialMessages.map((message) => message.id))
  );

  useEffect(() => {
    const ids = new Set(initialMessages.map((message) => message.id));
    displayedMessageIdsRef.current = ids;
    setMessages(initialMessages);
  }, [initialMessages]);

  const sortedReactions = useMemo(
    () =>
      reactionEvents.slice().sort((a, b) => a.videoTimestamp - b.videoTimestamp),
    [reactionEvents]
  );

  const seededReactionCounts = useMemo(() => {
    const counts: Record<ReactionType, number> = {
      heart: 0,
      clap: 0,
      thumbsUp: 0,
    };

    // Only count reactions that happened before video starts (for late joiners)
    // But for videos starting at 0, this will be 0
    sortedReactions.forEach((event) => {
      if (event.videoTimestamp < timing.initialElapsedSeconds) {
        counts[event.type] += 1;
      }
    });

    return counts;
  }, [sortedReactions, timing.initialElapsedSeconds]);

  const [reactionCounts, setReactionCounts] = useState(seededReactionCounts);
  // Don't pre-mark reactions as triggered - let them show at their exact timestamps
  const triggeredReactionsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setReactionCounts(seededReactionCounts);
  }, [seededReactionCounts]);

  // Don't pre-populate triggeredReactionsRef - let reactions show at exact time
  // This allows all reactions to appear when the video reaches their timestamp

  // Load Vimeo Player API
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Check if script already loaded
    if (window.Vimeo) return;
    
    const script = document.createElement('script');
    script.src = 'https://player.vimeo.com/api/player.js';
    script.async = true;
    document.head.appendChild(script);
    
    return () => {
      // Don't remove script as other components might use it
    };
  }, []);

  // Global error handler for uncaught errors on mobile/desktop
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleGlobalError = (event: ErrorEvent) => {
      // Only log errors related to video/media/vimeo
      const errorMessage = event.message?.toLowerCase() || '';
      const isVideoRelated = 
        errorMessage.includes('video') ||
        errorMessage.includes('vimeo') ||
        errorMessage.includes('player') ||
        errorMessage.includes('media') ||
        errorMessage.includes('iframe') ||
        event.filename?.includes('vimeo') ||
        event.filename?.includes('player');

      if (isVideoRelated) {
        console.error('🚨 Global error (video-related):', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        });

        logVideoError(
          webinar.id,
          viewer?.id,
          'uncaught_error',
          `${event.message} (${event.filename}:${event.lineno}:${event.colno})`,
          event.error?.stack,
          {
            name: viewer?.name,
            email: viewer?.email,
          }
        );
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Log all unhandled promise rejections as they might be video loading issues
      const reason = event.reason;
      const errorMessage = reason?.message || String(reason);
      
      console.error('🚨 Unhandled promise rejection:', {
        reason: errorMessage,
        promise: event.promise,
      });

      logVideoError(
        webinar.id,
        viewer?.id,
        'unhandled_rejection',
        `Promise rejected: ${errorMessage}`,
        reason?.stack,
        {
          name: viewer?.name,
          email: viewer?.email,
        }
      );
    };

    // Add global error listeners
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [webinar.id, viewer?.id, viewer?.name, viewer?.email]);

  // Monitor network connectivity issues
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      console.log('🌐 Network connection restored');
    };

    const handleOffline = () => {
      console.error('🚨 Network connection lost');
      
      // Log network disconnection if video is playing
      if (broadcastStarted) {
        logVideoError(
          webinar.id,
          viewer?.id,
          'network_offline',
          'Network connection lost while video was playing',
          undefined,
          {
            name: viewer?.name,
            email: viewer?.email,
          }
        );
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [webinar.id, viewer?.id, viewer?.name, viewer?.email, broadcastStarted]);

  // Track session end and schedule post-webinar reminders
  const watchTimeRef = useRef(0);
  const lastPositionRef = useRef(0);
  
  useEffect(() => {
    if (typeof window === 'undefined' || !viewer?.id) return;

    // Track watch time
    const intervalId = setInterval(() => {
      // If video is playing, increment watch time
      if (broadcastStarted) {
        watchTimeRef.current += 10;
      }
    }, 10000);

    const schedulePostReminders = async () => {
      const watchedSeconds = watchTimeRef.current;
      
      if (watchedSeconds < 30) {
        console.log('[Session End] Watch time too short, not scheduling reminders:', watchedSeconds);
        return; // Don't schedule if watched less than 30 seconds
      }

      console.log('[Session End] Scheduling post-webinar reminders...', {
        watchedSeconds,
        registrationId: viewer.id
      });

      try {
        const response = await fetch('/api/tracking/schedule-post-reminders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            registrationId: viewer.id,
            watchedSeconds,
            videoPosition: lastPositionRef.current
          }),
        });
        
        if (response.ok) {
          console.log('[Session End] Post-webinar reminders scheduled successfully');
        }
      } catch (error) {
        console.error('[Session End] Failed to schedule post-webinar reminders:', error);
      }
    };

    const handleBeforeUnload = () => {
      // Use navigator.sendBeacon for more reliable delivery on page unload
      if (watchTimeRef.current >= 30) {
        const data = JSON.stringify({
          registrationId: viewer.id,
          watchedSeconds: watchTimeRef.current,
          videoPosition: lastPositionRef.current
        });
        
        navigator.sendBeacon('/api/tracking/schedule-post-reminders', data);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        schedulePostReminders();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Schedule reminders on component unmount as well
      schedulePostReminders();
    };
  }, [viewer?.id, webinar.id, broadcastStarted]);

  const spawnReaction = useCallback(
    (type: ReactionType, origin?: { x: number; y: number }, userName?: string) => {
      // Desktop: Create flying animation over video
      const floatingReaction = document.createElement('div');
      floatingReaction.className = styles.flyingReaction;

      const iconMap: Record<
        ReactionType,
        { icon: string; color: string }
      > = {
        heart: { icon: 'fa-heart', color: '#e75780' },
        clap: {
          icon: 'fa-hands-clapping',
          color: '#f0c75e',
        },
        thumbsUp: {
          icon: 'fa-thumbs-up',
          color: '#7b68ee',
        },
      };

      const { icon, color } = iconMap[type];
      
      // Create reaction with user name - grayish background, first name only
      const firstName = userName ? userName.split(' ')[0] : '';
      floatingReaction.innerHTML = `
        <div style="display: flex; align-items: center; gap: 4px; background: rgba(100, 100, 100, 0.7); padding: 4px 8px; border-radius: 12px; backdrop-filter: blur(4px);">
          <i class="fas ${icon}" style="font-size: 0.9rem;"></i>
          ${firstName ? `<span style="font-size: 0.65rem; color: rgba(255, 255, 255, 0.95); font-weight: 500;">${firstName}</span>` : ''}
        </div>
      `;
      floatingReaction.style.color = color;

      const originX = origin?.x ?? window.innerWidth / 2;
      const originY = origin?.y ?? window.innerHeight / 2;

      floatingReaction.style.left = `${originX}px`;
      floatingReaction.style.top = `${originY}px`;

      // Move upward and slightly inward (toward center)
      const moveInward = originX < window.innerWidth / 2 ? 60 : -60; // Move towards center
      const tx = moveInward + (Math.random() - 0.5) * 30; // Inward + small random drift
      const ty = -220 - Math.random() * 80; // Upward movement

      floatingReaction.style.setProperty('--tx', `${tx}px`);
      floatingReaction.style.setProperty('--ty', `${ty}px`);

      document.body.appendChild(floatingReaction);
      window.setTimeout(() => floatingReaction.remove(), 2000);
    },
    []
  );

  const launchScriptedReaction = useCallback(
    (type: ReactionType, userName?: string) => {
      const container = videoContainerRef.current;
      let origin: { x: number; y: number } | undefined;
      if (container) {
        const rect = container.getBoundingClientRect();
        // Launch from sides: randomly pick left or right edge
        const fromLeft = Math.random() > 0.5;
        origin = {
          x: fromLeft 
            ? rect.left + (rect.width * 0.05) // 5% from left edge
            : rect.right - (rect.width * 0.05), // 5% from right edge
          y: rect.bottom - (rect.height * (0.2 + Math.random() * 0.6)), // Random height (20-80%)
        };
      }
      spawnReaction(type, origin, userName);
    },
    [spawnReaction]
  );

  const offersSorted = useMemo(
    () => offers.slice().sort((a, b) => a.videoTimestamp - b.videoTimestamp),
    [offers]
  );

  const initialActiveOffer = useMemo(
    () => findOfferForElapsed(offersSorted, timing.initialElapsedSeconds),
    [offersSorted, timing.initialElapsedSeconds]
  );

  const [activeOfferId, setActiveOfferId] = useState<string | null>(
    initialActiveOffer?.id ?? null
  );

  useEffect(() => {
    setActiveOfferId(initialActiveOffer?.id ?? null);
  }, [initialActiveOffer?.id]);

  const [elapsedSeconds, setElapsedSeconds] = useState<number>(
    timing.initialElapsedSeconds
  );
  const [secondsUntilStart, setSecondsUntilStart] = useState<number>(() => {
    const diff = Math.ceil((startTimeMs - serverNowMs) / 1000);
    return diff > 0 ? diff : 0;
  });

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        !!(
          document.fullscreenElement ||
          (document as any).webkitFullscreenElement ||
          (document as any).mozFullScreenElement ||
          (document as any).msFullscreenElement
        )
      );
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Mark component as mounted and auto-start replay mode
  useEffect(() => {
    setMounted(true);
    console.log('✅ Component mounted');
    
    // Tracker initialization moved to dedicated analytics effect below
    
    // REMOVED: Auto-start for mobile - force users to tap "Start" button
    // This ensures video starts UNMUTED (not muted for autoplay)
    // Only auto-start on desktop for better UX
    // 
    // UPDATE: Disabling auto-start for everyone (including desktop) based on user request.
    // Users must manually click to start the replay.
    /*
    if (isReplayMode && !showReplayPrompt && !webinarEnded && !isMobile) {
      console.log('🎬 Auto-starting replay mode (desktop only)...');
      setBroadcastStarted(true);
      setVideoLoading(true);
      
      // Store the initial elapsed time for video seeking
      startTimeRef.current = timing.initialElapsedSeconds;
      console.log(`📍 Initial replay position: ${timing.initialElapsedSeconds}s`);
    }
    */
    
    // No cleanup here - tracker is managed by analytics effect
  }, [isReplayMode, timing.initialElapsedSeconds, showReplayPrompt, webinarEnded, isMobile]);

  // Load seen offers from localStorage on mount
  useEffect(() => {
    if (!viewer?.id || !webinar.id) return;
    
    const storageKey = `seenOffers_${webinar.id}_${viewer.id}`;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const seenIds = JSON.parse(stored) as string[];
        setSeenOfferIds(new Set(seenIds));
        console.log(`📦 Loaded ${seenIds.length} seen offers from localStorage`);
      }
    } catch (err) {
      console.error('Failed to load seen offers:', err);
    }
  }, [viewer?.id, webinar.id]);

  // Show audio troubleshooting banner automatically after video starts (if muted)
  useEffect(() => {
    if (!broadcastStarted || !playerReady) return;
    
    // Wait 3 seconds after video starts, then show banner if still muted
    const timer = setTimeout(() => {
      if (isMuted) {
        setShowUnmuteHint(true);
        console.log('🔇 Showing audio troubleshooting banner (video is muted)');
      }
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [broadcastStarted, playerReady, isMuted]);

  // Auto-fullscreen on mobile landscape orientation
  useEffect(() => {
    if (!isMobile || !broadcastStarted) return;

    const handleOrientationChange = async () => {
      // Small delay to ensure orientation is fully changed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check if landscape mode
      const isLandscape = window.matchMedia('(orientation: landscape)').matches;
      
      console.log(`📱 Orientation change detected: ${isLandscape ? 'LANDSCAPE' : 'PORTRAIT'}`);
      
      if (isLandscape && videoContainerRef.current && !isFullscreen) {
        // Enter fullscreen in landscape mode
        console.log('🎬 Entering fullscreen for landscape mode...');
        try {
          const elem = videoContainerRef.current;
          
          if (elem.requestFullscreen) {
            await elem.requestFullscreen();
          } else if ((elem as any).webkitRequestFullscreen) {
            await (elem as any).webkitRequestFullscreen();
          } else if ((elem as any).mozRequestFullScreen) {
            await (elem as any).mozRequestFullScreen();
          } else if ((elem as any).msRequestFullscreen) {
            await (elem as any).msRequestFullscreen();
          }

          console.log('✅ Fullscreen entered');

          // Try to lock orientation to landscape (may not work on all devices)
          if (screen.orientation && (screen.orientation as any).lock) {
            try {
              await (screen.orientation as any).lock('landscape');
              console.log('✅ Orientation locked to landscape');
            } catch (err) {
              console.log('⚠️ Could not lock orientation:', err);
            }
          }
        } catch (err) {
          console.error('❌ Could not enter fullscreen:', err);
        }
      } else if (!isLandscape && isFullscreen) {
        // Exit fullscreen when rotating back to portrait
        console.log('🎬 Exiting fullscreen for portrait mode...');
        try {
          if (document.exitFullscreen) {
            await document.exitFullscreen();
          } else if ((document as any).webkitExitFullscreen) {
            await (document as any).webkitExitFullscreen();
          } else if ((document as any).mozCancelFullScreen) {
            await (document as any).mozCancelFullScreen();
          } else if ((document as any).msExitFullscreen) {
            await (document as any).msExitFullscreen();
          }

          console.log('✅ Fullscreen exited');

          // Unlock orientation
          if (screen.orientation && (screen.orientation as any).unlock) {
            (screen.orientation as any).unlock();
            console.log('✅ Orientation unlocked');
          }
        } catch (err) {
          console.error('❌ Could not exit fullscreen:', err);
        }
      }
    };

    // Listen to both orientation change and resize events
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
    
    // Also check immediately in case we're already in landscape
    handleOrientationChange();

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, [isMobile, broadcastStarted, isFullscreen]);

  // Handle tab visibility to pause/resume elapsed time
  useEffect(() => {
    const handleVisibilityChange = async () => {
      const isVisible = !document.hidden;
      setIsTabVisible(isVisible);

      if (!isVisible) {
        // Tab hidden - store current elapsed time and pause video
        pausedTimeRef.current = elapsedSeconds;
        
        if (vimeoPlayerRef.current) {
          vimeoPlayerRef.current.pause().catch(() => {
            // Ignore pause errors
          });
          console.log('⏸️ Tab hidden - paused at', elapsedSeconds, 'seconds');
        }
      } else {
        // Tab visible again
        console.log('👁️ Tab visible');
        
        // NEW: On mobile, do NOT auto-resume - let user tap play button
        // This prevents "can't hear" confusion after tab switching
        if (isMobile) {
          console.log('📱 Mobile: Video paused - user must manually resume');
          // Show the play overlay so user can tap to resume
          if (vimeoPlayerRef.current && broadcastStarted) {
            setShowPausedOverlay(true);
          }
          return; // Don't auto-resume on mobile
        }
        
        // Desktop: Auto-resume with sync
        if (vimeoPlayerRef.current && broadcastStarted && !isReplayMode) {
          try {
            // Get current elapsed session time
            const currentSessionTime = elapsedSeconds;
            
            // Get current video time
            const currentVideoTime = await vimeoPlayerRef.current.getCurrentTime();
            
            console.log(`🔄 Session time: ${currentSessionTime}s, Video time: ${currentVideoTime}s`);
            
            // If video is behind the session, sync it forward
            const timeDiff = currentSessionTime - currentVideoTime;
            if (timeDiff > 3) {
              console.log(`⏩ Syncing video forward by ${timeDiff}s to catch up with live session`);
              await vimeoPlayerRef.current.setCurrentTime(currentSessionTime);
            }
            
            // Resume playback
            await vimeoPlayerRef.current.play();
            console.log('▶️ Resumed video playback (desktop)');
          } catch (err) {
            console.error('❌ Error syncing/resuming video:', err);
          }
        } else if (vimeoPlayerRef.current && isReplayMode) {
          // Replay mode: just resume from where paused
          try {
            await vimeoPlayerRef.current.play();
            console.log('▶️ Resumed replay playback');
          } catch (err) {
            console.error('❌ Error resuming replay:', err);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [elapsedSeconds, broadcastStarted, isReplayMode, isMobile]);

  useEffect(() => {
    const update = () => {
      // If tab is hidden, don't update elapsed time
      if (!isTabVisible && pausedTimeRef.current !== null) {
        setElapsedSeconds(pausedTimeRef.current);
        return;
      }

      const approxServerNow = Date.now() - serverOffsetRef.current;
      const diff = approxServerNow - startTimeMs;
      const elapsedCandidate = Math.floor(diff / 1000);
      const untilCandidate = diff < 0 ? Math.ceil(-diff / 1000) : 0;

      setElapsedSeconds((prev) => {
        const next = Math.max(0, elapsedCandidate);
        const clamped =
          totalDuration != null ? Math.min(next, totalDuration) : next;
        return prev === clamped ? prev : clamped;
      });

      setSecondsUntilStart((prev) =>
        prev === untilCandidate ? prev : untilCandidate
      );
    };

    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [startTimeMs, totalDuration, isTabVisible]);

  // Simulate dynamic live viewer count for realistic feel
  useEffect(() => {
    if (!broadcastStarted) {
      return;
    }

    // Base viewer count: 15-50 viewers
    const baseCount = 15 + Math.floor(Math.random() * 35);
    setLiveViewerCount(baseCount);

    // Fluctuate viewer count every 8-15 seconds
    const interval = setInterval(() => {
      setLiveViewerCount((prev) => {
        const change = Math.floor(Math.random() * 7) - 3; // -3 to +3
        const newCount = Math.max(10, Math.min(100, prev + change));
        return newCount;
      });
    }, 8000 + Math.random() * 7000);

    return () => clearInterval(interval);
  }, [broadcastStarted]);

  // Initialize analytics tracking
  useEffect(() => {
    if (!viewer?.id || !webinar.id) return;

    const device = window.innerWidth <= 768 ? 'mobile' : 'desktop';
    
    // Initialize tracker
    trackerRef.current = new WebinarTracker(
      viewer.id,
      webinar.id,
      null // scheduleId - we can pass this from the parent page if available
    );

    // Start session tracking
    trackerRef.current.startSession(device);

    // Track page entry
    const visitorId = localStorage.getItem('visitorId');
    WebinarTracker.trackPageVisit(
      webinar.id,
      'webinar',
      'enter',
      viewer.id,
      undefined, // sessionId will be set after tracking starts
      visitorId || undefined
    );

    console.log('[Analytics] Tracking initialized for viewer:', viewer.email);

    // Cleanup: end session when component unmounts or user leaves
    return () => {
      if (trackerRef.current) {
        trackerRef.current.endSession();
        WebinarTracker.trackPageVisit(
          webinar.id,
          'webinar',
          'leave',
          viewer.id,
          undefined,
          visitorId || undefined
        );
      }
    };
  }, [viewer?.id, webinar.id]);

  // Track watch time and video position updates
  useEffect(() => {
    if (!trackerRef.current || !broadcastStarted) return;

    const interval = setInterval(() => {
      if (trackerRef.current && broadcastStarted && isTabVisible) {
        trackerRef.current.updateWatchTime(elapsedSeconds, true);
      }
    }, 1000); // Update every 1 second

    return () => clearInterval(interval);
  }, [broadcastStarted, elapsedSeconds, isTabVisible]);

  // Track when video ends
  useEffect(() => {
    if (!trackerRef.current || !totalDuration) return;

    if (elapsedSeconds >= totalDuration - 5 && broadcastStarted) {
      // Track video ended
      trackerRef.current.trackVideoEvent('ended', elapsedSeconds);
    }
  }, [elapsedSeconds, totalDuration, broadcastStarted]);

  useEffect(() => {
    if (webinar.hasChat === false) {
      return;
    }

    const ready = sortedMessages.filter((message) => {
      if (displayedMessageIdsRef.current.has(message.id)) {
        return false;
      }
      if (typeof message.videoTimestamp !== 'number') {
        return true;
      }
      return message.videoTimestamp <= elapsedSeconds;
    });

    if (ready.length === 0) {
      return;
    }

    // Add messages one by one with realistic delays (like real people typing)
    ready.forEach((message, index) => {
      displayedMessageIdsRef.current.add(message.id);
      
      // Random delay between 1-4 seconds for each message
      const typingDelay = 800 + Math.random() * 1200; // Time to show "typing"
      const messageDelay = 1500 + Math.random() * 2500; // Total time before message appears
      
      // Show typing indicator first
      setTimeout(() => {
        setIsTyping(true);
      }, messageDelay * index);
      
      // Then hide typing and show message
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => {
          // Check if message already exists to avoid duplicates
          if (prev.some(m => m.id === message.id)) {
            return prev;
          }
          return [...prev, message];
        });
      }, messageDelay * index + typingDelay);
    });
  }, [elapsedSeconds, sortedMessages, webinar.hasChat]);

  useEffect(() => {
    if (webinar.hasReactions === false) {
      return;
    }

    // Don't trigger reactions before broadcast has started
    if (!broadcastStarted) {
      return;
    }

    // Grace period: Don't show reactions in the first 3 seconds after clicking start
    const secondsSinceBroadcastStart = Date.now() - broadcastStartTimeRef.current;
    if (secondsSinceBroadcastStart < 3000) {
      console.log(`⏳ Grace period: ${Math.floor(secondsSinceBroadcastStart / 1000)}s / 3s`);
      return;
    }

    const due = sortedReactions.filter((event) => {
      if (triggeredReactionsRef.current.has(event.id)) {
        return false;
      }
      // OPTIMIZATION: Only show reactions that should appear NOW or in the FUTURE
      // Don't show reactions from before the current timestamp (when user joins mid-stream)
      // This prevents loading hundreds of past reactions on mobile
      const shouldShow = event.videoTimestamp >= elapsedSeconds - 1 && event.videoTimestamp < elapsedSeconds;
      
      if (shouldShow) {
        console.log(`✅ Reaction due: ${event.type} at ${event.videoTimestamp}s (current: ${elapsedSeconds}s)`);
      }
      
      return shouldShow;
    });

    if (due.length === 0) {
      return;
    }

    console.log(`🎉 Triggering ${due.length} reactions`);

    triggeredReactionsRef.current = new Set([
      ...Array.from(triggeredReactionsRef.current),
      ...due.map((event) => event.id),
    ]);

    setReactionCounts((prev) => {
      const next = { ...prev };
      due.forEach((event) => {
        next[event.type] = (next[event.type] ?? 0) + 1;
      });
      return next;
    });

    due.forEach((event) => {
      // Add random delay (0-2 seconds) to make reactions feel more organic
      const delay = Math.random() * 2000;
      setTimeout(() => {
        launchScriptedReaction(event.type, event.userName);
      }, delay);
    });
  }, [
    elapsedSeconds,
    sortedReactions,
    webinar.hasReactions,
    launchScriptedReaction,
    broadcastStarted,
  ]);

  useEffect(() => {
    if (webinar.hasOffers === false || offersSorted.length === 0) {
      return;
    }

    const latest = findOfferForElapsed(offersSorted, elapsedSeconds);
    const nextId = latest?.id ?? null;

    // If offer is visible now, mark it as seen
    if (nextId && !seenOfferIds.has(nextId)) {
      const newSeenIds = new Set(seenOfferIds);
      newSeenIds.add(nextId);
      setSeenOfferIds(newSeenIds);
      
      // Save to localStorage
      if (viewer?.id && webinar.id) {
        const storageKey = `seenOffers_${webinar.id}_${viewer.id}`;
        try {
          localStorage.setItem(storageKey, JSON.stringify(Array.from(newSeenIds)));
          console.log(`✅ Marked offer ${nextId} as seen and saved to localStorage`);
        } catch (err) {
          console.error('Failed to save seen offers:', err);
        }
      }
    }

    const displayOfferId = nextId;

    if (displayOfferId !== activeOfferId) {
      setActiveOfferId(displayOfferId);
      
      // Track offer view (only for first time)
      if (displayOfferId && latest && !seenOfferIds.has(displayOfferId) && trackerRef.current) {
        trackerRef.current.trackOffer(
          'view',
          latest.title,
          latest.ctaUrl,
          elapsedSeconds
        );
        trackerRef.current.trackEngagement('offer_view', elapsedSeconds, {
          offerTitle: latest.title,
          offerId: latest.id
        });
      }
      
      // Don't auto-switch tabs - let users control their own tab preference
      // The FAQ tab will become available when offer appears, but won't force switch
    }
  }, [
    elapsedSeconds,
    offersSorted,
    webinar.hasOffers,
    activeOfferId,
    seenOfferIds,
    viewer?.id,
    webinar.id,
  ]);

  const activeOffer = useMemo(() => {
    if (!activeOfferId) {
      return null;
    }
    return offersSorted.find((offer) => offer.id === activeOfferId) ?? null;
  }, [activeOfferId, offersSorted]);

  const offerContent = useMemo(
    () => buildOfferContent(activeOffer),
    [activeOffer]
  );

  const countdownRemainingSeconds = useMemo(() => {
    if (
      !activeOffer ||
      !offerContent ||
      !offerContent.countdownDuration
    ) {
      return null;
    }

    const secondsSinceOfferStart = Math.max(
      0,
      elapsedSeconds - activeOffer.videoTimestamp
    );
    const remaining = offerContent.countdownDuration - secondsSinceOfferStart;
    return remaining > 0 ? remaining : null;
  }, [activeOffer, offerContent, elapsedSeconds]);

  useEffect(() => {
    if (!activeOffer) {
      return;
    }

    const node = offerRef.current;
    if (!node) {
      return;
    }

    node.classList.add(styles.offerHighlight);
    const timer = window.setTimeout(() => {
      node.classList.remove(styles.offerHighlight);
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [activeOffer?.id]);

  // Fix: Restore unmute state when offer appears (mobile bug)
  // On mobile, when DOM changes (offer appearing), browser may re-mute video
  useEffect(() => {
    if (!vimeoPlayerRef.current || !isMobile) return;
    
    // When offer content changes (appears/disappears)
    if (offerContent) {
      console.log('📢 Offer appeared on mobile - checking mute state...');
      
      // Give DOM time to settle, then check if video got muted
      setTimeout(async () => {
        if (!vimeoPlayerRef.current) return;
        
        try {
          const actualMuted = await vimeoPlayerRef.current.getMuted();
          
          // If video got muted but our state says it should be unmuted
          if (actualMuted && !isMuted) {
            console.log('🔧 Video was muted by browser when offer appeared - restoring unmute state');
            await vimeoPlayerRef.current.setMuted(false);
            await vimeoPlayerRef.current.setVolume(1);
            console.log('✅ Unmute state restored');
          }
        } catch (err) {
          console.error('❌ Error checking/restoring mute state:', err);
        }
      }, 500); // Wait 500ms for DOM changes to complete
    }
  }, [offerContent, isMuted, isMobile]);

  // Mark component as mounted - DON'T auto-start from sessionStorage
  // Always show the "Start Broadcast" overlay on fresh page load
  useEffect(() => {
    setMounted(true);
    // Clear any previous session state to ensure overlay shows
    sessionStorage.removeItem(`broadcast-started-${webinar.id}`);
  }, [webinar.id]);

  useEffect(() => {
    // Only update on client after initial render to avoid hydration mismatch
    const updateViewport = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // Use setTimeout to ensure this runs after hydration
    const timer = setTimeout(updateViewport, 0);
    window.addEventListener('resize', updateViewport);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateViewport);
    };
  }, []);

  useEffect(() => {
    if (isChatOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isChatOpen, isMobile]);

  const scrollChatToBottom = useCallback(() => {
    const container = chatMessagesRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollChatToBottom();
  }, [messages, scrollChatToBottom]);

  const addChatMessage = useCallback((message: ChatMessage) => {
    displayedMessageIdsRef.current.add(message.id);
    setMessages((prev) => [...prev, message]);
  }, []);

  // Simulated live webinar - only show scripted + approved messages
  // No auto-generated random messages

  const handleReaction = useCallback(
    async (type: ReactionType, button: HTMLButtonElement | null) => {
      // Update local count immediately for instant feedback
      setReactionCounts((prev) => ({
        ...prev,
        [type]: (prev[type] ?? 0) + 1,
      }));

      const rect = button?.getBoundingClientRect();
      const origin = rect
        ? {
            x: rect.left + rect.width / 2,
            y: rect.top,
          }
        : undefined;

      const userName = viewer?.name || 'You';
      spawnReaction(type, origin, userName);

      // Track engagement
      if (trackerRef.current) {
        trackerRef.current.trackEngagement('reaction', elapsedSeconds, { 
          type, 
          userName 
        });
      }

      // Save reaction to database (will appear for all future viewers at this timestamp)
      // Include registrationId for registered attendees
      try {
        const response = await fetch(`/api/webinars/${webinar.id}/reactions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type,
            videoTimestamp: elapsedSeconds,
            registrationId: viewer?.id, // Pass registrationId for registered attendees
          }),
        });

        if (!response.ok) {
          console.error('Failed to save reaction:', await response.text());
        } else {
          console.log('✅ Reaction saved:', type, 'at', elapsedSeconds);
        }
      } catch (error) {
        console.error('Error saving reaction:', error);
      }
    },
    [spawnReaction, viewer, webinar.id, elapsedSeconds]
  );

  const handleLikeMessage = async (msgId: string) => {
    // Optimistic UI update
    setMessages(prev => prev.map(m => {
      if (m.id === msgId) {
        return {
          ...m,
          likes: (m.likes || 0) + (m.likedByMe ? -1 : 1),
          likedByMe: !m.likedByMe
        }
      }
      return m
    }));

    try {
      await fetch(`/api/chat/${msgId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId: viewer?.id,
          userName: viewer?.name || 'Guest'
        })
      });
    } catch (err) {
      console.error('Error liking message:', err);
    }
  };

  const handleSendMessage = useCallback(async () => {
    const text = chatInput.trim();
    if (!text) {
      return;
    }

    const userName = viewer?.name || 'You';
    
    // Debug logging
    console.log('💬 [Chat] Sending message:', {
      viewer: viewer,
      viewerId: viewer?.id,
      viewerName: viewer?.name,
      userName: userName
    });
    
    // Show message to user immediately (optimistic UI)
    const tempId = `temp-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: tempId,
      clientId: tempId, // Use tempId as stable clientId for key
      userName,
      message: text,
      videoTimestamp: elapsedSeconds,
      isScripted: false,
      createdAt: new Date().toISOString(),
    };
    
    addChatMessage(userMessage);
    setChatInput('');

    // Track engagement
    if (trackerRef.current) {
      trackerRef.current.trackEngagement('chat', elapsedSeconds, { 
        messageLength: text.length,
        userName 
      });
    }

    // Save message to database (will be approved for display)
    try {
      const payload = {
        webinarId: webinar.id,
        message: text,
        videoTimestamp: elapsedSeconds, // Include video timestamp
        registrationId: viewer?.id, // Pass registrationId for registered attendees
      };
      
      console.log('💬 [Chat] Sending to API:', payload);
      
      const response = await fetch(`/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Chat message saved:', data);
        // Update the message with real ID from server
        setMessages((prev) => 
          prev.map((msg) => 
            msg.id === tempId ? { ...msg, id: data.message.id } : msg
          )
        );

        // Check if we should get an AI response
        // Note: We check both offer active state OR simply if AI is enabled globally
        // The server-side will handle "activation" logic (e.g. only after offer), BUT
        // we want to allow auto-likes even before offers for engagement ("I'm excited!", etc)
        // So we remove the strict `if (activeOfferId)` check here and let the server decide.
        // if (activeOfferId) { <--- REMOVED strict check
          console.log('🤖 Checking for AI response...');
          try {
            const aiResponse = await fetch('/api/chat/ai-response', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                webinarId: webinar.id,
                question: text,
                currentVideoTime: elapsedSeconds,
                registrationId: viewer?.id,
              }),
            });

            if (aiResponse.ok) {
              const aiData = await aiResponse.json();
              console.log('🤖 AI Response:', aiData);

              // Handle AI Like
              if (aiData.liked) {
                // Show notification
                // You might need to add a toast/notification component or just a console log for now
                console.log(`❤️ ${aiData.likerName || 'The Host'} liked your comment!`);
                
                // Update the user's message to show it was liked
                setMessages((prev) => 
                  prev.map((msg) => 
                    msg.message === text && msg.userName === userName // Find the message we just sent
                      ? { ...msg, likes: (msg.likes || 0) + 1 }
                      : msg
                  )
                );

                // Show visual feedback (simple system message for now)
                const notifId = `notif-${Date.now()}`;
                const notificationMsg: ChatMessage = {
                  id: notifId,
                  userName: aiData.likerName || 'System', // Use the AI's name as the sender
                  message: 'Liked your comment',
                  videoTimestamp: elapsedSeconds,
                  isScripted: false,
                  createdAt: new Date().toISOString(),
                  isSystemNotification: true // We'll handle this styling
                } as any;
                addChatMessage(notificationMsg);
              }
              
              // Check if AI decided to skip this question (not relevant or insufficient info)
              if (aiData.skipped || !aiData.shouldRespond) {
                console.log('🤖 AI chose to stay quiet for this question');
                return; // AI stays silent - no message posted
              }
              
              if (aiData.shouldRespond && aiData.autoSent) {
                console.log('✅ AI response automatically posted to chat');
                // Add AI response to chat immediately
                const aiMessage: ChatMessage = {
                  id: `ai-${Date.now()}`,
                  userName: 'Program Assistant (AI)',
                  message: aiData.response,
                  videoTimestamp: elapsedSeconds,
                  isScripted: false,
                  createdAt: new Date().toISOString(),
                };
                
                // Add with a slight delay to feel more natural
                setTimeout(() => {
                  addChatMessage(aiMessage);
                }, 800);
              }
            }
          } catch (error) {
            console.error('Error getting AI response:', error);
            // Silently fail - don't interrupt user experience
          }
        // } <--- Removed closing bracket for if(activeOfferId)
      } else {
        console.error('Failed to save message:', await response.text());
      }
    } catch (error) {
      console.error('Error saving message:', error);
    }
  }, [chatInput, elapsedSeconds, webinar.id, viewer, addChatMessage, activeOfferId]);

  const handleChatKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  const toggleChat = useCallback(() => {
    if (webinar.hasChat === false) {
      return;
    }
    
    // On mobile, toggle minimization; on desktop, toggle open/close
    if (isMobile) {
      setIsChatMinimized((prev) => !prev);
    } else {
      setIsChatOpen((prev) => !prev);
    }
  }, [webinar.hasChat, isMobile]);

  const toggleFullscreen = useCallback(async () => {
    if (!videoContainerRef.current) return;

    try {
      if (!isFullscreen) {
        // Enter fullscreen
        if (videoContainerRef.current.requestFullscreen) {
          await videoContainerRef.current.requestFullscreen();
        } else if ((videoContainerRef.current as any).webkitRequestFullscreen) {
          await (videoContainerRef.current as any).webkitRequestFullscreen();
        } else if ((videoContainerRef.current as any).mozRequestFullScreen) {
          await (videoContainerRef.current as any).mozRequestFullScreen();
        } else if ((videoContainerRef.current as any).msRequestFullscreen) {
          await (videoContainerRef.current as any).msRequestFullscreen();
        }
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  }, [isFullscreen]);

  const toggleMute = useCallback(async () => {
    if (!vimeoPlayerRef.current) return;

    try {
      const newMutedState = !isMuted;
      await vimeoPlayerRef.current.setMuted(newMutedState);
      await vimeoPlayerRef.current.setVolume(newMutedState ? 0 : 1);
      setIsMuted(newMutedState);
      
      // Hide unmute hint when user unmutes
      if (!newMutedState) {
        setShowUnmuteHint(false);
      }
      
      // Track mute state change
      if (trackerRef.current) {
        trackerRef.current.setMuteState(newMutedState);
      }
      
      console.log(`🔊 Volume ${newMutedState ? 'MUTED' : 'UNMUTED'}`);
    } catch (err) {
      console.error('Error toggling mute:', err);
    }
  }, [isMuted]);

  const togglePlaybackSpeed = useCallback(async () => {
    if (!vimeoPlayerRef.current) return;

    try {
      const currentRate = playbackRate;
      let nextRate = 1;
      
      // Cycle: 0.8 -> 0.9 -> 1 -> 1.1 -> 1.2 -> 1.3 -> 0.8
      if (currentRate === 0.8) nextRate = 0.9;
      else if (currentRate === 0.9) nextRate = 1;
      else if (currentRate === 1) nextRate = 1.1;
      else if (currentRate === 1.1) nextRate = 1.2;
      else if (currentRate === 1.2) nextRate = 1.3;
      else nextRate = 0.8;

      await vimeoPlayerRef.current.setPlaybackRate(nextRate);
      setPlaybackRate(nextRate);
      console.log(`⏩ Playback rate set to ${nextRate}x`);
      
      // Track event
      if (trackerRef.current) {
        trackerRef.current.trackEngagement('playback_speed', elapsedSeconds, { rate: nextRate });
      }
    } catch (err) {
      console.error('Error changing playback rate:', err);
      // Vimeo Free/Plus accounts might not support speed control via API
      // If it fails, we should probably know about it or handle it gracefully
    }
  }, [playbackRate, elapsedSeconds]);

  const openChat = useCallback(() => {
    if (webinar.hasChat === false) {
      return;
    }
    
    // On mobile, toggle minimization; on desktop, toggle open/close
    if (isMobile) {
      setIsChatMinimized((prev) => !prev);
    } else {
      setIsChatOpen((prev) => !prev);
    }
  }, [webinar.hasChat, isMobile]);

  const handleTabSwitch = useCallback((tab: 'chat' | 'faq') => {
    setActiveTab(tab);
  }, []);

  const handleFaqToggle = useCallback((index: number) => {
    setOpenFaqs((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const handleShowOffer = useCallback(() => {
    setIsChatOpen(false);
    window.setTimeout(() => {
      if (offerRef.current) {
        offerRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
        offerRef.current.classList.add(styles.offerHighlight);
        window.setTimeout(() => {
          offerRef.current?.classList.remove(styles.offerHighlight);
        }, 2000);
      }
    }, 250);
  }, []);

  const handleStartReplay = useCallback(async () => {
    console.log('🎬 User clicked Start Replay button');
    setShowReplayPrompt(false);
    setBroadcastStarted(true);
    setVideoLoading(true);
    
    if (vimeoPlayerRef.current) {
      try {
        // Reset to beginning and play
        await vimeoPlayerRef.current.setCurrentTime(0);
        await vimeoPlayerRef.current.play();
        setVideoLoading(false);
        console.log('✅ Replay started from beginning');
        
        if (trackerRef.current) {
          trackerRef.current.trackVideoEvent('play', 0);
        }
      } catch (err) {
        console.error('❌ Failed to start replay:', err);
        setVideoLoading(false);
        setVideoError(true);
        setBroadcastStarted(false);
      }
    }
  }, []);

  // Determine replay vs live status
  const isReplay = isReplayMode || (totalDuration != null ? elapsedSeconds >= totalDuration : false);

  const statusLabel = isReplay ? 'Replay' : 'Broadcasting';

  const statusClass = isReplay ? styles.badgeReplay : styles.badgeLive;

  const formattedElapsed = useMemo(
    () => formatTimeLabel(elapsedSeconds),
    [elapsedSeconds]
  );

  const formattedTotal = useMemo(
    () => formatTimeLabel(totalDuration ?? elapsedSeconds),
    [totalDuration, elapsedSeconds]
  );

  // Generate embed URL with mobile-optimized quality
  const embedUrl = useMemo(() => deriveEmbedUrl(webinar, isMobile, isReplayMode), [webinar, isMobile, isReplayMode]);

  // Initialize Vimeo Player ONCE when broadcast starts
  useEffect(() => {
    if (!embedUrl || !webinar.vimeoVideoId || !mounted || !broadcastStarted) {
      return;
    }
    
    // Prevent re-initialization if player already exists
    if (vimeoPlayerRef.current) {
      return;
    }
    
    // Detect mobile early for better timeouts
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isSafariIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    
    // MOBILE FIX: Longer timeout for mobile (60s vs 20s) and fewer, slower retries
    const timeoutDuration = isSafariIOS ? 90000 : (isMobileDevice ? 60000 : 20000);
    const emergencyTimeout = setTimeout(() => {
      const errorMsg = `Emergency timeout after ${timeoutDuration/1000}s - video failed to load`;
      console.log(`⚠️ ${errorMsg}`);
      logVideoError(webinar.id, viewer?.id, 'timeout', errorMsg, undefined, {
        name: viewer?.name,
        email: viewer?.email,
      });
      setVideoLoading(false);
      setVideoError(true);
      setBroadcastStarted(false); // Surface retry overlay
    }, timeoutDuration);
    
    // MOBILE FIX: Fewer retries with longer delays - prevents timeout cascade
    let iframeRetries = 0;
    let apiRetries = 0;
    const maxRetries = isMobileDevice ? 15 : 10; // Reduced retries
    const retryDelay = isMobileDevice ? 800 : 500; // Longer delays on mobile
    
    const initPlayer = () => {
      const iframe = document.querySelector('iframe[src*="vimeo.com"]') as HTMLIFrameElement;
      if (!iframe) {
        iframeRetries++;
        if (iframeRetries >= maxRetries) {
          const errorMsg = `Vimeo iframe not found after ${maxRetries} retries`;
          console.error('❌', errorMsg);
          logVideoError(webinar.id, viewer?.id, 'iframe_not_found', errorMsg, undefined, {
            name: viewer?.name,
            email: viewer?.email,
          });
          clearTimeout(emergencyTimeout);
          setVideoLoading(false);
          setVideoError(true);
          setBroadcastStarted(false);
          return;
        }
        setTimeout(initPlayer, retryDelay);
        return;
      }
      
      if (!window.Vimeo) {
        apiRetries++;
        if (apiRetries >= maxRetries) {
          const errorMsg = `Vimeo Player API not loaded after ${maxRetries} retries`;
          console.error('❌', errorMsg);
          logVideoError(webinar.id, viewer?.id, 'api_not_loaded', errorMsg, undefined, {
            name: viewer?.name,
            email: viewer?.email,
          });
          clearTimeout(emergencyTimeout);
          setVideoLoading(false);
          setVideoError(true);
          setBroadcastStarted(false);
          return;
        }
        setTimeout(initPlayer, retryDelay);
        return;
      }
      
      // MOBILE FIX: Longer delay for iframe to be fully ready before initializing player
      const initDelay = isMobileDevice ? 1000 : 300;
      setTimeout(async () => {
        try {
          // Detect if we're in a problematic browser environment (Facebook, Instagram, etc.)
          const isInAppBrowser = /FBAN|FBAV|Instagram/.test(navigator.userAgent);
          
        const player = new window.Vimeo!.Player(iframe);
        vimeoPlayerRef.current = player;
        
        let startTime = startTimeRef.current;
        
        // SIMPLIFIED LOGIC:
        // If Replay Mode, ALWAYS start at 0
        // Live Mode uses the calculated elapsed time
        if (isReplayMode) {
           startTime = 0;
           console.log('REPLAY MODE: Starting video at 0:00');
        } else {
           console.log(`LIVE MODE: Starting at synced time: ${startTime}s`);
        }
        
        player.ready()
          .then(async () => {
            setPlayerReady(true);
            
            player.on('ended', () => {
              setWebinarEnded(true);
              setBroadcastStarted(false);
            });
            
            // CRITICAL: Set muted state FIRST, before ANY other operations
            try {
              await player.setMuted(true);
              await player.setVolume(0);
              
              // Apply saved playback rate
              if (playbackRate !== 1) {
                try {
                  await player.setPlaybackRate(playbackRate);
                  console.log(`⏩ Applied saved playback rate: ${playbackRate}x`);
                } catch (rateErr) {
                  console.warn('Could not set playback rate on init:', rateErr);
                }
              }

            } catch (e) {
              console.error('⚠️ CRITICAL: Could not set mute!', e);
              throw new Error('Failed to mute video - autoplay will fail');
            }
            
            // Set start time AFTER muting
            try {
              await player.setCurrentTime(startTime);
            } catch (e) {
              console.log('⚠️ Could not set time, starting from beginning...', e);
            }
            
            // Now try to play
            try {
              const playPromise = player.play();
              await playPromise;
              
              setIsMuted(true);
              clearTimeout(emergencyTimeout);
              setVideoLoading(false);
              
              // Start session tracking
              if (trackerRef.current) {
                const device = isMobileDevice ? 'mobile' : 'desktop';
                await trackerRef.current.startSession(device);
                trackerRef.current.setMuteState(true);
                trackerRef.current.trackVideoEvent('play', startTime);
              }
              
              // ALWAYS show unmute hint since video starts muted (for ALL devices)
              setTimeout(() => setShowUnmuteHint(true), 2000);
            } catch (playErr) {
              const errorMsg = `Play failed: ${playErr instanceof Error ? playErr.message : String(playErr)}`;
              const isPermissionError = errorMsg.includes('not allowed') || 
                                        errorMsg.includes('denied permission') ||
                                        errorMsg.includes('user gesture');
              
              console.error('❌', errorMsg);
              
              logVideoError(
                webinar.id, 
                viewer?.id, 
                isSafariIOS ? 'safari_ios_play_failed' : 'play_failed',
                errorMsg,
                playErr instanceof Error ? playErr.stack : undefined,
                {
                  name: viewer?.name,
                  email: viewer?.email,
                }
              );
              
              if (isPermissionError) {
                clearTimeout(emergencyTimeout);
                setVideoLoading(false);
                setNeedsUserGesture(true); // Show tap to play button
                setVideoError(false); // Don't show generic error
                return; // Don't throw, handle gracefully
              }
              
              throw playErr;
            }
          })
          .catch(async (err: Error) => {
            const errorMsg = `Player initialization failed: ${err.message}`;
            console.error('❌', errorMsg);
            
            logVideoError(
              webinar.id, 
              viewer?.id, 
              isSafariIOS ? 'safari_ios_init_failed' : 'player_init_failed',
              errorMsg,
              err.stack,
              {
                name: viewer?.name,
                email: viewer?.email,
              }
            );
            
            clearTimeout(emergencyTimeout);
            setVideoLoading(false);
            setVideoError(true);
            setBroadcastStarted(false);
            
            if (vimeoPlayerRef.current) {
              try {
                vimeoPlayerRef.current.off('ended');
                vimeoPlayerRef.current.off('pause');
                vimeoPlayerRef.current.off('play');
              } catch (cleanupErr) {
                console.error('❌ Failed to clean up player:', cleanupErr);
              }
              vimeoPlayerRef.current = null;
            }
          });
      } catch (error) {
        const errorMsg = `Error creating Vimeo player: ${error instanceof Error ? error.message : String(error)}`;
        console.error('❌', errorMsg);
        
        logVideoError(
          webinar.id,
          viewer?.id,
          'player_creation_failed',
          errorMsg,
          error instanceof Error ? error.stack : undefined,
          {
            name: viewer?.name,
            email: viewer?.email,
          }
        );

        clearTimeout(emergencyTimeout);
        setVideoLoading(false);
        setVideoError(true);
        setBroadcastStarted(false);
        
        // Clean up on error
        if (vimeoPlayerRef.current) {
          vimeoPlayerRef.current = null;
        }
      }
      }, initDelay); // Use mobile-optimized delay
    };
    
    // Load Vimeo Player API if not already loaded
    if (!window.Vimeo) {
      console.log('📥 Loading Vimeo Player API...');
      const script = document.createElement('script');
      script.src = 'https://player.vimeo.com/api/player.js';
      script.async = true;
      script.onload = () => {
        console.log('✅ Vimeo API script loaded, initializing player in 300ms...');
        setTimeout(initPlayer, 300);
      };
      script.onerror = (event) => {
        const errorMsg = 'Failed to load Vimeo API script - network or CORS issue';
        console.error('❌', errorMsg, event);
        logVideoError(
          webinar.id,
          viewer?.id,
          'script_load_failed',
          errorMsg,
          undefined,
          {
            name: viewer?.name,
            email: viewer?.email,
          }
        );
        clearTimeout(emergencyTimeout);
        setVideoLoading(false);
        setVideoError(true);
        setBroadcastStarted(false);
      };
      document.head.appendChild(script);
    } else {
      console.log('✅ Vimeo API already loaded, initializing immediately...');
      initPlayer();
    }
    
    return () => {
      clearTimeout(emergencyTimeout);
    };
  }, [embedUrl, webinar.vimeoVideoId, broadcastStarted, mounted, playbackRate]); 

  // Handler for manual play when user gesture is required
  const handleManualPlay = async () => {
    if (!vimeoPlayerRef.current) {
      console.error('❌ No player instance available for manual play');
      return;
    }

    console.log('🎯 Manual play triggered with fresh user gesture');
    setNeedsUserGesture(false);
    setVideoLoading(true);

    try {
      // The player is already muted and at the correct time
      // Just need to call play() with this fresh user gesture
      await vimeoPlayerRef.current.play();
      
      console.log('🎉 Manual play successful!');
      setVideoLoading(false);
      setIsMuted(true);
      
      // Start session tracking
      if (trackerRef.current) {
        const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const device = isMobileDevice ? 'mobile' : 'desktop';
        await trackerRef.current.startSession(device);
        trackerRef.current.setMuteState(true);
        const startTime = startTimeRef.current;
        trackerRef.current.trackVideoEvent('play', startTime);
        console.log(`📊 Session tracking started (${device}, muted)`);
      }
      
      // Show unmute hint
      setTimeout(() => setShowUnmuteHint(true), 2000);
      
      logVideoError(
        webinar.id,
        viewer?.id,
        'manual_play_success',
        'User successfully played video with manual interaction after permission error',
        undefined,
        {
          name: viewer?.name,
          email: viewer?.email,
        }
      );
    } catch (err) {
      const errorMsg = `Manual play failed: ${err instanceof Error ? err.message : String(err)}`;
      console.error('❌', errorMsg);
      
      logVideoError(
        webinar.id,
        viewer?.id,
        'manual_play_failed',
        errorMsg,
        err instanceof Error ? err.stack : undefined,
        {
          name: viewer?.name,
          email: viewer?.email,
        }
      );
      
      // If manual play also fails, show generic error
      setVideoLoading(false);
      setVideoError(true);
      setNeedsUserGesture(false);
      setBroadcastStarted(false);
    }
  };

  // Save watch position periodically (for both live and replay modes)
  useEffect(() => {
    // Early return if basic conditions aren't met
    if (!viewer?.id || !broadcastStarted || !playerReady) {
      return;
    }

    // Save position every 10 seconds
    const saveInterval = setInterval(async () => {
      if (vimeoPlayerRef.current && viewer?.id) {
        try {
          const currentTime = await vimeoPlayerRef.current.getCurrentTime();
          const roundedTime = Math.floor(currentTime);
          
          // Only save if position changed significantly (more than 2 seconds)
          if (Math.abs(roundedTime - (viewer.lastWatchedPosition || 0)) > 2) {
            const response = await fetch(`/api/registrations/${viewer.id}/watch-position`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ position: roundedTime, isReplay }),
              keepalive: true,
            });
            
            if (response.ok) {
              // Update viewer's lastWatchedPosition in memory
              if (viewer) {
                viewer.lastWatchedPosition = roundedTime;
              }
            }
          }
        } catch (err) {
          console.error('Error saving watch position:', err);
        }
      }
    }, 10000); // Save every 10 seconds

    // Save position when user leaves the page
    const handleBeforeUnload = async () => {
      if (vimeoPlayerRef.current && viewer?.id) {
        try {
          const currentTime = await vimeoPlayerRef.current.getCurrentTime();
          const roundedTime = Math.floor(currentTime);
          
          // Use sendBeacon for reliable sending during page unload
          const blob = new Blob(
            [JSON.stringify({ position: roundedTime, isReplay })],
            { type: 'application/json' }
          );
          navigator.sendBeacon(`/api/registrations/${viewer.id}/watch-position`, blob);
        } catch (err) {
          console.error('Error saving final watch position:', err);
        }
      }
      
      // End tracker session
      if (trackerRef.current) {
        await trackerRef.current.endSession();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(saveInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload();
    };
  }, [viewer?.id, broadcastStarted, playerReady]); // Removed isReplay - save for both live and replay

  // Track actual watch time (separate from video position)
  useEffect(() => {
    if (!broadcastStarted || !playerReady || !trackerRef.current) return;
    
    const trackingInterval = setInterval(async () => {
      if (vimeoPlayerRef.current) {
        try {
          const currentTime = await vimeoPlayerRef.current.getCurrentTime();
          const isPlaying = true; // Assume playing since interval is running
          
          // Update tracker with current position and playing state
          if (trackerRef.current) {
            trackerRef.current.updateWatchTime(currentTime, isPlaying);
          }
        } catch (err) {
          console.error('Error tracking watch time:', err);
        }
      }
    }, 5000); // Update every 5 seconds
    
    return () => {
      clearInterval(trackingInterval);
    };
  }, [broadcastStarted, playerReady]);

  // Countdown timer for replay expiration
  useEffect(() => {
    if (!isReplay || !webinar.replayExpiresAt) {
      setReplayTimeRemaining(null);
      return;
    }

    const updateCountdown = () => {
      const now = Date.now();
      const expiresAt = new Date(webinar.replayExpiresAt!).getTime();
      const diff = expiresAt - now;

      if (diff <= 0) {
        setReplayTimeRemaining('EXPIRED');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setReplayTimeRemaining(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setReplayTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setReplayTimeRemaining(`${minutes}m ${seconds}s`);
      } else {
        setReplayTimeRemaining(`${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [isReplay, webinar.replayExpiresAt]);

  const getSpeedLabel = (rate: number) => {
    if (rate === 0.8) return 'Slowest';
    if (rate === 0.9) return 'Slower';
    if (rate === 1) return 'Normal';
    if (rate === 1.1) return 'Fast';
    if (rate === 1.2) return 'Faster';
    if (rate === 1.3) return 'Max';
    return `${rate}x`;
  };

  return (
    <div className={styles.root}>
      {/* Preconnect to Vimeo for faster loading */}
      <link rel="preconnect" href="https://player.vimeo.com" />
      <link rel="preconnect" href="https://i.vimeocdn.com" />
      <link rel="dns-prefetch" href="https://f.vimeocdn.com" />
      
      <div
        className={`${styles.container} ${
          isChatOpen ? styles.chatOpen : ''
        } ${isChatMinimized ? styles.chatMinimized : ''}`}
      >
        {/* Replay Expiration Banner */}
        {isReplay && replayTimeRemaining && replayTimeRemaining !== 'EXPIRED' && (
          <div className={styles.replayExpirationBanner}>
            <div className={styles.replayBannerContent}>
              <i className="fas fa-clock" style={{ marginRight: '12px', fontSize: '20px' }} />
              <span className={styles.replayBannerText}>
                <strong>Replay Expires In:</strong> {replayTimeRemaining}
              </span>
              <i className="fas fa-exclamation-triangle" style={{ marginLeft: '12px', fontSize: '18px' }} />
            </div>
          </div>
        )}
        
        <div className={styles.webinarLayout}>
          <div className={styles.mainContent}>
            <div className={styles.videoContainer} ref={videoContainerRef}>
              {embedUrl ? (
                <>
                  <iframe
                    key={iframeKey}
                    src={`${embedUrl}${embedUrl.includes('?') ? '&' : '?'}badge=0&autopause=0&player_id=0&autoplay=0&muted=1&title=0&byline=0&portrait=0&sidedock=0&texttrack=0&cc=0&loop=0&background=0&transparent=0&playsinline=1&dnt=1${isReplayMode ? '' : '&controls=0'}`}
                    className={styles.videoEmbed}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                    title={webinar.title}
                    style={{ pointerEvents: isReplayMode ? 'auto' : 'none' }}
                    loading="lazy"
                    suppressHydrationWarning
                    onError={(e) => {
                      console.error('🚨 Iframe failed to load:', e);
                      logVideoError(
                        webinar.id,
                        viewer?.id,
                        'iframe_load_error',
                        'Vimeo iframe failed to load - possible network issue or blocked content',
                        undefined,
                        {
                          name: viewer?.name,
                          email: viewer?.email,
                        }
                      );
                    }}
                  />
                  
                  {/* EverWebinar-style "Click to Start Broadcast" Overlay */}
                  {!broadcastStarted && !videoLoading && (
                    <div 
                      className={styles.broadcastOverlay}
                      suppressHydrationWarning
                      onClick={async () => {
                        console.log('=== 🚀 BROADCAST START CLICKED ===');
                        console.log(`� Current elapsedSeconds: ${elapsedSeconds}`);
                        console.log(`�📍 Target start position: ${formatTimeLabel(elapsedSeconds)} (${elapsedSeconds}s from scheduled start)`);
                        
                        // Store the elapsed time when user clicks start
                        // For REPLAY MODE, default to 0 (start) unless smart resume kicks in later
                        // For LIVE MODE, sync to current elapsed time
                        startTimeRef.current = isReplayMode ? 0 : elapsedSeconds;
                        
                        // Track when broadcast actually started (for reaction grace period)
                        broadcastStartTimeRef.current = Date.now();
                        
                        // Clear any previous error and refresh iframe if needed
                        if (videoError) {
                          setIframeKey((prev) => prev + 1);
                        }
                        setVideoError(false);
                        
                        // Clear previous player instance if any
                        if (vimeoPlayerRef.current) {
                          try {
                            vimeoPlayerRef.current.off('ended');
                            vimeoPlayerRef.current.off('pause');
                            vimeoPlayerRef.current.off('play');
                          } catch (err) {
                            console.error('Error cleaning up player:', err);
                          }
                          vimeoPlayerRef.current = null;
                        }
                        
                        // Set states to show video and hide overlay
                        setBroadcastStarted(true);
                        setVideoLoading(true);
                        
                        // The useEffect will initialize the player and set the time
                        console.log('⏳ Triggering video initialization via useEffect...');
                      }}
                    >
                      <div className={styles.broadcastOverlayContent}>
                        <div className={styles.broadcastIcon}>
                          <i className={videoError ? "fas fa-rotate-right" : "fas fa-play-circle"} />
                        </div>
                        <h2 className={styles.broadcastTitle}>
                          {videoError 
                            ? 'Tap to Retry Video' 
                            : isReplayMode 
                              ? 'Tap to Start Replay' 
                              : 'Tap to Start Broadcast'
                          }
                        </h2>
                        <p className={styles.broadcastSubtitle}>
                          {videoError 
                            ? 'Video failed to load. This can happen due to slow connection. Tap to try again or refresh the page.'
                            : elapsedSeconds > 0 
                              ? `Live webinar in progress - Starting at ${formatTimeLabel(elapsedSeconds)}`
                              : 'The webinar is ready to begin'
                          }
                        </p>
                        {videoError && isMobile && (
                          <p className={styles.broadcastHint} style={{ marginTop: '10px', fontSize: '12px', opacity: 0.8 }}>
                            💡 Tip: Try switching to Wi-Fi or closing other apps
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Loading Spinner while video loads */}
                  {videoLoading && (
                    <div className={styles.videoLoadingOverlay}>
                      <div className={styles.spinner}></div>
                      <p className={styles.loadingText}>Loading video...</p>
                      {isMobile && (
                        <p style={{ marginTop: '10px', fontSize: '12px', opacity: 0.7 }}>
                          This may take a moment on mobile
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* User Gesture Required Overlay - Shows when autoplay permission denied */}
                  {needsUserGesture && !videoLoading && (
                    <div 
                      className={styles.broadcastOverlay}
                      suppressHydrationWarning
                      onClick={handleManualPlay}
                    >
                      <div className={styles.broadcastOverlayContent}>
                        <div className={styles.broadcastIcon}>
                          <i className="fas fa-hand-pointer" />
                        </div>
                        <h2 className={styles.broadcastTitle}>
                          Tap to Play Video
                        </h2>
                        <p className={styles.broadcastSubtitle}>
                          Your browser requires a tap to start playback
                        </p>
                        <p className={styles.broadcastHint} style={{ marginTop: '10px', fontSize: '12px', opacity: 0.8 }}>
                          💡 This is normal on mobile devices - just tap to continue
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Paused Overlay - Shows when video paused after tab switch on mobile */}
                  {showPausedOverlay && broadcastStarted && isMobile && (
                    <div 
                      className={styles.broadcastOverlay}
                      suppressHydrationWarning
                      onClick={async () => {
                        console.log('▶️ User clicked to resume video after tab switch');
                        setShowPausedOverlay(false);
                        
                        if (vimeoPlayerRef.current) {
                          try {
                            // Resume playback
                            await vimeoPlayerRef.current.play();
                            console.log('✅ Video resumed successfully');
                          } catch (err) {
                            console.error('❌ Error resuming video:', err);
                            // If resume fails, show error state
                            setVideoError(true);
                          }
                        }
                      }}
                    >
                      <div className={styles.broadcastOverlayContent}>
                        <div className={styles.broadcastIcon}>
                          <i className="fas fa-play-circle" />
                        </div>
                        <h2 className={styles.broadcastTitle}>
                          Tap to Resume
                        </h2>
                        <p className={styles.broadcastSubtitle}>
                          Video was paused when you switched tabs. Tap to continue watching.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Video Ended - Simple Reload Button */}
                  {webinarEnded && !broadcastStarted && (
                    <div className={styles.videoEndedOverlay}>
                      <div className={styles.videoEndedContent}>
                        <div className={styles.videoEndedIcon}>
                          <i className="fas fa-check-circle" style={{ color: '#10b981', fontSize: '48px' }} />
                        </div>
                        <h2 className={styles.videoEndedTitle}>
                          Webinar Ended
                        </h2>
                        <p className={styles.videoEndedSubtitle}>
                          Thank you for watching!
                        </p>
                        <button 
                          className={styles.reloadButton}
                          onClick={() => {
                            console.log('🔄 Reloading page for replay...');
                            window.location.reload();
                          }}
                        >
                          <i className="fas fa-rotate-right" style={{ marginRight: '10px' }} />
                          Watch Replay
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Unmute Hint - shows when video starts muted */}
                  {showUnmuteHint && isMuted && broadcastStarted && (
                    <div 
                      className={styles.unmuteHint}
                      onClick={() => {
                        toggleMute();
                        setShowUnmuteHint(false);
                      }}
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: 'rgba(0, 0, 0, 0.9)',
                        color: 'white',
                        padding: '24px 32px',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        zIndex: 1000,
                        textAlign: 'center',
                        animation: 'pulse 2s infinite',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                      }}
                    >
                      <i className="fas fa-volume-mute" style={{ fontSize: '48px', marginBottom: '12px', display: 'block' }} />
                      <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
                        Tap to Unmute
                      </div>
                      <div style={{ fontSize: '14px', opacity: 0.8 }}>
                        Video is playing without sound
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className={styles.videoPlaceholder}>
                  <i className="fas fa-play-circle" />
                </div>
              )}

              <div className={styles.videoControls}>
                <div className={`${styles.statusBadge} ${statusClass}`}>
                  <span className={styles.statusDot} />
                  {statusLabel}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {/* Rewind/Forward buttons - only show in replay mode (and not when native controls are active) */}
                  {isReplay && broadcastStarted && !isReplayMode && (
                    <>
                      <button
                        type="button"
                        className={styles.skipButton}
                        onClick={async () => {
                          if (!vimeoPlayerRef.current) return;
                          try {
                            const currentTime = await vimeoPlayerRef.current.getCurrentTime();
                            const newTime = Math.max(0, currentTime - 10);
                            await vimeoPlayerRef.current.setCurrentTime(newTime);
                            console.log(`⏪ Rewound 10 seconds: ${currentTime}s → ${newTime}s`);
                          } catch (err) {
                            console.error('Error rewinding:', err);
                          }
                        }}
                        aria-label="Rewind 10 seconds"
                        title="Rewind 10 seconds"
                      >
                        <i className="fas fa-backward" />
                        <span className={styles.skipTime}>10</span>
                      </button>
                      <button
                        type="button"
                        className={styles.skipButton}
                        onClick={async () => {
                          if (!vimeoPlayerRef.current) return;
                          try {
                            const currentTime = await vimeoPlayerRef.current.getCurrentTime();
                            const duration = await vimeoPlayerRef.current.getDuration();
                            const newTime = Math.min(duration, currentTime + 10);
                            await vimeoPlayerRef.current.setCurrentTime(newTime);
                            console.log(`⏩ Fast-forwarded 10 seconds: ${currentTime}s → ${newTime}s`);
                          } catch (err) {
                            console.error('Error fast-forwarding:', err);
                          }
                        }}
                        aria-label="Forward 10 seconds"
                        title="Forward 10 seconds"
                      >
                        <i className="fas fa-forward" />
                        <span className={styles.skipTime}>10</span>
                      </button>
                    </>
                  )}
                  {webinar.showElapsedTime !== false && !isReplayMode && (
                    <div className={styles.videoTime}>
                      {formattedElapsed}
                    </div>
                  )}
                  {broadcastStarted && !isReplayMode && (
                    <>
                      <button
                        type="button"
                        className={styles.playbackSpeedButton}
                        onClick={togglePlaybackSpeed}
                        aria-label={`Current playback speed: ${getSpeedLabel(playbackRate)}`}
                        title="Change playback speed"
                      >
                        {getSpeedLabel(playbackRate)}
                      </button>
                      <button
                        type="button"
                        className={styles.muteButton}
                        onClick={toggleMute}
                        aria-label={isMuted ? 'Unmute video' : 'Mute video'}
                      >
                        <i className={`fas ${isMuted ? 'fa-volume-mute' : 'fa-volume-up'}`} />
                      </button>
                      <button
                        type="button"
                        className={styles.fullscreenButton}
                        onClick={toggleFullscreen}
                        aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                      >
                        <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}`} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Reaction buttons overlaid on video - DESKTOP ONLY */}
              {webinar.hasReactions !== false && broadcastStarted && !isMobile && (
                <div className={styles.videoReactions}>
                  <button
                    type="button"
                    className={`${styles.videoReactionBtn} ${styles.reactionHeart}`}
                    onClick={(event) =>
                      handleReaction('heart', event.currentTarget)
                    }
                    aria-label="Send heart reaction"
                  >
                    <i className="fas fa-heart" />
                  </button>

                  <button
                    type="button"
                    className={`${styles.videoReactionBtn} ${styles.reactionClap}`}
                    onClick={(event) =>
                      handleReaction('clap', event.currentTarget)
                    }
                    aria-label="Send clap reaction"
                  >
                    <i className="fas fa-hands-clapping" />
                  </button>

                  <button
                    type="button"
                    className={`${styles.videoReactionBtn} ${styles.reactionThumbsUp}`}
                    onClick={(event) =>
                      handleReaction('thumbsUp', event.currentTarget)
                    }
                    aria-label="Send thumbs up reaction"
                  >
                    <i className="fas fa-thumbs-up" />
                  </button>

                  {webinar.hasChat !== false && (
                    <button
                      type="button"
                      className={`${styles.videoReactionBtn} ${styles.reactionChat}`}
                      onClick={toggleChat}
                      aria-label="Toggle chat sidebar"
                    >
                      <i className="fas fa-comments" />
                    </button>
                  )}
                </div>
              )}

              {/* Red CTA Button in Top-Left Corner - show when offer is active */}
              {webinar.hasOffers !== false && offerContent && broadcastStarted && (
                <div className={styles.videoTopLeftCTA}>
                  <button
                    type="button"
                    className={styles.videoCtaButton}
                    onClick={() => {
                      // Track offer click
                      if (trackerRef.current) {
                        trackerRef.current.trackOffer(
                          'click',
                          offerContent.title,
                          offerContent.ctaUrl || '#',
                          elapsedSeconds
                        );
                        trackerRef.current.trackEngagement('offer_click', elapsedSeconds, {
                          offerTitle: offerContent.title,
                          ctaUrl: offerContent.ctaUrl
                        });
                      }
                      
                      if (offerContent.ctaUrl && offerContent.ctaUrl !== '#') {
                        window.open(offerContent.ctaUrl, '_blank');
                      }
                    }}
                  >
                    <i className="fas fa-gift" />
                    <span>{offerContent.ctaText}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Reaction Buttons - Below Video */}
            {webinar.hasReactions !== false && broadcastStarted && isMobile && (
              <div className={styles.mobileReactionBar}>
                <button
                  type="button"
                  className={`${styles.mobileReactionBtn} ${styles.reactionHeart}`}
                  onClick={(event) => handleReaction('heart', event.currentTarget)}
                  aria-label="Send heart reaction"
                >
                  <i className="fas fa-heart" />
                </button>

                <button
                  type="button"
                  className={`${styles.mobileReactionBtn} ${styles.reactionClap}`}
                  onClick={(event) => handleReaction('clap', event.currentTarget)}
                  aria-label="Send clap reaction"
                >
                  <i className="fas fa-hands-clapping" />
                </button>

                <button
                  type="button"
                  className={`${styles.mobileReactionBtn} ${styles.reactionThumbsUp}`}
                  onClick={(event) => handleReaction('thumbsUp', event.currentTarget)}
                  aria-label="Send thumbs up reaction"
                >
                  <i className="fas fa-thumbs-up" />
                </button>

                {webinar.hasChat !== false && (
                  <button
                    type="button"
                    className={`${styles.mobileReactionBtn} ${styles.reactionChat}`}
                    onClick={toggleChat}
                    aria-label="Toggle chat sidebar"
                  >
                    <i className="fas fa-comments" />
                  </button>
                )}
              </div>
            )}

            {/* Offer CTA Button Below Video - show when offer is active */}
            {webinar.hasOffers !== false && offerContent && (
              <div className={styles.belowVideoOfferCTA}>
                <button
                  type="button"
                  className={styles.belowVideoOfferButton}
                  onClick={() => {
                    // Track offer click
                    if (trackerRef.current) {
                      trackerRef.current.trackOffer(
                        'click',
                        offerContent.title,
                        offerContent.ctaUrl || '#',
                        elapsedSeconds
                      );
                      trackerRef.current.trackEngagement('offer_click', elapsedSeconds, {
                        offerTitle: offerContent.title,
                        ctaUrl: offerContent.ctaUrl
                      });
                    }
                    
                    if (offerContent.ctaUrl && offerContent.ctaUrl !== '#') {
                      window.open(offerContent.ctaUrl, '_blank');
                    }
                  }}
                >
                  <i className="fas fa-gift" />
                  <span>{offerContent.ctaText}</span>
                  <i className="fas fa-arrow-right" />
                </button>
              </div>
            )}
          </div>

          {webinar.hasOffers !== false && offerContent && (
            <div className={styles.sidebar}>
              <div className={styles.offerContainer} ref={offerRef}>
                <h2 className={styles.offerTitle}>
                  {offerContent.title}
                </h2>
                <p className={styles.offerDescription}>
                  {offerContent.description}
                </p>
                {countdownRemainingSeconds !== null && (
                  <div className={styles.offerCountdown}>
                    <i className="fas fa-clock" />
                    <span>{formatCountdown(countdownRemainingSeconds)}</span>
                  </div>
                )}

                {offerContent.features.length > 0 && (
                  <div className={styles.offerFeatures}>
                    {offerContent.features.map((feature) => (
                      <div key={feature} className={styles.offerFeature}>
                        <i
                          className={`${styles.offerFeatureIcon} fas fa-check-circle`}
                        />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                )}

                    <div className={styles.offerPrice}>
                      <span className={styles.priceCurrent}>
                        {formatCurrency(offerContent.price)}
                      </span>
                      {offerContent.originalPrice && (
                        <span className={styles.priceOriginal}>
                          {formatCurrency(offerContent.originalPrice)}
                        </span>
                      )}
                      {offerContent.discountLabel && (
                        <span className={styles.priceDiscount}>
                          {offerContent.discountLabel}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      className={styles.ctaButton}
                      onClick={() => {
                        // Track offer click
                        if (trackerRef.current) {
                          trackerRef.current.trackOffer(
                            'click',
                            offerContent.title,
                            offerContent.ctaUrl || '#',
                            elapsedSeconds
                          );
                          trackerRef.current.trackEngagement('offer_click', elapsedSeconds, {
                            offerTitle: offerContent.title,
                            ctaUrl: offerContent.ctaUrl
                          });
                        }
                        
                        if (
                          offerContent.ctaUrl &&
                          offerContent.ctaUrl !== '#'
                        ) {
                          window.open(offerContent.ctaUrl, '_blank');
                        }
                      }}
                    >
                      {offerContent.ctaText}
                    </button>

                    <div className={styles.trustIndicators}>
                      {trustIndicators.map((indicator) => (
                        <div key={indicator.label} className={styles.trustItem}>
                          <i
                            className={`${styles.trustItemIcon} ${indicator.icon}`}
                          />
                          <span>{indicator.label}</span>
                        </div>
                      ))}
                    </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {webinar.hasChat !== false && (
        <>
          <div
            className={`${styles.overlay} ${
              isChatOpen ? styles.overlayActive : ''
            }`}
            onClick={toggleChat}
          />

          <aside
            className={`${styles.chatSidebar} ${
              isChatOpen ? styles.chatSidebarActive : ''
            } ${isChatMinimized ? styles.chatSidebarMinimized : ''}`}
          >
            <div className={styles.chatHeader}>
              <div className={styles.chatTitle}>Chat</div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className={styles.toggleChat}
                  onClick={toggleChat}
                  aria-label={isMobile ? (isChatMinimized ? "Expand chat" : "Minimize chat") : "Close chat"}
                >
                  <i className={`fas ${isMobile ? (isChatMinimized ? 'fa-plus' : 'fa-minus') : 'fa-times'}`} />
                </button>
              </div>
            </div>

            {/* Only show tabs when there's an active offer with FAQ */}
            {activeOffer && offerContent && (
              <div className={styles.chatTabs}>
                <button
                  type="button"
                  className={`${styles.chatTab} ${
                    activeTab === 'chat' ? styles.chatTabActive : ''
                  }`}
                  onClick={() => handleTabSwitch('chat')}
                >
                  Chat
                </button>
                <button
                  type="button"
                  className={`${styles.chatTab} ${
                    activeTab === 'faq' ? styles.chatTabActive : ''
                  }`}
                  onClick={() => handleTabSwitch('faq')}
                >
                  FAQ
                </button>
              </div>
            )}

            <div className={styles.chatContent}>
              <div
                ref={chatMessagesRef}
                className={`${styles.chatTabContent} ${
                  activeTab === 'chat' ? styles.chatTabContentActive : ''
                }`}
              >
                {messages.map((message) => (
                  <div key={message.clientId || message.id} className={`${styles.message} ${(message as any).isSystemNotification ? styles.systemMessage : ''}`}>
                    <div className={styles.messageContent}>
                      <div className={styles.messageText}>
                        <strong style={{ color: (message as any).isSystemNotification ? '#fab005' : '#7b68ee', marginRight: '6px' }}>
                          {message.userName}:
                        </strong>
                        <span style={ (message as any).isSystemNotification ? { fontWeight: 'bold', color: '#fab005' } : {} }>{message.message}</span>
                      </div>
                      {!(message as any).isSystemNotification && (
                        <div className="flex items-center gap-2 mt-1 -ml-1">
                          <button 
                            onClick={() => handleLikeMessage(message.id)}
                            className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded transition ${(message.likes && message.likes > 0) || message.likedByMe ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-red-400'}`}
                          >
                            <i className={`${(message.likes && message.likes > 0) || message.likedByMe ? 'fas' : 'far'} fa-heart`}></i>
                            {message.likes && message.likes > 0 && <span>{message.likes}</span>}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Typing indicator */}
                {isTyping && (
                  <div className={styles.message} style={{ opacity: 0.7 }}>
                    <div className={styles.messageContent}>
                      <div className={styles.messageText}>
                        <strong style={{ color: '#888', marginRight: '6px' }}>
                          Someone is typing...
                        </strong>
                        <span className={styles.typingDot}>●</span>
                        <span className={styles.typingDot}>●</span>
                        <span className={styles.typingDot}>●</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div
                className={`${styles.chatTabContent} ${
                  activeTab === 'faq' ? styles.chatTabContentActive : ''
                }`}
              >
                {(faqs.length > 0 ? faqs : defaultFaqs).map((faq, index) => {
                  const isOpen = openFaqs.has(index);
                  return (
                    <div
                      key={faq.id || faq.question}
                      className={`${styles.faqItem} ${
                        isOpen ? styles.faqItemActive : ''
                      }`}
                    >
                      <div
                        className={styles.faqQuestion}
                        onClick={() => handleFaqToggle(index)}
                      >
                        <span>{faq.question}</span>
                        <i
                          className={`${styles.faqIcon} fas ${
                            isOpen ? 'fa-chevron-up' : 'fa-chevron-down'
                          }`}
                        />
                      </div>
                      {isOpen && (
                        <div className={styles.faqAnswer}>{faq.answer}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Offer CTA in Chat Sidebar */}
            {webinar.hasOffers !== false && offerContent && (
              <div className={styles.chatOfferCTA}>
                <button
                  type="button"
                  className={styles.chatOfferButton}
                  onClick={() => {
                    if (offerContent.ctaUrl && offerContent.ctaUrl !== '#') {
                      window.open(offerContent.ctaUrl, '_blank');
                    }
                  }}
                >
                  <i className="fas fa-gift" />
                  <span>{offerContent.ctaText}</span>
                  <i className="fas fa-arrow-right" />
                </button>
              </div>
            )}

            <div className={styles.chatInputContainer}>
              <input
                type="text"
                className={styles.chatInput}
                placeholder="Type a message..."
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                onKeyDown={handleChatKeyDown}
              />
              <button
                type="button"
                className={styles.sendButton}
                onClick={handleSendMessage}
                aria-label="Send message"
              >
                <i className="fas fa-paper-plane" />
              </button>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
