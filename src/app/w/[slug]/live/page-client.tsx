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
        on(event: string, callback: () => void): void;
        off(event: string, callback?: () => void): void;
      };
    };
  }
}

type ReactionType = 'heart' | 'clap' | 'thumbsUp';

interface ChatMessage {
  id: string;
  userName: string;
  message: string;
  videoTimestamp: number | null;
  isScripted: boolean;
  createdAt: string;
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

interface WebinarLiveClientProps {
  webinar: WebinarData;
  offers: LiveOffer[];
  chatMessages: ChatMessage[];
  reactionEvents: ReactionEvent[];
  viewer: ViewerInfo | null;
  timing: TimingMeta;
  isReplayMode?: boolean;
}

const defaultFaqs = [
  {
    question: 'What is included in the Motherhood Balance Program?',
    answer:
      "The program includes 8 weeks of comprehensive content covering Islamic parenting principles, self-care strategies, time management techniques, and access to our supportive community of Muslim mothers. You'll also receive downloadable resources and lifetime access to all materials.",
  },
  {
    question: 'Is this program suitable for new mothers?',
    answer:
      'Yes, absolutely! The program is designed for mothers at all stages, including new mothers. We provide specific guidance for different phases of motherhood and help you establish healthy routines from the beginning.',
  },
  {
    question: 'How much time do I need to commit each week?',
    answer:
      'We recommend 2-3 hours per week for the best results. The content is self-paced, so you can adjust according to your schedule. Many mothers complete the program while managing their regular responsibilities.',
  },
  {
    question: 'Can I access the content on my mobile device?',
    answer:
      'Yes, the program is fully mobile-responsive. You can access all content, including videos, worksheets, and community discussions, from your smartphone or tablet.',
  },
  {
    question: 'Is there a payment plan available?',
    answer:
      'Yes, we offer flexible payment plans to make the program accessible to all mothers. You can choose to pay in full for a discount or spread payments over 3 months.',
  },
];

const baseNow = Date.now();

const sampleChatMessages: ChatMessage[] = [
  {
    id: 'sample-1',
    userName: 'Fatima',
    message: 'This program has transformed my daily routine!',
    videoTimestamp: 45,
    isScripted: true,
    createdAt: new Date(baseNow - 1000 * 60 * 25).toISOString(),
  },
  {
    id: 'sample-2',
    userName: 'Aisha',
    message: 'JazakAllah khair for this valuable information.',
    videoTimestamp: 120,
    isScripted: true,
    createdAt: new Date(baseNow - 1000 * 60 * 20).toISOString(),
  },
  {
    id: 'sample-3',
    userName: 'Khadija',
    message: 'Can you share more about balancing work and family?',
    videoTimestamp: 230,
    isScripted: true,
    createdAt: new Date(baseNow - 1000 * 60 * 15).toISOString(),
  },
  {
    id: 'sample-4',
    userName: 'Maryam',
    message: 'When does the next cohort start?',
    videoTimestamp: 360,
    isScripted: true,
    createdAt: new Date(baseNow - 1000 * 60 * 12).toISOString(),
  },
  {
    id: 'sample-5',
    userName: 'Zainab',
    message: "I'm definitely joining this program!",
    videoTimestamp: 420,
    isScripted: true,
    createdAt: new Date(baseNow - 1000 * 60 * 10).toISOString(),
  },
  {
    id: 'sample-6',
    userName: 'Safiyyah',
    message: 'Is there a payment plan option?',
    videoTimestamp: 540,
    isScripted: true,
    createdAt: new Date(baseNow - 1000 * 60 * 7).toISOString(),
  },
  {
    id: 'sample-7',
    userName: 'Hafsah',
    message: 'This has helped me so much with my children.',
    videoTimestamp: 680,
    isScripted: true,
    createdAt: new Date(baseNow - 1000 * 60 * 5).toISOString(),
  },
  {
    id: 'sample-8',
    userName: 'Amina',
    message: 'How long do we have access to the materials?',
    videoTimestamp: 820,
    isScripted: true,
    createdAt: new Date(baseNow - 1000 * 60 * 3).toISOString(),
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
  errorStack?: string
) {
  try {
    const deviceInfo = {
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      userAgent: navigator.userAgent,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      platform: navigator.platform,
      language: navigator.language,
    };

    await fetch('/api/video-errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        webinarId,
        registrationId,
        errorType,
        errorMessage,
        errorStack,
        userAgent: navigator.userAgent,
        deviceInfo: JSON.stringify(deviceInfo),
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.error('Failed to log video error:', err);
  }
}

function deriveEmbedUrl(webinar: WebinarData) {
  if (webinar.vimeoVideoId) {
    return `https://player.vimeo.com/video/${webinar.vimeoVideoId}`;
  }

  if (webinar.videoUrl) {
    const url = webinar.videoUrl;

    const youtubeMatch = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/i
    );
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}?rel=0`;
    }

    const vimeoUrlMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoUrlMatch) {
      return `https://player.vimeo.com/video/${vimeoUrlMatch[1]}`;
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
  const [isMuted, setIsMuted] = useState(true); // Start muted for mobile compatibility
  const [showUnmuteHint, setShowUnmuteHint] = useState(false); // Show prominent unmute hint
  const [replayTimeRemaining, setReplayTimeRemaining] = useState<string | null>(null); // Countdown display
  const [seenOfferIds, setSeenOfferIds] = useState<Set<string>>(new Set()); // Track offers user has seen
  const [webinarEnded, setWebinarEnded] = useState(false); // Track if live webinar has ended
  const [showReplayPrompt, setShowReplayPrompt] = useState(false); // Show replay start prompt
  const [iframeKey, setIframeKey] = useState(0); // Force iframe recreation on retry

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
    const base =
      chatMessages.length > 0 ? chatMessages : sampleChatMessages;
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

  const spawnReaction = useCallback(
    (type: ReactionType, origin?: { x: number; y: number }, userName?: string) => {
      // MOBILE OPTIMIZATION: Show reactions in chat sidebar instead of flying over video
      // Desktop: Full flying animation over video (keeps excitement)
      // Mobile: Simple emoji in chat (prevents video performance issues)
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobileDevice) {
        // Mobile: Add reaction as chat message
        const reactionEmoji = type === 'heart' ? '❤️' : type === 'clap' ? '👏' : '👍';
        const firstName = userName ? userName.split(' ')[0] : 'Someone';
        
        setMessages((prev) => [
          ...prev,
          {
            id: `reaction-${Date.now()}-${Math.random()}`,
            userName: firstName,
            message: reactionEmoji,
            videoTimestamp: null,
            isScripted: true,
            createdAt: new Date().toISOString(),
          }
        ]);
        console.log(`📱 Mobile: Showing ${reactionEmoji} in chat from ${firstName}`);
        return;
      }
      
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
    
    // Initialize tracker
    if (viewer?.id && webinar.id) {
      trackerRef.current = new WebinarTracker(viewer.id, webinar.id, null);
      console.log('📊 WebinarTracker initialized');
    }
    
    // REMOVED: Auto-start for mobile - force users to tap "Start" button
    // This ensures video starts UNMUTED (not muted for autoplay)
    // Only auto-start on desktop for better UX
    if (isReplayMode && !showReplayPrompt && !webinarEnded && !isMobile) {
      console.log('🎬 Auto-starting replay mode (desktop only)...');
      setBroadcastStarted(true);
      setVideoLoading(true);
      
      // Store the initial elapsed time for video seeking
      startTimeRef.current = timing.initialElapsedSeconds;
      console.log(`📍 Initial replay position: ${timing.initialElapsedSeconds}s`);
    }
    
    // Cleanup on unmount
    return () => {
      if (trackerRef.current) {
        console.log('🔚 Ending tracker session on unmount');
        trackerRef.current.endSession();
      }
    };
  }, [isReplayMode, timing.initialElapsedSeconds, showReplayPrompt, webinarEnded, viewer?.id, webinar.id, isMobile]);

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
    }, 5000); // Update every 5 seconds

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

    // Check if any previously seen offer should be shown
    // (user has seen it before, even if they rewound)
    let displayOfferId = nextId;
    if (!nextId && seenOfferIds.size > 0) {
      // Find the most recent seen offer that we're past the timestamp of
      const seenOffers = offersSorted.filter(offer => 
        seenOfferIds.has(offer.id) && elapsedSeconds >= offer.videoTimestamp
      );
      if (seenOffers.length > 0) {
        const mostRecent = seenOffers[seenOffers.length - 1];
        displayOfferId = mostRecent.id;
        console.log(`🔄 Showing previously seen offer: ${mostRecent.title}`);
      }
    }

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

        // Check if we should get an AI response (after CTA is shown)
        if (activeOfferId) {
          console.log('🤖 Checking for AI response after CTA...');
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
        }
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

  const openChat = useCallback(() => {
    if (webinar.hasChat === false) {
      return;
    }
    setIsChatOpen(true);
    setActiveTab('chat');
  }, [webinar.hasChat]);

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

  const embedUrl = useMemo(() => deriveEmbedUrl(webinar), [webinar]);

  // Initialize Vimeo Player ONCE when broadcast starts
  useEffect(() => {
    if (!embedUrl || !webinar.vimeoVideoId || !mounted || !broadcastStarted) {
      console.log('🚫 Skipping player init:', { embedUrl: !!embedUrl, vimeoVideoId: !!webinar.vimeoVideoId, mounted, broadcastStarted });
      return;
    }
    
    // Prevent re-initialization if player already exists
    if (vimeoPlayerRef.current) {
      console.log('⏭️ Player already initialized, skipping...');
      return;
    }
    
    console.log('🎯 Starting player initialization process...');
    
    // Detect mobile early for better timeouts
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    console.log(`📱 Mobile device detected: ${isMobileDevice}`);
    
    // MOBILE FIX: Longer timeout for mobile (60s vs 20s) and fewer, slower retries
    const timeoutDuration = isMobileDevice ? 60000 : 20000;
    const emergencyTimeout = setTimeout(() => {
      const errorMsg = `Emergency timeout after ${timeoutDuration/1000}s - video failed to load`;
      console.log(`⚠️ ${errorMsg}`);
      logVideoError(webinar.id, viewer?.id, 'timeout', errorMsg);
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
          logVideoError(webinar.id, viewer?.id, 'iframe_not_found', errorMsg);
          clearTimeout(emergencyTimeout);
          setVideoLoading(false);
          setVideoError(true);
          setBroadcastStarted(false);
          return;
        }
        console.log(`⚠️ Vimeo iframe not found (attempt ${iframeRetries}/${maxRetries}), retrying...`);
        setTimeout(initPlayer, retryDelay);
        return;
      }
      
      if (!window.Vimeo) {
        apiRetries++;
        if (apiRetries >= maxRetries) {
          const errorMsg = `Vimeo Player API not loaded after ${maxRetries} retries`;
          console.error('❌', errorMsg);
          logVideoError(webinar.id, viewer?.id, 'api_not_loaded', errorMsg);
          clearTimeout(emergencyTimeout);
          setVideoLoading(false);
          setVideoError(true);
          setBroadcastStarted(false);
          return;
        }
        console.log(`⚠️ Vimeo Player API not loaded yet (attempt ${apiRetries}/${maxRetries}), waiting...`);
        setTimeout(initPlayer, retryDelay);
        return;
      }
      
      // MOBILE FIX: Longer delay for iframe to be fully ready before initializing player
      const initDelay = isMobileDevice ? 1000 : 300;
      setTimeout(() => {
        try {
          console.log('🎬 Creating Vimeo Player instance...');
        const player = new window.Vimeo!.Player(iframe);
        vimeoPlayerRef.current = player;
        console.log('✅ Vimeo Player instance created');
        
        // Determine start time: 
        // 1. If replay mode and has lastWatchedPosition, resume from there
        // 2. Otherwise use the stored start time from when user clicked the button
        let startTime = startTimeRef.current;
        if (isReplay && viewer?.lastWatchedPosition && viewer.lastWatchedPosition > 0) {
          startTime = viewer.lastWatchedPosition;
          console.log(`🔄 REPLAY RESUME: Starting from ${formatTimeLabel(startTime)} (${startTime}s) - where user left off`);
        } else {
          console.log(`📍 Using stored start time: ${formatTimeLabel(startTime)} (${startTime}s)`);
        }
        
        console.log(`📱 Applying mobile-optimized settings for ${isMobileDevice ? 'mobile' : 'desktop'} device`);
        
        // MOBILE FIX: Always start muted for mobile to ensure autoplay works
        // Mobile browsers block unmuted autoplay, so we must start muted
        const startMuted = isMobileDevice ? true : false;
        
        player.ready()
          .then(async () => {
            console.log('✅ Player ready');
            setPlayerReady(true); // Mark player as ready for save effect
            
            // Add event listener for video end (to handle loop in replay mode)
            player.on('ended', () => {
              console.log('🎬 Video ended');
              if (isReplay) {
                // In replay mode, loop the video
                console.log('🔄 Replay mode: Restarting video from beginning');
                player.setCurrentTime(0).then(() => {
                  player.play().catch((err: Error) => {
                    console.error('❌ Failed to restart video:', err);
                  });
                });
              } else {
                // Live webinar just ended - show replay prompt screen
                console.log('🎬 Live webinar ended - showing replay prompt');
                setWebinarEnded(true);
                setShowReplayPrompt(true);
                setBroadcastStarted(false); // Stop the broadcast
                player.pause(); // Pause the video
              }
            });
            
            // Add event listener for play/pause to debug unexpected stops
            player.on('pause', () => {
              console.log('⏸️ Video paused');
              
              // REMOVED: Aggressive auto-resume that causes crash loops on mobile
              // Mobile devices often pause video due to memory/bandwidth issues
              // Let the user manually resume if needed
            });
            
            player.on('play', () => {
              console.log('▶️ Video playing');
            });
            
            // Set all properties at once without chaining
            try {
              await player.setMuted(startMuted);
              console.log(`✅ Muted: ${startMuted}`);
            } catch (e) {
              console.log('⚠️ Could not set mute, continuing...');
            }
            
            try {
              await player.setVolume(startMuted ? 0 : 1);
              console.log(`✅ Volume: ${startMuted ? 0 : 1}`);
            } catch (e) {
              console.log('⚠️ Could not set volume, continuing...');
            }
            
            try {
              await player.setCurrentTime(startTime);
              console.log(`✅ Time set to: ${startTime}s`);
            } catch (e) {
              console.log('⚠️ Could not set time, starting from beginning...');
            }
            
            // Now try to play - this is the critical part
            try {
              console.log('🎮 Attempting to play video...');
              await player.play();
              console.log('🎉 Video playing!');
              setIsMuted(startMuted);
              clearTimeout(emergencyTimeout);
              setVideoLoading(false);
              
              // Start session tracking
              if (trackerRef.current) {
                const device = isMobileDevice ? 'mobile' : 'desktop';
                await trackerRef.current.startSession(device);
                trackerRef.current.setMuteState(startMuted);
                trackerRef.current.trackVideoEvent('play', startTime);
                console.log(`� Session tracking started (${device}, ${startMuted ? 'muted' : 'unmuted'})`);
              }
              
              // Show unmute hint on mobile
              if (isMobileDevice && startMuted) {
                console.log('💡 Mobile: Video started muted. Showing unmute hint.');
                setTimeout(() => setShowUnmuteHint(true), 2000);
              }
            } catch (playErr) {
              const errorMsg = `Play failed: ${playErr instanceof Error ? playErr.message : String(playErr)}`;
              console.error('❌', errorMsg);
              logVideoError(
                webinar.id, 
                viewer?.id, 
                'play_failed', 
                errorMsg,
                playErr instanceof Error ? playErr.stack : undefined
              );
              throw playErr; // Pass to catch block
            }
          })
          .catch(async (err: Error) => {
            const errorMsg = `Player initialization failed: ${err.message}`;
            console.error('❌', errorMsg);
            logVideoError(
              webinar.id, 
              viewer?.id, 
              'player_init_failed', 
              errorMsg,
              err.stack
            );
            
            // MOBILE FIX: Simplified recovery - just show error, let user retry
            // No complex recovery loops that can cause crashes
            console.log('❌ Showing retry button - user can tap to try again');
            clearTimeout(emergencyTimeout);
            setVideoLoading(false);
            setVideoError(true);
            setBroadcastStarted(false);
            
            // Clean up failed player instance
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
        console.error('❌ Error creating Vimeo player:', error);
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
      script.onerror = () => {
        console.error('❌ Failed to load Vimeo API script');
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
  }, [embedUrl, webinar.vimeoVideoId, broadcastStarted, mounted]); // Removed elapsedSeconds - we use the ref instead

  // Save watch position periodically (for both live and replay modes)
  useEffect(() => {
    // Early return if basic conditions aren't met
    if (!viewer?.id || !broadcastStarted || !playerReady) {
      console.log('⏭️ Skipping position save setup:', { hasViewer: !!viewer?.id, broadcastStarted, playerReady });
      return;
    }

    console.log(`💾 Starting periodic position save for ${isReplay ? 'replay' : 'live'} mode`);
    console.log('💾 Viewer ID:', viewer.id);
    console.log('💾 Initial lastWatchedPosition:', viewer.lastWatchedPosition);

    // Save position every 10 seconds
    const saveInterval = setInterval(async () => {
      if (vimeoPlayerRef.current && viewer?.id) {
        try {
          const currentTime = await vimeoPlayerRef.current.getCurrentTime();
          const roundedTime = Math.floor(currentTime);
          
          console.log(`💾 Attempting to save position: ${roundedTime}s (last saved: ${viewer.lastWatchedPosition || 0}s)`);
          
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
              console.log(`✅ Successfully saved watch position: ${roundedTime}s`);
            } else {
              console.error(`❌ Failed to save position, status: ${response.status}`);
            }
          } else {
            console.log(`⏭️ Skipping save - position hasn't changed enough`);
          }
        } catch (err) {
          console.error('Error saving watch position:', err);
        }
      } else {
        console.log('⚠️ Cannot save position: player or viewer not available');
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
          console.log(`💾 Saved final watch position on unload: ${roundedTime}s`);
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
      // Final save on cleanup
      handleBeforeUnload();
    };
  }, [viewer?.id, broadcastStarted, playerReady]); // Removed isReplay - save for both live and replay

  // Track actual watch time (separate from video position)
  useEffect(() => {
    if (!broadcastStarted || !playerReady || !trackerRef.current) return;
    
    let lastUpdateTime = Date.now();
    
    const trackingInterval = setInterval(async () => {
      if (vimeoPlayerRef.current) {
        try {
          const currentTime = await vimeoPlayerRef.current.getCurrentTime();
          const now = Date.now();
          const isPlaying = true; // Assume playing since interval is running
          
          // Update tracker with current position and playing state
          if (trackerRef.current) {
            trackerRef.current.updateWatchTime(currentTime, isPlaying);
          }
          
          lastUpdateTime = now;
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
                    src={`${embedUrl}${embedUrl.includes('?') ? '&' : '?'}autoplay=0&muted=1&controls=0&title=0&byline=0&portrait=0&sidedock=0&texttrack=0&cc=0&loop=${isReplay ? 1 : 0}&autopause=0&background=0&transparent=0&playsinline=1&preload=metadata`}
                    className={styles.videoEmbed}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={webinar.title}
                    style={{ pointerEvents: 'none' }}
                    suppressHydrationWarning
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
                        startTimeRef.current = elapsedSeconds;
                        console.log(`💾 Stored start time in ref: ${startTimeRef.current}s`);
                        console.log(`🔍 Ref value check: ${formatTimeLabel(startTimeRef.current)}`);
                        
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
                  
                  {/* Replay Prompt Screen - shows when live webinar ends */}
                  {showReplayPrompt && webinarEnded && (
                    <div className={styles.replayPromptOverlay}>
                      <div className={styles.replayPromptContent}>
                        <div className={styles.replayPromptIcon}>
                          <i className="fas fa-check-circle" style={{ color: '#10b981', fontSize: '64px' }} />
                        </div>
                        <h2 className={styles.replayPromptTitle}>
                          Webinar Has Ended
                        </h2>
                        <p className={styles.replayPromptSubtitle}>
                          Thank you for attending! The replay is now available.
                        </p>
                        <button 
                          className={styles.startReplayButton}
                          onClick={handleStartReplay}
                        >
                          <i className="fas fa-play" style={{ marginRight: '10px' }} />
                          Start Replay
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
                  {/* Rewind/Forward buttons - only show in replay mode */}
                  {isReplay && broadcastStarted && (
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
                  {webinar.showElapsedTime !== false && (
                    <div className={styles.videoTime}>
                      {formattedElapsed}
                    </div>
                  )}
                  {broadcastStarted && (
                    <>
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
                  <span>Love</span>
                </button>

                <button
                  type="button"
                  className={`${styles.mobileReactionBtn} ${styles.reactionClap}`}
                  onClick={(event) => handleReaction('clap', event.currentTarget)}
                  aria-label="Send clap reaction"
                >
                  <i className="fas fa-hands-clapping" />
                  <span>Clap</span>
                </button>

                <button
                  type="button"
                  className={`${styles.mobileReactionBtn} ${styles.reactionThumbsUp}`}
                  onClick={(event) => handleReaction('thumbsUp', event.currentTarget)}
                  aria-label="Send thumbs up reaction"
                >
                  <i className="fas fa-thumbs-up" />
                  <span>Like</span>
                </button>

                {webinar.hasChat !== false && (
                  <button
                    type="button"
                    className={`${styles.mobileReactionBtn} ${styles.reactionChat}`}
                    onClick={toggleChat}
                    aria-label="Toggle chat sidebar"
                  >
                    <i className="fas fa-comments" />
                    <span>Chat</span>
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
                  <div key={message.id} className={styles.message}>
                    <div className={styles.messageContent}>
                      <div className={styles.messageText}>
                        <strong style={{ color: '#7b68ee', marginRight: '6px' }}>
                          {message.userName}:
                        </strong>
                        <span>{message.message}</span>
                      </div>
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
                {defaultFaqs.map((faq, index) => {
                  const isOpen = openFaqs.has(index);
                  return (
                    <div
                      key={faq.question}
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
