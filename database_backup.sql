--
-- PostgreSQL database dump
--

\restrict 7yyBhAaVa91JzW4tNTvY8bSVKlXCCeGjTZx6Jecxk6kaAmmYr4lGLgUS4YRjal6

-- Dumped from database version 15.14 (Homebrew)
-- Dumped by pg_dump version 15.14 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: aribafarheen
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO aribafarheen;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: aribafarheen
--

COMMENT ON SCHEMA public IS '';


--
-- Name: Role; Type: TYPE; Schema: public; Owner: aribafarheen
--

CREATE TYPE public."Role" AS ENUM (
    'ADMIN',
    'HOST',
    'ATTENDEE'
);


ALTER TYPE public."Role" OWNER TO aribafarheen;

--
-- Name: WebinarStatus; Type: TYPE; Schema: public; Owner: aribafarheen
--

CREATE TYPE public."WebinarStatus" AS ENUM (
    'DRAFT',
    'SCHEDULED',
    'LIVE',
    'ENDED',
    'CANCELLED'
);


ALTER TYPE public."WebinarStatus" OWNER TO aribafarheen;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Offer; Type: TABLE; Schema: public; Owner: aribafarheen
--

CREATE TABLE public."Offer" (
    id text NOT NULL,
    "webinarId" text NOT NULL,
    title text NOT NULL,
    description text,
    price double precision NOT NULL,
    "originalPrice" double precision,
    "discountLabel" text,
    "countdownDuration" integer,
    "bulletPoints" text[] DEFAULT ARRAY[]::text[],
    "ctaText" text DEFAULT 'Get This Offer'::text NOT NULL,
    "ctaUrl" text NOT NULL,
    "videoTimestamp" integer NOT NULL,
    "hideAfter" integer,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Offer" OWNER TO aribafarheen;

--
-- Name: ab_test_metrics; Type: TABLE; Schema: public; Owner: aribafarheen
--

CREATE TABLE public.ab_test_metrics (
    id text NOT NULL,
    "webinarId" text NOT NULL,
    "visitorId" text NOT NULL,
    "testGroup" text NOT NULL,
    element text NOT NULL,
    "variantShown" text NOT NULL,
    "pageView" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    converted boolean DEFAULT false NOT NULL,
    "registrationId" text,
    "timeOnPage" integer,
    clicks integer DEFAULT 0 NOT NULL,
    country text,
    referrer text,
    device text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.ab_test_metrics OWNER TO aribafarheen;

--
-- Name: accounts; Type: TABLE; Schema: public; Owner: aribafarheen
--

CREATE TABLE public.accounts (
    id text NOT NULL,
    "userId" text NOT NULL,
    type text NOT NULL,
    provider text NOT NULL,
    "providerAccountId" text NOT NULL,
    refresh_token text,
    access_token text,
    expires_at integer,
    token_type text,
    scope text,
    id_token text,
    session_state text
);


ALTER TABLE public.accounts OWNER TO aribafarheen;

--
-- Name: ai_chat_config; Type: TABLE; Schema: public; Owner: aribafarheen
--

CREATE TABLE public.ai_chat_config (
    id text NOT NULL,
    "webinarId" text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    "activateAfterOffer" boolean DEFAULT true NOT NULL,
    "systemPrompt" text,
    temperature double precision DEFAULT 0.7 NOT NULL,
    "maxTokens" integer DEFAULT 500 NOT NULL,
    "autoRespond" boolean DEFAULT true NOT NULL,
    "requireApproval" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.ai_chat_config OWNER TO aribafarheen;

--
-- Name: analytics; Type: TABLE; Schema: public; Owner: aribafarheen
--

CREATE TABLE public.analytics (
    id text NOT NULL,
    "userId" text,
    "webinarId" text,
    event text NOT NULL,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.analytics OWNER TO aribafarheen;

--
-- Name: attendee_sessions; Type: TABLE; Schema: public; Owner: aribafarheen
--

CREATE TABLE public.attendee_sessions (
    id text NOT NULL,
    "registrationId" text NOT NULL,
    "webinarId" text NOT NULL,
    "scheduleId" text,
    "joinedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "leftAt" timestamp(3) without time zone,
    "lastSeenAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "totalWatchTime" integer DEFAULT 0 NOT NULL,
    "videoPosition" integer DEFAULT 0 NOT NULL,
    "isWatching" boolean DEFAULT true NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    completed boolean DEFAULT false NOT NULL,
    "userAgent" text,
    device text,
    browser text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.attendee_sessions OWNER TO aribafarheen;

--
-- Name: bonus_resources; Type: TABLE; Schema: public; Owner: aribafarheen
--

CREATE TABLE public.bonus_resources (
    id text NOT NULL,
    "webinarId" text NOT NULL,
    title text NOT NULL,
    description text,
    "fileUrl" text NOT NULL,
    "fileType" text NOT NULL,
    "fileSize" integer,
    downloads integer DEFAULT 0 NOT NULL,
    "isPublic" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.bonus_resources OWNER TO aribafarheen;

--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: aribafarheen
--

CREATE TABLE public.chat_messages (
    id text NOT NULL,
    "webinarId" text NOT NULL,
    "userId" text,
    "registrationId" text,
    "userName" text,
    message text NOT NULL,
    "isScripted" boolean DEFAULT false NOT NULL,
    "videoTimestamp" integer,
    "isHidden" boolean DEFAULT false NOT NULL,
    "isApproved" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.chat_messages OWNER TO aribafarheen;

--
-- Name: comments; Type: TABLE; Schema: public; Owner: aribafarheen
--

CREATE TABLE public.comments (
    id text NOT NULL,
    content text NOT NULL,
    "postId" text NOT NULL,
    "authorId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.comments OWNER TO aribafarheen;

--
-- Name: countdown_pages; Type: TABLE; Schema: public; Owner: aribafarheen
--

CREATE TABLE public.countdown_pages (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "htmlCode" text NOT NULL,
    "showVideo" boolean DEFAULT false NOT NULL,
    "videoUrl" text,
    "videoTitle" text,
    "videoPlaceholder" text DEFAULT 'Watch this important message'::text,
    "showBonus" boolean DEFAULT false NOT NULL,
    "bonusTitle" text,
    "bonusDescription" text,
    "bonusImage" text,
    "bonusValue" text,
    "bonusBadge" text,
    "showReminder" boolean DEFAULT true NOT NULL,
    "showWhatsApp" boolean DEFAULT true NOT NULL,
    "showFacebook" boolean DEFAULT true NOT NULL,
    "showCustomCTA" boolean DEFAULT false NOT NULL,
    "customCTAText" text,
    "customCTAUrl" text,
    "organizationName" text,
    "contactEmail" text,
    "websiteUrl" text,
    "logoUrl" text,
    thumbnail text,
    "primaryColor" text DEFAULT '#4a3b6b'::text,
    "accentColor" text DEFAULT '#d53f8c'::text,
    "isSystem" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.countdown_pages OWNER TO aribafarheen;

--
-- Name: countdown_templates; Type: TABLE; Schema: public; Owner: aribafarheen
--

CREATE TABLE public.countdown_templates (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "htmlCode" text NOT NULL,
    thumbnail text,
    "isSystem" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.countdown_templates OWNER TO aribafarheen;

--
-- Name: engagement_events; Type: TABLE; Schema: public; Owner: aribafarheen
--

CREATE TABLE public.engagement_events (
    id text NOT NULL,
    "sessionId" text NOT NULL,
    "webinarId" text NOT NULL,
    "eventType" text NOT NULL,
    "eventData" text,
    "timestamp" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.engagement_events OWNER TO aribafarheen;

--
-- Name: images; Type: TABLE; Schema: public; Owner: aribafarheen
--

CREATE TABLE public.images (
    id text NOT NULL,
    filename text NOT NULL,
    "originalName" text NOT NULL,
    url text NOT NULL,
    size integer NOT NULL,
    "mimeType" text NOT NULL,
    width integer,
    height integer,
    "uploadedBy" text,
    tags text,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.images OWNER TO aribafarheen;

--
-- Name: offer_analytics; Type: TABLE; Schema: public; Owner: aribafarheen
--

CREATE TABLE public.offer_analytics (
    id text NOT NULL,
    "webinarId" text NOT NULL,
    "registrationId" text NOT NULL,
    "offerTitle" text NOT NULL,
    "offerUrl" text NOT NULL,
    "sawOffer" boolean DEFAULT false NOT NULL,
    "sawOfferAt" timestamp(3) without time zone,
    "clickedOffer" boolean DEFAULT false NOT NULL,
    "clickedOfferAt" timestamp(3) without time zone,
    "videoPosition" integer,
    converted boolean DEFAULT false NOT NULL,
    "convertedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.offer_analytics OWNER TO aribafarheen;

--
-- Name: page_visits; Type: TABLE; Schema: public; Owner: aribafarheen
--

CREATE TABLE public.page_visits (
    id text NOT NULL,
    "sessionId" text,
    "registrationId" text,
    "webinarId" text NOT NULL,
    "visitorId" text NOT NULL,
    "pageType" text NOT NULL,
    "pageId" text,
    "variantGroup" text,
    "enteredAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "leftAt" timestamp(3) without time zone,
    "timeSpent" integer,
    referrer text,
    "utmSource" text,
    "utmMedium" text,
    "utmCampaign" text,
    device text,
    browser text,
    country text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.page_visits OWNER TO aribafarheen;

--
-- Name: posts; Type: TABLE; Schema: public; Owner: aribafarheen
--

CREATE TABLE public.posts (
    id text NOT NULL,
    content text NOT NULL,
    "authorId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.posts OWNER TO aribafarheen;

--
-- Name: program_documents; Type: TABLE; Schema: public; Owner: aribafarheen
--

CREATE TABLE public.program_documents (
    id text NOT NULL,
    "webinarId" text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    category text DEFAULT 'general'::text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.program_documents OWNER TO aribafarheen;

--
-- Name: reactions; Type: TABLE; Schema: public; Owner: aribafarheen
--

CREATE TABLE public.reactions (
    id text NOT NULL,
    "webinarId" text NOT NULL,
    "userId" text,
    "registrationId" text,
    "userName" text,
    type text NOT NULL,
    "isScripted" boolean DEFAULT false NOT NULL,
    "videoTimestamp" integer NOT NULL,
    "isHidden" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.reactions OWNER TO aribafarheen;

--
-- Name: registration_pages; Type: TABLE; Schema: public; Owner: aribafarheen
--

CREATE TABLE public.registration_pages (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "htmlCode" text NOT NULL,
    "collectPhone" boolean DEFAULT false NOT NULL,
    "collectCompany" boolean DEFAULT false NOT NULL,
    "collectCustom1" boolean DEFAULT false NOT NULL,
    "customField1Label" text,
    "collectCustom2" boolean DEFAULT false NOT NULL,
    "customField2Label" text,
    "showHostInfo" boolean DEFAULT true NOT NULL,
    "showBenefits" boolean DEFAULT true NOT NULL,
    "showTestimonials" boolean DEFAULT false NOT NULL,
    "showCountdown" boolean DEFAULT true NOT NULL,
    "showSocialProof" boolean DEFAULT true NOT NULL,
    "showVideo" boolean DEFAULT false NOT NULL,
    "videoUrl" text,
    "videoTitle" text,
    "videoAutoplay" boolean DEFAULT false NOT NULL,
    "testimonial1Text" text,
    "testimonial1Author" text,
    "testimonial1Image" text,
    "testimonial2Text" text,
    "testimonial2Author" text,
    "testimonial2Image" text,
    "testimonial3Text" text,
    "testimonial3Author" text,
    "testimonial3Image" text,
    benefit1 text,
    benefit2 text,
    benefit3 text,
    benefit4 text,
    benefit5 text,
    "logoUrl" text,
    "primaryColor" text DEFAULT '#4f46e5'::text,
    "secondaryColor" text DEFAULT '#8b5cf6'::text,
    "backgroundColor" text DEFAULT '#ffffff'::text,
    "textColor" text DEFAULT '#1f2937'::text,
    "ctaButtonText" text DEFAULT 'Register Now'::text,
    "ctaButtonStyle" text DEFAULT 'solid'::text,
    "showFooter" boolean DEFAULT true NOT NULL,
    "footerText" text,
    "privacyPolicyUrl" text,
    "termsOfServiceUrl" text,
    thumbnail text,
    "metaDescription" text,
    "isSystem" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.registration_pages OWNER TO aribafarheen;

--
-- Name: registrations; Type: TABLE; Schema: public; Owner: aribafarheen
--

CREATE TABLE public.registrations (
    id text NOT NULL,
    "userId" text,
    "webinarId" text NOT NULL,
    "scheduleId" text,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    timezone text,
    country text,
    "gdprConsent" boolean DEFAULT false NOT NULL,
    "privacyConsent" boolean DEFAULT false NOT NULL,
    "marketingConsent" boolean DEFAULT false NOT NULL,
    "registeredAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "scheduledStartTime" timestamp(3) without time zone,
    attended boolean DEFAULT false NOT NULL,
    "joinedAt" timestamp(3) without time zone,
    "firstJoinedAt" timestamp(3) without time zone,
    "leftAt" timestamp(3) without time zone,
    "testGroup" text,
    "referralCode" text,
    "referredBy" text
);


ALTER TABLE public.registrations OWNER TO aribafarheen;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: aribafarheen
--

CREATE TABLE public.sessions (
    id text NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO aribafarheen;

--
-- Name: templates; Type: TABLE; Schema: public; Owner: aribafarheen
--

CREATE TABLE public.templates (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "htmlCode" text NOT NULL,
    thumbnail text,
    "popupStyle" text DEFAULT 'center'::text NOT NULL,
    "popupTheme" text DEFAULT 'purple'::text NOT NULL,
    "isSystem" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.templates OWNER TO aribafarheen;

--
-- Name: thank_you_templates; Type: TABLE; Schema: public; Owner: aribafarheen
--

CREATE TABLE public.thank_you_templates (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "htmlCode" text NOT NULL,
    thumbnail text,
    "isSystem" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.thank_you_templates OWNER TO aribafarheen;

--
-- Name: users; Type: TABLE; Schema: public; Owner: aribafarheen
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    name text,
    password text NOT NULL,
    image text,
    role public."Role" DEFAULT 'ATTENDEE'::public."Role" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.users OWNER TO aribafarheen;

--
-- Name: video_watch_events; Type: TABLE; Schema: public; Owner: aribafarheen
--

CREATE TABLE public.video_watch_events (
    id text NOT NULL,
    "sessionId" text NOT NULL,
    "webinarId" text NOT NULL,
    "timestamp" integer NOT NULL,
    "eventType" text NOT NULL,
    "watchedFrom" integer,
    "watchedTo" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.video_watch_events OWNER TO aribafarheen;

--
-- Name: webinar_faqs; Type: TABLE; Schema: public; Owner: aribafarheen
--

CREATE TABLE public.webinar_faqs (
    id text NOT NULL,
    "webinarId" text NOT NULL,
    question text NOT NULL,
    answer text NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.webinar_faqs OWNER TO aribafarheen;

--
-- Name: webinar_sales; Type: TABLE; Schema: public; Owner: aribafarheen
--

CREATE TABLE public.webinar_sales (
    id text NOT NULL,
    "webinarId" text NOT NULL,
    "registrationId" text,
    email text NOT NULL,
    "orderId" text NOT NULL,
    "orderFormId" text,
    "orderFormName" text,
    "productName" text,
    status text,
    amount double precision,
    currency text DEFAULT 'USD'::text,
    "contactId" text,
    "purchasedAt" timestamp(3) without time zone,
    "rawPayload" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.webinar_sales OWNER TO aribafarheen;

--
-- Name: webinar_schedules; Type: TABLE; Schema: public; Owner: aribafarheen
--

CREATE TABLE public.webinar_schedules (
    id text NOT NULL,
    "webinarId" text NOT NULL,
    "scheduleType" text NOT NULL,
    "scheduledAt" timestamp(3) without time zone,
    timezone text,
    "useUserTimezone" boolean DEFAULT false NOT NULL,
    "minutesFromReg" integer,
    "recurringPattern" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.webinar_schedules OWNER TO aribafarheen;

--
-- Name: webinars; Type: TABLE; Schema: public; Owner: aribafarheen
--

CREATE TABLE public.webinars (
    id text NOT NULL,
    slug text,
    title text NOT NULL,
    description text NOT NULL,
    thumbnail text,
    duration integer NOT NULL,
    "vimeoVideoId" text,
    "videoUrl" text,
    "videoDuration" integer,
    status public."WebinarStatus" DEFAULT 'DRAFT'::public."WebinarStatus" NOT NULL,
    "recordingUrl" text,
    "hostId" text NOT NULL,
    "hasReplay" boolean DEFAULT true NOT NULL,
    "hasOffers" boolean DEFAULT true NOT NULL,
    "hasChat" boolean DEFAULT true NOT NULL,
    "hasReactions" boolean DEFAULT true NOT NULL,
    "showElapsedTime" boolean DEFAULT true NOT NULL,
    "maxSchedulesToShow" integer DEFAULT 3 NOT NULL,
    "registrationPageId" text,
    "thankYouTemplateId" text,
    "countdownTemplateId" text,
    "countdownPageId" text,
    "enableABTesting" boolean DEFAULT false NOT NULL,
    "trafficSplitPercent" integer DEFAULT 50 NOT NULL,
    "testRegistrationPage" boolean DEFAULT false NOT NULL,
    "regPageAId" text,
    "regPageBId" text,
    "testSchedule" boolean DEFAULT false NOT NULL,
    "scheduleAIds" text,
    "scheduleBIds" text,
    "testOffer" boolean DEFAULT false NOT NULL,
    "offerAId" text,
    "offerBId" text,
    "testVideo" boolean DEFAULT false NOT NULL,
    "videoAId" text,
    "videoBId" text,
    "whatsappShareMessage" text,
    "facebookShareMessage" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "internalName" text
);


ALTER TABLE public.webinars OWNER TO aribafarheen;

--
-- Data for Name: Offer; Type: TABLE DATA; Schema: public; Owner: aribafarheen
--

COPY public."Offer" (id, "webinarId", title, description, price, "originalPrice", "discountLabel", "countdownDuration", "bulletPoints", "ctaText", "ctaUrl", "videoTimestamp", "hideAfter", "isActive", "createdAt", "updatedAt") FROM stdin;
cmhwyivfs0001jwwbgbe36367	cmhwvknlm0001jwauzd8qop5g	The Shepherd's Coaching Roadmap 	\N	197	2354	\N	1800	{}	Get This Offer	https://www.unshakeablemuslims.com/roadmap	1	\N	t	2025-11-13 04:56:54.952	2025-11-13 05:15:26.191
\.


--
-- Data for Name: ab_test_metrics; Type: TABLE DATA; Schema: public; Owner: aribafarheen
--

COPY public.ab_test_metrics (id, "webinarId", "visitorId", "testGroup", element, "variantShown", "pageView", converted, "registrationId", "timeOnPage", clicks, country, referrer, device, "createdAt") FROM stdin;
\.


--
-- Data for Name: accounts; Type: TABLE DATA; Schema: public; Owner: aribafarheen
--

COPY public.accounts (id, "userId", type, provider, "providerAccountId", refresh_token, access_token, expires_at, token_type, scope, id_token, session_state) FROM stdin;
\.


--
-- Data for Name: ai_chat_config; Type: TABLE DATA; Schema: public; Owner: aribafarheen
--

COPY public.ai_chat_config (id, "webinarId", enabled, "activateAfterOffer", "systemPrompt", temperature, "maxTokens", "autoRespond", "requireApproval", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: analytics; Type: TABLE DATA; Schema: public; Owner: aribafarheen
--

COPY public.analytics (id, "userId", "webinarId", event, metadata, "createdAt") FROM stdin;
\.


--
-- Data for Name: attendee_sessions; Type: TABLE DATA; Schema: public; Owner: aribafarheen
--

COPY public.attendee_sessions (id, "registrationId", "webinarId", "scheduleId", "joinedAt", "leftAt", "lastSeenAt", "totalWatchTime", "videoPosition", "isWatching", "isActive", completed, "userAgent", device, browser, "createdAt", "updatedAt") FROM stdin;
cmhwzoh1l000ejw60lcw65yjd	cmhwzhxuz0008jw6021mvprjt	cmhwvknlm0001jwauzd8qop5g	\N	2025-11-13 05:29:15.85	\N	2025-11-13 05:29:15.85	0	0	t	t	f	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	desktop	Chrome	2025-11-13 05:29:15.85	2025-11-13 05:29:15.85
cmhwzoh1l000gjw606clabam4	cmhwzhxuz0008jw6021mvprjt	cmhwvknlm0001jwauzd8qop5g	\N	2025-11-13 05:29:15.85	\N	2025-11-13 05:29:15.85	0	0	t	t	f	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	desktop	Chrome	2025-11-13 05:29:15.85	2025-11-13 05:29:15.85
cmhwzzsjy000xjw60b8klflyf	cmhwzd4380005jw6059a8u4en	cmhwvknlm0001jwauzd8qop5g	\N	2025-11-13 05:38:03.982	\N	2025-11-13 05:38:03.982	0	0	t	t	f	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	desktop	Chrome	2025-11-13 05:38:03.982	2025-11-13 05:38:03.982
cmhwzzsjy000vjw60vqqmmg3i	cmhwzd4380005jw6059a8u4en	cmhwvknlm0001jwauzd8qop5g	\N	2025-11-13 05:38:03.982	\N	2025-11-13 05:38:03.982	0	0	t	t	f	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	desktop	Chrome	2025-11-13 05:38:03.982	2025-11-13 05:38:03.982
cmhx12opo000djw0yrl7vvu5o	cmhx0tyyi0005jw0yhn65sdle	cmhwvknlm0001jwauzd8qop5g	\N	2025-11-13 06:08:18.583	\N	2025-11-13 06:08:18.583	0	0	t	t	f	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	desktop	Chrome	2025-11-13 06:08:18.583	2025-11-13 06:08:18.583
cmhx12opo000bjw0yfw888gna	cmhx0tyyi0005jw0yhn65sdle	cmhwvknlm0001jwauzd8qop5g	\N	2025-11-13 06:08:18.583	\N	2025-11-13 06:08:18.583	0	0	t	t	f	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	desktop	Chrome	2025-11-13 06:08:18.583	2025-11-13 06:08:18.583
cmhx19feh000njw0yxl3kj78u	cmhx12xu2000jjw0y7ig6ysre	cmhwvknlm0001jwauzd8qop5g	\N	2025-11-13 06:13:33.112	\N	2025-11-13 06:13:33.112	0	0	t	t	f	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	desktop	Chrome	2025-11-13 06:13:33.112	2025-11-13 06:13:33.112
cmhx19fef000ljw0yj9d9sgih	cmhx12xu2000jjw0y7ig6ysre	cmhwvknlm0001jwauzd8qop5g	\N	2025-11-13 06:13:33.111	\N	2025-11-13 06:13:33.111	0	0	t	t	f	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	desktop	Chrome	2025-11-13 06:13:33.111	2025-11-13 06:13:33.111
cmhx2ztis0008jweiguk1pj9h	cmhx2mnd10002jw16gdve0mi1	cmhwvknlm0001jwauzd8qop5g	\N	2025-11-13 07:02:04.084	\N	2025-11-13 07:02:04.084	0	0	t	t	f	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	desktop	Chrome	2025-11-13 07:02:04.084	2025-11-13 07:02:04.084
cmhx2ztis0007jweikouw7tbh	cmhx2mnd10002jw16gdve0mi1	cmhwvknlm0001jwauzd8qop5g	\N	2025-11-13 07:02:04.084	\N	2025-11-13 07:02:04.084	0	0	t	t	f	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	desktop	Chrome	2025-11-13 07:02:04.084	2025-11-13 07:02:04.084
cmhx4tm7l0008jwwl1od5cv00	cmhx48mme0002jwwl6rf91fum	cmhwvknlm0001jwauzd8qop5g	\N	2025-11-13 07:53:13.906	\N	2025-11-13 07:53:13.906	0	0	t	t	f	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	desktop	Chrome	2025-11-13 07:53:13.906	2025-11-13 07:53:13.906
cmhx4tm7l0006jwwl7btj2nue	cmhx48mme0002jwwl6rf91fum	cmhwvknlm0001jwauzd8qop5g	\N	2025-11-13 07:53:13.905	\N	2025-11-13 07:53:13.905	0	0	t	t	f	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	desktop	Chrome	2025-11-13 07:53:13.905	2025-11-13 07:53:13.905
cmhx62nfg0005jw306xl07hil	cmhx596zb0002jwlk6uwtp2g4	cmhwvknlm0001jwauzd8qop5g	\N	2025-11-13 08:28:14.97	\N	2025-11-13 08:28:14.97	0	0	t	t	f	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	desktop	Chrome	2025-11-13 08:28:14.97	2025-11-13 08:28:14.97
cmhx62ngs0007jw3068jhm7dp	cmhx596zb0002jwlk6uwtp2g4	cmhwvknlm0001jwauzd8qop5g	\N	2025-11-13 08:28:14.97	\N	2025-11-13 08:28:14.97	0	0	t	t	f	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	desktop	Chrome	2025-11-13 08:28:14.97	2025-11-13 08:28:14.97
cmhx79loo000kjw30vuil67rm	cmhx71cv2000ejw30lt9pyejh	cmhwvknlm0001jwauzd8qop5g	\N	2025-11-13 09:01:38.953	\N	2025-11-13 09:01:38.953	0	0	t	t	f	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	desktop	Chrome	2025-11-13 09:01:38.953	2025-11-13 09:01:38.953
cmhx79loo000mjw30xz71llk4	cmhx71cv2000ejw30lt9pyejh	cmhwvknlm0001jwauzd8qop5g	\N	2025-11-13 09:01:38.953	\N	2025-11-13 09:01:38.953	0	0	t	t	f	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	desktop	Chrome	2025-11-13 09:01:38.953	2025-11-13 09:01:38.953
\.


--
-- Data for Name: bonus_resources; Type: TABLE DATA; Schema: public; Owner: aribafarheen
--

COPY public.bonus_resources (id, "webinarId", title, description, "fileUrl", "fileType", "fileSize", downloads, "isPublic", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: aribafarheen
--

COPY public.chat_messages (id, "webinarId", "userId", "registrationId", "userName", message, "isScripted", "videoTimestamp", "isHidden", "isApproved", "createdAt") FROM stdin;
\.


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: aribafarheen
--

COPY public.comments (id, content, "postId", "authorId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: countdown_pages; Type: TABLE DATA; Schema: public; Owner: aribafarheen
--

COPY public.countdown_pages (id, name, description, "htmlCode", "showVideo", "videoUrl", "videoTitle", "videoPlaceholder", "showBonus", "bonusTitle", "bonusDescription", "bonusImage", "bonusValue", "bonusBadge", "showReminder", "showWhatsApp", "showFacebook", "showCustomCTA", "customCTAText", "customCTAUrl", "organizationName", "contactEmail", "websiteUrl", "logoUrl", thumbnail, "primaryColor", "accentColor", "isSystem", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: countdown_templates; Type: TABLE DATA; Schema: public; Owner: aribafarheen
--

COPY public.countdown_templates (id, name, description, "htmlCode", thumbnail, "isSystem", "createdAt", "updatedAt") FROM stdin;
cmhwuzjl5001vjwdkl51m6unu	GREEN		<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>{{webinarTitle}} - Starts Soon</title>\n    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet">\n    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">\n    <style>\n        :root {\n            --primary: #4a3b6b;\n            --secondary: #2c7a7b;\n            --accent: #d53f8c;\n            --gold: #d69e2e;\n            --dark: #1a202c;\n            --light: #f7fafc;\n            --white: #ffffff;\n            --gray: #718096;\n            --greenish: #2d5a5d;\n        }\n        \n        * {\n            margin: 0;\n            padding: 0;\n            box-sizing: border-box;\n        }\n        \n        body {\n            font-family: 'Poppins', sans-serif;\n            line-height: 1.5;\n            color: var(--dark);\n            background: var(--light);\n            min-height: 100vh;\n            overflow-x: hidden;\n        }\n        \n        .container {\n            width: 100%;\n            padding: 0 15px;\n            max-width: 800px;\n            margin: 0 auto;\n        }\n        \n        /* Header with consistent colors */\n        .header {\n            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);\n            color: var(--white);\n            padding: 20px 0;\n            text-align: center;\n            position: relative;\n            overflow: hidden;\n        }\n        \n        .header::before {\n            content: '';\n            position: absolute;\n            top: 0;\n            left: 0;\n            right: 0;\n            bottom: 0;\n            background: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z' fill='%23ffffff' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E");\n            animation: float 20s ease-in-out infinite;\n        }\n        \n        @keyframes float {\n            0%, 100% { transform: translateY(0px); }\n            50% { transform: translateY(-5px); }\n        }\n        \n        .webinar-status {\n            display: inline-flex;\n            align-items: center;\n            gap: 6px;\n            background: var(--accent);\n            color: var(--white);\n            font-weight: 600;\n            padding: 5px 12px;\n            border-radius: 15px;\n            font-size: 0.75rem;\n            margin-bottom: 10px;\n            box-shadow: 0 3px 10px rgba(213, 63, 140, 0.3);\n            animation: pulse 2s infinite;\n        }\n        \n        @keyframes pulse {\n            0% { transform: scale(1); }\n            50% { transform: scale(1.03); }\n            100% { transform: scale(1); }\n        }\n        \n        .title {\n            font-family: 'Playfair Display', serif;\n            font-size: 1.4rem;\n            font-weight: 800;\n            line-height: 1.2;\n            margin-bottom: 8px;\n            text-shadow: 0 2px 5px rgba(0,0,0,0.2);\n        }\n        \n        .subtitle {\n            font-size: 0.85rem;\n            font-weight: 300;\n            margin-bottom: 12px;\n            opacity: 0.95;\n            max-width: 350px;\n            margin-left: auto;\n            margin-right: auto;\n        }\n        \n        /* Countdown with consistent colors */\n        .countdown-section {\n            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);\n            padding: 15px 0;\n            text-align: center;\n            position: relative;\n            box-shadow: 0 3px 10px rgba(0,0,0,0.1);\n        }\n        \n        .countdown-section::before {\n            content: '';\n            position: absolute;\n            top: 0;\n            left: 0;\n            right: 0;\n            bottom: 0;\n            background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");\n        }\n        \n        .countdown-title {\n            font-size: 1.1rem;\n            font-weight: 700;\n            color: var(--white);\n            margin-bottom: 8px;\n            text-shadow: 0 2px 5px rgba(0,0,0,0.2);\n        }\n        \n        .webinar-date {\n            font-size: 0.8rem;\n            color: var(--white);\n            margin-bottom: 12px;\n            background: rgba(255,255,255,0.15);\n            display: inline-block;\n            padding: 5px 12px;\n            border-radius: 15px;\n            backdrop-filter: blur(10px);\n            box-shadow: 0 3px 10px rgba(0,0,0,0.1);\n        }\n        \n        .countdown {\n            display: flex;\n            justify-content: center;\n            gap: 8px;\n            margin-bottom: 5px;\n            flex-wrap: wrap;\n        }\n        \n        .countdown-item {\n            background: var(--white);\n            color: var(--primary);\n            border-radius: 8px;\n            padding: 8px 6px;\n            min-width: 50px;\n            box-shadow: 0 5px 15px rgba(0,0,0,0.15);\n            border: 2px solid var(--gold);\n            transition: all 0.3s ease;\n        }\n        \n        .countdown-item:hover {\n            transform: translateY(-2px) scale(1.05);\n            box-shadow: 0 8px 20px rgba(0,0,0,0.2);\n        }\n        \n        .countdown-value {\n            font-size: 1.3rem;\n            font-weight: 800;\n            line-height: 1;\n            display: block;\n            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);\n            -webkit-background-clip: text;\n            -webkit-text-fill-color: transparent;\n            background-clip: text;\n        }\n        \n        .countdown-label {\n            font-size: 0.6rem;\n            text-transform: uppercase;\n            margin-top: 3px;\n            color: var(--gray);\n            font-weight: 600;\n            letter-spacing: 0.5px;\n        }\n        \n        /* Content Section with consistent colors */\n        .content-section {\n            padding: 20px 0;\n            background: var(--white);\n        }\n        \n        .content-grid {\n            display: grid;\n            grid-template-columns: 1fr;\n            gap: 20px;\n            max-width: 700px;\n            margin: 0 auto;\n        }\n        \n        .video-container {\n            border-radius: 12px;\n            overflow: hidden;\n            box-shadow: 0 8px 20px rgba(0,0,0,0.12);\n            position: relative;\n            background: var(--white);\n        }\n        \n        .video-wrapper {\n            position: relative;\n            width: 100%;\n            height: 0;\n            padding-bottom: 56.25%; /* 16:9 aspect ratio */\n            overflow: hidden;\n        }\n        \n        .video-player {\n            position: absolute;\n            top: 0;\n            left: 0;\n            width: 100%;\n            height: 100%;\n            object-fit: cover;\n        }\n        \n        .video-overlay {\n            position: absolute;\n            top: 0;\n            left: 0;\n            width: 100%;\n            height: 100%;\n            display: flex;\n            flex-direction: column;\n            align-items: center;\n            justify-content: center;\n            color: var(--white);\n            background: rgba(0, 0, 0, 0.3);\n            transition: opacity 0.3s ease;\n            z-index: 1;\n            pointer-events: none;\n        }\n        \n        .video-overlay.hidden {\n            opacity: 0;\n            pointer-events: none;\n        }\n        \n        .video-controls {\n            position: absolute;\n            bottom: 0;\n            left: 0;\n            width: 100%;\n            background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);\n            padding: 15px;\n            display: flex;\n            justify-content: space-between;\n            align-items: center;\n            opacity: 0;\n            transition: opacity 0.3s ease;\n            z-index: 50;\n        }\n        \n        .video-container:hover .video-controls {\n            opacity: 1;\n        }\n        \n        .video-control-btn {\n            background: rgba(255, 255, 255, 0.2);\n            border: none;\n            color: var(--white);\n            width: 36px;\n            height: 36px;\n            border-radius: 50%;\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            cursor: pointer;\n            transition: all 0.3s ease;\n        }\n        \n        .video-control-btn:hover {\n            background: rgba(255, 255, 255, 0.3);\n            transform: scale(1.1);\n        }\n        \n        .video-progress {\n            flex: 1;\n            height: 4px;\n            background: rgba(255, 255, 255, 0.3);\n            border-radius: 2px;\n            margin: 0 15px;\n            position: relative;\n            cursor: pointer;\n        }\n        \n        .video-progress-filled {\n            position: absolute;\n            top: 0;\n            left: 0;\n            height: 100%;\n            background: var(--accent);\n            border-radius: 2px;\n            width: 0%;\n        }\n        \n        .unmute-prompt {\n            position: absolute;\n            top: 50%;\n            left: 50%;\n            transform: translate(-50%, -50%);\n            background: rgba(0, 0, 0, 0.7);\n            color: var(--white);\n            padding: 10px 20px;\n            border-radius: 30px;\n            font-size: 0.9rem;\n            display: flex;\n            align-items: center;\n            gap: 10px;\n            cursor: pointer;\n            transition: all 0.3s ease;\n            z-index: 100;\n            opacity: 1;\n            pointer-events: auto;\n        }\n        \n        .unmute-prompt.hidden {\n            opacity: 0;\n            pointer-events: none;\n        }\n        \n        .unmute-prompt:hover {\n            background: rgba(0, 0, 0, 0.8);\n            transform: translate(-50%, -50%) scale(1.05);\n        }\n        \n        .unmute-prompt i {\n            font-size: 1.2rem;\n        }\n        \n        .video-text {\n            font-size: 0.85rem;\n            font-weight: 500;\n            text-align: center;\n            max-width: 85%;\n            padding: 0 10px;\n            text-shadow: 0 2px 5px rgba(0,0,0,0.2);\n        }\n        \n        /* Greenish background below video */\n        .video-greenish-bg {\n            background: linear-gradient(135deg, var(--greenish) 0%, #3a6b6e 100%);\n            padding: 15px;\n            border-radius: 0 0 12px 12px;\n            position: relative;\n            z-index: -1;\n        }\n        \n        .greenish-content {\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            gap: 15px;\n            color: var(--white);\n        }\n        \n        .greenish-icon {\n            font-size: 1.5rem;\n            color: var(--gold);\n        }\n        \n        .greenish-text {\n            font-size: 0.9rem;\n            font-weight: 500;\n            text-align: center;\n        }\n        \n        .bonus-card {\n            background: var(--light);\n            border-radius: 12px;\n            padding: 20px;\n            box-shadow: 0 8px 20px rgba(0,0,0,0.1);\n            display: flex;\n            align-items: center;\n            gap: 15px;\n            position: relative;\n            border: 2px solid var(--secondary);\n        }\n        \n        .bonus-image-container {\n            position: relative;\n            width: 120px;\n            height: 120px;\n            flex-shrink: 0;\n        }\n        \n        .bonus-image {\n            width: 100%;\n            height: 100%;\n            border-radius: 10px;\n            object-fit: cover;\n            box-shadow: 0 5px 15px rgba(0,0,0,0.15);\n            transition: all 0.3s ease;\n        }\n        \n        .bonus-image:hover {\n            transform: translateY(-3px) rotate(2deg);\n            box-shadow: 0 8px 20px rgba(0,0,0,0.2);\n        }\n        \n        .bonus-badge {\n            position: absolute;\n            top: -8px;\n            right: -8px;\n            background: var(--accent);\n            color: var(--white);\n            padding: 4px 8px;\n            border-radius: 12px;\n            font-weight: 700;\n            font-size: 0.65rem;\n            box-shadow: 0 3px 10px rgba(213, 63, 140, 0.3);\n            transform: rotate(15deg);\n        }\n        \n        .bonus-text {\n            flex: 1;\n        }\n        \n        .bonus-title {\n            font-size: 1rem;\n            font-weight: 700;\n            color: var(--primary);\n            margin-bottom: 8px;\n            display: flex;\n            align-items: center;\n            gap: 6px;\n        }\n        \n        .bonus-description {\n            font-size: 0.8rem;\n            color: var(--dark);\n            line-height: 1.4;\n            margin-bottom: 8px;\n        }\n        \n        .value-tag {\n            display: inline-block;\n            background: var(--gold);\n            color: var(--white);\n            font-weight: 700;\n            padding: 4px 10px;\n            border-radius: 12px;\n            font-size: 0.7rem;\n            box-shadow: 0 3px 10px rgba(214, 158, 46, 0.3);\n        }\n        \n        /* Action Section with consistent colors */\n        .action-section {\n            padding: 20px 0;\n            background: var(--light);\n        }\n        \n        .action-content {\n            text-align: center;\n            max-width: 500px;\n            margin: 0 auto;\n        }\n        \n        .action-title {\n            font-size: 1.2rem;\n            font-weight: 700;\n            color: var(--primary);\n            margin-bottom: 10px;\n        }\n        \n        .action-description {\n            font-size: 0.85rem;\n            color: var(--dark);\n            line-height: 1.4;\n            margin-bottom: 15px;\n            font-style: italic;\n        }\n        \n        .action-buttons {\n            display: flex;\n            justify-content: center;\n            gap: 10px;\n            flex-wrap: wrap;\n            margin-bottom: 15px;\n        }\n        \n        .action-button {\n            display: flex;\n            align-items: center;\n            gap: 6px;\n            font-size: 0.85rem;\n            font-weight: 600;\n            padding: 8px 16px;\n            border-radius: 20px;\n            text-decoration: none;\n            transition: all 0.3s ease;\n            min-width: 120px;\n            justify-content: center;\n            box-shadow: 0 3px 10px rgba(0,0,0,0.1);\n            border: none;\n            cursor: pointer;\n        }\n        \n        .reminder-button {\n            background: var(--accent);\n            color: var(--white);\n        }\n        \n        .reminder-button:hover {\n            transform: translateY(-2px);\n            box-shadow: 0 5px 15px rgba(213, 63, 140, 0.3);\n        }\n        \n        .whatsapp-button {\n            background: var(--secondary);\n            color: var(--white);\n        }\n        \n        .whatsapp-button:hover {\n            transform: translateY(-2px);\n            box-shadow: 0 5px 15px rgba(44, 122, 123, 0.3);\n        }\n        \n        .facebook-button {\n            background: var(--primary);\n            color: var(--white);\n        }\n        \n        .facebook-button:hover {\n            transform: translateY(-2px);\n            box-shadow: 0 5px 15px rgba(74, 59, 107, 0.3);\n        }\n        \n        /* Footer with consistent colors */\n        .footer {\n            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);\n            color: var(--white);\n            padding: 15px 0;\n            text-align: center;\n            position: relative;\n        }\n        \n        .footer::before {\n            content: '';\n            position: absolute;\n            top: 0;\n            left: 0;\n            right: 0;\n            bottom: 0;\n            background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");\n        }\n        \n        .footer-content {\n            position: relative;\n        }\n        \n        .footer-title {\n            font-family: 'Playfair Display', serif;\n            font-size: 1.1rem;\n            font-weight: 700;\n            margin-bottom: 8px;\n        }\n        \n        .footer-description {\n            font-size: 0.8rem;\n            margin-bottom: 10px;\n            max-width: 400px;\n            margin-left: auto;\n            margin-right: auto;\n        }\n        \n        .contact-info {\n            display: flex;\n            justify-content: center;\n            gap: 15px;\n            flex-wrap: wrap;\n            margin-bottom: 8px;\n        }\n        \n        .contact-item {\n            display: flex;\n            align-items: center;\n            gap: 6px;\n            font-size: 0.75rem;\n        }\n        \n        .contact-item i {\n            color: var(--gold);\n        }\n        \n        .copyright {\n            font-size: 0.7rem;\n            opacity: 0.8;\n        }\n        \n        /* Responsive Design */\n        @media (min-width: 768px) {\n            .header {\n                padding: 25px 0;\n            }\n            \n            .title {\n                font-size: 1.6rem;\n            }\n            \n            .subtitle {\n                font-size: 0.9rem;\n            }\n            \n            .countdown-section {\n                padding: 20px 0;\n            }\n            \n            .countdown-title {\n                font-size: 1.2rem;\n            }\n            \n            .webinar-date {\n                font-size: 0.85rem;\n                padding: 6px 15px;\n            }\n            \n            .countdown {\n                gap: 10px;\n            }\n            \n            .countdown-item {\n                min-width: 55px;\n                padding: 10px 8px;\n            }\n            \n            .countdown-value {\n                font-size: 1.5rem;\n            }\n            \n            .countdown-label {\n                font-size: 0.65rem;\n            }\n            \n            .content-section {\n                padding: 25px 0;\n            }\n            \n            .content-grid {\n                grid-template-columns: 1fr 1fr;\n                gap: 25px;\n            }\n            \n            .video-text {\n                font-size: 0.9rem;\n            }\n            \n            .bonus-image-container {\n                width: 140px;\n                height: 140px;\n            }\n            \n            .bonus-title {\n                font-size: 1.1rem;\n            }\n            \n            .bonus-description {\n                font-size: 0.85rem;\n            }\n            \n            .action-section {\n                padding: 25px 0;\n            }\n            \n            .action-title {\n                font-size: 1.3rem;\n            }\n            \n            .action-description {\n                font-size: 0.9rem;\n            }\n            \n            .action-button {\n                font-size: 0.9rem;\n                padding: 10px 20px;\n                min-width: 130px;\n            }\n            \n            .footer {\n                padding: 20px 0;\n            }\n            \n            .footer-title {\n                font-size: 1.2rem;\n            }\n            \n            .footer-description {\n                font-size: 0.85rem;\n            }\n        }\n    </style>\n</head>\n<body>\n    <!-- Header -->\n    <header class="header">\n        <div class="container">\n            <div class="webinar-status">\n                <i class="fas fa-clock"></i> STARTING SOON\n            </div>\n            <h1 class="title">{{webinarTitle}}</h1>\n            <p class="subtitle">{{webinarDescription}}</p>\n        </div>\n    </header>\n    \n    <!-- Countdown Section -->\n    <section class="countdown-section">\n        <div class="container">\n            <h2 class="countdown-title">Webinar Starts In</h2>\n            <div class="webinar-date">\n                <i class="fas fa-calendar-alt"></i> {{webinarDate}} at {{webinarTime}}\n            </div>\n            <div class="countdown">\n                <div class="countdown-item">\n                    <span class="countdown-value" id="days">00</span>\n                    <span class="countdown-label">Days</span>\n                </div>\n                <div class="countdown-item">\n                    <span class="countdown-value" id="hours">00</span>\n                    <span class="countdown-label">Hours</span>\n                </div>\n                <div class="countdown-item">\n                    <span class="countdown-value" id="minutes">00</span>\n                    <span class="countdown-label">Minutes</span>\n                </div>\n                <div class="countdown-item">\n                    <span class="countdown-value" id="seconds">00</span>\n                    <span class="countdown-label">Seconds</span>\n                </div>\n            </div>\n        </div>\n    </section>\n    \n    <!-- Content Section -->\n    <section class="content-section">\n        <div class="container">\n            <div class="content-grid">\n                <div class="video-container">\n                    <div class="video-wrapper">\n                        <video \n                            class="video-player" \n                            id="webinarVideo"\n                            autoplay \n                            loop \n                            muted \n                            playsinline\n                            poster="https://picsum.photos/seed/video-poster/800/450.jpg">\n                            <source src="https://player.vimeo.com/progressive_redirect/playback/1114587642/rendition/720p/file.mp4%20%28720p%29.mp4?loc=external&signature=5597f1cc4f49f5032b6e80bfdcad3bae12479713da0efcff861e2330dbde0eca" type="video/mp4">\n                            Your browser does not support video tag.\n                        </video>\n                        \n                        <div class="unmute-prompt" id="unmutePrompt">\n                            <i class="fas fa-volume-mute"></i>\n                            <span>Click to unmute</span>\n                        </div>\n                        \n                        <div class="video-controls">\n                            <button class="video-control-btn" id="playPauseBtn">\n                                <i class="fas fa-pause"></i>\n                            </button>\n                            <div class="video-progress" id="videoProgress">\n                                <div class="video-progress-filled" id="videoProgressFilled"></div>\n                            </div>\n                            <button class="video-control-btn" id="muteBtn">\n                                <i class="fas fa-volume-mute"></i>\n                            </button>\n                        </div>\n                    </div>\n                    \n                    <!-- Greenish background below video -->\n                    <div class="video-greenish-bg">\n                        <div class="greenish-content">\n                            <i class="fas fa-quote-left greenish-icon"></i>\n                            <p class="greenish-text">"This webinar transformed my perspective and gave me practical tools to improve my life."</p>\n                        </div>\n                    </div>\n                </div>\n                \n                <div class="bonus-card">\n                    <div class="bonus-image-container">\n                        <img src="/uploads/1763011387006-tdqy06asbrg6lj3n66lbkw.png" alt="Bonus Gift" class="bonus-image">\n                        <div class="bonus-badge">FREE</div>\n                    </div>\n                    <div class="bonus-text">\n                        <div class="bonus-title">\n                            <i class="fas fa-gift"></i> Exclusive Bonus Gift\n                        </div>\n                        <p class="bonus-description">\n                            Join us for this transformative webinar and receive an exclusive bonus gift that will enhance your learning experience.\n                        </p>\n                        <span class="value-tag">Yours FREE</span>\n                    </div>\n                </div>\n            </div>\n        </div>\n    </section>\n    \n    <!-- Action Section -->\n    <section class="action-section">\n        <div class="container">\n            <div class="action-content">\n                <h2 class="action-title">Don't Miss This Event</h2>\n                <p class="action-description">\n                    Set a reminder so you don't miss this transformative webinar\n                </p>\n                <div class="action-buttons">\n                    <button class="action-button reminder-button" onclick="setReminder()">\n                        <i class="fas fa-bell"></i> Set Reminder\n                    </button>\n                    <a href="#" class="action-button whatsapp-button" onclick="shareOnWhatsApp(); return false;">\n                        <i class="fab fa-whatsapp"></i> Share\n                    </a>\n                    <a href="#" class="action-button facebook-button" onclick="shareOnFacebook(); return false;">\n                        <i class="fab fa-facebook-f"></i> Share\n                    </a>\n                </div>\n            </div>\n        </div>\n    </section>\n    \n    <!-- Footer -->\n    <footer class="footer">\n        <div class="container">\n            <div class="footer-content">\n                <p class="copyright">\n                    © {{currentYear}}. All rights reserved.\n                </p>\n            </div>\n        </div>\n    </footer>\n    \n    <script>\n        {{countdown}}\n    </script>\n    \n    <script>\n        // Video controls\n        document.addEventListener('DOMContentLoaded', function() {\n            const video = document.getElementById('webinarVideo');\n            const playPauseBtn = document.getElementById('playPauseBtn');\n            const muteBtn = document.getElementById('muteBtn');\n            const unmutePrompt = document.getElementById('unmutePrompt');\n            const videoProgress = document.getElementById('videoProgress');\n            const videoProgressFilled = document.getElementById('videoProgressFilled');\n            \n            // Update play/pause button\n            function updatePlayPauseBtn() {\n                if (video.paused) {\n                    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';\n                } else {\n                    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';\n                }\n            }\n            \n            // Update mute button and unmute prompt\n            function updateMuteBtn() {\n                if (video.muted) {\n                    muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';\n                    unmutePrompt.classList.remove('hidden');\n                } else {\n                    muteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';\n                    unmutePrompt.classList.add('hidden');\n                }\n            }\n            \n            // Update progress bar\n            function updateProgress() {\n                if (video.duration) {\n                    const progress = (video.currentTime / video.duration) * 100;\n                    videoProgressFilled.style.width = progress + '%';\n                }\n            }\n            \n            // Play/pause button click\n            playPauseBtn.addEventListener('click', function() {\n                if (video.paused) {\n                    video.play().catch(function(error) {\n                        console.log("Play error:", error);\n                    });\n                } else {\n                    video.pause();\n                }\n                updatePlayPauseBtn();\n            });\n            \n            // Mute button click\n            muteBtn.addEventListener('click', function() {\n                video.muted = !video.muted;\n                updateMuteBtn();\n            });\n            \n            // Unmute prompt click - Improved version\n            unmutePrompt.addEventListener('click', function(e) {\n                e.preventDefault();\n                e.stopPropagation();\n                console.log('Unmute button clicked!');\n                video.muted = false;\n                updateMuteBtn();\n            }, { capture: true });\n            \n            // Progress bar click\n            videoProgress.addEventListener('click', function(e) {\n                if (video.duration) {\n                    const rect = videoProgress.getBoundingClientRect();\n                    const pos = (e.clientX - rect.left) / rect.width;\n                    video.currentTime = pos * video.duration;\n                }\n            });\n            \n            // Video events\n            video.addEventListener('timeupdate', updateProgress);\n            video.addEventListener('play', updatePlayPauseBtn);\n            video.addEventListener('pause', updatePlayPauseBtn);\n            video.addEventListener('volumechange', updateMuteBtn);\n            video.addEventListener('loadedmetadata', updateProgress);\n            \n            // Initialize\n            updatePlayPauseBtn();\n            updateMuteBtn();\n            \n            // Handle mobile autoplay restrictions\n            video.play().catch(function(error) {\n                console.log("Autoplay prevented:", error);\n                // Show play button if autoplay is prevented\n                playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';\n            });\n        });\n    </script>\n    \n    <script>\n        // Share on WhatsApp function\n        function shareOnWhatsApp() {\n            const shareText = "Assalam aleykum sister,\\n\\nI found this FREE class for moms that I am sure you'll love.\\n\\nIt's about how to help our kids love Islam, without forcing them, even in a world that is pulling them away. It gave me so much hope and a new strategy to follow (something I never heard from anyone else before), so I thought of you.\\n\\nHere's the link to reserve a FREE spot \\n" + "{{referralLink}}";\n            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;\n            window.open(whatsappUrl, '_blank');\n        }\n        // Share on Facebook function\n        function shareOnFacebook() {\n            const shareUrl = "https://www.facebook.com/sharer/sharer.php?u={{referralLink}}";\n            window.open(shareUrl, '_blank', 'width=600,height=400');\n        }\n        \n        // Set reminder function\n        function setReminder() {\n            const webinarTitle = "{{webinarTitle}}";\n            const webinarDescription = "{{webinarDescription}}";\n            \n            // This will be populated by the system with actual webinar date\n            const targetDate = new Date("{{webinarStartDateTime}}");\n            \n            // Format date for calendar\n            const startDate = targetDate.toISOString().replace(/-|:|\\.\\d\\d\\d/g, "");\n            const endDate = new Date(targetDate.getTime() + {{webinarDuration}} * 60000).toISOString().replace(/-|:|\\.\\d\\d\\d/g, "");\n            \n            // Create Google Calendar link\n            const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(webinarTitle)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(webinarDescription)}&location=Online`;\n            \n            // Open in new window\n            window.open(googleCalendarUrl, '_blank');\n        }\n    </script>\n</body>\n</html>	\N	f	2025-11-13 03:17:54.233	2025-11-13 08:57:02.723
\.


--
-- Data for Name: engagement_events; Type: TABLE DATA; Schema: public; Owner: aribafarheen
--

COPY public.engagement_events (id, "sessionId", "webinarId", "eventType", "eventData", "timestamp", "createdAt") FROM stdin;
cmhwzohs7000ijw60lqijymgj	cmhwzoh1l000gjw606clabam4	cmhwvknlm0001jwauzd8qop5g	offer_view	{"offerTitle":"The Shepherd's Coaching Roadmap ","offerId":"cmhwyivfs0001jwwbgbe36367"}	1	2025-11-13 05:29:16.807
cmhx12pc4000fjw0y4km40fwf	cmhx12opo000bjw0yfw888gna	cmhwvknlm0001jwauzd8qop5g	offer_view	{"offerTitle":"The Shepherd's Coaching Roadmap ","offerId":"cmhwyivfs0001jwwbgbe36367"}	1	2025-11-13 06:08:19.396
cmhx19g6f000tjw0yjaifnb5l	cmhx19feh000njw0yxl3kj78u	cmhwvknlm0001jwauzd8qop5g	offer_view	{"offerTitle":"The Shepherd's Coaching Roadmap ","offerId":"cmhwyivfs0001jwwbgbe36367"}	1	2025-11-13 06:13:34.119
cmhx79nab000ojw30gm8zxhy3	cmhx79loo000mjw30xz71llk4	cmhwvknlm0001jwauzd8qop5g	offer_view	{"offerTitle":"The Shepherd's Coaching Roadmap ","offerId":"cmhwyivfs0001jwwbgbe36367"}	1	2025-11-13 09:01:41.028
cmhx7tn3t000vjw3036olws7i	cmhx79loo000kjw30vuil67rm	cmhwvknlm0001jwauzd8qop5g	offer_click	{"offerTitle":"The Shepherd's Coaching Roadmap ","ctaUrl":"https://www.unshakeablemuslims.com/roadmap"}	933	2025-11-13 09:17:13.913
\.


--
-- Data for Name: images; Type: TABLE DATA; Schema: public; Owner: aribafarheen
--

COPY public.images (id, filename, "originalName", url, size, "mimeType", width, height, "uploadedBy", tags, description, "createdAt", "updatedAt") FROM stdin;
jl7yqeqbr5dywsws0eudl2cfvphczxmrufz1niz2p97	1763011387006-tdqy06asbrg6lj3n66lbkw.png	book and me.png	/uploads/1763011387006-tdqy06asbrg6lj3n66lbkw.png	569239	image/png	512	819	cmhwvev380000jw96jkk00geq	\N	\N	2025-11-13 05:23:07.226	2025-11-13 05:23:07.226
\.


--
-- Data for Name: offer_analytics; Type: TABLE DATA; Schema: public; Owner: aribafarheen
--

COPY public.offer_analytics (id, "webinarId", "registrationId", "offerTitle", "offerUrl", "sawOffer", "sawOfferAt", "clickedOffer", "clickedOfferAt", "videoPosition", converted, "convertedAt", "createdAt", "updatedAt") FROM stdin;
cmhwzohsn000jjw60x98ttvmm	cmhwvknlm0001jwauzd8qop5g	cmhwzhxuz0008jw6021mvprjt	The Shepherd's Coaching Roadmap 	https://www.unshakeablemuslims.com/roadmap	t	2025-11-13 05:29:16.827	f	\N	1	f	\N	2025-11-13 05:29:16.823	2025-11-13 05:29:16.828
cmhx12pcc000gjw0yweaud0ur	cmhwvknlm0001jwauzd8qop5g	cmhx0tyyi0005jw0yhn65sdle	The Shepherd's Coaching Roadmap 	https://www.unshakeablemuslims.com/roadmap	t	2025-11-13 06:08:19.405	f	\N	1	f	\N	2025-11-13 06:08:19.404	2025-11-13 06:08:19.406
cmhx19g6f000ujw0ymf7oqx46	cmhwvknlm0001jwauzd8qop5g	cmhx12xu2000jjw0y7ig6ysre	The Shepherd's Coaching Roadmap 	https://www.unshakeablemuslims.com/roadmap	t	2025-11-13 06:13:34.12	f	\N	1	f	\N	2025-11-13 06:13:34.119	2025-11-13 06:13:34.121
cmhx79nah000pjw30rgtg7xmi	cmhwvknlm0001jwauzd8qop5g	cmhx71cv2000ejw30lt9pyejh	The Shepherd's Coaching Roadmap 	https://www.unshakeablemuslims.com/roadmap	t	2025-11-13 09:01:41.037	t	2025-11-13 09:17:13.916	1	f	\N	2025-11-13 09:01:41.034	2025-11-13 09:17:13.917
\.


--
-- Data for Name: page_visits; Type: TABLE DATA; Schema: public; Owner: aribafarheen
--

COPY public.page_visits (id, "sessionId", "registrationId", "webinarId", "visitorId", "pageType", "pageId", "variantGroup", "enteredAt", "leftAt", "timeSpent", referrer, "utmSource", "utmMedium", "utmCampaign", device, browser, country, "createdAt") FROM stdin;
cmhwz7j5y0000jw60zvivjvq9	\N	\N	cmhwvknlm0001jwauzd8qop5g	f567ec74-7474-4f2c-a315-dcda64deeaaf	registration	cmhwuq3mg0000jw0hsr1dzljm	\N	2025-11-13 05:16:05.422	\N	\N	\N	\N	\N	\N	desktop	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	2025-11-13 05:16:05.422
cmhwz8byi0001jw607boghc9l	\N	\N	cmhwvknlm0001jwauzd8qop5g	a07c332d-6e7a-483a-bf07-ce75c120d444	registration	cmhwuq3mg0000jw0hsr1dzljm	\N	2025-11-13 05:16:42.762	\N	\N	\N	\N	\N	\N	desktop	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	2025-11-13 05:16:42.762
cmhwzht7g0006jw60gu4u0t54	\N	\N	cmhwvknlm0001jwauzd8qop5g	f567ec74-7474-4f2c-a315-dcda64deeaaf	registration	cmhwuq3mg0000jw0hsr1dzljm	\N	2025-11-13 05:24:05.02	\N	\N	\N	\N	\N	\N	desktop	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	2025-11-13 05:24:05.02
cmhwzoh1g000cjw60j3wtywi9	\N	cmhwzhxuz0008jw6021mvprjt	cmhwvknlm0001jwauzd8qop5g	f567ec74-7474-4f2c-a315-dcda64deeaaf	webinar	\N	\N	2025-11-13 05:29:15.845	2025-11-13 05:29:15.863	0	http://localhost:3001/countdown/how-to-help-your-child-love-islam-without-force-ev?r=cmhwzhxuz0008jw6021mvprjt&s=cmhwx4xz80000jw2m0eh5ib39	\N	\N	\N	desktop	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	2025-11-13 05:29:15.845
cmhwzp5mq000kjw60egaio5m6	\N	\N	cmhwvknlm0001jwauzd8qop5g	f567ec74-7474-4f2c-a315-dcda64deeaaf	registration	cmhwuq3mg0000jw0hsr1dzljm	\N	2025-11-13 05:29:47.714	\N	\N	\N	\N	\N	\N	desktop	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	2025-11-13 05:29:47.714
cmhwztvld000njw60zlg73i96	\N	\N	cmhwvknlm0001jwauzd8qop5g	f567ec74-7474-4f2c-a315-dcda64deeaaf	registration	cmhwuq3mg0000jw0hsr1dzljm	\N	2025-11-13 05:33:27.986	\N	\N	\N	\N	\N	\N	desktop	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	2025-11-13 05:33:27.986
cmhwzzsje000rjw60bzirjvet	\N	cmhwzd4380005jw6059a8u4en	cmhwvknlm0001jwauzd8qop5g	f567ec74-7474-4f2c-a315-dcda64deeaaf	webinar	\N	\N	2025-11-13 05:38:03.962	\N	\N	http://localhost:3001/countdown/how-to-help-your-child-love-islam-without-force-ev?r=cmhwzd4380005jw6059a8u4en&s=cmhwx4y0u0001jw2mby3l4jhw	\N	\N	\N	desktop	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	2025-11-13 05:38:03.962
cmhwzoh1g000bjw609nqis6wi	\N	cmhwzhxuz0008jw6021mvprjt	cmhwvknlm0001jwauzd8qop5g	f567ec74-7474-4f2c-a315-dcda64deeaaf	webinar	\N	\N	2025-11-13 05:29:15.845	2025-11-13 05:38:03.986	528	http://localhost:3001/countdown/how-to-help-your-child-love-islam-without-force-ev?r=cmhwzhxuz0008jw6021mvprjt&s=cmhwx4xz80000jw2m0eh5ib39	\N	\N	\N	desktop	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	2025-11-13 05:29:15.845
cmhx0f4qw0000jw0ys3ufty5n	\N	\N	cmhwvknlm0001jwauzd8qop5g	f567ec74-7474-4f2c-a315-dcda64deeaaf	registration	cmhwuq3mg0000jw0hsr1dzljm	\N	2025-11-13 05:49:59.61	\N	\N	\N	\N	\N	\N	desktop	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	2025-11-13 05:49:59.61
cmhx0tug40003jw0yr13tq4fx	\N	\N	cmhwvknlm0001jwauzd8qop5g	f567ec74-7474-4f2c-a315-dcda64deeaaf	registration	cmhwuq3mg0000jw0hsr1dzljm	\N	2025-11-13 06:01:26.116	\N	\N	\N	\N	\N	\N	desktop	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	2025-11-13 06:01:26.116
cmhx12opi0007jw0yhz396ihb	\N	cmhx0tyyi0005jw0yhn65sdle	cmhwvknlm0001jwauzd8qop5g	f567ec74-7474-4f2c-a315-dcda64deeaaf	webinar	\N	\N	2025-11-13 06:08:18.582	\N	\N	http://localhost:3001/countdown/how-to-help-your-child-love-islam-without-force-ev?r=cmhx0tyyi0005jw0yhn65sdle&s=cmhwx4xz80000jw2m0eh5ib39	\N	\N	\N	desktop	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	2025-11-13 06:08:18.582
cmhx12opn0009jw0yvtlwqoya	\N	cmhx0tyyi0005jw0yhn65sdle	cmhwvknlm0001jwauzd8qop5g	f567ec74-7474-4f2c-a315-dcda64deeaaf	webinar	\N	\N	2025-11-13 06:08:18.582	\N	\N	http://localhost:3001/countdown/how-to-help-your-child-love-islam-without-force-ev?r=cmhx0tyyi0005jw0yhn65sdle&s=cmhwx4xz80000jw2m0eh5ib39	\N	\N	\N	desktop	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	2025-11-13 06:08:18.582
cmhwzzsjo000tjw60h5avqknq	\N	cmhwzd4380005jw6059a8u4en	cmhwvknlm0001jwauzd8qop5g	f567ec74-7474-4f2c-a315-dcda64deeaaf	webinar	\N	\N	2025-11-13 05:38:03.962	2025-11-13 06:08:18.592	1814	http://localhost:3001/countdown/how-to-help-your-child-love-islam-without-force-ev?r=cmhwzd4380005jw6059a8u4en&s=cmhwx4y0u0001jw2mby3l4jhw	\N	\N	\N	desktop	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	2025-11-13 05:38:03.962
cmhx12qm1000hjw0yukn05mvj	\N	\N	cmhwvknlm0001jwauzd8qop5g	f567ec74-7474-4f2c-a315-dcda64deeaaf	registration	cmhwuq3mg0000jw0hsr1dzljm	\N	2025-11-13 06:08:21.049	\N	\N	\N	\N	\N	\N	desktop	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	2025-11-13 06:08:21.049
cmhx19fhh000rjw0yjt1m3le2	\N	cmhx12xu2000jjw0y7ig6ysre	cmhwvknlm0001jwauzd8qop5g	f567ec74-7474-4f2c-a315-dcda64deeaaf	webinar	\N	\N	2025-11-13 06:13:33.217	\N	\N	http://localhost:3001/countdown/how-to-help-your-child-love-islam-without-force-ev?r=cmhx12xu2000jjw0y7ig6ysre&s=cmhwx4xz80000jw2m0eh5ib39	\N	\N	\N	desktop	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	2025-11-13 06:13:33.217
cmhx19fhc000pjw0yjv7vviyp	\N	cmhx12xu2000jjw0y7ig6ysre	cmhwvknlm0001jwauzd8qop5g	f567ec74-7474-4f2c-a315-dcda64deeaaf	webinar	\N	\N	2025-11-13 06:13:33.216	2025-11-13 06:13:33.224	0	http://localhost:3001/countdown/how-to-help-your-child-love-islam-without-force-ev?r=cmhx12xu2000jjw0y7ig6ysre&s=cmhwx4xz80000jw2m0eh5ib39	\N	\N	\N	desktop	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	2025-11-13 06:13:33.216
cmhx19kd3000vjw0yc9hvpri2	\N	\N	cmhwvknlm0001jwauzd8qop5g	f567ec74-7474-4f2c-a315-dcda64deeaaf	registration	cmhwuq3mg0000jw0hsr1dzljm	\N	2025-11-13 06:13:39.543	\N	\N	\N	\N	\N	\N	desktop	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	2025-11-13 06:13:39.543
cmhx1h0v40000jwaf076i19s0	\N	\N	cmhwvknlm0001jwauzd8qop5g	f567ec74-7474-4f2c-a315-dcda64deeaaf	registration	cmhwuq3mg0000jw0hsr1dzljm	\N	2025-11-13 06:19:27.519	\N	\N	\N	\N	\N	\N	desktop	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	2025-11-13 06:19:27.519
cmhx1qhib0000jw96bm6c0rbg	\N	\N	cmhwvknlm0001jwauzd8qop5g	f567ec74-7474-4f2c-a315-dcda64deeaaf	registration	cmhwuq3mg0000jw0hsr1dzljm	\N	2025-11-13 06:26:48.985	\N	\N	\N	\N	\N	\N	desktop	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	2025-11-13 06:26:48.985
cmhx2mdjq0000jw16sypnj1tj	\N	\N	cmhwvknlm0001jwauzd8qop5g	f567ec74-7474-4f2c-a315-dcda64deeaaf	registration	cmhwuq3mg0000jw0hsr1dzljm	\N	2025-11-13 06:51:36.834	\N	\N	\N	\N	\N	\N	desktop	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	2025-11-13 06:51:36.834
cmhx2zpko0000jweibuqhr0d7	\N	\N	cmhwvknlm0001jwauzd8qop5g	f567ec74-7474-4f2c-a315-dcda64deeaaf	registration	cmhwuq3mg0000jw0hsr1dzljm	\N	2025-11-13 07:01:58.948	\N	\N	\N	\N	\N	\N	desktop	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	2025-11-13 07:01:58.948
cmhx2zten0004jweicgcqx6n2	\N	cmhx2mnd10002jw16gdve0mi1	cmhwvknlm0001jwauzd8qop5g	f567ec74-7474-4f2c-a315-dcda64deeaaf	webinar	\N	\N	2025-11-13 07:02:03.84	\N	\N	http://localhost:3001/countdown/how-to-help-your-child-love-islam-without-force-ev?r=cmhx2mnd10002jw16gdve0mi1&s=cmhwx4xz80000jw2m0eh5ib39	\N	\N	\N	desktop	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	2025-11-13 07:02:03.84
cmhx2ztbz0002jwei0d3v33zw	\N	cmhx2mnd10002jw16gdve0mi1	cmhwvknlm0001jwauzd8qop5g	f567ec74-7474-4f2c-a315-dcda64deeaaf	webinar	\N	\N	2025-11-13 07:02:03.84	2025-11-13 07:02:03.85	0	http://localhost:3001/countdown/how-to-help-your-child-love-islam-without-force-ev?r=cmhx2mnd10002jw16gdve0mi1&s=cmhwx4xz80000jw2m0eh5ib39	\N	\N	\N	desktop	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	2025-11-13 07:02:03.84
cmhx3twz70000jwe8axqhdgfu	\N	\N	cmhwvknlm0001jwauzd8qop5g	bfedd549-c4a8-4365-b96b-f499b92555d5	registration	cmhwuq3mg0000jw0hsr1dzljm	\N	2025-11-13 07:25:28.205	\N	\N	\N	\N	\N	\N	desktop	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	2025-11-13 07:25:28.205
cmhx48hr70000jwwl8dxperda	\N	\N	cmhwvknlm0001jwauzd8qop5g	bfedd549-c4a8-4365-b96b-f499b92555d5	registration	cmhwuq3mg0000jw0hsr1dzljm	\N	2025-11-13 07:36:48.345	\N	\N	\N	\N	\N	\N	desktop	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	2025-11-13 07:36:48.345
cmhx4tm7l0004jwwlajusl4qz	\N	cmhx48mme0002jwwl6rf91fum	cmhwvknlm0001jwauzd8qop5g	bfedd549-c4a8-4365-b96b-f499b92555d5	webinar	\N	\N	2025-11-13 07:53:13.894	2025-11-13 07:53:13.931	0	http://localhost:3000/countdown/how-to-help-your-child-love-islam-without-force-ev?r=cmhx48mme0002jwwl6rf91fum&s=cmhwx4xz80000jw2m0eh5ib39	\N	\N	\N	desktop	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	2025-11-13 07:53:13.894
cmhx4w67u000ejwwliy1nraau	\N	cmhx48mme0002jwwl6rf91fum	cmhwvknlm0001jwauzd8qop5g	bfedd549-c4a8-4365-b96b-f499b92555d5	webinar	\N	\N	2025-11-13 07:55:13.146	\N	\N	http://localhost:3000/countdown/how-to-help-your-child-love-islam-without-force-ev?r=cmhx48mme0002jwwl6rf91fum&s=cmhwx4xz80000jw2m0eh5ib39	\N	\N	\N	desktop	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	2025-11-13 07:55:13.146
cmhx4w67u000djwwlraas1oyi	\N	cmhx48mme0002jwwl6rf91fum	cmhwvknlm0001jwauzd8qop5g	bfedd549-c4a8-4365-b96b-f499b92555d5	webinar	\N	\N	2025-11-13 07:55:13.146	\N	\N	http://localhost:3000/countdown/how-to-help-your-child-love-islam-without-force-ev?r=cmhx48mme0002jwwl6rf91fum&s=cmhwx4xz80000jw2m0eh5ib39	\N	\N	\N	desktop	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	2025-11-13 07:55:13.146
cmhx4tm87000ajwwlnqtgoh0v	\N	cmhx48mme0002jwwl6rf91fum	cmhwvknlm0001jwauzd8qop5g	bfedd549-c4a8-4365-b96b-f499b92555d5	webinar	\N	\N	2025-11-13 07:53:13.894	2025-11-13 07:55:13.154	119	http://localhost:3000/countdown/how-to-help-your-child-love-islam-without-force-ev?r=cmhx48mme0002jwwl6rf91fum&s=cmhwx4xz80000jw2m0eh5ib39	\N	\N	\N	desktop	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	2025-11-13 07:53:13.894
cmhx5914t0000jwlkcvj2sumy	\N	\N	cmhwvknlm0001jwauzd8qop5g	f567ec74-7474-4f2c-a315-dcda64deeaaf	registration	cmhwuq3mg0000jw0hsr1dzljm	\N	2025-11-13 08:05:13.086	\N	\N	\N	\N	\N	\N	desktop	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	2025-11-13 08:05:13.086
cmhx5d098000ajwlkhkqo81hc	\N	\N	cmhwvknlm0001jwauzd8qop5g	f567ec74-7474-4f2c-a315-dcda64deeaaf	registration	cmhwuq3mg0000jw0hsr1dzljm	\N	2025-11-13 08:08:18.572	\N	\N	\N	\N	\N	\N	desktop	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	2025-11-13 08:08:18.572
cmhx62nfg0003jw30skmtnq38	\N	cmhx596zb0002jwlk6uwtp2g4	cmhwvknlm0001jwauzd8qop5g	def45768-a481-408e-94dd-1772f8879380	webinar	\N	\N	2025-11-13 08:28:14.97	\N	\N	http://localhost:3002/countdown/how-to-help-your-child-love-islam-without-force-ev?r=cmhx596zb0002jwlk6uwtp2g4	\N	\N	\N	desktop	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	2025-11-13 08:28:14.97
cmhx70tc5000bjw30zxly4arj	\N	cmhx596zb0002jwlk6uwtp2g4	cmhwvknlm0001jwauzd8qop5g	de3ea93a-88ac-4960-bf09-d19d536bc660	webinar	\N	\N	2025-11-13 08:54:48.873	\N	\N	http://localhost:3002/countdown/how-to-help-your-child-love-islam-without-force-ev?r=cmhx596zb0002jwlk6uwtp2g4	\N	\N	\N	desktop	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	2025-11-13 08:54:48.873
cmhx70tc5000ajw30mhwushd0	\N	cmhx596zb0002jwlk6uwtp2g4	cmhwvknlm0001jwauzd8qop5g	de3ea93a-88ac-4960-bf09-d19d536bc660	webinar	\N	\N	2025-11-13 08:54:48.873	\N	\N	http://localhost:3002/countdown/how-to-help-your-child-love-islam-without-force-ev?r=cmhx596zb0002jwlk6uwtp2g4	\N	\N	\N	desktop	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	2025-11-13 08:54:48.873
cmhx62nfg0004jw301uz5p9t6	\N	cmhx596zb0002jwlk6uwtp2g4	cmhwvknlm0001jwauzd8qop5g	de3ea93a-88ac-4960-bf09-d19d536bc660	webinar	\N	\N	2025-11-13 08:28:14.97	2025-11-13 08:54:48.888	1593	http://localhost:3002/countdown/how-to-help-your-child-love-islam-without-force-ev?r=cmhx596zb0002jwlk6uwtp2g4	\N	\N	\N	desktop	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	2025-11-13 08:28:14.97
cmhx716vq000cjw3087f4x19h	\N	\N	cmhwvknlm0001jwauzd8qop5g	de3ea93a-88ac-4960-bf09-d19d536bc660	registration	cmhwuq3mg0000jw0hsr1dzljm	\N	2025-11-13 08:55:06.518	\N	\N	\N	\N	\N	\N	desktop	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	2025-11-13 08:55:06.518
cmhx79lny000gjw30zprug2e1	\N	cmhx71cv2000ejw30lt9pyejh	cmhwvknlm0001jwauzd8qop5g	de3ea93a-88ac-4960-bf09-d19d536bc660	webinar	\N	\N	2025-11-13 09:01:38.926	\N	\N	http://localhost:3002/countdown/how-to-help-your-child-love-islam-without-force-ev?r=cmhx71cv2000ejw30lt9pyejh&s=cmhx5esp0000bjwlk0xbfkuvw	\N	\N	\N	desktop	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	2025-11-13 09:01:38.926
cmhx79lo6000ijw30xbwknico	\N	cmhx71cv2000ejw30lt9pyejh	cmhwvknlm0001jwauzd8qop5g	de3ea93a-88ac-4960-bf09-d19d536bc660	webinar	\N	\N	2025-11-13 09:01:38.926	2025-11-13 09:01:38.953	0	http://localhost:3002/countdown/how-to-help-your-child-love-islam-without-force-ev?r=cmhx71cv2000ejw30lt9pyejh&s=cmhx5esp0000bjwlk0xbfkuvw	\N	\N	\N	desktop	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	2025-11-13 09:01:38.926
cmhx7t5a2000rjw30imoz30yd	\N	cmhx71cv2000ejw30lt9pyejh	cmhwvknlm0001jwauzd8qop5g	de3ea93a-88ac-4960-bf09-d19d536bc660	webinar	\N	\N	2025-11-13 09:16:50.81	\N	\N	http://localhost:3002/countdown/how-to-help-your-child-love-islam-without-force-ev?r=cmhx71cv2000ejw30lt9pyejh&s=cmhx5esp0000bjwlk0xbfkuvw	\N	\N	\N	desktop	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	2025-11-13 09:16:50.81
cmhx7t5al000tjw30yxjmh7gk	\N	cmhx71cv2000ejw30lt9pyejh	cmhwvknlm0001jwauzd8qop5g	de3ea93a-88ac-4960-bf09-d19d536bc660	webinar	\N	\N	2025-11-13 09:16:50.81	2025-11-13 09:16:50.907	0	http://localhost:3002/countdown/how-to-help-your-child-love-islam-without-force-ev?r=cmhx71cv2000ejw30lt9pyejh&s=cmhx5esp0000bjwlk0xbfkuvw	\N	\N	\N	desktop	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	2025-11-13 09:16:50.81
cmhx9k4zo0000jw04yo5zxgf5	\N	\N	cmhwvknlm0001jwauzd8qop5g	bfedd549-c4a8-4365-b96b-f499b92555d5	registration	cmhwuq3mg0000jw0hsr1dzljm	\N	2025-11-13 10:05:49.743	\N	\N	\N	\N	\N	\N	desktop	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	2025-11-13 10:05:49.743
cmhx9kwwt0003jw04n0aiom4h	\N	\N	cmhwvknlm0001jwauzd8qop5g	bfedd549-c4a8-4365-b96b-f499b92555d5	registration	cmhwuq3mg0000jw0hsr1dzljm	\N	2025-11-13 10:06:25.949	\N	\N	\N	\N	\N	\N	desktop	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	\N	2025-11-13 10:06:25.949
\.


--
-- Data for Name: posts; Type: TABLE DATA; Schema: public; Owner: aribafarheen
--

COPY public.posts (id, content, "authorId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: program_documents; Type: TABLE DATA; Schema: public; Owner: aribafarheen
--

COPY public.program_documents (id, "webinarId", title, content, category, "isActive", "sortOrder", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: reactions; Type: TABLE DATA; Schema: public; Owner: aribafarheen
--

COPY public.reactions (id, "webinarId", "userId", "registrationId", "userName", type, "isScripted", "videoTimestamp", "isHidden", "createdAt") FROM stdin;
\.


--
-- Data for Name: registration_pages; Type: TABLE DATA; Schema: public; Owner: aribafarheen
--

COPY public.registration_pages (id, name, description, "htmlCode", "collectPhone", "collectCompany", "collectCustom1", "customField1Label", "collectCustom2", "customField2Label", "showHostInfo", "showBenefits", "showTestimonials", "showCountdown", "showSocialProof", "showVideo", "videoUrl", "videoTitle", "videoAutoplay", "testimonial1Text", "testimonial1Author", "testimonial1Image", "testimonial2Text", "testimonial2Author", "testimonial2Image", "testimonial3Text", "testimonial3Author", "testimonial3Image", benefit1, benefit2, benefit3, benefit4, benefit5, "logoUrl", "primaryColor", "secondaryColor", "backgroundColor", "textColor", "ctaButtonText", "ctaButtonStyle", "showFooter", "footerText", "privacyPolicyUrl", "termsOfServiceUrl", thumbnail, "metaDescription", "isSystem", "createdAt", "updatedAt") FROM stdin;
cmhwuq3mg0000jw0hsr1dzljm	GREEN _ UM	\N	<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Free Class for Mothers | Help Your Child Love Islam</title>\n    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">\n    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">\n    <style>\n        :root {\n            --primary: #4a3b6b; /* Deep professional purple */\n            --secondary: #2c7a7b; /* Professional teal */\n            --accent: #d53f8c; /* Professional magenta */\n            --gold: #d69e2e; /* Gold for official touches */\n            --dark: #1a202c; /* Professional dark */\n            --light: #f7fafc; /* Clean light */\n            --white: #ffffff;\n            --gray: #718096; /* Professional gray */\n        }\n        \n        * {\n            margin: 0;\n            padding: 0;\n            box-sizing: border-box;\n        }\n        \n        body {\n            font-family: 'Poppins', sans-serif;\n            line-height: 1.6;\n            color: var(--dark);\n            background-color: var(--light);\n            padding-bottom: 80px; /* Space for sticky CTA */\n        }\n        \n        .container {\n            width: 100%;\n            max-width: 1200px;\n            margin: 0 auto;\n            padding: 0 20px;\n        }\n        \n        /* Header Section */\n        .header {\n            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);\n            color: var(--white);\n            padding: 40px 0;\n            text-align: center;\n            position: relative;\n            overflow: hidden;\n        }\n        \n        .header::before {\n            content: '';\n            position: absolute;\n            top: 0;\n            left: 0;\n            right: 0;\n            bottom: 0;\n            background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");\n        }\n        \n        .institution-name {\n            font-size: 0.9rem;\n            font-weight: 500;\n            letter-spacing: 2px;\n            text-transform: uppercase;\n            margin-bottom: 10px;\n            opacity: 0.9;\n        }\n        \n        .free-class {\n            font-size: 1rem;\n            font-weight: 600;\n            letter-spacing: 1px;\n            text-transform: uppercase;\n            margin-bottom: 15px;\n            background: var(--accent);\n            display: inline-block;\n            padding: 5px 20px;\n            border-radius: 20px;\n        }\n        \n        .title {\n            font-family: 'Playfair Display', serif;\n            font-size: 2.5rem;\n            font-weight: 700;\n            line-height: 1.2;\n            margin-bottom: 20px;\n            max-width: 900px;\n            margin-left: auto;\n            margin-right: auto;\n        }\n        \n        .subtitle {\n            font-size: 1.2rem;\n            font-weight: 400;\n            margin-bottom: 25px;\n            max-width: 800px;\n            margin-left: auto;\n            margin-right: auto;\n            opacity: 0.95;\n        }\n        \n        .description {\n            font-size: 1.1rem;\n            margin-bottom: 30px;\n            max-width: 700px;\n            margin-left: auto;\n            margin-right: auto;\n            font-style: italic;\n        }\n        \n        /* Trust Indicators */\n        .trust-indicators {\n            display: flex;\n            justify-content: center;\n            gap: 30px;\n            margin-top: 20px;\n            flex-wrap: wrap;\n        }\n        \n        .trust-item {\n            display: flex;\n            align-items: center;\n            gap: 8px;\n            font-size: 0.9rem;\n            background: rgba(255,255,255,0.1);\n            padding: 8px 15px;\n            border-radius: 20px;\n            backdrop-filter: blur(10px);\n        }\n        \n        .trust-item i {\n            color: var(--gold);\n        }\n        \n        /* Bonus Section */\n        .bonus-section {\n            background-color: var(--white);\n            padding: 30px 0;\n            border-bottom: 3px solid var(--secondary);\n            box-shadow: 0 2px 10px rgba(0,0,0,0.05);\n        }\n        \n        .bonus-content {\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            flex-wrap: wrap;\n            gap: 30px;\n        }\n        \n        .bonus-text {\n            flex: 1;\n            min-width: 250px;\n        }\n        \n        .bonus-title {\n            font-size: 1.4rem;\n            font-weight: 700;\n            color: var(--primary);\n            margin-bottom: 15px;\n            display: flex;\n            align-items: center;\n            gap: 10px;\n        }\n        \n        .bonus-description {\n            font-size: 1.1rem;\n            color: var(--dark);\n            line-height: 1.7;\n        }\n        \n        .author-image {\n            flex: 0 0 auto;\n            width: 200px;\n            height: 200px;\n            border-radius: 10px;\n            object-fit: cover;\n            border: 4px solid var(--secondary);\n            box-shadow: 0 10px 30px rgba(0,0,0,0.15);\n        }\n        \n        /* Timer Section */\n        .timer-section {\n            background-color: var(--primary);\n            padding: 30px 0;\n            text-align: center;\n            position: relative;\n        }\n        \n        .timer-section::before {\n            content: '';\n            position: absolute;\n            top: 0;\n            left: 0;\n            right: 0;\n            bottom: 0;\n            background: linear-gradient(45deg, rgba(255,255,255,0.05) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.05) 75%, transparent 75%, transparent);\n            background-size: 20px 20px;\n        }\n        \n        .limited-availability {\n            font-size: 1.3rem;\n            font-weight: 600;\n            color: var(--white);\n            margin-bottom: 20px;\n            text-transform: uppercase;\n            letter-spacing: 2px;\n            position: relative;\n        }\n        \n        .countdown {\n            display: flex;\n            justify-content: center;\n            gap: 20px;\n            margin-bottom: 30px;\n            position: relative;\n        }\n        \n        .countdown-item {\n            background-color: var(--white);\n            color: var(--primary);\n            border-radius: 10px;\n            padding: 15px;\n            min-width: 80px;\n            box-shadow: 0 8px 20px rgba(0,0,0,0.15);\n            border: 2px solid var(--gold);\n        }\n        \n        .countdown-value {\n            font-size: 2rem;\n            font-weight: 700;\n            line-height: 1;\n        }\n        \n        .countdown-label {\n            font-size: 0.8rem;\n            text-transform: uppercase;\n            margin-top: 5px;\n            color: var(--gray);\n        }\n        \n        /* Enhanced CTA Button */\n        .cta-button {\n            display: inline-block;\n            background: linear-gradient(135deg, var(--accent) 0%, #97266d 100%);\n            color: var(--white);\n            font-size: 1.4rem;\n            font-weight: 800;\n            padding: 20px 45px;\n            border-radius: 50px;\n            text-decoration: none;\n            text-transform: uppercase;\n            letter-spacing: 1.5px;\n            box-shadow: 0 10px 30px rgba(213, 63, 140, 0.4);\n            transition: all 0.3s ease;\n            margin: 10px 0;\n            position: relative;\n            overflow: hidden;\n            border: none;\n            cursor: pointer;\n            text-shadow: 0 1px 3px rgba(0,0,0,0.3);\n            border: 2px solid rgba(255,255,255,0.3);\n        }\n        \n        .cta-button::before {\n            content: '';\n            position: absolute;\n            top: 0;\n            left: -100%;\n            width: 100%;\n            height: 100%;\n            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);\n            transition: left 0.5s;\n        }\n        \n        .cta-button:hover::before {\n            left: 100%;\n        }\n        \n        .cta-button:hover {\n            transform: translateY(-5px);\n            box-shadow: 0 15px 40px rgba(213, 63, 140, 0.5);\n            background: linear-gradient(135deg, #e91e63 0%, #ad1457 100%);\n        }\n        \n        .cta-button:active {\n            transform: translateY(-2px);\n        }\n        \n        /* What You Will Learn Section */\n        .learn-section {\n            padding: 50px 0;\n            background-color: var(--white);\n        }\n        \n        .section-title {\n            font-family: 'Playfair Display', serif;\n            font-size: 2.3rem;\n            font-weight: 700;\n            color: var(--primary);\n            text-align: center;\n            margin-bottom: 40px;\n            position: relative;\n        }\n        \n        .section-title::after {\n            content: '';\n            position: absolute;\n            bottom: -15px;\n            left: 50%;\n            transform: translateX(-50%);\n            width: 100px;\n            height: 4px;\n            background: linear-gradient(90deg, var(--primary), var(--secondary));\n            border-radius: 2px;\n        }\n        \n        .learn-item {\n            margin-bottom: 30px;\n            padding: 25px;\n            border-radius: 15px;\n            background-color: var(--light);\n            box-shadow: 0 5px 20px rgba(0,0,0,0.08);\n            transition: all 0.3s ease;\n            border-left: 5px solid var(--secondary);\n        }\n        \n        .learn-item:hover {\n            transform: translateY(-5px);\n            box-shadow: 0 10px 30px rgba(0,0,0,0.12);\n        }\n        \n        .learn-title {\n            font-size: 1.3rem;\n            font-weight: 600;\n            color: var(--primary);\n            margin-bottom: 15px;\n            display: flex;\n            align-items: flex-start;\n            gap: 15px;\n        }\n        \n        .learn-description {\n            font-size: 1.1rem;\n            color: var(--dark);\n            padding-left: 45px;\n            line-height: 1.7;\n        }\n        \n        .learn-arrow {\n            color: var(--secondary);\n            font-weight: 700;\n        }\n        \n        /* Author Section */\n        .author-section {\n            padding: 50px 0;\n            background-color: var(--light);\n            position: relative;\n        }\n        \n        .author-section::before {\n            content: '';\n            position: absolute;\n            top: 0;\n            left: 0;\n            right: 0;\n            height: 3px;\n            background: linear-gradient(90deg, var(--primary), var(--secondary), var(--accent));\n        }\n        \n        .author-container {\n            display: flex;\n            flex-wrap: wrap;\n            gap: 40px;\n            align-items: center;\n        }\n        \n        .author-image-container {\n            flex: 0 0 auto;\n            width: 220px;\n            height: 220px;\n            border-radius: 15px;\n            overflow: hidden;\n            box-shadow: 0 15px 30px rgba(0,0,0,0.15);\n            border: 4px solid var(--white);\n            position: relative;\n        }\n        \n        .author-image-container::after {\n            content: '';\n            position: absolute;\n            bottom: 0;\n            left: 0;\n            right: 0;\n            height: 4px;\n            background: linear-gradient(90deg, var(--primary), var(--secondary));\n        }\n        \n        .author-image-container img {\n            width: 100%;\n            height: 100%;\n            object-fit: cover;\n        }\n        \n        .author-info {\n            flex: 1;\n            min-width: 250px;\n        }\n        \n        .author-name {\n            font-size: 2rem;\n            font-weight: 700;\n            color: var(--primary);\n            margin-bottom: 10px;\n        }\n        \n        .author-title {\n            font-size: 1.3rem;\n            font-weight: 600;\n            color: var(--secondary);\n            margin-bottom: 20px;\n        }\n        \n        .author-bio {\n            font-size: 1.1rem;\n            margin-bottom: 20px;\n            line-height: 1.7;\n        }\n        \n        .author-achievements {\n            font-size: 1.1rem;\n            margin-bottom: 20px;\n            line-height: 1.7;\n        }\n        \n        .author-achievements strong {\n            color: var(--primary);\n        }\n        \n        /* Certifications */\n        .certifications {\n            display: flex;\n            gap: 15px;\n            margin-top: 20px;\n            flex-wrap: wrap;\n        }\n        \n        .cert-badge {\n            background: var(--gold);\n            color: var(--dark);\n            padding: 5px 15px;\n            border-radius: 20px;\n            font-size: 0.85rem;\n            font-weight: 600;\n            display: flex;\n            align-items: center;\n            gap: 5px;\n        }\n        \n        /* Footer CTA */\n        .footer-cta {\n            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);\n            padding: 40px 0;\n            text-align: center;\n            position: relative;\n        }\n        \n        .footer-cta::before {\n            content: '';\n            position: absolute;\n            top: 0;\n            left: 0;\n            right: 0;\n            bottom: 0;\n            background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");\n        }\n        \n        .footer-cta .cta-button {\n            background-color: var(--white);\n            color: var(--primary);\n            position: relative;\n            text-shadow: none;\n            border: 2px solid var(--gold);\n        }\n        \n        .footer-cta .cta-button:hover {\n            background-color: var(--light);\n            transform: translateY(-5px);\n            box-shadow: 0 15px 40px rgba(0,0,0,0.3);\n        }\n        \n        /* Sticky CTA Button */\n        .sticky-cta {\n            position: fixed;\n            bottom: 0;\n            left: 0;\n            right: 0;\n            background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);\n            padding: 15px;\n            text-align: center;\n            box-shadow: 0 -5px 20px rgba(0,0,0,0.15);\n            z-index: 1000;\n            transform: translateY(100%);\n            transition: transform 0.3s ease;\n        }\n        \n        .sticky-cta.show {\n            transform: translateY(0);\n        }\n        \n        .sticky-cta .cta-button {\n            background-color: var(--accent);\n            color: var(--white);\n            font-size: 1.2rem;\n            font-weight: 800;\n            padding: 15px 35px;\n            box-shadow: 0 5px 20px rgba(0,0,0,0.2);\n            text-shadow: 0 1px 3px rgba(0,0,0,0.3);\n            border: 2px solid rgba(255,255,255,0.3);\n        }\n        \n        .sticky-cta .cta-button:hover {\n            background-color: #e91e63;\n            transform: translateY(-3px);\n            box-shadow: 0 8px 25px rgba(0,0,0,0.3);\n        }\n        \n        /* Modal Styles */\n        .modal {\n            display: none;\n            position: fixed;\n            z-index: 10000;\n            left: 0;\n            top: 0;\n            width: 100%;\n            height: 100%;\n            overflow: auto;\n            background-color: rgba(0,0,0,0.7);\n        }\n        \n        .modal-content {\n            background-color: var(--white);\n            margin: 5% auto;\n            padding: 0;\n            border-radius: 10px;\n            width: 90%;\n            max-width: 600px;\n            position: relative;\n            box-shadow: 0 10px 30px rgba(0,0,0,0.3);\n            animation: modalopen 0.4s;\n        }\n        \n        @keyframes modalopen {\n            from {opacity: 0; transform: translateY(-50px);}\n            to {opacity: 1; transform: translateY(0);}\n        }\n        \n        .modal-header {\n            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);\n            color: var(--white);\n            padding: 20px;\n            border-radius: 10px 10px 0 0;\n            display: flex;\n            justify-content: space-between;\n            align-items: center;\n        }\n        \n        .modal-title {\n            font-size: 1.5rem;\n            font-weight: 600;\n        }\n        \n        .close {\n            color: var(--white);\n            font-size: 28px;\n            font-weight: bold;\n            cursor: pointer;\n            transition: 0.3s;\n        }\n        \n        .close:hover {\n            opacity: 0.7;\n        }\n        \n        .modal-body {\n            padding: 20px;\n            max-height: 70vh;\n            overflow-y: auto;\n        }\n        \n        /* Responsive Design */\n        @media (max-width: 768px) {\n            .title {\n                font-size: 2rem;\n            }\n            \n            .subtitle {\n                font-size: 1.1rem;\n            }\n            \n            .countdown {\n                gap: 10px;\n            }\n            \n            .countdown-item {\n                min-width: 70px;\n                padding: 10px;\n            }\n            \n            .countdown-value {\n                font-size: 1.5rem;\n            }\n            \n            .author-image {\n                width: 180px;\n                height: 180px;\n            }\n            \n            /* Always show sticky CTA on mobile */\n            .sticky-cta {\n                transform: translateY(0);\n            }\n            \n            .modal-content {\n                width: 95%;\n                margin: 10% auto;\n            }\n            \n            .cta-button {\n                font-size: 1.2rem;\n                padding: 18px 35px;\n            }\n        }\n        \n        @media (min-width: 769px) {\n            /* Show sticky CTA on desktop when scrolling */\n            .sticky-cta.show {\n                transform: translateY(0);\n            }\n        }\n    </style>\n</head>\n<body>\n    <!-- Header Section -->\n    <header class="header">\n        <div class="container">\n            <div class="institution-name">Emaan Power Educational Institute</div>\n            <div class="free-class">FREE CLASS FOR MOTHERS</div>\n            <h1 class="title">How to Help Your Child Love Islam Without Force - Even When the Whole World is Pulling Them Away</h1>\n            <p class="subtitle">You've taught them. You've reminded them. They pray and listen… but deep down, you feel it — their heart isn't fully in it.</p>\n            <p class="description">There's a deeper role every Muslim mom is meant to grow into — and in this free training, you'll discover it.</p>\n            \n            <div class="trust-indicators">\n                <div class="trust-item">\n                    <i class="fas fa-check-circle"></i>\n                    <span>18+ Years Experience</span>\n                </div>\n                <div class="trust-item">\n                    <i class="fas fa-users"></i>\n                    <span>114,000+ Students</span>\n                </div>\n                <div class="trust-item">\n                    <i class="fas fa-globe"></i>\n                    <span>Global Reach</span>\n                </div>\n            </div>\n        </div>\n    </header>\n    \n    <!-- Bonus Section -->\n    <section class="bonus-section">\n        <div class="container">\n            <div class="bonus-content">\n                <div class="bonus-text">\n                    <div class="bonus-title">\n                        <i class="fas fa-gift"></i> EXCLUSIVE BONUS GIFT\n                    </div>\n                    <p class="bonus-description">Attend this official masterclass and receive for FREE the inspiring storybook for mothers sharing stories of great mothers who raised great men - a $47 value, yours absolutely free!</p>\n                </div>\n                <img src="https://picsum.photos/seed/aribafarheenbook/200/200.jpg" alt="Ustadha Ariba Farheen with book" class="author-image">\n            </div>\n        </div>\n    </section>\n    \n    <!-- Timer Section -->\n    <section class="timer-section">\n        <div class="container">\n            <div class="limited-availability">Limited Spots Available</div>\n            <div class="countdown">\n                <div class="countdown-item">\n                    <div class="countdown-value" id="days">0</div>\n                    <div class="countdown-label">Days</div>\n                </div>\n                <div class="countdown-item">\n                    <div class="countdown-value" id="hours">1</div>\n                    <div class="countdown-label">Hours</div>\n                </div>\n                <div class="countdown-item">\n                    <div class="countdown-value" id="minutes">2</div>\n                    <div class="countdown-label">Minutes</div>\n                </div>\n                <div class="countdown-item">\n                    <div class="countdown-value" id="seconds">58</div>\n                    <div class="countdown-label">Seconds</div>\n                </div>\n            </div>\n            <button class="cta-button" onclick="openModal()">Reserve My Free Seat</button>\n        </div>\n    </section>\n    \n    <!-- What You Will Learn Section -->\n    <section class="learn-section">\n        <div class="container">\n            <h2 class="section-title">What You Will Learn In This Official Masterclass:</h2>\n            \n            <div class="learn-item">\n                <div class="learn-title">\n                    <span class="checkmark">✅</span>\n                    The one thing missing between your child knowing Islam… and loving it enough to hold on when you're not around\n                </div>\n                <p class="learn-description">\n                    <span class="learn-arrow">→</span> You've taught the rituals. They're doing the actions. But you can feel the spark fading — and this is why.\n                </p>\n            </div>\n            \n            <div class="learn-item">\n                <div class="learn-title">\n                    <span class="checkmark">✅</span>\n                    How to reach a place in their heart no class, lecture, or screen-time limit ever could — even if they already feel far\n                </div>\n                <p class="learn-description">\n                    <span class="learn-arrow">→</span> You don't need to beg. You don't need to bribe. You just need to speak to a part of them that's been waiting for you.\n                </p>\n            </div>\n            \n            <div class="learn-item">\n                <div class="learn-title">\n                    <span class="checkmark">✅</span>\n                    How to step into the one role no one taught you — not scholars, not teachers — but it's the role Allah trusted you with\n                </div>\n                <p class="learn-description">\n                    <span class="learn-arrow">→</span> You've been showing up. But no one showed you this role. And that's what makes all the difference.\n                </p>\n            </div>\n            \n            <div style="text-align: center; margin-top: 40px;">\n                <button class="cta-button" onclick="openModal()">Secure My Free Place Now</button>\n            </div>\n        </div>\n    </section>\n    \n    <!-- Author Section -->\n    <section class="author-section">\n        <div class="container">\n            <div class="author-container">\n                <div class="author-image-container">\n                    <img src="https://picsum.photos/seed/aribafarheen/220/220.jpg" alt="Ustadha Ariba Farheen">\n                </div>\n                <div class="author-info">\n                    <h3 class="author-name">Ustadha Ariba Farheen</h3>\n                    <p class="author-title">Founder & Director, Emaan Power</p>\n                    <p class="author-bio">Benefit from the wisdom and experience of Ustadha Ariba Farheen, a dedicated mentor in faith-nurturing education with over 18 years of experience teaching thousands of families worldwide.</p>\n                    <p class="author-bio">As the founder of Emaan Power, I have helped more than 114,000 young Muslims across the globe discover their potential and become confident Muslims who contribute to our society. My mission is to empower our young generations to be proud Muslims who can create a positive impact in the world and lead our Ummah in the future, inshaAllah.</p>\n                    <p class="author-achievements"><strong>Ariba Farheen</strong> is the Creator of certified online courses including My Guide to My Mother's Heart, Names of Allah, Enter My Paradise, Rising Heroes, Science in the Kingdom of Allah, Winner of Hearts, Humble Your Heart, Fly High, and many more.</p>\n                    <p class="author-achievements">She is also the author of bestselling children's books including Discover the Power of Salah, Moments from the Life of RasulAllah, 15 Ways to Develop Khushu, Power Up Your Salah, and the newly released Secrets to Raising Strong and Confident Muslims.</p>\n                    \n                    <div class="certifications">\n                        <div class="cert-badge">\n                            <i class="fas fa-award"></i> Certified Educator\n                        </div>\n                        <div class="cert-badge">\n                            <i class="fas fa-book"></i> Published Author\n                        </div>\n                        <div class="cert-badge">\n                            <i class="fas fa-graduation-cap"></i> Islamic Scholar\n                        </div>\n                    </div>\n                </div>\n            </div>\n        </div>\n    </section>\n    \n    <!-- Footer CTA -->\n    <footer class="footer-cta">\n        <div class="container">\n            <button class="cta-button" onclick="openModal()">Claim My Official Free Seat</button>\n        </div>\n    </footer>\n    \n    <!-- Sticky CTA Button -->\n    <div class="sticky-cta" id="stickyCta">\n        <button class="cta-button" onclick="openModal()">Claim Your FREE Spot Now!</button>\n    </div>\n    \n    <!-- Webinar Registration Modal -->\n    <div id="webinarModal" class="modal">\n        <div class="modal-content">\n            <div class="modal-header">\n                <h3 class="modal-title">Register for Free Class</h3>\n                <span class="close" onclick="closeModal()">&times;</span>\n            </div>\n            <div class="modal-body">\n                <!-- Webinar Registration Form -->\n                <div id="webinar-embed-cmhewnysp000kjwasa35r6j1p"></div>\n            </div>\n        </div>\n    </div>\n    \n    <script>\n        // Countdown Timer\n        function updateCountdown() {\n            // Set the target date (3 days from now for this example)\n            const targetDate = new Date();\n            targetDate.setDate(targetDate.getDate() + 3);\n            \n            const now = new Date();\n            const difference = targetDate - now;\n            \n            // Calculate days, hours, minutes, seconds\n            const days = Math.floor(difference / (1000 * 60 * 60 * 24));\n            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));\n            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));\n            const seconds = Math.floor((difference % (1000 * 60)) / 1000);\n            \n            // Update the DOM\n            document.getElementById('days').textContent = days;\n            document.getElementById('hours').textContent = hours;\n            document.getElementById('minutes').textContent = minutes;\n            document.getElementById('seconds').textContent = seconds;\n        }\n        \n        // Update countdown immediately and then every second\n        updateCountdown();\n        setInterval(updateCountdown, 1000);\n        \n        // Sticky CTA Button Logic\n        const stickyCta = document.getElementById('stickyCta');\n        let lastScrollTop = 0;\n        \n        // Show/hide sticky CTA based on scroll position\n        window.addEventListener('scroll', function() {\n            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;\n            \n            // On desktop, show when scrolled past first section\n            if (window.innerWidth > 768) {\n                if (scrollTop > 500) {\n                    stickyCta.classList.add('show');\n                } else {\n                    stickyCta.classList.remove('show');\n                }\n            }\n            \n            lastScrollTop = scrollTop;\n        });\n        \n        // Modal Functions\n        function openModal() {\n            document.getElementById('webinarModal').style.display = 'block';\n            document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open\n            \n            // Load the webinar embed script only when modal is opened\n            if (!document.getElementById('webinar-script')) {\n                const script = document.createElement('script');\n                script.id = 'webinar-script';\n                script.src = 'http://localhost:3000/api/embed/cmhewnysp000kjwasa35r6j1p?theme=default&type=inline';\n                document.body.appendChild(script);\n            }\n        }\n        \n        function closeModal() {\n            document.getElementById('webinarModal').style.display = 'none';\n            document.body.style.overflow = 'auto'; // Enable scrolling again\n        }\n        \n        // Close modal when clicking outside of it\n        window.onclick = function(event) {\n            const modal = document.getElementById('webinarModal');\n            if (event.target == modal) {\n                closeModal();\n            }\n        }\n        \n        // Close modal with Escape key\n        document.addEventListener('keydown', function(event) {\n            if (event.key === 'Escape') {\n                closeModal();\n            }\n        });\n    </script>\n</body>\n</html>	f	f	f	\N	f	\N	t	t	f	t	t	f	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	#4f46e5	#8b5cf6	#ffffff	#1f2937	Register Now	solid	t	\N	\N	\N	\N	\N	f	2025-11-13 03:10:33.676	2025-11-13 03:10:33.676
cmhx9439p0002jwydpck1vr23	GREEN _ UM (2)	\N	<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Free Class for Mothers | Help Your Child Love Islam</title>\n    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">\n    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">\n    <style>\n        :root {\n            --primary: #4a3b6b; /* Deep professional purple */\n            --secondary: #2c7a7b; /* Professional teal */\n            --accent: #d53f8c; /* Professional magenta */\n            --gold: #d69e2e; /* Gold for official touches */\n            --dark: #1a202c; /* Professional dark */\n            --light: #f7fafc; /* Clean light */\n            --white: #ffffff;\n            --gray: #718096; /* Professional gray */\n        }\n        \n        * {\n            margin: 0;\n            padding: 0;\n            box-sizing: border-box;\n        }\n        \n        body {\n            font-family: 'Poppins', sans-serif;\n            line-height: 1.6;\n            color: var(--dark);\n            background-color: var(--light);\n            padding-bottom: 80px; /* Space for sticky CTA */\n        }\n        \n        .container {\n            width: 100%;\n            max-width: 1200px;\n            margin: 0 auto;\n            padding: 0 20px;\n        }\n        \n        /* Header Section */\n        .header {\n            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);\n            color: var(--white);\n            padding: 40px 0;\n            text-align: center;\n            position: relative;\n            overflow: hidden;\n        }\n        \n        .header::before {\n            content: '';\n            position: absolute;\n            top: 0;\n            left: 0;\n            right: 0;\n            bottom: 0;\n            background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");\n        }\n        \n        .institution-name {\n            font-size: 0.9rem;\n            font-weight: 500;\n            letter-spacing: 2px;\n            text-transform: uppercase;\n            margin-bottom: 10px;\n            opacity: 0.9;\n        }\n        \n        .free-class {\n            font-size: 1rem;\n            font-weight: 600;\n            letter-spacing: 1px;\n            text-transform: uppercase;\n            margin-bottom: 15px;\n            background: var(--accent);\n            display: inline-block;\n            padding: 5px 20px;\n            border-radius: 20px;\n        }\n        \n        .title {\n            font-family: 'Playfair Display', serif;\n            font-size: 2.5rem;\n            font-weight: 700;\n            line-height: 1.2;\n            margin-bottom: 20px;\n            max-width: 900px;\n            margin-left: auto;\n            margin-right: auto;\n        }\n        \n        .subtitle {\n            font-size: 1.2rem;\n            font-weight: 400;\n            margin-bottom: 25px;\n            max-width: 800px;\n            margin-left: auto;\n            margin-right: auto;\n            opacity: 0.95;\n        }\n        \n        .description {\n            font-size: 1.1rem;\n            margin-bottom: 30px;\n            max-width: 700px;\n            margin-left: auto;\n            margin-right: auto;\n            font-style: italic;\n        }\n        \n        /* Trust Indicators */\n        .trust-indicators {\n            display: flex;\n            justify-content: center;\n            gap: 30px;\n            margin-top: 20px;\n            flex-wrap: wrap;\n        }\n        \n        .trust-item {\n            display: flex;\n            align-items: center;\n            gap: 8px;\n            font-size: 0.9rem;\n            background: rgba(255,255,255,0.1);\n            padding: 8px 15px;\n            border-radius: 20px;\n            backdrop-filter: blur(10px);\n        }\n        \n        .trust-item i {\n            color: var(--gold);\n        }\n        \n        /* Bonus Section */\n        .bonus-section {\n            background-color: var(--white);\n            padding: 30px 0;\n            border-bottom: 3px solid var(--secondary);\n            box-shadow: 0 2px 10px rgba(0,0,0,0.05);\n        }\n        \n        .bonus-content {\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            flex-wrap: wrap;\n            gap: 30px;\n        }\n        \n        .bonus-text {\n            flex: 1;\n            min-width: 250px;\n        }\n        \n        .bonus-title {\n            font-size: 1.4rem;\n            font-weight: 700;\n            color: var(--primary);\n            margin-bottom: 15px;\n            display: flex;\n            align-items: center;\n            gap: 10px;\n        }\n        \n        .bonus-description {\n            font-size: 1.1rem;\n            color: var(--dark);\n            line-height: 1.7;\n        }\n        \n        .author-image {\n            flex: 0 0 auto;\n            width: 200px;\n            height: 200px;\n            border-radius: 10px;\n            object-fit: cover;\n            border: 4px solid var(--secondary);\n            box-shadow: 0 10px 30px rgba(0,0,0,0.15);\n        }\n        \n        /* Timer Section */\n        .timer-section {\n            background-color: var(--primary);\n            padding: 30px 0;\n            text-align: center;\n            position: relative;\n        }\n        \n        .timer-section::before {\n            content: '';\n            position: absolute;\n            top: 0;\n            left: 0;\n            right: 0;\n            bottom: 0;\n            background: linear-gradient(45deg, rgba(255,255,255,0.05) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.05) 75%, transparent 75%, transparent);\n            background-size: 20px 20px;\n        }\n        \n        .limited-availability {\n            font-size: 1.3rem;\n            font-weight: 600;\n            color: var(--white);\n            margin-bottom: 20px;\n            text-transform: uppercase;\n            letter-spacing: 2px;\n            position: relative;\n        }\n        \n        .countdown {\n            display: flex;\n            justify-content: center;\n            gap: 20px;\n            margin-bottom: 30px;\n            position: relative;\n        }\n        \n        .countdown-item {\n            background-color: var(--white);\n            color: var(--primary);\n            border-radius: 10px;\n            padding: 15px;\n            min-width: 80px;\n            box-shadow: 0 8px 20px rgba(0,0,0,0.15);\n            border: 2px solid var(--gold);\n        }\n        \n        .countdown-value {\n            font-size: 2rem;\n            font-weight: 700;\n            line-height: 1;\n        }\n        \n        .countdown-label {\n            font-size: 0.8rem;\n            text-transform: uppercase;\n            margin-top: 5px;\n            color: var(--gray);\n        }\n        \n        /* Enhanced CTA Button */\n        .cta-button {\n            display: inline-block;\n            background: linear-gradient(135deg, var(--accent) 0%, #97266d 100%);\n            color: var(--white);\n            font-size: 1.4rem;\n            font-weight: 800;\n            padding: 20px 45px;\n            border-radius: 50px;\n            text-decoration: none;\n            text-transform: uppercase;\n            letter-spacing: 1.5px;\n            box-shadow: 0 10px 30px rgba(213, 63, 140, 0.4);\n            transition: all 0.3s ease;\n            margin: 10px 0;\n            position: relative;\n            overflow: hidden;\n            border: none;\n            cursor: pointer;\n            text-shadow: 0 1px 3px rgba(0,0,0,0.3);\n            border: 2px solid rgba(255,255,255,0.3);\n        }\n        \n        .cta-button::before {\n            content: '';\n            position: absolute;\n            top: 0;\n            left: -100%;\n            width: 100%;\n            height: 100%;\n            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);\n            transition: left 0.5s;\n        }\n        \n        .cta-button:hover::before {\n            left: 100%;\n        }\n        \n        .cta-button:hover {\n            transform: translateY(-5px);\n            box-shadow: 0 15px 40px rgba(213, 63, 140, 0.5);\n            background: linear-gradient(135deg, #e91e63 0%, #ad1457 100%);\n        }\n        \n        .cta-button:active {\n            transform: translateY(-2px);\n        }\n        \n        /* What You Will Learn Section */\n        .learn-section {\n            padding: 50px 0;\n            background-color: var(--white);\n        }\n        \n        .section-title {\n            font-family: 'Playfair Display', serif;\n            font-size: 2.3rem;\n            font-weight: 700;\n            color: var(--primary);\n            text-align: center;\n            margin-bottom: 40px;\n            position: relative;\n        }\n        \n        .section-title::after {\n            content: '';\n            position: absolute;\n            bottom: -15px;\n            left: 50%;\n            transform: translateX(-50%);\n            width: 100px;\n            height: 4px;\n            background: linear-gradient(90deg, var(--primary), var(--secondary));\n            border-radius: 2px;\n        }\n        \n        .learn-item {\n            margin-bottom: 30px;\n            padding: 25px;\n            border-radius: 15px;\n            background-color: var(--light);\n            box-shadow: 0 5px 20px rgba(0,0,0,0.08);\n            transition: all 0.3s ease;\n            border-left: 5px solid var(--secondary);\n        }\n        \n        .learn-item:hover {\n            transform: translateY(-5px);\n            box-shadow: 0 10px 30px rgba(0,0,0,0.12);\n        }\n        \n        .learn-title {\n            font-size: 1.3rem;\n            font-weight: 600;\n            color: var(--primary);\n            margin-bottom: 15px;\n            display: flex;\n            align-items: flex-start;\n            gap: 15px;\n        }\n        \n        .learn-description {\n            font-size: 1.1rem;\n            color: var(--dark);\n            padding-left: 45px;\n            line-height: 1.7;\n        }\n        \n        .learn-arrow {\n            color: var(--secondary);\n            font-weight: 700;\n        }\n        \n        /* Author Section */\n        .author-section {\n            padding: 50px 0;\n            background-color: var(--light);\n            position: relative;\n        }\n        \n        .author-section::before {\n            content: '';\n            position: absolute;\n            top: 0;\n            left: 0;\n            right: 0;\n            height: 3px;\n            background: linear-gradient(90deg, var(--primary), var(--secondary), var(--accent));\n        }\n        \n        .author-container {\n            display: flex;\n            flex-wrap: wrap;\n            gap: 40px;\n            align-items: center;\n        }\n        \n        .author-image-container {\n            flex: 0 0 auto;\n            width: 220px;\n            height: 220px;\n            border-radius: 15px;\n            overflow: hidden;\n            box-shadow: 0 15px 30px rgba(0,0,0,0.15);\n            border: 4px solid var(--white);\n            position: relative;\n        }\n        \n        .author-image-container::after {\n            content: '';\n            position: absolute;\n            bottom: 0;\n            left: 0;\n            right: 0;\n            height: 4px;\n            background: linear-gradient(90deg, var(--primary), var(--secondary));\n        }\n        \n        .author-image-container img {\n            width: 100%;\n            height: 100%;\n            object-fit: cover;\n        }\n        \n        .author-info {\n            flex: 1;\n            min-width: 250px;\n        }\n        \n        .author-name {\n            font-size: 2rem;\n            font-weight: 700;\n            color: var(--primary);\n            margin-bottom: 10px;\n        }\n        \n        .author-title {\n            font-size: 1.3rem;\n            font-weight: 600;\n            color: var(--secondary);\n            margin-bottom: 20px;\n        }\n        \n        .author-bio {\n            font-size: 1.1rem;\n            margin-bottom: 20px;\n            line-height: 1.7;\n        }\n        \n        .author-achievements {\n            font-size: 1.1rem;\n            margin-bottom: 20px;\n            line-height: 1.7;\n        }\n        \n        .author-achievements strong {\n            color: var(--primary);\n        }\n        \n        /* Certifications */\n        .certifications {\n            display: flex;\n            gap: 15px;\n            margin-top: 20px;\n            flex-wrap: wrap;\n        }\n        \n        .cert-badge {\n            background: var(--gold);\n            color: var(--dark);\n            padding: 5px 15px;\n            border-radius: 20px;\n            font-size: 0.85rem;\n            font-weight: 600;\n            display: flex;\n            align-items: center;\n            gap: 5px;\n        }\n        \n        /* Footer CTA */\n        .footer-cta {\n            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);\n            padding: 40px 0;\n            text-align: center;\n            position: relative;\n        }\n        \n        .footer-cta::before {\n            content: '';\n            position: absolute;\n            top: 0;\n            left: 0;\n            right: 0;\n            bottom: 0;\n            background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");\n        }\n        \n        .footer-cta .cta-button {\n            background-color: var(--white);\n            color: var(--primary);\n            position: relative;\n            text-shadow: none;\n            border: 2px solid var(--gold);\n        }\n        \n        .footer-cta .cta-button:hover {\n            background-color: var(--light);\n            transform: translateY(-5px);\n            box-shadow: 0 15px 40px rgba(0,0,0,0.3);\n        }\n        \n        /* Sticky CTA Button */\n        .sticky-cta {\n            position: fixed;\n            bottom: 0;\n            left: 0;\n            right: 0;\n            background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);\n            padding: 15px;\n            text-align: center;\n            box-shadow: 0 -5px 20px rgba(0,0,0,0.15);\n            z-index: 1000;\n            transform: translateY(100%);\n            transition: transform 0.3s ease;\n        }\n        \n        .sticky-cta.show {\n            transform: translateY(0);\n        }\n        \n        .sticky-cta .cta-button {\n            background-color: var(--accent);\n            color: var(--white);\n            font-size: 1.2rem;\n            font-weight: 800;\n            padding: 15px 35px;\n            box-shadow: 0 5px 20px rgba(0,0,0,0.2);\n            text-shadow: 0 1px 3px rgba(0,0,0,0.3);\n            border: 2px solid rgba(255,255,255,0.3);\n        }\n        \n        .sticky-cta .cta-button:hover {\n            background-color: #e91e63;\n            transform: translateY(-3px);\n            box-shadow: 0 8px 25px rgba(0,0,0,0.3);\n        }\n        \n        /* Modal Styles */\n        .modal {\n            display: none;\n            position: fixed;\n            z-index: 10000;\n            left: 0;\n            top: 0;\n            width: 100%;\n            height: 100%;\n            overflow: auto;\n            background-color: rgba(0,0,0,0.7);\n        }\n        \n        .modal-content {\n            background-color: var(--white);\n            margin: 5% auto;\n            padding: 0;\n            border-radius: 10px;\n            width: 90%;\n            max-width: 600px;\n            position: relative;\n            box-shadow: 0 10px 30px rgba(0,0,0,0.3);\n            animation: modalopen 0.4s;\n        }\n        \n        @keyframes modalopen {\n            from {opacity: 0; transform: translateY(-50px);}\n            to {opacity: 1; transform: translateY(0);}\n        }\n        \n        .modal-header {\n            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);\n            color: var(--white);\n            padding: 20px;\n            border-radius: 10px 10px 0 0;\n            display: flex;\n            justify-content: space-between;\n            align-items: center;\n        }\n        \n        .modal-title {\n            font-size: 1.5rem;\n            font-weight: 600;\n        }\n        \n        .close {\n            color: var(--white);\n            font-size: 28px;\n            font-weight: bold;\n            cursor: pointer;\n            transition: 0.3s;\n        }\n        \n        .close:hover {\n            opacity: 0.7;\n        }\n        \n        .modal-body {\n            padding: 20px;\n            max-height: 70vh;\n            overflow-y: auto;\n        }\n        \n        /* Responsive Design */\n        @media (max-width: 768px) {\n            .title {\n                font-size: 2rem;\n            }\n            \n            .subtitle {\n                font-size: 1.1rem;\n            }\n            \n            .countdown {\n                gap: 10px;\n            }\n            \n            .countdown-item {\n                min-width: 70px;\n                padding: 10px;\n            }\n            \n            .countdown-value {\n                font-size: 1.5rem;\n            }\n            \n            .author-image {\n                width: 180px;\n                height: 180px;\n            }\n            \n            /* Always show sticky CTA on mobile */\n            .sticky-cta {\n                transform: translateY(0);\n            }\n            \n            .modal-content {\n                width: 95%;\n                margin: 10% auto;\n            }\n            \n            .cta-button {\n                font-size: 1.2rem;\n                padding: 18px 35px;\n            }\n        }\n        \n        @media (min-width: 769px) {\n            /* Show sticky CTA on desktop when scrolling */\n            .sticky-cta.show {\n                transform: translateY(0);\n            }\n        }\n    </style>\n</head>\n<body>\n    <!-- Header Section -->\n    <header class="header">\n        <div class="container">\n            <div class="institution-name">Emaan Power Educational Institute</div>\n            <div class="free-class">FREE CLASS FOR MOTHERS</div>\n            <h1 class="title">How to Help Your Child Love Islam Without Force - Even When the Whole World is Pulling Them Away</h1>\n            <p class="subtitle">You've taught them. You've reminded them. They pray and listen… but deep down, you feel it — their heart isn't fully in it.</p>\n            <p class="description">There's a deeper role every Muslim mom is meant to grow into — and in this free training, you'll discover it.</p>\n            \n            <div class="trust-indicators">\n                <div class="trust-item">\n                    <i class="fas fa-check-circle"></i>\n                    <span>18+ Years Experience</span>\n                </div>\n                <div class="trust-item">\n                    <i class="fas fa-users"></i>\n                    <span>114,000+ Students</span>\n                </div>\n                <div class="trust-item">\n                    <i class="fas fa-globe"></i>\n                    <span>Global Reach</span>\n                </div>\n            </div>\n        </div>\n    </header>\n    \n    <!-- Bonus Section -->\n    <section class="bonus-section">\n        <div class="container">\n            <div class="bonus-content">\n                <div class="bonus-text">\n                    <div class="bonus-title">\n                        <i class="fas fa-gift"></i> EXCLUSIVE BONUS GIFT\n                    </div>\n                    <p class="bonus-description">Attend this official masterclass and receive for FREE the inspiring storybook for mothers sharing stories of great mothers who raised great men - a $47 value, yours absolutely free!</p>\n                </div>\n                <img src="https://picsum.photos/seed/aribafarheenbook/200/200.jpg" alt="Ustadha Ariba Farheen with book" class="author-image">\n            </div>\n        </div>\n    </section>\n    \n    <!-- Timer Section -->\n    <section class="timer-section">\n        <div class="container">\n            <div class="limited-availability">Limited Spots Available</div>\n            <div class="countdown">\n                <div class="countdown-item">\n                    <div class="countdown-value" id="days">0</div>\n                    <div class="countdown-label">Days</div>\n                </div>\n                <div class="countdown-item">\n                    <div class="countdown-value" id="hours">1</div>\n                    <div class="countdown-label">Hours</div>\n                </div>\n                <div class="countdown-item">\n                    <div class="countdown-value" id="minutes">2</div>\n                    <div class="countdown-label">Minutes</div>\n                </div>\n                <div class="countdown-item">\n                    <div class="countdown-value" id="seconds">58</div>\n                    <div class="countdown-label">Seconds</div>\n                </div>\n            </div>\n            <button class="cta-button" onclick="openModal()">Reserve My Free Seat</button>\n        </div>\n    </section>\n    \n    <!-- What You Will Learn Section -->\n    <section class="learn-section">\n        <div class="container">\n            <h2 class="section-title">What You Will Learn In This Official Masterclass:</h2>\n            \n            <div class="learn-item">\n                <div class="learn-title">\n                    <span class="checkmark">✅</span>\n                    The one thing missing between your child knowing Islam… and loving it enough to hold on when you're not around\n                </div>\n                <p class="learn-description">\n                    <span class="learn-arrow">→</span> You've taught the rituals. They're doing the actions. But you can feel the spark fading — and this is why.\n                </p>\n            </div>\n            \n            <div class="learn-item">\n                <div class="learn-title">\n                    <span class="checkmark">✅</span>\n                    How to reach a place in their heart no class, lecture, or screen-time limit ever could — even if they already feel far\n                </div>\n                <p class="learn-description">\n                    <span class="learn-arrow">→</span> You don't need to beg. You don't need to bribe. You just need to speak to a part of them that's been waiting for you.\n                </p>\n            </div>\n            \n            <div class="learn-item">\n                <div class="learn-title">\n                    <span class="checkmark">✅</span>\n                    How to step into the one role no one taught you — not scholars, not teachers — but it's the role Allah trusted you with\n                </div>\n                <p class="learn-description">\n                    <span class="learn-arrow">→</span> You've been showing up. But no one showed you this role. And that's what makes all the difference.\n                </p>\n            </div>\n            \n            <div style="text-align: center; margin-top: 40px;">\n                <button class="cta-button" onclick="openModal()">Secure My Free Place Now</button>\n            </div>\n        </div>\n    </section>\n    \n    <!-- Author Section -->\n    <section class="author-section">\n        <div class="container">\n            <div class="author-container">\n                <div class="author-image-container">\n                    <img src="https://picsum.photos/seed/aribafarheen/220/220.jpg" alt="Ustadha Ariba Farheen">\n                </div>\n                <div class="author-info">\n                    <h3 class="author-name">Ustadha Ariba Farheen</h3>\n                    <p class="author-title">Founder & Director, Emaan Power</p>\n                    <p class="author-bio">Benefit from the wisdom and experience of Ustadha Ariba Farheen, a dedicated mentor in faith-nurturing education with over 18 years of experience teaching thousands of families worldwide.</p>\n                    <p class="author-bio">As the founder of Emaan Power, I have helped more than 114,000 young Muslims across the globe discover their potential and become confident Muslims who contribute to our society. My mission is to empower our young generations to be proud Muslims who can create a positive impact in the world and lead our Ummah in the future, inshaAllah.</p>\n                    <p class="author-achievements"><strong>Ariba Farheen</strong> is the Creator of certified online courses including My Guide to My Mother's Heart, Names of Allah, Enter My Paradise, Rising Heroes, Science in the Kingdom of Allah, Winner of Hearts, Humble Your Heart, Fly High, and many more.</p>\n                    <p class="author-achievements">She is also the author of bestselling children's books including Discover the Power of Salah, Moments from the Life of RasulAllah, 15 Ways to Develop Khushu, Power Up Your Salah, and the newly released Secrets to Raising Strong and Confident Muslims.</p>\n                    \n                    <div class="certifications">\n                        <div class="cert-badge">\n                            <i class="fas fa-award"></i> Certified Educator\n                        </div>\n                        <div class="cert-badge">\n                            <i class="fas fa-book"></i> Published Author\n                        </div>\n                        <div class="cert-badge">\n                            <i class="fas fa-graduation-cap"></i> Islamic Scholar\n                        </div>\n                    </div>\n                </div>\n            </div>\n        </div>\n    </section>\n    \n    <!-- Footer CTA -->\n    <footer class="footer-cta">\n        <div class="container">\n            <button class="cta-button" onclick="openModal()">Claim My Official Free Seat</button>\n        </div>\n    </footer>\n    \n    <!-- Sticky CTA Button -->\n    <div class="sticky-cta" id="stickyCta">\n        <button class="cta-button" onclick="openModal()">Claim Your FREE Spot Now!</button>\n    </div>\n    \n    <!-- Webinar Registration Modal -->\n    <div id="webinarModal" class="modal">\n        <div class="modal-content">\n            <div class="modal-header">\n                <h3 class="modal-title">Register for Free Class</h3>\n                <span class="close" onclick="closeModal()">&times;</span>\n            </div>\n            <div class="modal-body">\n                <!-- Webinar Registration Form -->\n                <div id="webinar-embed-cmhewnysp000kjwasa35r6j1p"></div>\n            </div>\n        </div>\n    </div>\n    \n    <script>\n        // Countdown Timer\n        function updateCountdown() {\n            // Set the target date (3 days from now for this example)\n            const targetDate = new Date();\n            targetDate.setDate(targetDate.getDate() + 3);\n            \n            const now = new Date();\n            const difference = targetDate - now;\n            \n            // Calculate days, hours, minutes, seconds\n            const days = Math.floor(difference / (1000 * 60 * 60 * 24));\n            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));\n            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));\n            const seconds = Math.floor((difference % (1000 * 60)) / 1000);\n            \n            // Update the DOM\n            document.getElementById('days').textContent = days;\n            document.getElementById('hours').textContent = hours;\n            document.getElementById('minutes').textContent = minutes;\n            document.getElementById('seconds').textContent = seconds;\n        }\n        \n        // Update countdown immediately and then every second\n        updateCountdown();\n        setInterval(updateCountdown, 1000);\n        \n        // Sticky CTA Button Logic\n        const stickyCta = document.getElementById('stickyCta');\n        let lastScrollTop = 0;\n        \n        // Show/hide sticky CTA based on scroll position\n        window.addEventListener('scroll', function() {\n            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;\n            \n            // On desktop, show when scrolled past first section\n            if (window.innerWidth > 768) {\n                if (scrollTop > 500) {\n                    stickyCta.classList.add('show');\n                } else {\n                    stickyCta.classList.remove('show');\n                }\n            }\n            \n            lastScrollTop = scrollTop;\n        });\n        \n        // Modal Functions\n        function openModal() {\n            document.getElementById('webinarModal').style.display = 'block';\n            document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open\n            \n            // Load the webinar embed script only when modal is opened\n            if (!document.getElementById('webinar-script')) {\n                const script = document.createElement('script');\n                script.id = 'webinar-script';\n                script.src = 'http://localhost:3000/api/embed/cmhewnysp000kjwasa35r6j1p?theme=default&type=inline';\n                document.body.appendChild(script);\n            }\n        }\n        \n        function closeModal() {\n            document.getElementById('webinarModal').style.display = 'none';\n            document.body.style.overflow = 'auto'; // Enable scrolling again\n        }\n        \n        // Close modal when clicking outside of it\n        window.onclick = function(event) {\n            const modal = document.getElementById('webinarModal');\n            if (event.target == modal) {\n                closeModal();\n            }\n        }\n        \n        // Close modal with Escape key\n        document.addEventListener('keydown', function(event) {\n            if (event.key === 'Escape') {\n                closeModal();\n            }\n        });\n    </script>\n</body>\n</html>	f	f	f	\N	f	\N	t	t	f	t	t	f	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	#4f46e5	#8b5cf6	#ffffff	#1f2937	Register Now	solid	t	\N	\N	\N	\N	\N	f	2025-11-13 09:53:21.037	2025-11-13 09:53:21.037
\.


--
-- Data for Name: registrations; Type: TABLE DATA; Schema: public; Owner: aribafarheen
--

COPY public.registrations (id, "userId", "webinarId", "scheduleId", name, email, phone, timezone, country, "gdprConsent", "privacyConsent", "marketingConsent", "registeredAt", "scheduledStartTime", attended, "joinedAt", "firstJoinedAt", "leftAt", "testGroup", "referralCode", "referredBy") FROM stdin;
cmhwz8img0003jw60ntmjbjew	\N	cmhwvknlm0001jwauzd8qop5g	cmhwx4xz80000jw2m0eh5ib39	Ariba Farheen	seen@gmail.com	+61 423092939	Asia/Calcutta	AU	f	t	f	2025-11-13 05:16:51.385	2025-11-13 05:21:50.212	f	\N	\N	\N	\N	3AN9B8	\N
cmhwzhxuz0008jw6021mvprjt	\N	cmhwvknlm0001jwauzd8qop5g	cmhwx4xz80000jw2m0eh5ib39	Ariba Farheen	sen@gmail.com	+61 423092939	Asia/Calcutta	AU	f	t	f	2025-11-13 05:24:11.036	2025-11-13 05:29:10.549	t	2025-11-13 05:29:15.867	2025-11-13 05:29:15.867	\N	\N	6JV9TP	\N
cmhwzpbl0000mjw60l848tljb	\N	cmhwvknlm0001jwauzd8qop5g	cmhwx4xz80000jw2m0eh5ib39	Ard	dheen@gmail.com	+61 423092939	Asia/Calcutta	AU	f	t	f	2025-11-13 05:29:55.428	2025-11-13 05:34:54.706	f	\N	\N	\N	\N	E2N9T2	\N
cmhwzu0xm000pjw60lycqrwh4	\N	cmhwvknlm0001jwauzd8qop5g	cmhwx4xz80000jw2m0eh5ib39	Aribd	adheen@gmail.com	+91 9310880027	Asia/Calcutta	AU	f	t	f	2025-11-13 05:33:34.886	2025-11-13 05:38:34.626	f	\N	\N	\N	\N	93688G	\N
cmhwzd4380005jw6059a8u4en	\N	cmhwvknlm0001jwauzd8qop5g	cmhwx4y0u0001jw2mby3l4jhw	Ariba Farheen	snpower@gmail.com	+61 497687631	Asia/Calcutta	AU	f	t	f	2025-11-13 05:20:25.828	2025-11-13 05:30:00	t	2025-11-13 05:38:03.995	2025-11-13 05:38:03.995	\N	\N	VRC5W3	\N
cmhx0f9wu0002jw0yi82ffumn	\N	cmhwvknlm0001jwauzd8qop5g	cmhwx4xz80000jw2m0eh5ib39	Ariba Farheen	sen@gmail.com	+61 423092939	Asia/Calcutta	AU	f	t	f	2025-11-13 05:50:06.31	2025-11-13 05:55:05.79	f	\N	\N	\N	\N	S31HRA	\N
cmhx0tyyi0005jw0yhn65sdle	\N	cmhwvknlm0001jwauzd8qop5g	cmhwx4xz80000jw2m0eh5ib39	Ariba Farheen	emaanpower@gmail.com	+61 497687631	Asia/Calcutta	AU	f	t	f	2025-11-13 06:01:31.934	2025-11-13 06:06:31.564	t	2025-11-13 06:08:18.6	2025-11-13 06:08:18.6	\N	\N	BIOYMR	\N
cmhx12xu2000jjw0y7ig6ysre	\N	cmhwvknlm0001jwauzd8qop5g	cmhwx4xz80000jw2m0eh5ib39	rheen	1n@gmail.com	+91 9310880027	Asia/Calcutta	AU	f	t	f	2025-11-13 06:08:30.41	2025-11-13 06:13:29.647	t	2025-11-13 06:13:33.125	2025-11-13 06:13:33.125	\N	\N	B6RMT4	\N
cmhx19qvk000xjw0ylruo67nc	\N	cmhwvknlm0001jwauzd8qop5g	cmhwx4xz80000jw2m0eh5ib39	11en	1een@gmail.com	+91 9310880027	Asia/Calcutta	AU	f	t	f	2025-11-13 06:13:47.984	2025-11-13 06:18:47.861	f	\N	\N	\N	\N	I8U9SE	\N
cmhx1h7a40002jwafrz9f5674	\N	cmhwvknlm0001jwauzd8qop5g	cmhwx4xz80000jw2m0eh5ib39	111	1rheen@gmail.com	+61 423092939	Asia/Calcutta	AU	f	t	f	2025-11-13 06:19:35.825	2025-11-13 06:24:35.398	f	\N	\N	\N	\N	JH3D93	\N
cmhx1qqvm0002jw96ldn16eaw	\N	cmhwvknlm0001jwauzd8qop5g	cmhwx4xz80000jw2m0eh5ib39	1a Farheen	seen@gmail.com	+91 9310880027	Asia/Calcutta	AU	f	t	f	2025-11-13 06:27:01.128	2025-11-13 06:31:58.344	f	\N	\N	\N	\N	BQUG8J	\N
cmhx2mnd10002jw16gdve0mi1	\N	cmhwvknlm0001jwauzd8qop5g	cmhwx4xz80000jw2m0eh5ib39	seen	sower@gmail.com	+61 421977616	Asia/Calcutta	AU	f	t	f	2025-11-13 06:51:49.562	2025-11-13 06:56:46.628	t	2025-11-13 07:02:04.089	2025-11-13 07:02:04.089	\N	\N	H43WRL	\N
cmhx3u1u00002jwe8oxc7ltsu	\N	cmhwvknlm0001jwauzd8qop5g	cmhwx4xz80000jw2m0eh5ib39	Ariba Farheen	srheen@gmail.com	+61 423092939	Asia/Calcutta	AU	f	t	f	2025-11-13 07:25:34.514	2025-11-13 07:30:34.151	f	\N	\N	\N	\N	P0MK3U	\N
cmhx48mme0002jwwl6rf91fum	\N	cmhwvknlm0001jwauzd8qop5g	cmhwx4xz80000jw2m0eh5ib39	Ariba Farheen	ariba.farheen@gmail.com	+61 423092939	Asia/Calcutta	AU	f	t	f	2025-11-13 07:36:54.646	2025-11-13 07:41:54.197	t	2025-11-13 07:53:13.93	2025-11-13 07:53:13.93	\N	\N	JAK89O	\N
cmhx596zb0002jwlk6uwtp2g4	\N	cmhwvknlm0001jwauzd8qop5g	cmhwx4xz80000jw2m0eh5ib39	sheen	sa.farheen@gmail.com	+91 9310880027	Asia/Calcutta	AU	f	t	f	2025-11-13 08:05:20.662	2025-11-13 08:10:20.072	t	2025-11-13 08:28:15.148	2025-11-13 08:28:15.148	\N	\N	7Y1Z8O	\N
cmhx71cv2000ejw30lt9pyejh	\N	cmhwvknlm0001jwauzd8qop5g	cmhx5esp0000bjwlk0xbfkuvw	Asen	arisen@gmail.com	+61 423092939	Asia/Calcutta	AU	f	t	f	2025-11-13 08:55:14.268	2025-11-13 09:00:13.782	t	2025-11-13 09:01:39.002	2025-11-13 09:01:39.002	\N	\N	0QXQ3V	\N
cmhx9kfjd0002jw0439sxs0hc	\N	cmhwvknlm0001jwauzd8qop5g	cmhx9383z0000jwydceaqvnsn	Ariba Farheen	1er@gmail.com	+61 497687631	Asia/Calcutta	AU	f	t	f	2025-11-13 10:06:03.423	2025-11-13 10:10:58.577	f	\N	\N	\N	\N	D8E297	\N
cmhx9l7am0005jw04l6qfvx21	\N	cmhwvknlm0001jwauzd8qop5g	cmhx9383z0000jwydceaqvnsn	hello	hell1o@gmail.com	+1	Asia/Calcutta	AU	f	t	f	2025-11-13 10:06:39.402	2025-11-13 10:11:38.699	f	\N	\N	\N	\N	YZADSV	\N
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: aribafarheen
--

COPY public.sessions (id, "sessionToken", "userId", expires) FROM stdin;
\.


--
-- Data for Name: templates; Type: TABLE DATA; Schema: public; Owner: aribafarheen
--

COPY public.templates (id, name, description, "htmlCode", thumbnail, "popupStyle", "popupTheme", "isSystem", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: thank_you_templates; Type: TABLE DATA; Schema: public; Owner: aribafarheen
--

COPY public.thank_you_templates (id, name, description, "htmlCode", thumbnail, "isSystem", "createdAt", "updatedAt") FROM stdin;
cmhwuxkem0003jw0hbqs6mjhg	GREEN		<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Thank You for Registering | {{webinarTitle}}</title>\n    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">\n    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">\n    <style>\n        :root {\n            --primary: #4a3b6b;\n            --secondary: #2c7a7b;\n            --accent: #d53f8c;\n            --gold: #d69e2e;\n            --dark: #1a202c;\n            --light: #f7fafc;\n            --white: #ffffff;\n            --gray: #718096;\n        }\n        \n        * {\n            margin: 0;\n            padding: 0;\n            box-sizing: border-box;\n        }\n        \n        body {\n            font-family: 'Poppins', sans-serif;\n            line-height: 1.6;\n            color: var(--dark);\n            background-color: var(--light);\n        }\n        \n        .container {\n            width: 100%;\n            max-width: 1200px;\n            margin: 0 auto;\n            padding: 0 20px;\n        }\n        \n        .header {\n            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);\n            color: var(--white);\n            padding: 60px 0;\n            text-align: center;\n            position: relative;\n            overflow: hidden;\n        }\n        \n        .header::before {\n            content: '';\n            position: absolute;\n            top: 0;\n            left: 0;\n            right: 0;\n            bottom: 0;\n            background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");\n        }\n        \n        .institution-name {\n            font-size: 0.9rem;\n            font-weight: 500;\n            letter-spacing: 2px;\n            text-transform: uppercase;\n            margin-bottom: 10px;\n            opacity: 0.9;\n        }\n        \n        .thank-you {\n            font-size: 1rem;\n            font-weight: 600;\n            letter-spacing: 1px;\n            text-transform: uppercase;\n            margin-bottom: 15px;\n            background: var(--accent);\n            display: inline-block;\n            padding: 5px 20px;\n            border-radius: 20px;\n        }\n        \n        .title {\n            font-family: 'Playfair Display', serif;\n            font-size: 2.5rem;\n            font-weight: 700;\n            line-height: 1.2;\n            margin-bottom: 20px;\n            max-width: 900px;\n            margin-left: auto;\n            margin-right: auto;\n        }\n        \n        .subtitle {\n            font-size: 1.2rem;\n            font-weight: 400;\n            margin-bottom: 25px;\n            max-width: 800px;\n            margin-left: auto;\n            margin-right: auto;\n            opacity: 0.95;\n        }\n        \n        .success-animation {\n            margin: 30px 0;\n        }\n        \n        .success-icon {\n            font-size: 5rem;\n            color: var(--gold);\n            animation: pulse 1.5s infinite;\n        }\n        \n        @keyframes pulse {\n            0% { transform: scale(1); }\n            50% { transform: scale(1.1); }\n            100% { transform: scale(1); }\n        }\n        \n        .bonus-section {\n            background-color: var(--white);\n            padding: 50px 0;\n            border-bottom: 3px solid var(--secondary);\n            box-shadow: 0 2px 10px rgba(0,0,0,0.05);\n        }\n        \n        .section-title {\n            font-family: 'Playfair Display', serif;\n            font-size: 2.3rem;\n            font-weight: 700;\n            color: var(--primary);\n            text-align: center;\n            margin-bottom: 40px;\n            position: relative;\n        }\n        \n        .section-title::after {\n            content: '';\n            position: absolute;\n            bottom: -15px;\n            left: 50%;\n            transform: translateX(-50%);\n            width: 100px;\n            height: 4px;\n            background: linear-gradient(90deg, var(--primary), var(--secondary));\n            border-radius: 2px;\n        }\n        \n        .bonus-content {\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            flex-wrap: wrap;\n            gap: 40px;\n        }\n        \n        .bonus-text {\n            flex: 1;\n            min-width: 250px;\n        }\n        \n        .bonus-title {\n            font-size: 1.4rem;\n            font-weight: 700;\n            color: var(--primary);\n            margin-bottom: 15px;\n            display: flex;\n            align-items: center;\n            gap: 10px;\n        }\n        \n        .bonus-description {\n            font-size: 1.1rem;\n            color: var(--dark);\n            line-height: 1.7;\n        }\n        \n        .bonus-image {\n            flex: 0 0 auto;\n            width: 250px;\n            height: 250px;\n            border-radius: 10px;\n            object-fit: cover;\n            border: 4px solid var(--secondary);\n            box-shadow: 0 10px 30px rgba(0,0,0,0.15);\n        }\n        \n        .next-steps-section {\n            padding: 50px 0;\n            background-color: var(--light);\n        }\n        \n        .steps-container {\n            display: flex;\n            flex-wrap: wrap;\n            gap: 30px;\n            margin-top: 40px;\n        }\n        \n        .step-card {\n            flex: 1;\n            min-width: 280px;\n            background-color: var(--white);\n            border-radius: 15px;\n            padding: 30px;\n            box-shadow: 0 5px 20px rgba(0,0,0,0.08);\n            transition: all 0.3s ease;\n            border-top: 5px solid var(--secondary);\n        }\n        \n        .step-card:hover {\n            transform: translateY(-5px);\n            box-shadow: 0 10px 30px rgba(0,0,0,0.12);\n        }\n        \n        .step-card.important {\n            border-top: 5px solid var(--accent);\n            background: linear-gradient(to bottom, rgba(213, 63, 140, 0.05), var(--white));\n        }\n        \n        .step-number {\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            width: 50px;\n            height: 50px;\n            background-color: var(--primary);\n            color: var(--white);\n            border-radius: 50%;\n            font-size: 1.5rem;\n            font-weight: 700;\n            margin-bottom: 20px;\n        }\n        \n        .step-card.important .step-number {\n            background-color: var(--accent);\n        }\n        \n        .step-title {\n            font-size: 1.3rem;\n            font-weight: 600;\n            color: var(--primary);\n            margin-bottom: 15px;\n        }\n        \n        .step-card.important .step-title {\n            color: var(--accent);\n        }\n        \n        .step-description {\n            font-size: 1.1rem;\n            color: var(--dark);\n            line-height: 1.7;\n            margin-bottom: 20px;\n        }\n        \n        .btn {\n            display: inline-block;\n            padding: 12px 25px;\n            border-radius: 50px;\n            font-size: 1rem;\n            font-weight: 600;\n            text-decoration: none;\n            text-align: center;\n            cursor: pointer;\n            transition: all 0.3s ease;\n            border: none;\n        }\n        \n        .btn-primary {\n            background: linear-gradient(135deg, var(--accent) 0%, #97266d 100%);\n            color: var(--white);\n            box-shadow: 0 5px 15px rgba(213, 63, 140, 0.3);\n        }\n        \n        .btn-primary:hover {\n            transform: translateY(-3px);\n            box-shadow: 0 8px 20px rgba(213, 63, 140, 0.4);\n        }\n        \n        .btn-secondary {\n            background-color: var(--secondary);\n            color: var(--white);\n            box-shadow: 0 5px 15px rgba(44, 122, 123, 0.3);\n        }\n        \n        .btn-secondary:hover {\n            transform: translateY(-3px);\n            box-shadow: 0 8px 20px rgba(44, 122, 123, 0.4);\n        }\n        \n        .social-sharing {\n            display: flex;\n            gap: 15px;\n            margin-top: 20px;\n        }\n        \n        .social-btn {\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            width: 50px;\n            height: 50px;\n            border-radius: 50%;\n            color: var(--white);\n            font-size: 1.2rem;\n            transition: all 0.3s ease;\n            text-decoration: none;\n        }\n        \n        .social-btn:hover {\n            transform: translateY(-3px);\n        }\n        \n        .whatsapp-btn {\n            background-color: #25D366;\n        }\n        \n        .facebook-btn {\n            background-color: #1877F2;\n        }\n        \n        .reward-text {\n            font-style: italic;\n            color: var(--secondary);\n            margin-top: 15px;\n            font-size: 0.9rem;\n            padding: 10px;\n            border-left: 3px solid var(--secondary);\n            background-color: rgba(44, 122, 123, 0.05);\n            border-radius: 0 5px 5px 0;\n        }\n        \n        .webinar-details {\n            background-color: var(--white);\n            padding: 30px;\n            border-radius: 15px;\n            margin-top: 30px;\n            box-shadow: 0 5px 20px rgba(0,0,0,0.08);\n        }\n        \n        .detail-item {\n            display: flex;\n            align-items: center;\n            margin-bottom: 15px;\n            font-size: 1.1rem;\n        }\n        \n        .detail-item i {\n            color: var(--secondary);\n            margin-right: 15px;\n            font-size: 1.3rem;\n        }\n        \n        .footer {\n            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);\n            color: var(--white);\n            padding: 40px 0;\n            text-align: center;\n        }\n        \n        .footer-logo {\n            font-size: 1.5rem;\n            font-weight: 700;\n            margin-bottom: 20px;\n        }\n        \n        .footer-links {\n            display: flex;\n            justify-content: center;\n            gap: 30px;\n            margin-bottom: 20px;\n            flex-wrap: wrap;\n        }\n        \n        .footer-link {\n            color: var(--white);\n            text-decoration: none;\n            transition: opacity 0.3s ease;\n        }\n        \n        .footer-link:hover {\n            opacity: 0.8;\n        }\n        \n        .copyright {\n            font-size: 0.9rem;\n            opacity: 0.8;\n        }\n        \n        /* Calendar Buttons - Platform-Styled */\n        .calendar-buttons {\n            display: flex;\n            flex-direction: column;\n            gap: 10px;\n            margin-top: 20px;\n        }\n        \n        .google-calendar-button {\n            background-color: #fff;\n            color: #3c4043;\n            border: 1px solid #dadce0;\n            font-family: 'Google Sans', 'Roboto', Arial, sans-serif;\n            font-size: 14px;\n            font-weight: 500;\n            padding: 9px 16px;\n            border-radius: 4px;\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            gap: 8px;\n            transition: all 0.2s ease;\n            box-shadow: 0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15);\n            width: 100%;\n        }\n        \n        .google-calendar-button:hover {\n            background-color: #f8f9fa;\n            box-shadow: 0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15);\n            border-color: #dadce0;\n        }\n        \n        .google-calendar-button:active {\n            background-color: #f1f3f4;\n            box-shadow: 0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15);\n        }\n        \n        .google-calendar-button i {\n            color: #4285f4;\n            font-size: 18px;\n        }\n        \n        .apple-calendar-button {\n            background-color: #000;\n            color: #fff;\n            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;\n            font-size: 14px;\n            font-weight: 400;\n            padding: 9px 16px;\n            border-radius: 20px;\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            gap: 8px;\n            transition: all 0.2s ease;\n            border: none;\n            width: 100%;\n        }\n        \n        .apple-calendar-button:hover {\n            background-color: #333;\n            transform: translateY(-1px);\n        }\n        \n        .apple-calendar-button:active {\n            background-color: #222;\n            transform: translateY(0);\n        }\n        \n        .apple-calendar-button i {\n            font-size: 18px;\n        }\n        \n        .email-icon {\n            font-size: 3rem;\n            color: var(--accent);\n            margin-bottom: 20px;\n            text-align: center;\n        }\n        \n        @media (max-width: 768px) {\n            .title {\n                font-size: 2rem;\n            }\n            \n            .subtitle {\n                font-size: 1.1rem;\n            }\n            \n            .bonus-image {\n                width: 200px;\n                height: 200px;\n            }\n            \n            .steps-container {\n                flex-direction: column;\n            }\n            \n            .calendar-buttons {\n                flex-direction: row;\n                gap: 12px;\n            }\n        }\n    </style>\n</head>\n<body>\n    <header class="header">\n        <div class="container">\n             <div class="thank-you">REGISTRATION SUCCESSFUL</div>\n            <h1 class="title">You are In, {{attendeeName}}!</h1>\n         \n            \n           \n        </div>\n    </header>\n    \n    <section class="bonus-section">\n        <div class="container">\n            <h2 class="section-title">Your Exclusive Bonus Gift</h2>\n            <div class="bonus-content">\n                <div class="bonus-text">\n                    <div class="bonus-title">\n                        <i class="fas fa-gift"></i> FREE BONUS RESOURCE\n                    </div>\n                    <p class="bonus-description">As promised, you'll receive an exclusive bonus ebook when you attend , make sure to focus and pay attention!.</p>\n              \n                </div>\n                <img src="/uploads/1763011387006-tdqy06asbrg6lj3n66lbkw.png?w=250&h=250&fit=crop" alt="Bonus Gift" class="bonus-image">\n            </div>\n        </div>\n    </section>\n    \n    <section class="next-steps-section">\n        <div class="container">\n            <h2 class="section-title">What To Do Next</h2>\n            \n            <div class="steps-container">\n                <div class="step-card important">\n                    <div class="step-number">1</div>\n                    <h3 class="step-title">Important: Check Your Email</h3>\n                    <div class="email-icon">\n                        <i class="fas fa-envelope"></i>\n                    </div>\n                    <p class="step-description">We've sent a confirmation email with all the webinar details to your registered email address. Please check your inbox (and spam folder) to ensure you receive all the updates.</p>\n                </div>\n                \n                <div class="step-card">\n                    <div class="step-number">2</div>\n                    <h3 class="step-title">Mark Your Calendar</h3>\n                    <p class="step-description">Don't miss out on this transformative session. Add it to your calendar now to ensure you don't forget.</p>\n                    \n                    <div class="webinar-details">\n                        <div class="detail-item">\n                            <i class="fas fa-calendar-alt"></i>\n                            <span>{{webinarDate}}</span>\n                        </div>\n                        <div class="detail-item">\n                            <i class="fas fa-clock"></i>\n                            <span>{{webinarTime}} ({{timeZone}})</span>\n                        </div>\n                        <div class="detail-item">\n                            <i class="fas fa-hourglass-half"></i>\n                            <span>Duration: {{webinarDuration}} minutes</span>\n                        </div>\n                        <div class="detail-item">\n                            <i class="fas fa-laptop"></i>\n                            <span>Platform: Online</span>\n                        </div>\n                    </div>\n                    \n                    <div class="calendar-buttons">\n                        <button class="google-calendar-button" onclick="addToGoogleCalendar()">\n                            <i class="fab fa-google"></i> Google Calendar\n                        </button>\n                        <button class="apple-calendar-button" onclick="addToAppleCalendar()">\n                            <i class="fab fa-apple"></i> Apple Calendar\n                        </button>\n                    </div>\n                </div>\n                \n                <div class="step-card">\n                    <div class="step-number">3</div>\n                    <h3 class="step-title"> Share & Earn rewards from Allah swt</h3>\n                    <p class="step-description">Be a light for others! <b>Invite your friends to this free Masterclass</b> so they can also raise strong, confident Muslims, and you can<b> earn rewards from Allah just by sharing it :) </b>\n</p>\n                    \n                    <div class="social-sharing">\n                        <a href="#" onclick="shareOnWhatsApp(); return false;" class="social-btn whatsapp-btn">\n                            <i class="fab fa-whatsapp"></i>\n                        </a>\n                        <a href="#" onclick="shareOnFacebook(); return false;" class="social-btn facebook-btn">\n                            <i class="fab fa-facebook-f"></i>\n                        </a>\n                    </div>\n                    \n                    <p class="reward-text">"Whoever guides someone to goodness will have a reward like the one who did it.." - Prophet Muhammad ﷺ </p>\n                    \n                    <button class="btn btn-secondary" style="margin-top: 20px; width: 100%;" onclick="copyLink()">\n                        <i class="fas fa-copy"></i> Copy Registration Link\n                    </button>\n                    \n                    <a href="\n{{joinLink}}" class="btn btn-primary" style="margin-top: 15px; width: 100%; display: block;">\n                        <i class="fas fa-video"></i> Join Webinar Room\n                    </a>\n                </div>\n            </div>\n            \n            <div style="text-align: center; margin-top: 40px; padding: 30px; background: white; border-radius: 15px; box-shadow: 0 5px 20px rgba(0,0,0,0.08);">\n                <div id="countdown" style="font-size: 2.5rem; font-weight: 700; color: var(--primary); margin-bottom: 10px;">Loading...</div>\n                <p style="color: var(--gray); font-size: 1.1rem;">Until Your Webinar Starts</p>\n            </div>\n        </div>\n    </section>\n    \n    <footer class="footer">\n        <div class="container">\n            <div class="footer-logo">{{hostName}}</div>\n            <div class="footer-links">\n                <a href="#" class="footer-link">About Us</a>\n                <a href="mailto:{{hostEmail}}" class="footer-link">Contact</a>\n                <a href="#" class="footer-link">Privacy Policy</a>\n            </div>\n            <p class="copyright">© 2025 {{hostName}}. All rights reserved.</p>\n            <p style="font-size: 0.8rem; opacity: 0.7; margin-top: 10px;">Registration ID: {{registrationId}}</p>\n        </div>\n    </footer>\n    \n    <script>\n        {{countdown}}\n        \n        function copyLink() {\n            const link = "{{referralLink}}";\n            const dummy = document.createElement('input');\n            document.body.appendChild(dummy);\n            dummy.value = link;\n            dummy.select();\n            document.execCommand('copy');\n            document.body.removeChild(dummy);\n            \n            const button = event.target;\n            const originalText = button.innerHTML;\n            button.innerHTML = '<i class="fas fa-check"></i> Link Copied!';\n            button.style.backgroundColor = '#48bb78';\n            \n            setTimeout(() => {\n                button.innerHTML = originalText;\n                button.style.backgroundColor = '';\n            }, 2000);\n        }\n        \n        // Add to Google Calendar function\n        function addToGoogleCalendar() {\n            const calendarUrl = '{{googleCalendarLink}}';\n            window.open(calendarUrl, '_blank');\n        }\n        \n        // Add to Apple/ICS Calendar function\n        function addToAppleCalendar() {\n            const calendarUrl = '{{appleCalendarLink}}';\n            window.open(calendarUrl, '_blank');\n        }\n        \n        // Share on WhatsApp function\n        function shareOnWhatsApp() {\n            const shareText = "Assalam aleykum sister,\\n\\nI found this FREE class for moms that I am sure you'll love.\\n\\nIt's about how to help our kids love Islam, without forcing them, even in a world that is pulling them away. It gave me so much hope and a new strategy to follow (something I never heard from anyone else before), so I thought of you.\\n\\nHere's the link to reserve a FREE spot  " + "{{referralLink}}";\n            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;\n            window.open(whatsappUrl, '_blank');\n        }\n        \n        // Share on Facebook function\n        function shareOnFacebook() {\n            const shareUrl = "https://www.facebook.com/sharer/sharer.php?u=" + "{{referralLink}}";\n            window.open(shareUrl, '_blank', 'width=600,height=400');\n        }\n    </script>\n</body>\n</html>	\N	f	2025-11-13 03:16:22.019	2025-11-13 08:51:39.238
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: aribafarheen
--

COPY public.users (id, email, name, password, image, role, "createdAt", "updatedAt") FROM stdin;
cmhwvev380000jw96jkk00geq	ariba.farheen@gmail.com	Ariba Farheen	$2a$12$FJTTU6VobXSWjB6Q8v/3p.cHPEQ3oK7eWkTbCKsVGsk4JkQKmvfka	\N	HOST	2025-11-13 03:29:49.028	2025-11-13 03:29:49.028
\.


--
-- Data for Name: video_watch_events; Type: TABLE DATA; Schema: public; Owner: aribafarheen
--

COPY public.video_watch_events (id, "sessionId", "webinarId", "timestamp", "eventType", "watchedFrom", "watchedTo", "createdAt") FROM stdin;
\.


--
-- Data for Name: webinar_faqs; Type: TABLE DATA; Schema: public; Owner: aribafarheen
--

COPY public.webinar_faqs (id, "webinarId", question, answer, "sortOrder", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: webinar_sales; Type: TABLE DATA; Schema: public; Owner: aribafarheen
--

COPY public.webinar_sales (id, "webinarId", "registrationId", email, "orderId", "orderFormId", "orderFormName", "productName", status, amount, currency, "contactId", "purchasedAt", "rawPayload", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: webinar_schedules; Type: TABLE DATA; Schema: public; Owner: aribafarheen
--

COPY public.webinar_schedules (id, "webinarId", "scheduleType", "scheduledAt", timezone, "useUserTimezone", "minutesFromReg", "recurringPattern", "isActive", "createdAt", "updatedAt") FROM stdin;
cmhx9383z0000jwydceaqvnsn	cmhwvknlm0001jwauzd8qop5g	justInTime	\N	\N	f	5	\N	t	2025-11-13 09:52:40.64	2025-11-13 09:52:40.64
cmhx9385r0001jwydrjomzhd6	cmhwvknlm0001jwauzd8qop5g	recurring	\N	USER_TIMEZONE	t	\N	{"interval":"daily","time":"11:00"}	t	2025-11-13 09:52:40.64	2025-11-13 09:52:40.64
\.


--
-- Data for Name: webinars; Type: TABLE DATA; Schema: public; Owner: aribafarheen
--

COPY public.webinars (id, slug, title, description, thumbnail, duration, "vimeoVideoId", "videoUrl", "videoDuration", status, "recordingUrl", "hostId", "hasReplay", "hasOffers", "hasChat", "hasReactions", "showElapsedTime", "maxSchedulesToShow", "registrationPageId", "thankYouTemplateId", "countdownTemplateId", "countdownPageId", "enableABTesting", "trafficSplitPercent", "testRegistrationPage", "regPageAId", "regPageBId", "testSchedule", "scheduleAIds", "scheduleBIds", "testOffer", "offerAId", "offerBId", "testVideo", "videoAId", "videoBId", "whatsappShareMessage", "facebookShareMessage", "createdAt", "updatedAt", "internalName") FROM stdin;
cmhwvknlm0001jwauzd8qop5g	loveislam	How to Help Your Child Love Islam Without Force - Even When the Whole World is Pulling Them Away	How to Help Your Child Love Islam Without Force - Even When the Whole World is Pulling Them Away\n\n		120	1102063526	\N	\N	SCHEDULED	\N	cmhwvev380000jw96jkk00geq	t	t	t	t	t	3	cmhwuq3mg0000jw0hsr1dzljm	cmhwuxkem0003jw0hbqs6mjhg	\N	cmhwuzjl5001vjwdkl51m6unu	f	50	f	\N	\N	f	\N	\N	f	\N	\N	f	\N	\N	\N	\N	2025-11-13 03:34:19.155	2025-11-13 09:52:40.512	UM-Webinar A
\.


--
-- Name: Offer Offer_pkey; Type: CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public."Offer"
    ADD CONSTRAINT "Offer_pkey" PRIMARY KEY (id);


--
-- Name: ab_test_metrics ab_test_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.ab_test_metrics
    ADD CONSTRAINT ab_test_metrics_pkey PRIMARY KEY (id);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: ai_chat_config ai_chat_config_pkey; Type: CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.ai_chat_config
    ADD CONSTRAINT ai_chat_config_pkey PRIMARY KEY (id);


--
-- Name: analytics analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.analytics
    ADD CONSTRAINT analytics_pkey PRIMARY KEY (id);


--
-- Name: attendee_sessions attendee_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.attendee_sessions
    ADD CONSTRAINT attendee_sessions_pkey PRIMARY KEY (id);


--
-- Name: bonus_resources bonus_resources_pkey; Type: CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.bonus_resources
    ADD CONSTRAINT bonus_resources_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: countdown_pages countdown_pages_pkey; Type: CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.countdown_pages
    ADD CONSTRAINT countdown_pages_pkey PRIMARY KEY (id);


--
-- Name: countdown_templates countdown_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.countdown_templates
    ADD CONSTRAINT countdown_templates_pkey PRIMARY KEY (id);


--
-- Name: engagement_events engagement_events_pkey; Type: CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.engagement_events
    ADD CONSTRAINT engagement_events_pkey PRIMARY KEY (id);


--
-- Name: images images_pkey; Type: CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.images
    ADD CONSTRAINT images_pkey PRIMARY KEY (id);


--
-- Name: offer_analytics offer_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.offer_analytics
    ADD CONSTRAINT offer_analytics_pkey PRIMARY KEY (id);


--
-- Name: page_visits page_visits_pkey; Type: CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.page_visits
    ADD CONSTRAINT page_visits_pkey PRIMARY KEY (id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: program_documents program_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.program_documents
    ADD CONSTRAINT program_documents_pkey PRIMARY KEY (id);


--
-- Name: reactions reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.reactions
    ADD CONSTRAINT reactions_pkey PRIMARY KEY (id);


--
-- Name: registration_pages registration_pages_pkey; Type: CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.registration_pages
    ADD CONSTRAINT registration_pages_pkey PRIMARY KEY (id);


--
-- Name: registrations registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.registrations
    ADD CONSTRAINT registrations_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: templates templates_pkey; Type: CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.templates
    ADD CONSTRAINT templates_pkey PRIMARY KEY (id);


--
-- Name: thank_you_templates thank_you_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.thank_you_templates
    ADD CONSTRAINT thank_you_templates_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: video_watch_events video_watch_events_pkey; Type: CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.video_watch_events
    ADD CONSTRAINT video_watch_events_pkey PRIMARY KEY (id);


--
-- Name: webinar_faqs webinar_faqs_pkey; Type: CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.webinar_faqs
    ADD CONSTRAINT webinar_faqs_pkey PRIMARY KEY (id);


--
-- Name: webinar_sales webinar_sales_pkey; Type: CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.webinar_sales
    ADD CONSTRAINT webinar_sales_pkey PRIMARY KEY (id);


--
-- Name: webinar_schedules webinar_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.webinar_schedules
    ADD CONSTRAINT webinar_schedules_pkey PRIMARY KEY (id);


--
-- Name: webinars webinars_pkey; Type: CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.webinars
    ADD CONSTRAINT webinars_pkey PRIMARY KEY (id);


--
-- Name: ab_test_metrics_visitorId_idx; Type: INDEX; Schema: public; Owner: aribafarheen
--

CREATE INDEX "ab_test_metrics_visitorId_idx" ON public.ab_test_metrics USING btree ("visitorId");


--
-- Name: ab_test_metrics_webinarId_element_testGroup_idx; Type: INDEX; Schema: public; Owner: aribafarheen
--

CREATE INDEX "ab_test_metrics_webinarId_element_testGroup_idx" ON public.ab_test_metrics USING btree ("webinarId", element, "testGroup");


--
-- Name: accounts_provider_providerAccountId_key; Type: INDEX; Schema: public; Owner: aribafarheen
--

CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON public.accounts USING btree (provider, "providerAccountId");


--
-- Name: ai_chat_config_webinarId_key; Type: INDEX; Schema: public; Owner: aribafarheen
--

CREATE UNIQUE INDEX "ai_chat_config_webinarId_key" ON public.ai_chat_config USING btree ("webinarId");


--
-- Name: attendee_sessions_joinedAt_idx; Type: INDEX; Schema: public; Owner: aribafarheen
--

CREATE INDEX "attendee_sessions_joinedAt_idx" ON public.attendee_sessions USING btree ("joinedAt");


--
-- Name: attendee_sessions_registrationId_idx; Type: INDEX; Schema: public; Owner: aribafarheen
--

CREATE INDEX "attendee_sessions_registrationId_idx" ON public.attendee_sessions USING btree ("registrationId");


--
-- Name: attendee_sessions_webinarId_completed_idx; Type: INDEX; Schema: public; Owner: aribafarheen
--

CREATE INDEX "attendee_sessions_webinarId_completed_idx" ON public.attendee_sessions USING btree ("webinarId", completed);


--
-- Name: attendee_sessions_webinarId_scheduleId_idx; Type: INDEX; Schema: public; Owner: aribafarheen
--

CREATE INDEX "attendee_sessions_webinarId_scheduleId_idx" ON public.attendee_sessions USING btree ("webinarId", "scheduleId");


--
-- Name: countdown_pages_name_key; Type: INDEX; Schema: public; Owner: aribafarheen
--

CREATE UNIQUE INDEX countdown_pages_name_key ON public.countdown_pages USING btree (name);


--
-- Name: countdown_templates_name_key; Type: INDEX; Schema: public; Owner: aribafarheen
--

CREATE UNIQUE INDEX countdown_templates_name_key ON public.countdown_templates USING btree (name);


--
-- Name: engagement_events_sessionId_idx; Type: INDEX; Schema: public; Owner: aribafarheen
--

CREATE INDEX "engagement_events_sessionId_idx" ON public.engagement_events USING btree ("sessionId");


--
-- Name: engagement_events_webinarId_eventType_idx; Type: INDEX; Schema: public; Owner: aribafarheen
--

CREATE INDEX "engagement_events_webinarId_eventType_idx" ON public.engagement_events USING btree ("webinarId", "eventType");


--
-- Name: engagement_events_webinarId_timestamp_idx; Type: INDEX; Schema: public; Owner: aribafarheen
--

CREATE INDEX "engagement_events_webinarId_timestamp_idx" ON public.engagement_events USING btree ("webinarId", "timestamp");


--
-- Name: images_uploadedBy_idx; Type: INDEX; Schema: public; Owner: aribafarheen
--

CREATE INDEX "images_uploadedBy_idx" ON public.images USING btree ("uploadedBy");


--
-- Name: offer_analytics_registrationId_idx; Type: INDEX; Schema: public; Owner: aribafarheen
--

CREATE INDEX "offer_analytics_registrationId_idx" ON public.offer_analytics USING btree ("registrationId");


--
-- Name: offer_analytics_webinarId_clickedOffer_idx; Type: INDEX; Schema: public; Owner: aribafarheen
--

CREATE INDEX "offer_analytics_webinarId_clickedOffer_idx" ON public.offer_analytics USING btree ("webinarId", "clickedOffer");


--
-- Name: offer_analytics_webinarId_converted_idx; Type: INDEX; Schema: public; Owner: aribafarheen
--

CREATE INDEX "offer_analytics_webinarId_converted_idx" ON public.offer_analytics USING btree ("webinarId", converted);


--
-- Name: offer_analytics_webinarId_idx; Type: INDEX; Schema: public; Owner: aribafarheen
--

CREATE INDEX "offer_analytics_webinarId_idx" ON public.offer_analytics USING btree ("webinarId");


--
-- Name: offer_analytics_webinarId_sawOffer_idx; Type: INDEX; Schema: public; Owner: aribafarheen
--

CREATE INDEX "offer_analytics_webinarId_sawOffer_idx" ON public.offer_analytics USING btree ("webinarId", "sawOffer");


--
-- Name: page_visits_registrationId_idx; Type: INDEX; Schema: public; Owner: aribafarheen
--

CREATE INDEX "page_visits_registrationId_idx" ON public.page_visits USING btree ("registrationId");


--
-- Name: page_visits_visitorId_idx; Type: INDEX; Schema: public; Owner: aribafarheen
--

CREATE INDEX "page_visits_visitorId_idx" ON public.page_visits USING btree ("visitorId");


--
-- Name: page_visits_webinarId_enteredAt_idx; Type: INDEX; Schema: public; Owner: aribafarheen
--

CREATE INDEX "page_visits_webinarId_enteredAt_idx" ON public.page_visits USING btree ("webinarId", "enteredAt");


--
-- Name: page_visits_webinarId_pageType_idx; Type: INDEX; Schema: public; Owner: aribafarheen
--

CREATE INDEX "page_visits_webinarId_pageType_idx" ON public.page_visits USING btree ("webinarId", "pageType");


--
-- Name: page_visits_webinarId_pageType_pageId_idx; Type: INDEX; Schema: public; Owner: aribafarheen
--

CREATE INDEX "page_visits_webinarId_pageType_pageId_idx" ON public.page_visits USING btree ("webinarId", "pageType", "pageId");


--
-- Name: reactions_webinarId_videoTimestamp_idx; Type: INDEX; Schema: public; Owner: aribafarheen
--

CREATE INDEX "reactions_webinarId_videoTimestamp_idx" ON public.reactions USING btree ("webinarId", "videoTimestamp");


--
-- Name: registration_pages_name_key; Type: INDEX; Schema: public; Owner: aribafarheen
--

CREATE UNIQUE INDEX registration_pages_name_key ON public.registration_pages USING btree (name);


--
-- Name: registrations_email_idx; Type: INDEX; Schema: public; Owner: aribafarheen
--

CREATE INDEX registrations_email_idx ON public.registrations USING btree (email);


--
-- Name: registrations_referralCode_key; Type: INDEX; Schema: public; Owner: aribafarheen
--

CREATE UNIQUE INDEX "registrations_referralCode_key" ON public.registrations USING btree ("referralCode");


--
-- Name: registrations_userId_idx; Type: INDEX; Schema: public; Owner: aribafarheen
--

CREATE INDEX "registrations_userId_idx" ON public.registrations USING btree ("userId");


--
-- Name: registrations_webinarId_attended_idx; Type: INDEX; Schema: public; Owner: aribafarheen
--

CREATE INDEX "registrations_webinarId_attended_idx" ON public.registrations USING btree ("webinarId", attended);


--
-- Name: registrations_webinarId_idx; Type: INDEX; Schema: public; Owner: aribafarheen
--

CREATE INDEX "registrations_webinarId_idx" ON public.registrations USING btree ("webinarId");


--
-- Name: registrations_webinarId_registeredAt_idx; Type: INDEX; Schema: public; Owner: aribafarheen
--

CREATE INDEX "registrations_webinarId_registeredAt_idx" ON public.registrations USING btree ("webinarId", "registeredAt");


--
-- Name: sessions_sessionToken_key; Type: INDEX; Schema: public; Owner: aribafarheen
--

CREATE UNIQUE INDEX "sessions_sessionToken_key" ON public.sessions USING btree ("sessionToken");


--
-- Name: templates_name_key; Type: INDEX; Schema: public; Owner: aribafarheen
--

CREATE UNIQUE INDEX templates_name_key ON public.templates USING btree (name);


--
-- Name: thank_you_templates_name_key; Type: INDEX; Schema: public; Owner: aribafarheen
--

CREATE UNIQUE INDEX thank_you_templates_name_key ON public.thank_you_templates USING btree (name);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: aribafarheen
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: video_watch_events_sessionId_idx; Type: INDEX; Schema: public; Owner: aribafarheen
--

CREATE INDEX "video_watch_events_sessionId_idx" ON public.video_watch_events USING btree ("sessionId");


--
-- Name: video_watch_events_webinarId_timestamp_idx; Type: INDEX; Schema: public; Owner: aribafarheen
--

CREATE INDEX "video_watch_events_webinarId_timestamp_idx" ON public.video_watch_events USING btree ("webinarId", "timestamp");


--
-- Name: webinar_sales_email_idx; Type: INDEX; Schema: public; Owner: aribafarheen
--

CREATE INDEX webinar_sales_email_idx ON public.webinar_sales USING btree (email);


--
-- Name: webinar_sales_orderId_key; Type: INDEX; Schema: public; Owner: aribafarheen
--

CREATE UNIQUE INDEX "webinar_sales_orderId_key" ON public.webinar_sales USING btree ("orderId");


--
-- Name: webinar_sales_registrationId_idx; Type: INDEX; Schema: public; Owner: aribafarheen
--

CREATE INDEX "webinar_sales_registrationId_idx" ON public.webinar_sales USING btree ("registrationId");


--
-- Name: webinar_sales_webinarId_idx; Type: INDEX; Schema: public; Owner: aribafarheen
--

CREATE INDEX "webinar_sales_webinarId_idx" ON public.webinar_sales USING btree ("webinarId");


--
-- Name: webinars_slug_key; Type: INDEX; Schema: public; Owner: aribafarheen
--

CREATE UNIQUE INDEX webinars_slug_key ON public.webinars USING btree (slug);


--
-- Name: Offer Offer_webinarId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public."Offer"
    ADD CONSTRAINT "Offer_webinarId_fkey" FOREIGN KEY ("webinarId") REFERENCES public.webinars(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ab_test_metrics ab_test_metrics_registrationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.ab_test_metrics
    ADD CONSTRAINT "ab_test_metrics_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES public.registrations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: accounts accounts_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ai_chat_config ai_chat_config_webinarId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.ai_chat_config
    ADD CONSTRAINT "ai_chat_config_webinarId_fkey" FOREIGN KEY ("webinarId") REFERENCES public.webinars(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: analytics analytics_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.analytics
    ADD CONSTRAINT "analytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: analytics analytics_webinarId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.analytics
    ADD CONSTRAINT "analytics_webinarId_fkey" FOREIGN KEY ("webinarId") REFERENCES public.webinars(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: attendee_sessions attendee_sessions_registrationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.attendee_sessions
    ADD CONSTRAINT "attendee_sessions_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES public.registrations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: bonus_resources bonus_resources_webinarId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.bonus_resources
    ADD CONSTRAINT "bonus_resources_webinarId_fkey" FOREIGN KEY ("webinarId") REFERENCES public.webinars(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: chat_messages chat_messages_registrationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT "chat_messages_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES public.registrations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: chat_messages chat_messages_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT "chat_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: chat_messages chat_messages_webinarId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT "chat_messages_webinarId_fkey" FOREIGN KEY ("webinarId") REFERENCES public.webinars(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: comments comments_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT "comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: comments comments_postId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT "comments_postId_fkey" FOREIGN KEY ("postId") REFERENCES public.posts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: engagement_events engagement_events_sessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.engagement_events
    ADD CONSTRAINT "engagement_events_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES public.attendee_sessions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: page_visits page_visits_registrationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.page_visits
    ADD CONSTRAINT "page_visits_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES public.registrations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: page_visits page_visits_sessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.page_visits
    ADD CONSTRAINT "page_visits_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES public.attendee_sessions(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: posts posts_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT "posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: program_documents program_documents_webinarId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.program_documents
    ADD CONSTRAINT "program_documents_webinarId_fkey" FOREIGN KEY ("webinarId") REFERENCES public.webinars(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reactions reactions_registrationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.reactions
    ADD CONSTRAINT "reactions_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES public.registrations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: reactions reactions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.reactions
    ADD CONSTRAINT "reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: reactions reactions_webinarId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.reactions
    ADD CONSTRAINT "reactions_webinarId_fkey" FOREIGN KEY ("webinarId") REFERENCES public.webinars(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: registrations registrations_referredBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.registrations
    ADD CONSTRAINT "registrations_referredBy_fkey" FOREIGN KEY ("referredBy") REFERENCES public.registrations("referralCode") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: registrations registrations_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.registrations
    ADD CONSTRAINT "registrations_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: registrations registrations_webinarId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.registrations
    ADD CONSTRAINT "registrations_webinarId_fkey" FOREIGN KEY ("webinarId") REFERENCES public.webinars(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sessions sessions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: video_watch_events video_watch_events_sessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.video_watch_events
    ADD CONSTRAINT "video_watch_events_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES public.attendee_sessions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: webinar_faqs webinar_faqs_webinarId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.webinar_faqs
    ADD CONSTRAINT "webinar_faqs_webinarId_fkey" FOREIGN KEY ("webinarId") REFERENCES public.webinars(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: webinar_sales webinar_sales_registrationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.webinar_sales
    ADD CONSTRAINT "webinar_sales_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES public.registrations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: webinar_sales webinar_sales_webinarId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.webinar_sales
    ADD CONSTRAINT "webinar_sales_webinarId_fkey" FOREIGN KEY ("webinarId") REFERENCES public.webinars(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: webinar_schedules webinar_schedules_webinarId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.webinar_schedules
    ADD CONSTRAINT "webinar_schedules_webinarId_fkey" FOREIGN KEY ("webinarId") REFERENCES public.webinars(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: webinars webinars_hostId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aribafarheen
--

ALTER TABLE ONLY public.webinars
    ADD CONSTRAINT "webinars_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: aribafarheen
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict 7yyBhAaVa91JzW4tNTvY8bSVKlXCCeGjTZx6Jecxk6kaAmmYr4lGLgUS4YRjal6

