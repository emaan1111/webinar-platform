# Webinar Platform

## Overview

A comprehensive automated webinar platform that simulates live webinars using pre-recorded Vimeo videos. The system creates an "EverWebinar-style" experience where attendees join scheduled sessions that appear live, complete with time-synced chat messages, reactions, and timed offers. The platform includes sophisticated scheduling options (specific times, recurring patterns, just-in-time), customizable registration templates, A/B testing capabilities, and deep integrations with ClickFunnels and Facebook Conversions API.

**Core Value Proposition:** Run unlimited automated webinars that feel live, with full control over scheduling, design, engagement features, and conversion tracking.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### 1. Frontend Architecture

**Framework:** Next.js 14+ with App Router
- Server components for data fetching and SEO
- Client components (`'use client'`) for interactive features (video player, chat, reactions)
- TypeScript for type safety across the codebase

**Key Design Patterns:**
- **Template System:** Dynamic component loading based on database configuration
  - Registration pages support 4 templates (default, minimal, urgency, custom HTML)
  - Countdown pages use database-backed CountdownPage model
  - Thank you pages use similar template approach
  - Templates receive props (webinar data, schedules, handlers) and render independently
- **State Management:** React hooks (useState, useEffect, useRef) with no external state library
- **Real-time Updates:** Client-side intervals for video timestamp tracking, triggering time-synced events
- **Responsive Design:** Mobile-first approach with Tailwind CSS

**Critical Client Components:**
- Video player with autoplay at calculated timestamps
- Time-synced chat message display
- Reaction animations flying from video area
- Live countdown timers
- Registration modals with form validation

### 2. Backend Architecture

**Framework:** Next.js API Routes (serverless functions)

**Authentication:** NextAuth.js with credentials provider
- Session-based auth with JWT tokens
- User roles implicit through database relationships (host ownership)
- Protected routes via middleware and session checks

**Key API Endpoints:**
- `/api/webinars` - CRUD for webinars
- `/api/webinars/[id]/register` - Registration endpoint (triggers ClickFunnels/Facebook sync)
- `/api/tracking/*` - Session, video, engagement, page visit, offer tracking
- `/api/chat` - Chat message CRUD with approval workflow
- `/api/integrations/clickfunnels/webhook` - Incoming webhook from ClickFunnels
- `/api/embed/[webinarId]` - Generates embeddable registration forms

**Business Logic Patterns:**
- **Simulated Live Experience:** Calculate video playback position based on schedule start time and current time
  - Formula: `elapsedSeconds = (now - scheduledStartTime) / 1000`
  - Video autoplays at this timestamp to simulate live broadcast
- **Time-Sync Engine:** Chat messages and reactions stored with `videoTimestamp` field
  - Client tracks current video position
  - Triggers events when `currentVideoTime >= event.videoTimestamp`
- **Visitor Assignment (A/B Testing):** Cookie-based visitor ID hashing with SHA-256
  - Deterministic assignment ensures consistent experience across visits
  - Per-webinar test groups stored in cookies

### 3. Data Architecture

**ORM:** Prisma with PostgreSQL

**Core Models:**

**Webinar Model:**
- Stores video source (vimeoVideoId), duration, host relationship
- Multiple schedule types via polymorphic scheduling fields
- A/B testing configuration (12 fields for element-level testing)
- Template selections (registrationTemplate, countdownPageId, thankYouTemplateId)
- Custom HTML/CSS/JS for registration pages

**Schedule Types (WebinarSchedule):**
- `specific` - Fixed date/time with timezone
- `recurring` - Daily/weekly/monthly patterns with JSON configuration
- `justInTime` - Starts X minutes after registration

