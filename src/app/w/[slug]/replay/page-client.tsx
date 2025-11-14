'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from '../live/WebinarLivePage.module.css';
import { WebinarTracker } from '@/lib/tracking';

// Extend Vimeo Player API types for replay
interface VimeoPlayer {
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
  on(event: string, callback: (...args: any[]) => void): void;
  off(event: string, callback?: (...args: any[]) => void): void;
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

interface WebinarReplayClientProps {
  webinar: WebinarData;
  offers: LiveOffer[];
  chatMessages: ChatMessage[];
  reactionEvents: ReactionEvent[];
  viewer: ViewerInfo | null;
  replayExpiresAt: string | null;
}

const defaultOfferFallback = {
  title: 'Special Offer',
  description: 'Get exclusive access to premium content',
  price: 97,
  ctaText: 'Claim Your Spot',
  ctaUrl: '#',
};

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

const trustIndicators = [
  { icon: 'fas fa-shield-alt', label: '100% Secure' },
  { icon: 'fas fa-lock', label: 'Safe Checkout' },
  { icon: 'fas fa-undo', label: '30-Day Guarantee' },
];

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function formatTimeLabel(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0 || h > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Format replay expiration countdown
function formatReplayExpiration(isoString: string | null): string {
  if (!isoString) return '';
  
  const now = Date.now();
  const expiresAt = new Date(isoString).getTime();
  const diff = expiresAt - now;
  
  if (diff <= 0) return 'EXPIRED';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  
  return parts.join(' ');
}

function getActiveOffer(
  offers: LiveOffer[],
  elapsedSeconds: number
): LiveOffer | null {
  let candidate: LiveOffer | null = null;
  for (const offer of offers) {
    if (offer.videoTimestamp > elapsedSeconds) {
      continue;
    }
    const hideAt =
      offer.hideAfter != null
        ? offer.videoTimestamp + offer.hideAfter
        : Number.MAX_SAFE_INTEGER;
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

export default function WebinarReplayClient({
  webinar,
  offers,
  chatMessages,
  reactionEvents,
  viewer,
  replayExpiresAt,
}: WebinarReplayClientProps) {
  // UI State
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'faq'>('chat');
  const [chatInput, setChatInput] = useState('');
  const [openFaqs, setOpenFaqs] = useState<Set<number>>(new Set());
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false); // Replay starts unmuted by default
  
  // Video State
  const [videoReady, setVideoReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [videoDuration, setVideoDuration] = useState(webinar.videoDuration || 0);
  const [videoError, setVideoError] = useState(false);
  
  // Replay-specific state
  const [replayExpiration, setReplayExpiration] = useState<string>('');
  const [videoProgress, setVideoProgress] = useState(0); // 0-100 percentage
  
  // Refs
  const vimeoPlayerRef = useRef<any>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const offerRef = useRef<HTMLDivElement>(null);
  const trackerRef = useRef<WebinarTracker | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  
  // Sync state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [reactionCounts, setReactionCounts] = useState<Record<ReactionType, number>>({
    heart: 0,
    clap: 0,
    thumbsUp: 0,
  });
  
  // Active offer based on video position
  const activeOffer = useMemo(
    () => getActiveOffer(offers, elapsedSeconds),
    [offers, elapsedSeconds]
  );

  const offerContent = useMemo(
    () => buildOfferContent(activeOffer),
    [activeOffer]
  );

  // Calculate offer countdown
  const offerTimeRemaining = useMemo(() => {
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

  // Update replay expiration countdown
  useEffect(() => {
    if (!replayExpiresAt) return;
    
    const updateExpiration = () => {
      setReplayExpiration(formatReplayExpiration(replayExpiresAt));
    };
    
    updateExpiration();
    const interval = setInterval(updateExpiration, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [replayExpiresAt]);

  // Initialize video player
  useEffect(() => {
    if (!mounted || !webinar.vimeoVideoId) return;

    const initializePlayer = async () => {
      try {
        // Load Vimeo API
        if (!window.Vimeo) {
          const script = document.createElement('script');
          script.src = 'https://player.vimeo.com/api/player.js';
          script.async = true;
          document.head.appendChild(script);
          
          await new Promise<void>((resolve, reject) => {
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Vimeo API'));
          });
          
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        const iframe = document.querySelector('#vimeo-iframe') as HTMLIFrameElement;
        if (!iframe || !window.Vimeo) {
          throw new Error('Vimeo player not available');
        }

        const player = new window.Vimeo.Player(iframe) as unknown as VimeoPlayer;
        vimeoPlayerRef.current = player;

        await player.ready();
        
        // Get duration
        const duration = await player.getDuration();
        setVideoDuration(duration);
        
        // Set initial mute state
        await player.setMuted(isMuted);
        
        // Listen to video events
        player.on('timeupdate', async (data: any) => {
          const currentTime = data.seconds || 0;
          setElapsedSeconds(currentTime);
          setVideoProgress((currentTime / duration) * 100);
        });
        
        player.on('play', () => {
          setIsPlaying(true);
          if (trackerRef.current) {
            trackerRef.current.trackVideoEvent('play', elapsedSeconds);
          }
        });
        
        player.on('pause', () => {
          setIsPlaying(false);
          if (trackerRef.current) {
            trackerRef.current.trackVideoEvent('pause', elapsedSeconds);
          }
        });
        
        player.on('ended', () => {
          setIsPlaying(false);
          if (trackerRef.current) {
            trackerRef.current.trackVideoEvent('ended', elapsedSeconds);
          }
        });
        
        setVideoReady(true);
        setVideoError(false);
        
      } catch (error) {
        console.error('Failed to initialize video player:', error);
        setVideoError(true);
      }
    };

    const timeout = setTimeout(initializePlayer, 500);
    return () => clearTimeout(timeout);
  }, [mounted, webinar.vimeoVideoId, isMuted]);

  // Sync chat messages based on video position
  useEffect(() => {
    if (webinar.hasChat === false) return;

    const visibleMessages = chatMessages.filter(
      (msg) =>
        msg.videoTimestamp !== null &&
        msg.videoTimestamp <= elapsedSeconds
    );

    setMessages(visibleMessages);
  }, [elapsedSeconds, chatMessages, webinar.hasChat]);

  // Sync reactions based on video position
  useEffect(() => {
    if (webinar.hasReactions === false) return;

    const counts: Record<ReactionType, number> = {
      heart: 0,
      clap: 0,
      thumbsUp: 0,
    };

    reactionEvents.forEach((event) => {
      if (event.videoTimestamp <= elapsedSeconds) {
        counts[event.type] = (counts[event.type] || 0) + 1;
      }
    });

    setReactionCounts(counts);
  }, [elapsedSeconds, reactionEvents, webinar.hasReactions]);

  // Initialize analytics tracker
  useEffect(() => {
    if (!viewer?.id || !webinar.id) return;

    const device = window.innerWidth <= 768 ? 'mobile' : 'desktop';

    trackerRef.current = new WebinarTracker(
      viewer.id,
      webinar.id,
      null
    );

    trackerRef.current.startSession(device);

    // Track page entry
    const visitorId = localStorage.getItem('visitorId');
    WebinarTracker.trackPageVisit(
      webinar.id,
      'replay',
      'enter',
      viewer.id,
      undefined,
      visitorId || undefined
    );

    console.log('[Analytics] Replay tracking initialized for viewer:', viewer.email);

    return () => {
      if (trackerRef.current) {
        trackerRef.current.endSession();
        const visitorId = localStorage.getItem('visitorId');
        WebinarTracker.trackPageVisit(
          webinar.id,
          'replay',
          'leave',
          viewer.id,
          undefined,
          visitorId || undefined
        );
      }
    };
  }, [viewer?.id, webinar.id]);

  // Track watch time updates
  useEffect(() => {
    if (!trackerRef.current) return;

    const interval = setInterval(() => {
      if (trackerRef.current && isPlaying && !document.hidden) {
        trackerRef.current.updateWatchTime(elapsedSeconds, true);
      }
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [isPlaying, elapsedSeconds]);

  // Track video events
  useEffect(() => {
    if (!trackerRef.current || !vimeoPlayerRef.current) return;

    const handlePlay = () => {
      trackerRef.current?.trackVideoEvent('play', elapsedSeconds);
    };

    const handlePause = () => {
      trackerRef.current?.trackVideoEvent('pause', elapsedSeconds);
    };

    const handleEnded = () => {
      trackerRef.current?.trackVideoEvent('ended', elapsedSeconds);
    };

    vimeoPlayerRef.current.on('play', handlePlay);
    vimeoPlayerRef.current.on('pause', handlePause);
    vimeoPlayerRef.current.on('ended', handleEnded);

    return () => {
      if (vimeoPlayerRef.current) {
        vimeoPlayerRef.current.off('play', handlePlay);
        vimeoPlayerRef.current.off('pause', handlePause);
        vimeoPlayerRef.current.off('ended', handleEnded);
      }
    };
  }, [elapsedSeconds]);

  // Mark as mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update viewport state
  useEffect(() => {
    const updateViewport = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    const timer = setTimeout(updateViewport, 0);
    window.addEventListener('resize', updateViewport);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateViewport);
    };
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages]);

  // Highlight offer when it appears
  useEffect(() => {
    if (!activeOffer || !offerRef.current) return;

    offerRef.current.classList.add(styles.offerHighlight);
    const timer = setTimeout(() => {
      offerRef.current?.classList.remove(styles.offerHighlight);
    }, 2000);

    return () => clearTimeout(timer);
  }, [activeOffer?.id]);

  // Video controls
  const togglePlayPause = useCallback(async () => {
    if (!vimeoPlayerRef.current) return;

    try {
      if (isPlaying) {
        await vimeoPlayerRef.current.pause();
      } else {
        await vimeoPlayerRef.current.play();
      }
    } catch (error) {
      console.error('Failed to toggle play/pause:', error);
    }
  }, [isPlaying]);

  const toggleMute = useCallback(async () => {
    if (!vimeoPlayerRef.current) return;

    try {
      const newMutedState = !isMuted;
      await vimeoPlayerRef.current.setMuted(newMutedState);
      setIsMuted(newMutedState);
    } catch (error) {
      console.error('Failed to toggle mute:', error);
    }
  }, [isMuted]);

  const seek = useCallback(async (seconds: number) => {
    if (!vimeoPlayerRef.current) return;

    try {
      await vimeoPlayerRef.current.setCurrentTime(seconds);
    } catch (error) {
      console.error('Failed to seek:', error);
    }
  }, []);

  // Progress bar scrubbing
  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !videoDuration) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const seekTime = percentage * videoDuration;
    
    seek(seekTime);
  }, [videoDuration, seek]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(async () => {
    if (!videoContainerRef.current) return;

    try {
      if (!isFullscreen) {
        if (videoContainerRef.current.requestFullscreen) {
          await videoContainerRef.current.requestFullscreen();
        } else if ((videoContainerRef.current as any).webkitRequestFullscreen) {
          await (videoContainerRef.current as any).webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
      }
    } catch (error) {
      console.error('Failed to toggle fullscreen:', error);
    }
  }, [isFullscreen]);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Chat and UI handlers
  const toggleChat = useCallback(() => {
    if (isMobile) {
      setIsChatMinimized(!isChatMinimized);
    } else {
      setIsChatOpen(!isChatOpen);
    }
  }, [isMobile, isChatMinimized, isChatOpen]);

  const handleTabSwitch = useCallback((tab: 'chat' | 'faq') => {
    setActiveTab(tab);
  }, []);

  const toggleFaq = useCallback((index: number) => {
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

  const handleReaction = useCallback(
    async (type: ReactionType, button: HTMLButtonElement | null) => {
      // Spawn reaction animation
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
          userName,
        });
      }
    },
    [viewer, elapsedSeconds]
  );

  const spawnReaction = useCallback(
    (type: ReactionType, origin?: { x: number; y: number }, userName?: string) => {
      const floatingReaction = document.createElement('div');
      floatingReaction.className = styles.flyingReaction;

      const iconMap: Record<ReactionType, { icon: string; color: string }> = {
        heart: { icon: 'fa-heart', color: '#e75780' },
        clap: { icon: 'fa-hands-clapping', color: '#f0c75e' },
        thumbsUp: { icon: 'fa-thumbs-up', color: '#7b68ee' },
      };

      const { icon, color } = iconMap[type];
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

      const moveInward = originX < window.innerWidth / 2 ? 60 : -60;
      const tx = moveInward + (Math.random() - 0.5) * 30;
      const ty = -220 - Math.random() * 80;

      floatingReaction.style.setProperty('--tx', `${tx}px`);
      floatingReaction.style.setProperty('--ty', `${ty}px`);

      document.body.appendChild(floatingReaction);

      setTimeout(() => {
        floatingReaction.remove();
      }, 3000);
    },
    []
  );

  const formattedElapsed = formatTimeLabel(elapsedSeconds);
  const formattedDuration = formatTimeLabel(videoDuration);

  if (!mounted) {
    return null;
  }

  return (
    <div className={styles.container}>
      {/* Replay Expiration Countdown Banner */}
      {replayExpiration && (
        <div className={styles.replayExpirationBanner}>
          <div className={styles.replayExpirationContent}>
            <i className="fas fa-clock" style={{ marginRight: '8px' }} />
            <strong>REPLAY ACCESS EXPIRES IN:</strong>
            <span className={styles.replayExpirationTime}>{replayExpiration}</span>
          </div>
        </div>
      )}

      <div className={styles.mainContent}>
        <div className={styles.videoSection}>
          <div className={styles.videoWrapper} ref={videoContainerRef}>
            {webinar.vimeoVideoId ? (
              <>
                <iframe
                  id="vimeo-iframe"
                  src={`https://player.vimeo.com/video/${webinar.vimeoVideoId}?api=1&background=0&autopause=0&controls=0&title=0&byline=0&portrait=0`}
                  className={styles.videoEmbed}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={webinar.title}
                  suppressHydrationWarning
                />

                {videoError && (
                  <div className={styles.videoError}>
                    <div className={styles.videoErrorContent}>
                      <i className="fas fa-exclamation-triangle" />
                      <p>Failed to load video. Please refresh the page.</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className={styles.videoPlaceholder}>
                <i className="fas fa-play-circle" />
              </div>
            )}

            {/* Video Controls Overlay */}
            <div className={styles.videoControls}>
              <div className={`${styles.statusBadge} ${styles.statusReplay}`}>
                <span className={styles.statusDot} />
                REPLAY
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {webinar.showElapsedTime !== false && (
                  <div className={styles.videoTime}>
                    {formattedElapsed} / {formattedDuration}
                  </div>
                )}
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
              </div>
            </div>

            {/* Progress Bar */}
            <div 
              className={styles.videoProgressBar}
              ref={progressBarRef}
              onClick={handleProgressClick}
            >
              <div 
                className={styles.videoProgressFill}
                style={{ width: `${videoProgress}%` }}
              />
              <div 
                className={styles.videoProgressThumb}
                style={{ left: `${videoProgress}%` }}
              />
            </div>

            {/* Play/Pause Button */}
            {videoReady && (
              <button
                type="button"
                className={styles.playPauseButton}
                onClick={togglePlayPause}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`} />
              </button>
            )}

            {/* Reaction buttons */}
            {webinar.hasReactions !== false && (
              <div className={styles.videoReactions}>
                <button
                  type="button"
                  className={`${styles.videoReactionBtn} ${styles.reactionHeart}`}
                  onClick={(event) => handleReaction('heart', event.currentTarget)}
                  aria-label="Send heart reaction"
                >
                  <i className="fas fa-heart" />
                  {reactionCounts.heart > 0 && (
                    <span className={styles.reactionCount}>{reactionCounts.heart}</span>
                  )}
                </button>

                <button
                  type="button"
                  className={`${styles.videoReactionBtn} ${styles.reactionClap}`}
                  onClick={(event) => handleReaction('clap', event.currentTarget)}
                  aria-label="Send clap reaction"
                >
                  <i className="fas fa-hands-clapping" />
                  {reactionCounts.clap > 0 && (
                    <span className={styles.reactionCount}>{reactionCounts.clap}</span>
                  )}
                </button>

                <button
                  type="button"
                  className={`${styles.videoReactionBtn} ${styles.reactionThumbsUp}`}
                  onClick={(event) => handleReaction('thumbsUp', event.currentTarget)}
                  aria-label="Send thumbs up reaction"
                >
                  <i className="fas fa-thumbs-up" />
                  {reactionCounts.thumbsUp > 0 && (
                    <span className={styles.reactionCount}>{reactionCounts.thumbsUp}</span>
                  )}
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

            {/* Red CTA Button Overlay */}
            {webinar.hasOffers !== false && offerContent && (
              <div className={styles.videoTopLeftCTA}>
                <button
                  type="button"
                  className={styles.videoCtaButton}
                  onClick={() => {
                    if (trackerRef.current) {
                      trackerRef.current.trackOffer(
                        'click',
                        offerContent.title,
                        offerContent.ctaUrl || '#',
                        elapsedSeconds
                      );
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

          {/* Offer CTA Below Video */}
          {webinar.hasOffers !== false && offerContent && (
            <div className={styles.belowVideoOfferCTA}>
              <button
                type="button"
                className={styles.belowVideoOfferButton}
                onClick={() => {
                  if (trackerRef.current) {
                    trackerRef.current.trackOffer(
                      'click',
                      offerContent.title,
                      offerContent.ctaUrl || '#',
                      elapsedSeconds
                    );
                  }
                  if (offerContent.ctaUrl && offerContent.ctaUrl !== '#') {
                    window.open(offerContent.ctaUrl, '_blank');
                  }
                }}
              >
                <i className="fas fa-gift" style={{ marginRight: '8px' }} />
                {offerContent.ctaText}
              </button>
            </div>
          )}

          {/* Offer Card */}
          {webinar.hasOffers !== false && offerContent && (
            <div className={styles.offerSection} ref={offerRef}>
              <div className={styles.offerCard}>
                <div className={styles.offerHeader}>
                  <h3 className={styles.offerTitle}>{offerContent.title}</h3>
                  {offerTimeRemaining !== null && (
                    <div className={styles.offerCountdown}>
                      <i className="fas fa-clock" />
                      <span>{formatCountdown(offerTimeRemaining)}</span>
                    </div>
                  )}
                </div>

                <p className={styles.offerDescription}>{offerContent.description}</p>

                {offerContent.features.length > 0 && (
                  <div className={styles.offerFeatures}>
                    {offerContent.features.map((feature, index) => (
                      <div key={index} className={styles.offerFeature}>
                        <i className="fas fa-check-circle" />
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
                    if (trackerRef.current) {
                      trackerRef.current.trackOffer(
                        'click',
                        offerContent.title,
                        offerContent.ctaUrl || '#',
                        elapsedSeconds
                      );
                    }
                    if (offerContent.ctaUrl && offerContent.ctaUrl !== '#') {
                      window.open(offerContent.ctaUrl, '_blank');
                    }
                  }}
                >
                  {offerContent.ctaText}
                </button>

                <div className={styles.trustIndicators}>
                  {trustIndicators.map((indicator) => (
                    <div key={indicator.label} className={styles.trustItem}>
                      <i className={`${styles.trustItemIcon} ${indicator.icon}`} />
                      <span>{indicator.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat Sidebar */}
      {webinar.hasChat !== false && (
        <>
          <div
            className={`${styles.overlay} ${isChatOpen ? styles.overlayActive : ''}`}
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
                  aria-label={isMobile ? (isChatMinimized ? 'Expand chat' : 'Minimize chat') : 'Close chat'}
                >
                  <i
                    className={`fas ${
                      isMobile ? (isChatMinimized ? 'fa-plus' : 'fa-minus') : 'fa-times'
                    }`}
                  />
                </button>
              </div>
            </div>

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
                
                {messages.length === 0 && (
                  <div className={styles.emptyChat}>
                    <p>Chat messages will appear here as you watch the replay</p>
                  </div>
                )}
              </div>

              {activeOffer && offerContent && (
                <div
                  className={`${styles.chatTabContent} ${
                    activeTab === 'faq' ? styles.chatTabContentActive : ''
                  }`}
                >
                  <div className={styles.faqList}>
                    {defaultFaqs.map((faq, index) => (
                      <div key={index} className={styles.faqItem}>
                        <button
                          type="button"
                          className={`${styles.faqQuestion} ${
                            openFaqs.has(index) ? styles.faqQuestionOpen : ''
                          }`}
                          onClick={() => toggleFaq(index)}
                        >
                          <span>{faq.question}</span>
                          <i
                            className={`fas ${
                              openFaqs.has(index) ? 'fa-chevron-up' : 'fa-chevron-down'
                            }`}
                          />
                        </button>
                        {openFaqs.has(index) && (
                          <div className={styles.faqAnswer}>{faq.answer}</div>
                        )}
                      </div>
                    ))}
                  </div>

                  {offerContent && (
                    <div className={styles.sidebarOfferCTA}>
                      <button
                        type="button"
                        className={styles.sidebarCtaButton}
                        onClick={() => {
                          if (trackerRef.current) {
                            trackerRef.current.trackOffer(
                              'click',
                              offerContent.title,
                              offerContent.ctaUrl || '#',
                              elapsedSeconds
                            );
                          }
                          if (offerContent.ctaUrl && offerContent.ctaUrl !== '#') {
                            window.open(offerContent.ctaUrl, '_blank');
                          }
                        }}
                      >
                        {offerContent.ctaText}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
