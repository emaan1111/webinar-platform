// Utility functions for tracking user behavior

export class WebinarTracker {
  private sessionId: string | null = null;
  private registrationId: string;
  private webinarId: string;
  private scheduleId: string | null;
  private lastUpdateTime: number = Date.now();
  private updateInterval: NodeJS.Timeout | null = null;
  private watchTime: number = 0;
  private currentPosition: number = 0;
  private isWatching: boolean = false;
  private isMuted: boolean = true; // Track mute state
  private mutedTime: number = 0;
  private unmutedTime: number = 0;
  private lastMuteStateChange: number = Date.now();

  constructor(registrationId: string, webinarId: string, scheduleId: string | null = null) {
    this.registrationId = registrationId;
    this.webinarId = webinarId;
    this.scheduleId = scheduleId;
  }

  // Start session tracking
  async startSession(device: string = 'desktop') {
    try {
      const response = await fetch('/api/tracking/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId: this.registrationId,
          webinarId: this.webinarId,
          scheduleId: this.scheduleId,
          action: 'join',
          userAgent: navigator.userAgent,
          device,
        }),
      });

      const data = await response.json();
      if (data.success) {
        this.sessionId = data.sessionId;
        this.startWatchTimeTracking();
        console.log('[Tracking] Session started:', this.sessionId);
      }
    } catch (error) {
      console.error('[Tracking] Failed to start session:', error);
    }
  }

  // Update session periodically
  private startWatchTimeTracking() {
    // Update every 10 seconds
    this.updateInterval = setInterval(() => {
      if (this.isWatching && this.sessionId) {
        this.updateSession();
      }
    }, 10000);
  }

  private async updateSession() {
    try {
      await fetch('/api/tracking/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId: this.registrationId,
          webinarId: this.webinarId,
          action: 'update',
          videoPosition: this.currentPosition,
          watchTime: this.watchTime,
          isMuted: this.isMuted,
          mutedTime: this.mutedTime,
          unmutedTime: this.unmutedTime,
        }),
      });
    } catch (error) {
      console.error('[Tracking] Failed to update session:', error);
    }
  }

  // End session
  async endSession() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    // Update mute time before ending
    this.updateMuteTime();

    if (this.sessionId) {
      try {
        await fetch('/api/tracking/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            registrationId: this.registrationId,
            webinarId: this.webinarId,
            action: 'leave',
            videoPosition: this.currentPosition,
            watchTime: this.watchTime,
            isMuted: this.isMuted,
            mutedTime: this.mutedTime,
            unmutedTime: this.unmutedTime,
          }),
        });
        console.log('[Tracking] Session ended');
      } catch (error) {
        console.error('[Tracking] Failed to end session:', error);
      }
    }
  }

  // Update watch time
  updateWatchTime(position: number, isPlaying: boolean) {
    const now = Date.now();
    const timeDiff = (now - this.lastUpdateTime) / 1000;
    
    if (isPlaying && timeDiff > 0 && timeDiff < 5) {
      this.watchTime += timeDiff;
      this.updateMuteTime(); // Update muted/unmuted duration
    }
    
    this.currentPosition = position;
    this.isWatching = isPlaying;
    this.lastUpdateTime = now;
  }

  // Update mute state and track duration
  setMuteState(isMuted: boolean) {
    // Before changing state, add time to the appropriate counter
    this.updateMuteTime();
    
    // Update state
    this.isMuted = isMuted;
    this.lastMuteStateChange = Date.now();
    
    console.log(`[Tracking] Mute state changed to: ${isMuted ? 'MUTED' : 'UNMUTED'}`);
    console.log(`[Tracking] Muted time: ${this.mutedTime}s, Unmuted time: ${this.unmutedTime}s`);
  }

  // Helper to update muted/unmuted duration
  private updateMuteTime() {
    const now = Date.now();
    const timeDiff = (now - this.lastMuteStateChange) / 1000;
    
    if (this.isWatching && timeDiff > 0 && timeDiff < 15) { // Sanity check
      if (this.isMuted) {
        this.mutedTime += timeDiff;
      } else {
        this.unmutedTime += timeDiff;
      }
    }
    
    this.lastMuteStateChange = now;
  }

  // Track video events
  async trackVideoEvent(eventType: 'play' | 'pause' | 'seek' | 'ended' | 'left', timestamp: number, watchedFrom?: number, watchedTo?: number) {
    if (!this.sessionId) return;

    try {
      await fetch('/api/tracking/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionId,
          webinarId: this.webinarId,
          eventType,
          timestamp,
          watchedFrom,
          watchedTo,
        }),
      });
      console.log('[Tracking] Video event:', eventType, 'at', timestamp);
    } catch (error) {
      console.error('[Tracking] Failed to track video event:', error);
    }
  }

  // Track engagement events
  async trackEngagement(eventType: 'chat' | 'reaction' | 'question' | 'poll' | 'offer_view' | 'offer_click', timestamp: number, eventData?: any) {
    if (!this.sessionId) return;

    try {
      await fetch('/api/tracking/engagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionId,
          webinarId: this.webinarId,
          eventType,
          timestamp,
          eventData,
        }),
      });
      console.log('[Tracking] Engagement:', eventType, 'at', timestamp);
    } catch (error) {
      console.error('[Tracking] Failed to track engagement:', error);
    }
  }

  // Track offer interactions
  async trackOffer(action: 'view' | 'click' | 'convert', offerTitle: string, offerUrl: string, videoPosition: number) {
    try {
      await fetch('/api/tracking/offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId: this.registrationId,
          webinarId: this.webinarId,
          action,
          offerTitle,
          offerUrl,
          videoPosition,
        }),
      });
      console.log('[Tracking] Offer:', action, offerTitle);
    } catch (error) {
      console.error('[Tracking] Failed to track offer:', error);
    }
  }

  // Track page visit
  static async trackPageVisit(
    webinarId: string,
    pageType: 'registration' | 'countdown' | 'webinar' | 'thank_you' | 'replay',
    action: 'enter' | 'leave',
    registrationId?: string,
    sessionId?: string,
    visitorId?: string
  ) {
    try {
      const device = window.innerWidth <= 768 ? 'mobile' : 'desktop';
      const response = await fetch('/api/tracking/page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webinarId,
          pageType,
          action,
          registrationId,
          sessionId,
          visitorId,
          device,
          browser: navigator.userAgent,
          referrer: document.referrer,
        }),
      });

      const data = await response.json();
      if (action === 'enter' && data.visitorId) {
        // Store visitor ID in localStorage for tracking across pages
        localStorage.setItem('visitorId', data.visitorId);
        return data.visitorId;
      }
    } catch (error) {
      console.error('[Tracking] Failed to track page visit:', error);
    }
  }
}
