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
}: WebinarLiveClientProps) {
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
  const [liveViewerCount, setLiveViewerCount] = useState(0); // Simulated live viewer count
  const [isTyping, setIsTyping] = useState(false); // Show "someone is typing" indicator
  const [isTabVisible, setIsTabVisible] = useState(true); // Track tab visibility
  const pausedTimeRef = useRef<number | null>(null); // Store elapsed time when tab becomes hidden
  const broadcastStartTimeRef = useRef<number>(0); // Track when broadcast actually started
  const trackerRef = useRef<WebinarTracker | null>(null); // Analytics tracker

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

  // Handle tab visibility to pause/resume elapsed time
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      setIsTabVisible(isVisible);

      if (!isVisible) {
        // Tab hidden - store current elapsed time and pause video
        pausedTimeRef.current = elapsedSeconds;
        if (vimeoPlayerRef.current) {
          vimeoPlayerRef.current.pause().catch(() => {
            // Ignore pause errors
          });
        }
        console.log('⏸️ Tab hidden - paused at', elapsedSeconds, 'seconds');
      } else {
        // Tab visible again - resume from paused time
        console.log('▶️ Tab visible - resuming from', pausedTimeRef.current, 'seconds');
        if (vimeoPlayerRef.current && broadcastStarted) {
          vimeoPlayerRef.current.play().catch(() => {
            // Ignore play errors
          });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [elapsedSeconds, broadcastStarted]);

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
      // Only show reactions that should have appeared by now
      // Reaction should appear AFTER its timestamp, not at it
      const shouldShow = event.videoTimestamp < elapsedSeconds;
      
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

    if (nextId !== activeOfferId) {
      setActiveOfferId(nextId);
      
      // Track offer view
      if (nextId && latest && trackerRef.current) {
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
      
      // Auto-switch to FAQ tab when offer appears
      if (nextId) {
        setActiveTab('faq');
      } else {
        // Switch back to Chat when offer ends
        setActiveTab('chat');
      }
    }
  }, [
    elapsedSeconds,
    offersSorted,
    webinar.hasOffers,
    activeOfferId,
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
      const response = await fetch(`/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          webinarId: webinar.id,
          message: text,
          registrationId: viewer?.id, // Pass registrationId for registered attendees
        }),
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
      } else {
        console.error('Failed to save message:', await response.text());
      }
    } catch (error) {
      console.error('Error saving message:', error);
    }
  }, [chatInput, elapsedSeconds, webinar.id, viewer, addChatMessage]);

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

  // Simulated webinar - always show as live
  const isReplay =
    totalDuration != null ? elapsedSeconds >= totalDuration : false;

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
    
    const initPlayer = () => {
      const iframe = document.querySelector('iframe[src*="vimeo.com"]') as HTMLIFrameElement;
      if (!iframe) {
        console.log('⚠️ Vimeo iframe not found, retrying in 200ms...');
        setTimeout(initPlayer, 200);
        return;
      }
      
      if (!window.Vimeo) {
        console.log('⚠️ Vimeo Player API not loaded yet, waiting...');
        setTimeout(initPlayer, 100);
        return;
      }
      
      try {
        console.log('🎬 Creating Vimeo Player instance...');
        const player = new window.Vimeo.Player(iframe);
        vimeoPlayerRef.current = player;
        console.log('✅ Vimeo Player instance created');
        
        // Fallback: Hide loading after 5 seconds max
        const loadingTimeout = setTimeout(() => {
          console.log('⏰ Timeout: Force hiding loading overlay');
          setVideoLoading(false);
        }, 5000);
        
        // Use the stored start time from when user clicked the button
        const startTime = startTimeRef.current;
        console.log(`📍 Using stored start time: ${formatTimeLabel(startTime)} (${startTime}s)`);
        
        // More robust initialization sequence
        player.ready()
          .then(() => {
            console.log('✅ Player ready, setting initial time...');
            return player.setCurrentTime(startTime);
          })
          .then(() => {
            console.log('✅ Time set, unmuting...');
            return player.setMuted(false);
          })
          .then(() => {
            console.log('✅ Unmuted, setting volume to 100%...');
            return player.setVolume(1);
          })
          .then(() => {
            console.log('✅ Volume set, starting playback...');
            return player.play();
          })
          .then(() => {
            console.log('✅ Video playing! Double-checking audio...');
            // Double-check audio is unmuted (iOS workaround)
            return Promise.all([
              player.setMuted(false),
              player.setVolume(1)
            ]);
          })
          .then(() => {
            console.log(`🎉 Video playing successfully at ${formatTimeLabel(startTime)}`);
            clearTimeout(loadingTimeout);
            setVideoLoading(false);
          })
          .catch((err: Error) => {
            console.error('❌ Error during video setup:', err);
            console.log('🔄 Attempting simplified retry...');
            
            // Simplified retry - just try to play
            Promise.all([
              player.setMuted(false),
              player.setVolume(1)
            ])
              .then(() => player.play())
              .then(() => {
                console.log('✅ Retry successful');
                clearTimeout(loadingTimeout);
                setVideoLoading(false);
              })
              .catch((retryErr: Error) => {
                console.error('❌ Retry also failed:', retryErr);
                // Still hide loading so user can see the overlay again
                clearTimeout(loadingTimeout);
                setVideoLoading(false);
              });
          });
      } catch (error) {
        console.error('❌ Error creating Vimeo player:', error);
        setVideoLoading(false);
      }
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
        setVideoLoading(false);
        // Reset broadcast started so user can try again
        setBroadcastStarted(false);
      };
      document.head.appendChild(script);
    } else {
      console.log('✅ Vimeo API already loaded, initializing immediately...');
      initPlayer();
    }
  }, [embedUrl, webinar.vimeoVideoId, broadcastStarted, mounted]); // Removed elapsedSeconds - we use the ref instead

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
        <div className={styles.webinarLayout}>
          <div className={styles.mainContent}>
            <div className={styles.videoContainer} ref={videoContainerRef}>
              {embedUrl ? (
                <>
                  <iframe
                    src={`${embedUrl}${embedUrl.includes('?') ? '&' : '?'}autoplay=0&muted=0&controls=0&title=0&byline=0&portrait=0&sidedock=0&texttrack=0&cc=0`}
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
                        
                        // Set states to show video and hide overlay
                        setBroadcastStarted(true);
                        setVideoLoading(true);
                        
                        // The useEffect will initialize the player and set the time
                        console.log('⏳ Triggering video initialization via useEffect...');
                      }}
                    >
                      <div className={styles.broadcastOverlayContent}>
                        <div className={styles.broadcastIcon}>
                          <i className="fas fa-play-circle" />
                        </div>
                        <h2 className={styles.broadcastTitle}>Click to Start Broadcast</h2>
                        <p className={styles.broadcastSubtitle}>
                          {elapsedSeconds > 0 
                            ? `Live webinar in progress - Starting at ${formatTimeLabel(elapsedSeconds)}`
                            : 'The webinar is ready to begin'
                          }
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Loading Spinner while video loads */}
                  {videoLoading && (
                    <div className={styles.videoLoadingOverlay}>
                      <div className={styles.spinner}></div>
                      <p className={styles.loadingText}>Starting broadcast...</p>
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
                {webinar.showElapsedTime !== false && (
                  <div className={styles.videoTime}>
                    {formattedElapsed}
                  </div>
                )}
              </div>

              {/* Reaction buttons overlaid on video - only show after broadcast starts */}
              {webinar.hasReactions !== false && broadcastStarted && (
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
            </div>

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