**Registration Model:**
- Links attendees to webinars and specific schedules
- Stores timezone, consent flags (GDPR compliance)
- Tracks `scheduledStartTime` (when this person's session starts)
- A/B test group assignment (`testGroup: "A" | "B"`)
- Relations to tracking tables (sessions, pageVisits, engagements)

**Tracking Models:**
- **Session:** Join/leave timestamps, watch time, device info
- **VideoEvent:** Play, pause, seek, completion events
- **Engagement:** Chat, reactions, questions, poll responses
- **PageVisit:** Funnel tracking (registration → countdown → room → thank-you)
- **ABTestMetric:** Element-level A/B test results

**Message/Reaction Models:**
- **ChatMessage:** Supports both scripted (pre-imported) and real user messages
  - `isScripted`, `isApproved`, `isHidden` flags for moderation
  - `videoTimestamp` for time-synced display
- **Reaction:** Similar structure with emoji type and timestamp

**Design Decision:** Separate models for different event types rather than generic event table
- **Rationale:** Strong typing, easier querying, clearer analytics
- **Trade-off:** More tables but better performance and maintainability

### 4. Scheduling System

**Problem Solved:** Support multiple scheduling paradigms for different use cases

**Architecture:**
- WebinarSchedule model with polymorphic `scheduleType` field
- `scheduledAt` for specific times
- `recurringPattern` (JSON) for recurring rules
- `minutesFromNow` for just-in-time sessions

**Schedule Resolution Logic:**
1. Check registration's `scheduledStartTime` (most reliable - stored at registration)
2. If missing, look up schedule by `scheduleId` parameter
3. For recurring: Calculate next occurrence from pattern
4. For just-in-time: Add minutes to registration timestamp
5. Default to specific `scheduledAt` value

**Timezone Handling:**
- Store schedules in UTC in database
- Display in user's timezone (auto-detected via Intl API)
- Countdown pages and registration forms show localized times

### 5. Template & Customization System

**Design Pattern:** Database-driven templates with variable replacement

**Registration Page Templates:**
- 4 built-in React components (default, minimal, urgency, custom)
- Custom template renders user HTML with XSS protection (DOMPurify)
- Variable replacement engine: `{{webinarTitle}}`, `{{schedules}}`, etc.
- Automatic button detection: All `<button>` and `<a>` elements trigger registration modal

**Countdown Pages:**
- CountdownPage model stores HTML with embedded countdown script
- JavaScript countdown injected via `{{countdown}}` variable
- Auto-redirects to webinar room when timer reaches zero

**Thank You Pages:**
- Similar template system with confirmation messaging
- Calendar integration (Google Calendar, Apple .ics download)

**Choice Rationale:**
- Database storage allows runtime template switching without deployments
- Variable system provides flexibility without coding knowledge
- XSS protection via DOMPurify for custom HTML safety

### 6. A/B Testing Framework

**Architecture:** Visitor-based consistent assignment across multiple elements

**Testable Elements:**
- Registration page templates (A/B template IDs)
- Schedule options (different time slot sets)
- Special offers (A/B offer IDs)
- Video content (A/B video IDs)

**Assignment Logic:**
- Hash visitor UUID + webinar ID → deterministic group (A or B)
- Traffic split percentage controls A/B distribution
- Cookie persistence ensures same experience on return visits
- ABTestMetric tracks conversions per element and variant

**Admin UI:**
- Collapsible configuration panel in webinar form
- Toggle switches for each test type
- Dropdowns for variant selection (fetches from API)
- Real-time validation prevents invalid configurations

**Trade-off:** Visitor-level assignment (not session-level)
- Ensures consistent experience across multiple visits
- Sacrifice: Can't test different variants for same person

### 7. Analytics & Tracking

**Data Collection Strategy:** Comprehensive event tracking at every touchpoint

**Tracking Points:**
- Page visits (registration, countdown, room, thank-you)
- Video events (play, pause, seek, completion)
- User engagement (chat, reactions, questions)
- Session metrics (join time, leave time, watch duration)
- Offer interactions (view, click, conversion)

**Performance Optimization:**
- Bulk analytics API (`/api/webinars/[id]/analytics`) replaces N+1 queries
- Single database query with deep joins for all metrics
- Client-side aggregation for dashboard displays
- **Problem Solved:** Original implementation made separate API calls per webinar (10 webinars = 10 calls)

**GDPR Compliance:**
- IP address and location tracking optional
- Consent flags stored per registration
- Data export capabilities built-in

### 8. Chat Moderation System

**Workflow:**
1. User submits message → Saved with `isApproved=false`, `isHidden=true`
2. Admin reviews in moderation dashboard
3. Approve → Message visible to all future viewers at timestamp
4. Reject → Message stays hidden

**Scripted Messages:**
- CSV import for pre-written chat logs
- `isScripted=true` flag bypasses approval
- Time-synced to video timestamps

**Design Decision:** Approval workflow rather than real-time chat
- **Rationale:** Automated webinars are pre-recorded; chat must feel organic but controlled
- Admin can curate experience without moderation burden during "live" sessions

### 9. AI Chat Assistant (Post-CTA)

**Activation Logic:** AI responds only AFTER first offer timestamp reached
- Prevents AI from answering before sales pitch
- Uses GPT-4o-mini with RAG over uploaded program documents

**Knowledge Base:**
- ProgramDocument model stores content by category (overview, pricing, FAQ, curriculum, testimonials)
- AI queries documents to answer questions accurately
- Never generates information not in knowledge base

**Configuration:**
- Custom system prompts
- Temperature control (creativity vs accuracy)
- Auto-response toggle
- Approval requirement option

## External Dependencies

### Third-Party Services

**ClickFunnels 2.0:**
- **Integration Type:** Bidirectional
- **Incoming:** Webhook receives form submissions → Auto-creates registrations
- **Outgoing:** Registration API sends contact data + applies tags
- **Tags Applied:** Registered, Attended, MostlyAttended, PartlyAttended, Missed, ReplayAttended
- **Custom Fields:** webinar_id, webinar_title, registered_at, scheduled_start_time

**Facebook Conversions API:**
- **Purpose:** Server-side conversion tracking (more reliable than pixel)
- **Events:** CompleteRegistration sent on every registration
- **PII Handling:** Email, phone, name automatically hashed (SHA-256)
- **Attribution:** Captures _fbc, _fbp cookies, IP address, user agent

**Vimeo:**
- **Purpose:** Video hosting and playback
- **Integration:** Embedded player via iframe with custom parameters
- **Controls:** Hidden (no pause/rewind) for simulated live experience
- **Autoplay Strategy:** Start at calculated timestamp with `autoplay=1&start={seconds}#t={seconds}s`

### APIs & SDKs

- **NextAuth.js** - Authentication framework
- **Prisma** - Database ORM with type-safe queries
- **facebook-nodejs-business-sdk** - Server-side Facebook API client
- **isomorphic-dompurify** - XSS protection for custom HTML
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Icon library

### Database

**PostgreSQL** - Primary data store
- Hosted location not specified in codebase (likely external service)
- Connection via Prisma with connection pooling
- Schema migrations via `prisma migrate` or `prisma db push`

### Environment Configuration

**Required Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Session encryption key
- `NEXTAUTH_URL` - Application base URL
- `CLICKFUNNELS_API_KEY`, `CLICKFUNNELS_WORKSPACE_ID` - CF integration
- `CLICKFUNNELS_TAG_*` - Tag IDs for attendance-based tagging
- `FB_PIXEL_ID`, `FB_ACCESS_TOKEN` - Facebook Conversions API

**Optional:**
- `FB_TEST_EVENT_CODE` - For testing Facebook events
- A/B testing tag IDs for ClickFunnels segmentation

### Deployment Considerations

- **Platform:** Next.js compatible (Vercel, Netlify, self-hosted)
- **Serverless Functions:** All API routes designed as serverless endpoints
- **Static Assets:** Templates and pages use Next.js ISR/SSG where applicable
- **CORS:** Enabled for embed code functionality (`Access-Control-Allow-Origin: *`)