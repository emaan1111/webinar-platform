pg_dump: warning: there are circular foreign-key constraints on this table:
pg_dump: detail: registrations
pg_dump: hint: You might not be able to restore the dump without using --disable-triggers or temporarily dropping the constraints.
pg_dump: hint: Consider using a full dump instead of a --data-only dump to avoid this problem.
--
-- PostgreSQL database dump
--

\restrict ZQ0CWxdPHpGmLuPUthK6asfUehPQSAEgCWiWWVmgoluYPKnufdIA3gXdLghLwHe

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
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: aribafarheen
--

INSERT INTO public.users VALUES ('cmhwvev380000jw96jkk00geq', 'ariba.farheen@gmail.com', 'Ariba Farheen', '$2a$12$FJTTU6VobXSWjB6Q8v/3p.cHPEQ3oK7eWkTbCKsVGsk4JkQKmvfka', NULL, 'HOST', '2025-11-13 03:29:49.028', '2025-11-13 03:29:49.028');


--
-- Data for Name: webinars; Type: TABLE DATA; Schema: public; Owner: aribafarheen
--

INSERT INTO public.webinars VALUES ('cmhwvknlm0001jwauzd8qop5g', 'loveislam', 'How to Help Your Child Love Islam Without Force - Even When the Whole World is Pulling Them Away', 'How to Help Your Child Love Islam Without Force - Even When the Whole World is Pulling Them Away

', '', 120, '1102063526', NULL, NULL, 'SCHEDULED', NULL, 'cmhwvev380000jw96jkk00geq', true, true, true, true, true, 3, 'cmhwuq3mg0000jw0hsr1dzljm', 'cmhwuxkem0003jw0hbqs6mjhg', NULL, 'cmhwuzjl5001vjwdkl51m6unu', false, 50, false, NULL, NULL, false, NULL, NULL, false, NULL, NULL, false, NULL, NULL, NULL, NULL, '2025-11-13 03:34:19.155', '2025-11-13 09:52:40.512', 'UM-Webinar A');


--
-- Data for Name: analytics; Type: TABLE DATA; Schema: public; Owner: aribafarheen
--



--
-- Data for Name: registrations; Type: TABLE DATA; Schema: public; Owner: aribafarheen
--

INSERT INTO public.registrations VALUES ('cmhwz8img0003jw60ntmjbjew', NULL, 'cmhwvknlm0001jwauzd8qop5g', 'cmhwx4xz80000jw2m0eh5ib39', 'Ariba Farheen', 'seen@gmail.com', '+61 423092939', 'Asia/Calcutta', 'AU', false, true, false, '2025-11-13 05:16:51.385', '2025-11-13 05:21:50.212', false, NULL, NULL, NULL, NULL, '3AN9B8', NULL);
INSERT INTO public.registrations VALUES ('cmhwzhxuz0008jw6021mvprjt', NULL, 'cmhwvknlm0001jwauzd8qop5g', 'cmhwx4xz80000jw2m0eh5ib39', 'Ariba Farheen', 'sen@gmail.com', '+61 423092939', 'Asia/Calcutta', 'AU', false, true, false, '2025-11-13 05:24:11.036', '2025-11-13 05:29:10.549', true, '2025-11-13 05:29:15.867', '2025-11-13 05:29:15.867', NULL, NULL, '6JV9TP', NULL);
INSERT INTO public.registrations VALUES ('cmhwzpbl0000mjw60l848tljb', NULL, 'cmhwvknlm0001jwauzd8qop5g', 'cmhwx4xz80000jw2m0eh5ib39', 'Ard', 'dheen@gmail.com', '+61 423092939', 'Asia/Calcutta', 'AU', false, true, false, '2025-11-13 05:29:55.428', '2025-11-13 05:34:54.706', false, NULL, NULL, NULL, NULL, 'E2N9T2', NULL);
INSERT INTO public.registrations VALUES ('cmhwzu0xm000pjw60lycqrwh4', NULL, 'cmhwvknlm0001jwauzd8qop5g', 'cmhwx4xz80000jw2m0eh5ib39', 'Aribd', 'adheen@gmail.com', '+91 9310880027', 'Asia/Calcutta', 'AU', false, true, false, '2025-11-13 05:33:34.886', '2025-11-13 05:38:34.626', false, NULL, NULL, NULL, NULL, '93688G', NULL);
INSERT INTO public.registrations VALUES ('cmhwzd4380005jw6059a8u4en', NULL, 'cmhwvknlm0001jwauzd8qop5g', 'cmhwx4y0u0001jw2mby3l4jhw', 'Ariba Farheen', 'snpower@gmail.com', '+61 497687631', 'Asia/Calcutta', 'AU', false, true, false, '2025-11-13 05:20:25.828', '2025-11-13 05:30:00', true, '2025-11-13 05:38:03.995', '2025-11-13 05:38:03.995', NULL, NULL, 'VRC5W3', NULL);
INSERT INTO public.registrations VALUES ('cmhx0f9wu0002jw0yi82ffumn', NULL, 'cmhwvknlm0001jwauzd8qop5g', 'cmhwx4xz80000jw2m0eh5ib39', 'Ariba Farheen', 'sen@gmail.com', '+61 423092939', 'Asia/Calcutta', 'AU', false, true, false, '2025-11-13 05:50:06.31', '2025-11-13 05:55:05.79', false, NULL, NULL, NULL, NULL, 'S31HRA', NULL);
INSERT INTO public.registrations VALUES ('cmhx0tyyi0005jw0yhn65sdle', NULL, 'cmhwvknlm0001jwauzd8qop5g', 'cmhwx4xz80000jw2m0eh5ib39', 'Ariba Farheen', 'emaanpower@gmail.com', '+61 497687631', 'Asia/Calcutta', 'AU', false, true, false, '2025-11-13 06:01:31.934', '2025-11-13 06:06:31.564', true, '2025-11-13 06:08:18.6', '2025-11-13 06:08:18.6', NULL, NULL, 'BIOYMR', NULL);
INSERT INTO public.registrations VALUES ('cmhx12xu2000jjw0y7ig6ysre', NULL, 'cmhwvknlm0001jwauzd8qop5g', 'cmhwx4xz80000jw2m0eh5ib39', 'rheen', '1n@gmail.com', '+91 9310880027', 'Asia/Calcutta', 'AU', false, true, false, '2025-11-13 06:08:30.41', '2025-11-13 06:13:29.647', true, '2025-11-13 06:13:33.125', '2025-11-13 06:13:33.125', NULL, NULL, 'B6RMT4', NULL);
INSERT INTO public.registrations VALUES ('cmhx19qvk000xjw0ylruo67nc', NULL, 'cmhwvknlm0001jwauzd8qop5g', 'cmhwx4xz80000jw2m0eh5ib39', '11en', '1een@gmail.com', '+91 9310880027', 'Asia/Calcutta', 'AU', false, true, false, '2025-11-13 06:13:47.984', '2025-11-13 06:18:47.861', false, NULL, NULL, NULL, NULL, 'I8U9SE', NULL);
INSERT INTO public.registrations VALUES ('cmhx1h7a40002jwafrz9f5674', NULL, 'cmhwvknlm0001jwauzd8qop5g', 'cmhwx4xz80000jw2m0eh5ib39', '111', '1rheen@gmail.com', '+61 423092939', 'Asia/Calcutta', 'AU', false, true, false, '2025-11-13 06:19:35.825', '2025-11-13 06:24:35.398', false, NULL, NULL, NULL, NULL, 'JH3D93', NULL);
INSERT INTO public.registrations VALUES ('cmhx1qqvm0002jw96ldn16eaw', NULL, 'cmhwvknlm0001jwauzd8qop5g', 'cmhwx4xz80000jw2m0eh5ib39', '1a Farheen', 'seen@gmail.com', '+91 9310880027', 'Asia/Calcutta', 'AU', false, true, false, '2025-11-13 06:27:01.128', '2025-11-13 06:31:58.344', false, NULL, NULL, NULL, NULL, 'BQUG8J', NULL);
INSERT INTO public.registrations VALUES ('cmhx2mnd10002jw16gdve0mi1', NULL, 'cmhwvknlm0001jwauzd8qop5g', 'cmhwx4xz80000jw2m0eh5ib39', 'seen', 'sower@gmail.com', '+61 421977616', 'Asia/Calcutta', 'AU', false, true, false, '2025-11-13 06:51:49.562', '2025-11-13 06:56:46.628', true, '2025-11-13 07:02:04.089', '2025-11-13 07:02:04.089', NULL, NULL, 'H43WRL', NULL);
INSERT INTO public.registrations VALUES ('cmhx3u1u00002jwe8oxc7ltsu', NULL, 'cmhwvknlm0001jwauzd8qop5g', 'cmhwx4xz80000jw2m0eh5ib39', 'Ariba Farheen', 'srheen@gmail.com', '+61 423092939', 'Asia/Calcutta', 'AU', false, true, false, '2025-11-13 07:25:34.514', '2025-11-13 07:30:34.151', false, NULL, NULL, NULL, NULL, 'P0MK3U', NULL);
INSERT INTO public.registrations VALUES ('cmhx48mme0002jwwl6rf91fum', NULL, 'cmhwvknlm0001jwauzd8qop5g', 'cmhwx4xz80000jw2m0eh5ib39', 'Ariba Farheen', 'ariba.farheen@gmail.com', '+61 423092939', 'Asia/Calcutta', 'AU', false, true, false, '2025-11-13 07:36:54.646', '2025-11-13 07:41:54.197', true, '2025-11-13 07:53:13.93', '2025-11-13 07:53:13.93', NULL, NULL, 'JAK89O', NULL);
INSERT INTO public.registrations VALUES ('cmhx596zb0002jwlk6uwtp2g4', NULL, 'cmhwvknlm0001jwauzd8qop5g', 'cmhwx4xz80000jw2m0eh5ib39', 'sheen', 'sa.farheen@gmail.com', '+91 9310880027', 'Asia/Calcutta', 'AU', false, true, false, '2025-11-13 08:05:20.662', '2025-11-13 08:10:20.072', true, '2025-11-13 08:28:15.148', '2025-11-13 08:28:15.148', NULL, NULL, '7Y1Z8O', NULL);
INSERT INTO public.registrations VALUES ('cmhx71cv2000ejw30lt9pyejh', NULL, 'cmhwvknlm0001jwauzd8qop5g', 'cmhx5esp0000bjwlk0xbfkuvw', 'Asen', 'arisen@gmail.com', '+61 423092939', 'Asia/Calcutta', 'AU', false, true, false, '2025-11-13 08:55:14.268', '2025-11-13 09:00:13.782', true, '2025-11-13 09:01:39.002', '2025-11-13 09:01:39.002', NULL, NULL, '0QXQ3V', NULL);
INSERT INTO public.registrations VALUES ('cmhx9kfjd0002jw0439sxs0hc', NULL, 'cmhwvknlm0001jwauzd8qop5g', 'cmhx9383z0000jwydceaqvnsn', 'Ariba Farheen', '1er@gmail.com', '+61 497687631', 'Asia/Calcutta', 'AU', false, true, false, '2025-11-13 10:06:03.423', '2025-11-13 10:10:58.577', false, NULL, NULL, NULL, NULL, 'D8E297', NULL);
INSERT INTO public.registrations VALUES ('cmhx9l7am0005jw04l6qfvx21', NULL, 'cmhwvknlm0001jwauzd8qop5g', 'cmhx9383z0000jwydceaqvnsn', 'hello', 'hell1o@gmail.com', '+1', 'Asia/Calcutta', 'AU', false, true, false, '2025-11-13 10:06:39.402', '2025-11-13 10:11:38.699', false, NULL, NULL, NULL, NULL, 'YZADSV', NULL);


--
-- Data for Name: attendee_sessions; Type: TABLE DATA; Schema: public; Owner: aribafarheen
--

INSERT INTO public.attendee_sessions VALUES ('cmhwzoh1l000ejw60lcw65yjd', 'cmhwzhxuz0008jw6021mvprjt', 'cmhwvknlm0001jwauzd8qop5g', NULL, '2025-11-13 05:29:15.85', NULL, '2025-11-13 05:29:15.85', 0, 0, true, true, false, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 'desktop', 'Chrome', '2025-11-13 05:29:15.85', '2025-11-13 05:29:15.85');
INSERT INTO public.attendee_sessions VALUES ('cmhwzoh1l000gjw606clabam4', 'cmhwzhxuz0008jw6021mvprjt', 'cmhwvknlm0001jwauzd8qop5g', NULL, '2025-11-13 05:29:15.85', NULL, '2025-11-13 05:29:15.85', 0, 0, true, true, false, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 'desktop', 'Chrome', '2025-11-13 05:29:15.85', '2025-11-13 05:29:15.85');
INSERT INTO public.attendee_sessions VALUES ('cmhwzzsjy000xjw60b8klflyf', 'cmhwzd4380005jw6059a8u4en', 'cmhwvknlm0001jwauzd8qop5g', NULL, '2025-11-13 05:38:03.982', NULL, '2025-11-13 05:38:03.982', 0, 0, true, true, false, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 'desktop', 'Chrome', '2025-11-13 05:38:03.982', '2025-11-13 05:38:03.982');
INSERT INTO public.attendee_sessions VALUES ('cmhwzzsjy000vjw60vqqmmg3i', 'cmhwzd4380005jw6059a8u4en', 'cmhwvknlm0001jwauzd8qop5g', NULL, '2025-11-13 05:38:03.982', NULL, '2025-11-13 05:38:03.982', 0, 0, true, true, false, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 'desktop', 'Chrome', '2025-11-13 05:38:03.982', '2025-11-13 05:38:03.982');
INSERT INTO public.attendee_sessions VALUES ('cmhx12opo000djw0yrl7vvu5o', 'cmhx0tyyi0005jw0yhn65sdle', 'cmhwvknlm0001jwauzd8qop5g', NULL, '2025-11-13 06:08:18.583', NULL, '2025-11-13 06:08:18.583', 0, 0, true, true, false, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 'desktop', 'Chrome', '2025-11-13 06:08:18.583', '2025-11-13 06:08:18.583');
INSERT INTO public.attendee_sessions VALUES ('cmhx12opo000bjw0yfw888gna', 'cmhx0tyyi0005jw0yhn65sdle', 'cmhwvknlm0001jwauzd8qop5g', NULL, '2025-11-13 06:08:18.583', NULL, '2025-11-13 06:08:18.583', 0, 0, true, true, false, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 'desktop', 'Chrome', '2025-11-13 06:08:18.583', '2025-11-13 06:08:18.583');
INSERT INTO public.attendee_sessions VALUES ('cmhx19feh000njw0yxl3kj78u', 'cmhx12xu2000jjw0y7ig6ysre', 'cmhwvknlm0001jwauzd8qop5g', NULL, '2025-11-13 06:13:33.112', NULL, '2025-11-13 06:13:33.112', 0, 0, true, true, false, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 'desktop', 'Chrome', '2025-11-13 06:13:33.112', '2025-11-13 06:13:33.112');
INSERT INTO public.attendee_sessions VALUES ('cmhx19fef000ljw0yj9d9sgih', 'cmhx12xu2000jjw0y7ig6ysre', 'cmhwvknlm0001jwauzd8qop5g', NULL, '2025-11-13 06:13:33.111', NULL, '2025-11-13 06:13:33.111', 0, 0, true, true, false, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 'desktop', 'Chrome', '2025-11-13 06:13:33.111', '2025-11-13 06:13:33.111');
INSERT INTO public.attendee_sessions VALUES ('cmhx2ztis0008jweiguk1pj9h', 'cmhx2mnd10002jw16gdve0mi1', 'cmhwvknlm0001jwauzd8qop5g', NULL, '2025-11-13 07:02:04.084', NULL, '2025-11-13 07:02:04.084', 0, 0, true, true, false, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 'desktop', 'Chrome', '2025-11-13 07:02:04.084', '2025-11-13 07:02:04.084');
INSERT INTO public.attendee_sessions VALUES ('cmhx2ztis0007jweikouw7tbh', 'cmhx2mnd10002jw16gdve0mi1', 'cmhwvknlm0001jwauzd8qop5g', NULL, '2025-11-13 07:02:04.084', NULL, '2025-11-13 07:02:04.084', 0, 0, true, true, false, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 'desktop', 'Chrome', '2025-11-13 07:02:04.084', '2025-11-13 07:02:04.084');
INSERT INTO public.attendee_sessions VALUES ('cmhx4tm7l0008jwwl1od5cv00', 'cmhx48mme0002jwwl6rf91fum', 'cmhwvknlm0001jwauzd8qop5g', NULL, '2025-11-13 07:53:13.906', NULL, '2025-11-13 07:53:13.906', 0, 0, true, true, false, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 'desktop', 'Chrome', '2025-11-13 07:53:13.906', '2025-11-13 07:53:13.906');
INSERT INTO public.attendee_sessions VALUES ('cmhx4tm7l0006jwwl7btj2nue', 'cmhx48mme0002jwwl6rf91fum', 'cmhwvknlm0001jwauzd8qop5g', NULL, '2025-11-13 07:53:13.905', NULL, '2025-11-13 07:53:13.905', 0, 0, true, true, false, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 'desktop', 'Chrome', '2025-11-13 07:53:13.905', '2025-11-13 07:53:13.905');
INSERT INTO public.attendee_sessions VALUES ('cmhx62nfg0005jw306xl07hil', 'cmhx596zb0002jwlk6uwtp2g4', 'cmhwvknlm0001jwauzd8qop5g', NULL, '2025-11-13 08:28:14.97', NULL, '2025-11-13 08:28:14.97', 0, 0, true, true, false, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 'desktop', 'Chrome', '2025-11-13 08:28:14.97', '2025-11-13 08:28:14.97');
INSERT INTO public.attendee_sessions VALUES ('cmhx62ngs0007jw3068jhm7dp', 'cmhx596zb0002jwlk6uwtp2g4', 'cmhwvknlm0001jwauzd8qop5g', NULL, '2025-11-13 08:28:14.97', NULL, '2025-11-13 08:28:14.97', 0, 0, true, true, false, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 'desktop', 'Chrome', '2025-11-13 08:28:14.97', '2025-11-13 08:28:14.97');
INSERT INTO public.attendee_sessions VALUES ('cmhx79loo000kjw30vuil67rm', 'cmhx71cv2000ejw30lt9pyejh', 'cmhwvknlm0001jwauzd8qop5g', NULL, '2025-11-13 09:01:38.953', NULL, '2025-11-13 09:01:38.953', 0, 0, true, true, false, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 'desktop', 'Chrome', '2025-11-13 09:01:38.953', '2025-11-13 09:01:38.953');
INSERT INTO public.attendee_sessions VALUES ('cmhx79loo000mjw30xz71llk4', 'cmhx71cv2000ejw30lt9pyejh', 'cmhwvknlm0001jwauzd8qop5g', NULL, '2025-11-13 09:01:38.953', NULL, '2025-11-13 09:01:38.953', 0, 0, true, true, false, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 'desktop', 'Chrome', '2025-11-13 09:01:38.953', '2025-11-13 09:01:38.953');


--
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: aribafarheen
--



--
-- Data for Name: countdown_pages; Type: TABLE DATA; Schema: public; Owner: aribafarheen
--



--
-- Data for Name: countdown_templates; Type: TABLE DATA; Schema: public; Owner: aribafarheen
--

INSERT INTO public.countdown_templates VALUES ('cmhwuzjl5001vjwdkl51m6unu', 'GREEN', '', '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{webinarTitle}} - Starts Soon</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --primary: #4a3b6b;
            --secondary: #2c7a7b;
            --accent: #d53f8c;
            --gold: #d69e2e;
            --dark: #1a202c;
            --light: #f7fafc;
            --white: #ffffff;
            --gray: #718096;
            --greenish: #2d5a5d;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: ''Poppins'', sans-serif;
            line-height: 1.5;
            color: var(--dark);
            background: var(--light);
            min-height: 100vh;
            overflow-x: hidden;
        }
        
        .container {
            width: 100%;
            padding: 0 15px;
            max-width: 800px;
            margin: 0 auto;
        }
        
        /* Header with consistent colors */
        .header {
            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
            color: var(--white);
            padding: 20px 0;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '''';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url("data:image/svg+xml,%3Csvg width=''100'' height=''100'' viewBox=''0 0 100 100'' xmlns=''http://www.w3.org/2000/svg''%3E%3Cpath d=''M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z'' fill=''%23ffffff'' fill-opacity=''0.1'' fill-rule=''evenodd''/%3E%3C/svg%3E");
            animation: float 20s ease-in-out infinite;
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-5px); }
        }
        
        .webinar-status {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: var(--accent);
            color: var(--white);
            font-weight: 600;
            padding: 5px 12px;
            border-radius: 15px;
            font-size: 0.75rem;
            margin-bottom: 10px;
            box-shadow: 0 3px 10px rgba(213, 63, 140, 0.3);
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.03); }
            100% { transform: scale(1); }
        }
        
        .title {
            font-family: ''Playfair Display'', serif;
            font-size: 1.4rem;
            font-weight: 800;
            line-height: 1.2;
            margin-bottom: 8px;
            text-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        
        .subtitle {
            font-size: 0.85rem;
            font-weight: 300;
            margin-bottom: 12px;
            opacity: 0.95;
            max-width: 350px;
            margin-left: auto;
            margin-right: auto;
        }
        
        /* Countdown with consistent colors */
        .countdown-section {
            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
            padding: 15px 0;
            text-align: center;
            position: relative;
            box-shadow: 0 3px 10px rgba(0,0,0,0.1);
        }
        
        .countdown-section::before {
            content: '''';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url("data:image/svg+xml,%3Csvg width=''60'' height=''60'' viewBox=''0 0 60 60'' xmlns=''http://www.w3.org/2000/svg''%3E%3Cg fill=''none'' fill-rule=''evenodd''%3E%3Cg fill=''%23ffffff'' fill-opacity=''0.05''%3E%3Cpath d=''M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z''/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        
        .countdown-title {
            font-size: 1.1rem;
            font-weight: 700;
            color: var(--white);
            margin-bottom: 8px;
            text-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        
        .webinar-date {
            font-size: 0.8rem;
            color: var(--white);
            margin-bottom: 12px;
            background: rgba(255,255,255,0.15);
            display: inline-block;
            padding: 5px 12px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
            box-shadow: 0 3px 10px rgba(0,0,0,0.1);
        }
        
        .countdown {
            display: flex;
            justify-content: center;
            gap: 8px;
            margin-bottom: 5px;
            flex-wrap: wrap;
        }
        
        .countdown-item {
            background: var(--white);
            color: var(--primary);
            border-radius: 8px;
            padding: 8px 6px;
            min-width: 50px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.15);
            border: 2px solid var(--gold);
            transition: all 0.3s ease;
        }
        
        .countdown-item:hover {
            transform: translateY(-2px) scale(1.05);
            box-shadow: 0 8px 20px rgba(0,0,0,0.2);
        }
        
        .countdown-value {
            font-size: 1.3rem;
            font-weight: 800;
            line-height: 1;
            display: block;
            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .countdown-label {
            font-size: 0.6rem;
            text-transform: uppercase;
            margin-top: 3px;
            color: var(--gray);
            font-weight: 600;
            letter-spacing: 0.5px;
        }
        
        /* Content Section with consistent colors */
        .content-section {
            padding: 20px 0;
            background: var(--white);
        }
        
        .content-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 20px;
            max-width: 700px;
            margin: 0 auto;
        }
        
        .video-container {
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 8px 20px rgba(0,0,0,0.12);
            position: relative;
            background: var(--white);
        }
        
        .video-wrapper {
            position: relative;
            width: 100%;
            height: 0;
            padding-bottom: 56.25%; /* 16:9 aspect ratio */
            overflow: hidden;
        }
        
        .video-player {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .video-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: var(--white);
            background: rgba(0, 0, 0, 0.3);
            transition: opacity 0.3s ease;
            z-index: 1;
            pointer-events: none;
        }
        
        .video-overlay.hidden {
            opacity: 0;
            pointer-events: none;
        }
        
        .video-controls {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
            padding: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            opacity: 0;
            transition: opacity 0.3s ease;
            z-index: 50;
        }
        
        .video-container:hover .video-controls {
            opacity: 1;
        }
        
        .video-control-btn {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: var(--white);
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .video-control-btn:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: scale(1.1);
        }
        
        .video-progress {
            flex: 1;
            height: 4px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 2px;
            margin: 0 15px;
            position: relative;
            cursor: pointer;
        }
        
        .video-progress-filled {
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            background: var(--accent);
            border-radius: 2px;
            width: 0%;
        }
        
        .unmute-prompt {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.7);
            color: var(--white);
            padding: 10px 20px;
            border-radius: 30px;
            font-size: 0.9rem;
            display: flex;
            align-items: center;
            gap: 10px;
            cursor: pointer;
            transition: all 0.3s ease;
            z-index: 100;
            opacity: 1;
            pointer-events: auto;
        }
        
        .unmute-prompt.hidden {
            opacity: 0;
            pointer-events: none;
        }
        
        .unmute-prompt:hover {
            background: rgba(0, 0, 0, 0.8);
            transform: translate(-50%, -50%) scale(1.05);
        }
        
        .unmute-prompt i {
            font-size: 1.2rem;
        }
        
        .video-text {
            font-size: 0.85rem;
            font-weight: 500;
            text-align: center;
            max-width: 85%;
            padding: 0 10px;
            text-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        
        /* Greenish background below video */
        .video-greenish-bg {
            background: linear-gradient(135deg, var(--greenish) 0%, #3a6b6e 100%);
            padding: 15px;
            border-radius: 0 0 12px 12px;
            position: relative;
            z-index: -1;
        }
        
        .greenish-content {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
            color: var(--white);
        }
        
        .greenish-icon {
            font-size: 1.5rem;
            color: var(--gold);
        }
        
        .greenish-text {
            font-size: 0.9rem;
            font-weight: 500;
            text-align: center;
        }
        
        .bonus-card {
            background: var(--light);
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 8px 20px rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
            gap: 15px;
            position: relative;
            border: 2px solid var(--secondary);
        }
        
        .bonus-image-container {
            position: relative;
            width: 120px;
            height: 120px;
            flex-shrink: 0;
        }
        
        .bonus-image {
            width: 100%;
            height: 100%;
            border-radius: 10px;
            object-fit: cover;
            box-shadow: 0 5px 15px rgba(0,0,0,0.15);
            transition: all 0.3s ease;
        }
        
        .bonus-image:hover {
            transform: translateY(-3px) rotate(2deg);
            box-shadow: 0 8px 20px rgba(0,0,0,0.2);
        }
        
        .bonus-badge {
            position: absolute;
            top: -8px;
            right: -8px;
            background: var(--accent);
            color: var(--white);
            padding: 4px 8px;
            border-radius: 12px;
            font-weight: 700;
            font-size: 0.65rem;
            box-shadow: 0 3px 10px rgba(213, 63, 140, 0.3);
            transform: rotate(15deg);
        }
        
        .bonus-text {
            flex: 1;
        }
        
        .bonus-title {
            font-size: 1rem;
            font-weight: 700;
            color: var(--primary);
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .bonus-description {
            font-size: 0.8rem;
            color: var(--dark);
            line-height: 1.4;
            margin-bottom: 8px;
        }
        
        .value-tag {
            display: inline-block;
            background: var(--gold);
            color: var(--white);
            font-weight: 700;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 0.7rem;
            box-shadow: 0 3px 10px rgba(214, 158, 46, 0.3);
        }
        
        /* Action Section with consistent colors */
        .action-section {
            padding: 20px 0;
            background: var(--light);
        }
        
        .action-content {
            text-align: center;
            max-width: 500px;
            margin: 0 auto;
        }
        
        .action-title {
            font-size: 1.2rem;
            font-weight: 700;
            color: var(--primary);
            margin-bottom: 10px;
        }
        
        .action-description {
            font-size: 0.85rem;
            color: var(--dark);
            line-height: 1.4;
            margin-bottom: 15px;
            font-style: italic;
        }
        
        .action-buttons {
            display: flex;
            justify-content: center;
            gap: 10px;
            flex-wrap: wrap;
            margin-bottom: 15px;
        }
        
        .action-button {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 0.85rem;
            font-weight: 600;
            padding: 8px 16px;
            border-radius: 20px;
            text-decoration: none;
            transition: all 0.3s ease;
            min-width: 120px;
            justify-content: center;
            box-shadow: 0 3px 10px rgba(0,0,0,0.1);
            border: none;
            cursor: pointer;
        }
        
        .reminder-button {
            background: var(--accent);
            color: var(--white);
        }
        
        .reminder-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(213, 63, 140, 0.3);
        }
        
        .whatsapp-button {
            background: var(--secondary);
            color: var(--white);
        }
        
        .whatsapp-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(44, 122, 123, 0.3);
        }
        
        .facebook-button {
            background: var(--primary);
            color: var(--white);
        }
        
        .facebook-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(74, 59, 107, 0.3);
        }
        
        /* Footer with consistent colors */
        .footer {
            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
            color: var(--white);
            padding: 15px 0;
            text-align: center;
            position: relative;
        }
        
        .footer::before {
            content: '''';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url("data:image/svg+xml,%3Csvg width=''60'' height=''60'' viewBox=''0 0 60 60'' xmlns=''http://www.w3.org/2000/svg''%3E%3Cg fill=''none'' fill-rule=''evenodd''%3E%3Cg fill=''%23ffffff'' fill-opacity=''0.05''%3E%3Cpath d=''M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z''/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        
        .footer-content {
            position: relative;
        }
        
        .footer-title {
            font-family: ''Playfair Display'', serif;
            font-size: 1.1rem;
            font-weight: 700;
            margin-bottom: 8px;
        }
        
        .footer-description {
            font-size: 0.8rem;
            margin-bottom: 10px;
            max-width: 400px;
            margin-left: auto;
            margin-right: auto;
        }
        
        .contact-info {
            display: flex;
            justify-content: center;
            gap: 15px;
            flex-wrap: wrap;
            margin-bottom: 8px;
        }
        
        .contact-item {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 0.75rem;
        }
        
        .contact-item i {
            color: var(--gold);
        }
        
        .copyright {
            font-size: 0.7rem;
            opacity: 0.8;
        }
        
        /* Responsive Design */
        @media (min-width: 768px) {
            .header {
                padding: 25px 0;
            }
            
            .title {
                font-size: 1.6rem;
            }
            
            .subtitle {
                font-size: 0.9rem;
            }
            
            .countdown-section {
                padding: 20px 0;
            }
            
            .countdown-title {
                font-size: 1.2rem;
            }
            
            .webinar-date {
                font-size: 0.85rem;
                padding: 6px 15px;
            }
            
            .countdown {
                gap: 10px;
            }
            
            .countdown-item {
                min-width: 55px;
                padding: 10px 8px;
            }
            
            .countdown-value {
                font-size: 1.5rem;
            }
            
            .countdown-label {
                font-size: 0.65rem;
            }
            
            .content-section {
                padding: 25px 0;
            }
            
            .content-grid {
                grid-template-columns: 1fr 1fr;
                gap: 25px;
            }
            
            .video-text {
                font-size: 0.9rem;
            }
            
            .bonus-image-container {
                width: 140px;
                height: 140px;
            }
            
            .bonus-title {
                font-size: 1.1rem;
            }
            
            .bonus-description {
                font-size: 0.85rem;
            }
            
            .action-section {
                padding: 25px 0;
            }
            
            .action-title {
                font-size: 1.3rem;
            }
            
            .action-description {
                font-size: 0.9rem;
            }
            
            .action-button {
                font-size: 0.9rem;
                padding: 10px 20px;
                min-width: 130px;
            }
            
            .footer {
                padding: 20px 0;
            }
            
            .footer-title {
                font-size: 1.2rem;
            }
            
            .footer-description {
                font-size: 0.85rem;
            }
        }
    </style>
</head>
<body>
    <!-- Header -->
    <header class="header">
        <div class="container">
            <div class="webinar-status">
                <i class="fas fa-clock"></i> STARTING SOON
            </div>
            <h1 class="title">{{webinarTitle}}</h1>
            <p class="subtitle">{{webinarDescription}}</p>
        </div>
    </header>
    
    <!-- Countdown Section -->
    <section class="countdown-section">
        <div class="container">
            <h2 class="countdown-title">Webinar Starts In</h2>
            <div class="webinar-date">
                <i class="fas fa-calendar-alt"></i> {{webinarDate}} at {{webinarTime}}
            </div>
            <div class="countdown">
                <div class="countdown-item">
                    <span class="countdown-value" id="days">00</span>
                    <span class="countdown-label">Days</span>
                </div>
                <div class="countdown-item">
                    <span class="countdown-value" id="hours">00</span>
                    <span class="countdown-label">Hours</span>
                </div>
                <div class="countdown-item">
                    <span class="countdown-value" id="minutes">00</span>
                    <span class="countdown-label">Minutes</span>
                </div>
                <div class="countdown-item">
                    <span class="countdown-value" id="seconds">00</span>
                    <span class="countdown-label">Seconds</span>
                </div>
            </div>
        </div>
    </section>
    
    <!-- Content Section -->
    <section class="content-section">
        <div class="container">
            <div class="content-grid">
                <div class="video-container">
                    <div class="video-wrapper">
                        <video 
                            class="video-player" 
                            id="webinarVideo"
                            autoplay 
                            loop 
                            muted 
                            playsinline
                            poster="https://picsum.photos/seed/video-poster/800/450.jpg">
                            <source src="https://player.vimeo.com/progressive_redirect/playback/1114587642/rendition/720p/file.mp4%20%28720p%29.mp4?loc=external&signature=5597f1cc4f49f5032b6e80bfdcad3bae12479713da0efcff861e2330dbde0eca" type="video/mp4">
                            Your browser does not support video tag.
                        </video>
                        
                        <div class="unmute-prompt" id="unmutePrompt">
                            <i class="fas fa-volume-mute"></i>
                            <span>Click to unmute</span>
                        </div>
                        
                        <div class="video-controls">
                            <button class="video-control-btn" id="playPauseBtn">
                                <i class="fas fa-pause"></i>
                            </button>
                            <div class="video-progress" id="videoProgress">
                                <div class="video-progress-filled" id="videoProgressFilled"></div>
                            </div>
                            <button class="video-control-btn" id="muteBtn">
                                <i class="fas fa-volume-mute"></i>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Greenish background below video -->
                    <div class="video-greenish-bg">
                        <div class="greenish-content">
                            <i class="fas fa-quote-left greenish-icon"></i>
                            <p class="greenish-text">"This webinar transformed my perspective and gave me practical tools to improve my life."</p>
                        </div>
                    </div>
                </div>
                
                <div class="bonus-card">
                    <div class="bonus-image-container">
                        <img src="/uploads/1763011387006-tdqy06asbrg6lj3n66lbkw.png" alt="Bonus Gift" class="bonus-image">
                        <div class="bonus-badge">FREE</div>
                    </div>
                    <div class="bonus-text">
                        <div class="bonus-title">
                            <i class="fas fa-gift"></i> Exclusive Bonus Gift
                        </div>
                        <p class="bonus-description">
                            Join us for this transformative webinar and receive an exclusive bonus gift that will enhance your learning experience.
                        </p>
                        <span class="value-tag">Yours FREE</span>
                    </div>
                </div>
            </div>
        </div>
    </section>
    
    <!-- Action Section -->
    <section class="action-section">
        <div class="container">
            <div class="action-content">
                <h2 class="action-title">Don''t Miss This Event</h2>
                <p class="action-description">
                    Set a reminder so you don''t miss this transformative webinar
                </p>
                <div class="action-buttons">
                    <button class="action-button reminder-button" onclick="setReminder()">
                        <i class="fas fa-bell"></i> Set Reminder
                    </button>
                    <a href="#" class="action-button whatsapp-button" onclick="shareOnWhatsApp(); return false;">
                        <i class="fab fa-whatsapp"></i> Share
                    </a>
                    <a href="#" class="action-button facebook-button" onclick="shareOnFacebook(); return false;">
                        <i class="fab fa-facebook-f"></i> Share
                    </a>
                </div>
            </div>
        </div>
    </section>
    
    <!-- Footer -->
    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <p class="copyright">
                    © {{currentYear}}. All rights reserved.
                </p>
            </div>
        </div>
    </footer>
    
    <script>
        {{countdown}}
    </script>
    
    <script>
        // Video controls
        document.addEventListener(''DOMContentLoaded'', function() {
            const video = document.getElementById(''webinarVideo'');
            const playPauseBtn = document.getElementById(''playPauseBtn'');
            const muteBtn = document.getElementById(''muteBtn'');
            const unmutePrompt = document.getElementById(''unmutePrompt'');
            const videoProgress = document.getElementById(''videoProgress'');
            const videoProgressFilled = document.getElementById(''videoProgressFilled'');
            
            // Update play/pause button
            function updatePlayPauseBtn() {
                if (video.paused) {
                    playPauseBtn.innerHTML = ''<i class="fas fa-play"></i>'';
                } else {
                    playPauseBtn.innerHTML = ''<i class="fas fa-pause"></i>'';
                }
            }
            
            // Update mute button and unmute prompt
            function updateMuteBtn() {
                if (video.muted) {
                    muteBtn.innerHTML = ''<i class="fas fa-volume-mute"></i>'';
                    unmutePrompt.classList.remove(''hidden'');
                } else {
                    muteBtn.innerHTML = ''<i class="fas fa-volume-up"></i>'';
                    unmutePrompt.classList.add(''hidden'');
                }
            }
            
            // Update progress bar
            function updateProgress() {
                if (video.duration) {
                    const progress = (video.currentTime / video.duration) * 100;
                    videoProgressFilled.style.width = progress + ''%'';
                }
            }
            
            // Play/pause button click
            playPauseBtn.addEventListener(''click'', function() {
                if (video.paused) {
                    video.play().catch(function(error) {
                        console.log("Play error:", error);
                    });
                } else {
                    video.pause();
                }
                updatePlayPauseBtn();
            });
            
            // Mute button click
            muteBtn.addEventListener(''click'', function() {
                video.muted = !video.muted;
                updateMuteBtn();
            });
            
            // Unmute prompt click - Improved version
            unmutePrompt.addEventListener(''click'', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log(''Unmute button clicked!'');
                video.muted = false;
                updateMuteBtn();
            }, { capture: true });
            
            // Progress bar click
            videoProgress.addEventListener(''click'', function(e) {
                if (video.duration) {
                    const rect = videoProgress.getBoundingClientRect();
                    const pos = (e.clientX - rect.left) / rect.width;
                    video.currentTime = pos * video.duration;
                }
            });
            
            // Video events
            video.addEventListener(''timeupdate'', updateProgress);
            video.addEventListener(''play'', updatePlayPauseBtn);
            video.addEventListener(''pause'', updatePlayPauseBtn);
            video.addEventListener(''volumechange'', updateMuteBtn);
            video.addEventListener(''loadedmetadata'', updateProgress);
            
            // Initialize
            updatePlayPauseBtn();
            updateMuteBtn();
            
            // Handle mobile autoplay restrictions
            video.play().catch(function(error) {
                console.log("Autoplay prevented:", error);
                // Show play button if autoplay is prevented
                playPauseBtn.innerHTML = ''<i class="fas fa-play"></i>'';
            });
        });
    </script>
    
    <script>
        // Share on WhatsApp function
        function shareOnWhatsApp() {
            const shareText = "Assalam aleykum sister,\n\nI found this FREE class for moms that I am sure you''ll love.\n\nIt''s about how to help our kids love Islam, without forcing them, even in a world that is pulling them away. It gave me so much hope and a new strategy to follow (something I never heard from anyone else before), so I thought of you.\n\nHere''s the link to reserve a FREE spot \n" + "{{referralLink}}";
            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
            window.open(whatsappUrl, ''_blank'');
        }
        // Share on Facebook function
        function shareOnFacebook() {
            const shareUrl = "https://www.facebook.com/sharer/sharer.php?u={{referralLink}}";
            window.open(shareUrl, ''_blank'', ''width=600,height=400'');
        }
        
        // Set reminder function
        function setReminder() {
            const webinarTitle = "{{webinarTitle}}";
            const webinarDescription = "{{webinarDescription}}";
            
            // This will be populated by the system with actual webinar date
            const targetDate = new Date("{{webinarStartDateTime}}");
            
            // Format date for calendar
            const startDate = targetDate.toISOString().replace(/-|:|\.\d\d\d/g, "");
            const endDate = new Date(targetDate.getTime() + {{webinarDuration}} * 60000).toISOString().replace(/-|:|\.\d\d\d/g, "");
            
            // Create Google Calendar link
            const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(webinarTitle)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(webinarDescription)}&location=Online`;
            
            // Open in new window
            window.open(googleCalendarUrl, ''_blank'');
        }
    </script>
</body>
</html>', NULL, false, '2025-11-13 03:17:54.233', '2025-11-13 08:57:02.723');


--
-- Data for Name: engagement_events; Type: TABLE DATA; Schema: public; Owner: aribafarheen
--

INSERT INTO public.engagement_events VALUES ('cmhwzohs7000ijw60lqijymgj', 'cmhwzoh1l000gjw606clabam4', 'cmhwvknlm0001jwauzd8qop5g', 'offer_view', '{"offerTitle":"The Shepherd''s Coaching Roadmap ","offerId":"cmhwyivfs0001jwwbgbe36367"}', 1, '2025-11-13 05:29:16.807');
INSERT INTO public.engagement_events VALUES ('cmhx12pc4000fjw0y4km40fwf', 'cmhx12opo000bjw0yfw888gna', 'cmhwvknlm0001jwauzd8qop5g', 'offer_view', '{"offerTitle":"The Shepherd''s Coaching Roadmap ","offerId":"cmhwyivfs0001jwwbgbe36367"}', 1, '2025-11-13 06:08:19.396');
INSERT INTO public.engagement_events VALUES ('cmhx19g6f000tjw0yjaifnb5l', 'cmhx19feh000njw0yxl3kj78u', 'cmhwvknlm0001jwauzd8qop5g', 'offer_view', '{"offerTitle":"The Shepherd''s Coaching Roadmap ","offerId":"cmhwyivfs0001jwwbgbe36367"}', 1, '2025-11-13 06:13:34.119');
INSERT INTO public.engagement_events VALUES ('cmhx79nab000ojw30gm8zxhy3', 'cmhx79loo000mjw30xz71llk4', 'cmhwvknlm0001jwauzd8qop5g', 'offer_view', '{"offerTitle":"The Shepherd''s Coaching Roadmap ","offerId":"cmhwyivfs0001jwwbgbe36367"}', 1, '2025-11-13 09:01:41.028');
INSERT INTO public.engagement_events VALUES ('cmhx7tn3t000vjw3036olws7i', 'cmhx79loo000kjw30vuil67rm', 'cmhwvknlm0001jwauzd8qop5g', 'offer_click', '{"offerTitle":"The Shepherd''s Coaching Roadmap ","ctaUrl":"https://www.unshakeablemuslims.com/roadmap"}', 933, '2025-11-13 09:17:13.913');


--
-- Data for Name: images; Type: TABLE DATA; Schema: public; Owner: aribafarheen
--

INSERT INTO public.images VALUES ('jl7yqeqbr5dywsws0eudl2cfvphczxmrufz1niz2p97', '1763011387006-tdqy06asbrg6lj3n66lbkw.png', 'book and me.png', '/uploads/1763011387006-tdqy06asbrg6lj3n66lbkw.png', 569239, 'image/png', 512, 819, 'cmhwvev380000jw96jkk00geq', NULL, NULL, '2025-11-13 05:23:07.226', '2025-11-13 05:23:07.226');


--
-- Data for Name: offer_analytics; Type: TABLE DATA; Schema: public; Owner: aribafarheen
--

INSERT INTO public.offer_analytics VALUES ('cmhwzohsn000jjw60x98ttvmm', 'cmhwvknlm0001jwauzd8qop5g', 'cmhwzhxuz0008jw6021mvprjt', 'The Shepherd''s Coaching Roadmap ', 'https://www.unshakeablemuslims.com/roadmap', true, '2025-11-13 05:29:16.827', false, NULL, 1, false, NULL, '2025-11-13 05:29:16.823', '2025-11-13 05:29:16.828');
INSERT INTO public.offer_analytics VALUES ('cmhx12pcc000gjw0yweaud0ur', 'cmhwvknlm0001jwauzd8qop5g', 'cmhx0tyyi0005jw0yhn65sdle', 'The Shepherd''s Coaching Roadmap ', 'https://www.unshakeablemuslims.com/roadmap', true, '2025-11-13 06:08:19.405', false, NULL, 1, false, NULL, '2025-11-13 06:08:19.404', '2025-11-13 06:08:19.406');
INSERT INTO public.offer_analytics VALUES ('cmhx19g6f000ujw0ymf7oqx46', 'cmhwvknlm0001jwauzd8qop5g', 'cmhx12xu2000jjw0y7ig6ysre', 'The Shepherd''s Coaching Roadmap ', 'https://www.unshakeablemuslims.com/roadmap', true, '2025-11-13 06:13:34.12', false, NULL, 1, false, NULL, '2025-11-13 06:13:34.119', '2025-11-13 06:13:34.121');
INSERT INTO public.offer_analytics VALUES ('cmhx79nah000pjw30rgtg7xmi', 'cmhwvknlm0001jwauzd8qop5g', 'cmhx71cv2000ejw30lt9pyejh', 'The Shepherd''s Coaching Roadmap ', 'https://www.unshakeablemuslims.com/roadmap', true, '2025-11-13 09:01:41.037', true, '2025-11-13 09:17:13.916', 1, false, NULL, '2025-11-13 09:01:41.034', '2025-11-13 09:17:13.917');


--
-- Data for Name: page_visits; Type: TABLE DATA; Schema: public; Owner: aribafarheen
--

INSERT INTO public.page_visits VALUES ('cmhwz7j5y0000jw60zvivjvq9', NULL, NULL, 'cmhwvknlm0001jwauzd8qop5g', 'f567ec74-7474-4f2c-a315-dcda64deeaaf', 'registration', 'cmhwuq3mg0000jw0hsr1dzljm', NULL, '2025-11-13 05:16:05.422', NULL, NULL, NULL, NULL, NULL, NULL, 'desktop', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, '2025-11-13 05:16:05.422');
INSERT INTO public.page_visits VALUES ('cmhwz8byi0001jw607boghc9l', NULL, NULL, 'cmhwvknlm0001jwauzd8qop5g', 'a07c332d-6e7a-483a-bf07-ce75c120d444', 'registration', 'cmhwuq3mg0000jw0hsr1dzljm', NULL, '2025-11-13 05:16:42.762', NULL, NULL, NULL, NULL, NULL, NULL, 'desktop', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, '2025-11-13 05:16:42.762');
INSERT INTO public.page_visits VALUES ('cmhwzht7g0006jw60gu4u0t54', NULL, NULL, 'cmhwvknlm0001jwauzd8qop5g', 'f567ec74-7474-4f2c-a315-dcda64deeaaf', 'registration', 'cmhwuq3mg0000jw0hsr1dzljm', NULL, '2025-11-13 05:24:05.02', NULL, NULL, NULL, NULL, NULL, NULL, 'desktop', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, '2025-11-13 05:24:05.02');
INSERT INTO public.page_visits VALUES ('cmhwzoh1g000cjw60j3wtywi9', NULL, 'cmhwzhxuz0008jw6021mvprjt', 'cmhwvknlm0001jwauzd8qop5g', 'f567ec74-7474-4f2c-a315-dcda64deeaaf', 'webinar', NULL, NULL, '2025-11-13 05:29:15.845', '2025-11-13 05:29:15.863', 0, 'http://localhost:3001/countdown/how-to-help-your-child-love-islam-without-force-ev?r=cmhwzhxuz0008jw6021mvprjt&s=cmhwx4xz80000jw2m0eh5ib39', NULL, NULL, NULL, 'desktop', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, '2025-11-13 05:29:15.845');
INSERT INTO public.page_visits VALUES ('cmhwzp5mq000kjw60egaio5m6', NULL, NULL, 'cmhwvknlm0001jwauzd8qop5g', 'f567ec74-7474-4f2c-a315-dcda64deeaaf', 'registration', 'cmhwuq3mg0000jw0hsr1dzljm', NULL, '2025-11-13 05:29:47.714', NULL, NULL, NULL, NULL, NULL, NULL, 'desktop', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, '2025-11-13 05:29:47.714');
INSERT INTO public.page_visits VALUES ('cmhwztvld000njw60zlg73i96', NULL, NULL, 'cmhwvknlm0001jwauzd8qop5g', 'f567ec74-7474-4f2c-a315-dcda64deeaaf', 'registration', 'cmhwuq3mg0000jw0hsr1dzljm', NULL, '2025-11-13 05:33:27.986', NULL, NULL, NULL, NULL, NULL, NULL, 'desktop', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, '2025-11-13 05:33:27.986');
INSERT INTO public.page_visits VALUES ('cmhwzzsje000rjw60bzirjvet', NULL, 'cmhwzd4380005jw6059a8u4en', 'cmhwvknlm0001jwauzd8qop5g', 'f567ec74-7474-4f2c-a315-dcda64deeaaf', 'webinar', NULL, NULL, '2025-11-13 05:38:03.962', NULL, NULL, 'http://localhost:3001/countdown/how-to-help-your-child-love-islam-without-force-ev?r=cmhwzd4380005jw6059a8u4en&s=cmhwx4y0u0001jw2mby3l4jhw', NULL, NULL, NULL, 'desktop', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, '2025-11-13 05:38:03.962');
INSERT INTO public.page_visits VALUES ('cmhwzoh1g000bjw609nqis6wi', NULL, 'cmhwzhxuz0008jw6021mvprjt', 'cmhwvknlm0001jwauzd8qop5g', 'f567ec74-7474-4f2c-a315-dcda64deeaaf', 'webinar', NULL, NULL, '2025-11-13 05:29:15.845', '2025-11-13 05:38:03.986', 528, 'http://localhost:3001/countdown/how-to-help-your-child-love-islam-without-force-ev?r=cmhwzhxuz0008jw6021mvprjt&s=cmhwx4xz80000jw2m0eh5ib39', NULL, NULL, NULL, 'desktop', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, '2025-11-13 05:29:15.845');
INSERT INTO public.page_visits VALUES ('cmhx0f4qw0000jw0ys3ufty5n', NULL, NULL, 'cmhwvknlm0001jwauzd8qop5g', 'f567ec74-7474-4f2c-a315-dcda64deeaaf', 'registration', 'cmhwuq3mg0000jw0hsr1dzljm', NULL, '2025-11-13 05:49:59.61', NULL, NULL, NULL, NULL, NULL, NULL, 'desktop', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, '2025-11-13 05:49:59.61');
INSERT INTO public.page_visits VALUES ('cmhx0tug40003jw0yr13tq4fx', NULL, NULL, 'cmhwvknlm0001jwauzd8qop5g', 'f567ec74-7474-4f2c-a315-dcda64deeaaf', 'registration', 'cmhwuq3mg0000jw0hsr1dzljm', NULL, '2025-11-13 06:01:26.116', NULL, NULL, NULL, NULL, NULL, NULL, 'desktop', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, '2025-11-13 06:01:26.116');
INSERT INTO public.page_visits VALUES ('cmhx12opi0007jw0yhz396ihb', NULL, 'cmhx0tyyi0005jw0yhn65sdle', 'cmhwvknlm0001jwauzd8qop5g', 'f567ec74-7474-4f2c-a315-dcda64deeaaf', 'webinar', NULL, NULL, '2025-11-13 06:08:18.582', NULL, NULL, 'http://localhost:3001/countdown/how-to-help-your-child-love-islam-without-force-ev?r=cmhx0tyyi0005jw0yhn65sdle&s=cmhwx4xz80000jw2m0eh5ib39', NULL, NULL, NULL, 'desktop', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, '2025-11-13 06:08:18.582');
INSERT INTO public.page_visits VALUES ('cmhx12opn0009jw0yvtlwqoya', NULL, 'cmhx0tyyi0005jw0yhn65sdle', 'cmhwvknlm0001jwauzd8qop5g', 'f567ec74-7474-4f2c-a315-dcda64deeaaf', 'webinar', NULL, NULL, '2025-11-13 06:08:18.582', NULL, NULL, 'http://localhost:3001/countdown/how-to-help-your-child-love-islam-without-force-ev?r=cmhx0tyyi0005jw0yhn65sdle&s=cmhwx4xz80000jw2m0eh5ib39', NULL, NULL, NULL, 'desktop', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, '2025-11-13 06:08:18.582');
INSERT INTO public.page_visits VALUES ('cmhwzzsjo000tjw60h5avqknq', NULL, 'cmhwzd4380005jw6059a8u4en', 'cmhwvknlm0001jwauzd8qop5g', 'f567ec74-7474-4f2c-a315-dcda64deeaaf', 'webinar', NULL, NULL, '2025-11-13 05:38:03.962', '2025-11-13 06:08:18.592', 1814, 'http://localhost:3001/countdown/how-to-help-your-child-love-islam-without-force-ev?r=cmhwzd4380005jw6059a8u4en&s=cmhwx4y0u0001jw2mby3l4jhw', NULL, NULL, NULL, 'desktop', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, '2025-11-13 05:38:03.962');
INSERT INTO public.page_visits VALUES ('cmhx12qm1000hjw0yukn05mvj', NULL, NULL, 'cmhwvknlm0001jwauzd8qop5g', 'f567ec74-7474-4f2c-a315-dcda64deeaaf', 'registration', 'cmhwuq3mg0000jw0hsr1dzljm', NULL, '2025-11-13 06:08:21.049', NULL, NULL, NULL, NULL, NULL, NULL, 'desktop', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, '2025-11-13 06:08:21.049');
INSERT INTO public.page_visits VALUES ('cmhx19fhh000rjw0yjt1m3le2', NULL, 'cmhx12xu2000jjw0y7ig6ysre', 'cmhwvknlm0001jwauzd8qop5g', 'f567ec74-7474-4f2c-a315-dcda64deeaaf', 'webinar', NULL, NULL, '2025-11-13 06:13:33.217', NULL, NULL, 'http://localhost:3001/countdown/how-to-help-your-child-love-islam-without-force-ev?r=cmhx12xu2000jjw0y7ig6ysre&s=cmhwx4xz80000jw2m0eh5ib39', NULL, NULL, NULL, 'desktop', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, '2025-11-13 06:13:33.217');
INSERT INTO public.page_visits VALUES ('cmhx19fhc000pjw0yjv7vviyp', NULL, 'cmhx12xu2000jjw0y7ig6ysre', 'cmhwvknlm0001jwauzd8qop5g', 'f567ec74-7474-4f2c-a315-dcda64deeaaf', 'webinar', NULL, NULL, '2025-11-13 06:13:33.216', '2025-11-13 06:13:33.224', 0, 'http://localhost:3001/countdown/how-to-help-your-child-love-islam-without-force-ev?r=cmhx12xu2000jjw0y7ig6ysre&s=cmhwx4xz80000jw2m0eh5ib39', NULL, NULL, NULL, 'desktop', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, '2025-11-13 06:13:33.216');
INSERT INTO public.page_visits VALUES ('cmhx19kd3000vjw0yc9hvpri2', NULL, NULL, 'cmhwvknlm0001jwauzd8qop5g', 'f567ec74-7474-4f2c-a315-dcda64deeaaf', 'registration', 'cmhwuq3mg0000jw0hsr1dzljm', NULL, '2025-11-13 06:13:39.543', NULL, NULL, NULL, NULL, NULL, NULL, 'desktop', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, '2025-11-13 06:13:39.543');
INSERT INTO public.page_visits VALUES ('cmhx1h0v40000jwaf076i19s0', NULL, NULL, 'cmhwvknlm0001jwauzd8qop5g', 'f567ec74-7474-4f2c-a315-dcda64deeaaf', 'registration', 'cmhwuq3mg0000jw0hsr1dzljm', NULL, '2025-11-13 06:19:27.519', NULL, NULL, NULL, NULL, NULL, NULL, 'desktop', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, '2025-11-13 06:19:27.519');
INSERT INTO public.page_visits VALUES ('cmhx1qhib0000jw96bm6c0rbg', NULL, NULL, 'cmhwvknlm0001jwauzd8qop5g', 'f567ec74-7474-4f2c-a315-dcda64deeaaf', 'registration', 'cmhwuq3mg0000jw0hsr1dzljm', NULL, '2025-11-13 06:26:48.985', NULL, NULL, NULL, NULL, NULL, NULL, 'desktop', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, '2025-11-13 06:26:48.985');
INSERT INTO public.page_visits VALUES ('cmhx2mdjq0000jw16sypnj1tj', NULL, NULL, 'cmhwvknlm0001jwauzd8qop5g', 'f567ec74-7474-4f2c-a315-dcda64deeaaf', 'registration', 'cmhwuq3mg0000jw0hsr1dzljm', NULL, '2025-11-13 06:51:36.834', NULL, NULL, NULL, NULL, NULL, NULL, 'desktop', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, '2025-11-13 06:51:36.834');
INSERT INTO public.page_visits VALUES ('cmhx2zpko0000jweibuqhr0d7', NULL, NULL, 'cmhwvknlm0001jwauzd8qop5g', 'f567ec74-7474-4f2c-a315-dcda64deeaaf', 'registration', 'cmhwuq3mg0000jw0hsr1dzljm', NULL, '2025-11-13 07:01:58.948', NULL, NULL, NULL, NULL, NULL, NULL, 'desktop', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, '2025-11-13 07:01:58.948');
INSERT INTO public.page_visits VALUES ('cmhx2zten0004jweicgcqx6n2', NULL, 'cmhx2mnd10002jw16gdve0mi1', 'cmhwvknlm0001jwauzd8qop5g', 'f567ec74-7474-4f2c-a315-dcda64deeaaf', 'webinar', NULL, NULL, '2025-11-13 07:02:03.84', NULL, NULL, 'http://localhost:3001/countdown/how-to-help-your-child-love-islam-without-force-ev?r=cmhx2mnd10002jw16gdve0mi1&s=cmhwx4xz80000jw2m0eh5ib39', NULL, NULL, NULL, 'desktop', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, '2025-11-13 07:02:03.84');
INSERT INTO public.page_visits VALUES ('cmhx2ztbz0002jwei0d3v33zw', NULL, 'cmhx2mnd10002jw16gdve0mi1', 'cmhwvknlm0001jwauzd8qop5g', 'f567ec74-7474-4f2c-a315-dcda64deeaaf', 'webinar', NULL, NULL, '2025-11-13 07:02:03.84', '2025-11-13 07:02:03.85', 0, 'http://localhost:3001/countdown/how-to-help-your-child-love-islam-without-force-ev?r=cmhx2mnd10002jw16gdve0mi1&s=cmhwx4xz80000jw2m0eh5ib39', NULL, NULL, NULL, 'desktop', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, '2025-11-13 07:02:03.84');
INSERT INTO public.page_visits VALUES ('cmhx3twz70000jwe8axqhdgfu', NULL, NULL, 'cmhwvknlm0001jwauzd8qop5g', 'bfedd549-c4a8-4365-b96b-f499b92555d5', 'registration', 'cmhwuq3mg0000jw0hsr1dzljm', NULL, '2025-11-13 07:25:28.205', NULL, NULL, NULL, NULL, NULL, NULL, 'desktop', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, '2025-11-13 07:25:28.205');
INSERT INTO public.page_visits VALUES ('cmhx48hr70000jwwl8dxperda', NULL, NULL, 'cmhwvknlm0001jwauzd8qop5g', 'bfedd549-c4a8-4365-b96b-f499b92555d5', 'registration', 'cmhwuq3mg0000jw0hsr1dzljm', NULL, '2025-11-13 07:36:48.345', NULL, NULL, NULL, NULL, NULL, NULL, 'desktop', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, '2025-11-13 07:36:48.345');
INSERT INTO public.page_visits VALUES ('cmhx4tm7l0004jwwlajusl4qz', NULL, 'cmhx48mme0002jwwl6rf91fum', 'cmhwvknlm0001jwauzd8qop5g', 'bfedd549-c4a8-4365-b96b-f499b92555d5', 'webinar', NULL, NULL, '2025-11-13 07:53:13.894', '2025-11-13 07:53:13.931', 0, 'http://localhost:3000/countdown/how-to-help-your-child-love-islam-without-force-ev?r=cmhx48mme0002jwwl6rf91fum&s=cmhwx4xz80000jw2m0eh5ib39', NULL, NULL, NULL, 'desktop', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, '2025-11-13 07:53:13.894');
INSERT INTO public.page_visits VALUES ('cmhx4w67u000ejwwliy1nraau', NULL, 'cmhx48mme0002jwwl6rf91fum', 'cmhwvknlm0001jwauzd8qop5g', 'bfedd549-c4a8-4365-b96b-f499b92555d5', 'webinar', NULL, NULL, '2025-11-13 07:55:13.146', NULL, NULL, 'http://localhost:3000/countdown/how-to-help-your-child-love-islam-without-force-ev?r=cmhx48mme0002jwwl6rf91fum&s=cmhwx4xz80000jw2m0eh5ib39', NULL, NULL, NULL, 'desktop', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, '2025-11-13 07:55:13.146');
INSERT INTO public.page_visits VALUES ('cmhx4w67u000djwwlraas1oyi', NULL, 'cmhx48mme0002jwwl6rf91fum', 'cmhwvknlm0001jwauzd8qop5g', 'bfedd549-c4a8-4365-b96b-f499b92555d5', 'webinar', NULL, NULL, '2025-11-13 07:55:13.146', NULL, NULL, 'http://localhost:3000/countdown/how-to-help-your-child-love-islam-without-force-ev?r=cmhx48mme0002jwwl6rf91fum&s=cmhwx4xz80000jw2m0eh5ib39', NULL, NULL, NULL, 'desktop', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, '2025-11-13 07:55:13.146');
INSERT INTO public.page_visits VALUES ('cmhx4tm87000ajwwlnqtgoh0v', NULL, 'cmhx48mme0002jwwl6rf91fum', 'cmhwvknlm0001jwauzd8qop5g', 'bfedd549-c4a8-4365-b96b-f499b92555d5', 'webinar', NULL, NULL, '2025-11-13 07:53:13.894', '2025-11-13 07:55:13.154', 119, 'http://localhost:3000/countdown/how-to-help-your-child-love-islam-without-force-ev?r=cmhx48mme0002jwwl6rf91fum&s=cmhwx4xz80000jw2m0eh5ib39', NULL, NULL, NULL, 'desktop', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, '2025-11-13 07:53:13.894');
INSERT INTO public.page_visits VALUES ('cmhx5914t0000jwlkcvj2sumy', NULL, NULL, 'cmhwvknlm0001jwauzd8qop5g', 'f567ec74-7474-4f2c-a315-dcda64deeaaf', 'registration', 'cmhwuq3mg0000jw0hsr1dzljm', NULL, '2025-11-13 08:05:13.086', NULL, NULL, NULL, NULL, NULL, NULL, 'desktop', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, '2025-11-13 08:05:13.086');
INSERT INTO public.page_visits VALUES ('cmhx5d098000ajwlkhkqo81hc', NULL, NULL, 'cmhwvknlm0001jwauzd8qop5g', 'f567ec74-7474-4f2c-a315-dcda64deeaaf', 'registration', 'cmhwuq3mg0000jw0hsr1dzljm', NULL, '2025-11-13 08:08:18.572', NULL, NULL, NULL, NULL, NULL, NULL, 'desktop', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, '2025-11-13 08:08:18.572');
INSERT INTO public.page_visits VALUES ('cmhx62nfg0003jw30skmtnq38', NULL, 'cmhx596zb0002jwlk6uwtp2g4', 'cmhwvknlm0001jwauzd8qop5g', 'def45768-a481-408e-94dd-1772f8879380', 'webinar', NULL, NULL, '2025-11-13 08:28:14.97', NULL, NULL, 'http://localhost:3002/countdown/how-to-help-your-child-love-islam-without-force-ev?r=cmhx596zb0002jwlk6uwtp2g4', NULL, NULL, NULL, 'desktop', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, '2025-11-13 08:28:14.97');
INSERT INTO public.page_visits VALUES ('cmhx70tc5000bjw30zxly4arj', NULL, 'cmhx596zb0002jwlk6uwtp2g4', 'cmhwvknlm0001jwauzd8qop5g', 'de3ea93a-88ac-4960-bf09-d19d536bc660', 'webinar', NULL, NULL, '2025-11-13 08:54:48.873', NULL, NULL, 'http://localhost:3002/countdown/how-to-help-your-child-love-islam-without-force-ev?r=cmhx596zb0002jwlk6uwtp2g4', NULL, NULL, NULL, 'desktop', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, '2025-11-13 08:54:48.873');
INSERT INTO public.page_visits VALUES ('cmhx70tc5000ajw30mhwushd0', NULL, 'cmhx596zb0002jwlk6uwtp2g4', 'cmhwvknlm0001jwauzd8qop5g', 'de3ea93a-88ac-4960-bf09-d19d536bc660', 'webinar', NULL, NULL, '2025-11-13 08:54:48.873', NULL, NULL, 'http://localhost:3002/countdown/how-to-help-your-child-love-islam-without-force-ev?r=cmhx596zb0002jwlk6uwtp2g4', NULL, NULL, NULL, 'desktop', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, '2025-11-13 08:54:48.873');
INSERT INTO public.page_visits VALUES ('cmhx62nfg0004jw301uz5p9t6', NULL, 'cmhx596zb0002jwlk6uwtp2g4', 'cmhwvknlm0001jwauzd8qop5g', 'de3ea93a-88ac-4960-bf09-d19d536bc660', 'webinar', NULL, NULL, '2025-11-13 08:28:14.97', '2025-11-13 08:54:48.888', 1593, 'http://localhost:3002/countdown/how-to-help-your-child-love-islam-without-force-ev?r=cmhx596zb0002jwlk6uwtp2g4', NULL, NULL, NULL, 'desktop', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, '2025-11-13 08:28:14.97');
INSERT INTO public.page_visits VALUES ('cmhx716vq000cjw3087f4x19h', NULL, NULL, 'cmhwvknlm0001jwauzd8qop5g', 'de3ea93a-88ac-4960-bf09-d19d536bc660', 'registration', 'cmhwuq3mg0000jw0hsr1dzljm', NULL, '2025-11-13 08:55:06.518', NULL, NULL, NULL, NULL, NULL, NULL, 'desktop', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, '2025-11-13 08:55:06.518');
INSERT INTO public.page_visits VALUES ('cmhx79lny000gjw30zprug2e1', NULL, 'cmhx71cv2000ejw30lt9pyejh', 'cmhwvknlm0001jwauzd8qop5g', 'de3ea93a-88ac-4960-bf09-d19d536bc660', 'webinar', NULL, NULL, '2025-11-13 09:01:38.926', NULL, NULL, 'http://localhost:3002/countdown/how-to-help-your-child-love-islam-without-force-ev?r=cmhx71cv2000ejw30lt9pyejh&s=cmhx5esp0000bjwlk0xbfkuvw', NULL, NULL, NULL, 'desktop', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, '2025-11-13 09:01:38.926');
INSERT INTO public.page_visits VALUES ('cmhx79lo6000ijw30xbwknico', NULL, 'cmhx71cv2000ejw30lt9pyejh', 'cmhwvknlm0001jwauzd8qop5g', 'de3ea93a-88ac-4960-bf09-d19d536bc660', 'webinar', NULL, NULL, '2025-11-13 09:01:38.926', '2025-11-13 09:01:38.953', 0, 'http://localhost:3002/countdown/how-to-help-your-child-love-islam-without-force-ev?r=cmhx71cv2000ejw30lt9pyejh&s=cmhx5esp0000bjwlk0xbfkuvw', NULL, NULL, NULL, 'desktop', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, '2025-11-13 09:01:38.926');
INSERT INTO public.page_visits VALUES ('cmhx7t5a2000rjw30imoz30yd', NULL, 'cmhx71cv2000ejw30lt9pyejh', 'cmhwvknlm0001jwauzd8qop5g', 'de3ea93a-88ac-4960-bf09-d19d536bc660', 'webinar', NULL, NULL, '2025-11-13 09:16:50.81', NULL, NULL, 'http://localhost:3002/countdown/how-to-help-your-child-love-islam-without-force-ev?r=cmhx71cv2000ejw30lt9pyejh&s=cmhx5esp0000bjwlk0xbfkuvw', NULL, NULL, NULL, 'desktop', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, '2025-11-13 09:16:50.81');
INSERT INTO public.page_visits VALUES ('cmhx7t5al000tjw30yxjmh7gk', NULL, 'cmhx71cv2000ejw30lt9pyejh', 'cmhwvknlm0001jwauzd8qop5g', 'de3ea93a-88ac-4960-bf09-d19d536bc660', 'webinar', NULL, NULL, '2025-11-13 09:16:50.81', '2025-11-13 09:16:50.907', 0, 'http://localhost:3002/countdown/how-to-help-your-child-love-islam-without-force-ev?r=cmhx71cv2000ejw30lt9pyejh&s=cmhx5esp0000bjwlk0xbfkuvw', NULL, NULL, NULL, 'desktop', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, '2025-11-13 09:16:50.81');
INSERT INTO public.page_visits VALUES ('cmhx9k4zo0000jw04yo5zxgf5', NULL, NULL, 'cmhwvknlm0001jwauzd8qop5g', 'bfedd549-c4a8-4365-b96b-f499b92555d5', 'registration', 'cmhwuq3mg0000jw0hsr1dzljm', NULL, '2025-11-13 10:05:49.743', NULL, NULL, NULL, NULL, NULL, NULL, 'desktop', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, '2025-11-13 10:05:49.743');
INSERT INTO public.page_visits VALUES ('cmhx9kwwt0003jw04n0aiom4h', NULL, NULL, 'cmhwvknlm0001jwauzd8qop5g', 'bfedd549-c4a8-4365-b96b-f499b92555d5', 'registration', 'cmhwuq3mg0000jw0hsr1dzljm', NULL, '2025-11-13 10:06:25.949', NULL, NULL, NULL, NULL, NULL, NULL, 'desktop', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, '2025-11-13 10:06:25.949');


--
-- Data for Name: reactions; Type: TABLE DATA; Schema: public; Owner: aribafarheen
--



--
-- Data for Name: registration_pages; Type: TABLE DATA; Schema: public; Owner: aribafarheen
--

INSERT INTO public.registration_pages VALUES ('cmhwuq3mg0000jw0hsr1dzljm', 'GREEN _ UM', NULL, '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Free Class for Mothers | Help Your Child Love Islam</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --primary: #4a3b6b; /* Deep professional purple */
            --secondary: #2c7a7b; /* Professional teal */
            --accent: #d53f8c; /* Professional magenta */
            --gold: #d69e2e; /* Gold for official touches */
            --dark: #1a202c; /* Professional dark */
            --light: #f7fafc; /* Clean light */
            --white: #ffffff;
            --gray: #718096; /* Professional gray */
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: ''Poppins'', sans-serif;
            line-height: 1.6;
            color: var(--dark);
            background-color: var(--light);
            padding-bottom: 80px; /* Space for sticky CTA */
        }
        
        .container {
            width: 100%;
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
        }
        
        /* Header Section */
        .header {
            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
            color: var(--white);
            padding: 40px 0;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '''';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: url("data:image/svg+xml,%3Csvg width=''60'' height=''60'' viewBox=''0 0 60 60'' xmlns=''http://www.w3.org/2000/svg''%3E%3Cg fill=''none'' fill-rule=''evenodd''%3E%3Cg fill=''%23ffffff'' fill-opacity=''0.05''%3E%3Cpath d=''M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z''/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        
        .institution-name {
            font-size: 0.9rem;
            font-weight: 500;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-bottom: 10px;
            opacity: 0.9;
        }
        
        .free-class {
            font-size: 1rem;
            font-weight: 600;
            letter-spacing: 1px;
            text-transform: uppercase;
            margin-bottom: 15px;
            background: var(--accent);
            display: inline-block;
            padding: 5px 20px;
            border-radius: 20px;
        }
        
        .title {
            font-family: ''Playfair Display'', serif;
            font-size: 2.5rem;
            font-weight: 700;
            line-height: 1.2;
            margin-bottom: 20px;
            max-width: 900px;
            margin-left: auto;
            margin-right: auto;
        }
        
        .subtitle {
            font-size: 1.2rem;
            font-weight: 400;
            margin-bottom: 25px;
            max-width: 800px;
            margin-left: auto;
            margin-right: auto;
            opacity: 0.95;
        }
        
        .description {
            font-size: 1.1rem;
            margin-bottom: 30px;
            max-width: 700px;
            margin-left: auto;
            margin-right: auto;
            font-style: italic;
        }
        
        /* Trust Indicators */
        .trust-indicators {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin-top: 20px;
            flex-wrap: wrap;
        }
        
        .trust-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.9rem;
            background: rgba(255,255,255,0.1);
            padding: 8px 15px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
        }
        
        .trust-item i {
            color: var(--gold);
        }
        
        /* Bonus Section */
        .bonus-section {
            background-color: var(--white);
            padding: 30px 0;
            border-bottom: 3px solid var(--secondary);
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        
        .bonus-content {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-wrap: wrap;
            gap: 30px;
        }
        
        .bonus-text {
            flex: 1;
            min-width: 250px;
        }
        
        .bonus-title {
            font-size: 1.4rem;
            font-weight: 700;
            color: var(--primary);
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .bonus-description {
            font-size: 1.1rem;
            color: var(--dark);
            line-height: 1.7;
        }
        
        .author-image {
            flex: 0 0 auto;
            width: 200px;
            height: 200px;
            border-radius: 10px;
            object-fit: cover;
            border: 4px solid var(--secondary);
            box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        }
        
        /* Timer Section */
        .timer-section {
            background-color: var(--primary);
            padding: 30px 0;
            text-align: center;
            position: relative;
        }
        
        .timer-section::before {
            content: '''';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(45deg, rgba(255,255,255,0.05) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.05) 75%, transparent 75%, transparent);
            background-size: 20px 20px;
        }
        
        .limited-availability {
            font-size: 1.3rem;
            font-weight: 600;
            color: var(--white);
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 2px;
            position: relative;
        }
        
        .countdown {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-bottom: 30px;
            position: relative;
        }
        
        .countdown-item {
            background-color: var(--white);
            color: var(--primary);
            border-radius: 10px;
            padding: 15px;
            min-width: 80px;
            box-shadow: 0 8px 20px rgba(0,0,0,0.15);
            border: 2px solid var(--gold);
        }
        
        .countdown-value {
            font-size: 2rem;
            font-weight: 700;
            line-height: 1;
        }
        
        .countdown-label {
            font-size: 0.8rem;
            text-transform: uppercase;
            margin-top: 5px;
            color: var(--gray);
        }
        
        /* Enhanced CTA Button */
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, var(--accent) 0%, #97266d 100%);
            color: var(--white);
            font-size: 1.4rem;
            font-weight: 800;
            padding: 20px 45px;
            border-radius: 50px;
            text-decoration: none;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            box-shadow: 0 10px 30px rgba(213, 63, 140, 0.4);
            transition: all 0.3s ease;
            margin: 10px 0;
            position: relative;
            overflow: hidden;
            border: none;
            cursor: pointer;
            text-shadow: 0 1px 3px rgba(0,0,0,0.3);
            border: 2px solid rgba(255,255,255,0.3);
        }
        
        .cta-button::before {
            content: '''';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            transition: left 0.5s;
        }
        
        .cta-button:hover::before {
            left: 100%;
        }
        
        .cta-button:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 40px rgba(213, 63, 140, 0.5);
            background: linear-gradient(135deg, #e91e63 0%, #ad1457 100%);
        }
        
        .cta-button:active {
            transform: translateY(-2px);
        }
        
        /* What You Will Learn Section */
        .learn-section {
            padding: 50px 0;
            background-color: var(--white);
        }
        
        .section-title {
            font-family: ''Playfair Display'', serif;
            font-size: 2.3rem;
            font-weight: 700;
            color: var(--primary);
            text-align: center;
            margin-bottom: 40px;
            position: relative;
        }
        
        .section-title::after {
            content: '''';
            position: absolute;
            bottom: -15px;
            left: 50%;
            transform: translateX(-50%);
            width: 100px;
            height: 4px;
            background: linear-gradient(90deg, var(--primary), var(--secondary));
            border-radius: 2px;
        }
        
        .learn-item {
            margin-bottom: 30px;
            padding: 25px;
            border-radius: 15px;
            background-color: var(--light);
            box-shadow: 0 5px 20px rgba(0,0,0,0.08);
            transition: all 0.3s ease;
            border-left: 5px solid var(--secondary);
        }
        
        .learn-item:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.12);
        }
        
        .learn-title {
            font-size: 1.3rem;
            font-weight: 600;
            color: var(--primary);
            margin-bottom: 15px;
            display: flex;
            align-items: flex-start;
            gap: 15px;
        }
        
        .learn-description {
            font-size: 1.1rem;
            color: var(--dark);
            padding-left: 45px;
            line-height: 1.7;
        }
        
        .learn-arrow {
            color: var(--secondary);
            font-weight: 700;
        }
        
        /* Author Section */
        .author-section {
            padding: 50px 0;
            background-color: var(--light);
            position: relative;
        }
        
        .author-section::before {
            content: '''';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, var(--primary), var(--secondary), var(--accent));
        }
        
        .author-container {
            display: flex;
            flex-wrap: wrap;
            gap: 40px;
            align-items: center;
        }
        
        .author-image-container {
            flex: 0 0 auto;
            width: 220px;
            height: 220px;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 15px 30px rgba(0,0,0,0.15);
            border: 4px solid var(--white);
            position: relative;
        }
        
        .author-image-container::after {
            content: '''';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, var(--primary), var(--secondary));
        }
        
        .author-image-container img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .author-info {
            flex: 1;
            min-width: 250px;
        }
        
        .author-name {
            font-size: 2rem;
            font-weight: 700;
            color: var(--primary);
            margin-bottom: 10px;
        }
        
        .author-title {
            font-size: 1.3rem;
            font-weight: 600;
            color: var(--secondary);
            margin-bottom: 20px;
        }
        
        .author-bio {
            font-size: 1.1rem;
            margin-bottom: 20px;
            line-height: 1.7;
        }
        
        .author-achievements {
            font-size: 1.1rem;
            margin-bottom: 20px;
            line-height: 1.7;
        }
        
        .author-achievements strong {
            color: var(--primary);
        }
        
        /* Certifications */
        .certifications {
            display: flex;
            gap: 15px;
            margin-top: 20px;
            flex-wrap: wrap;
        }
        
        .cert-badge {
            background: var(--gold);
            color: var(--dark);
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        /* Footer CTA */
        .footer-cta {
            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
            padding: 40px 0;
            text-align: center;
            position: relative;
        }
        
        .footer-cta::before {
            content: '''';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: url("data:image/svg+xml,%3Csvg width=''60'' height=''60'' viewBox=''0 0 60 60'' xmlns=''http://www.w3.org/2000/svg''%3E%3Cg fill=''none'' fill-rule=''evenodd''%3E%3Cg fill=''%23ffffff'' fill-opacity=''0.05''%3E%3Cpath d=''M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z''/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        
        .footer-cta .cta-button {
            background-color: var(--white);
            color: var(--primary);
            position: relative;
            text-shadow: none;
            border: 2px solid var(--gold);
        }
        
        .footer-cta .cta-button:hover {
            background-color: var(--light);
            transform: translateY(-5px);
            box-shadow: 0 15px 40px rgba(0,0,0,0.3);
        }
        
        /* Sticky CTA Button */
        .sticky-cta {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
            padding: 15px;
            text-align: center;
            box-shadow: 0 -5px 20px rgba(0,0,0,0.15);
            z-index: 1000;
            transform: translateY(100%);
            transition: transform 0.3s ease;
        }
        
        .sticky-cta.show {
            transform: translateY(0);
        }
        
        .sticky-cta .cta-button {
            background-color: var(--accent);
            color: var(--white);
            font-size: 1.2rem;
            font-weight: 800;
            padding: 15px 35px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.2);
            text-shadow: 0 1px 3px rgba(0,0,0,0.3);
            border: 2px solid rgba(255,255,255,0.3);
        }
        
        .sticky-cta .cta-button:hover {
            background-color: #e91e63;
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.3);
        }
        
        /* Modal Styles */
        .modal {
            display: none;
            position: fixed;
            z-index: 10000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            overflow: auto;
            background-color: rgba(0,0,0,0.7);
        }
        
        .modal-content {
            background-color: var(--white);
            margin: 5% auto;
            padding: 0;
            border-radius: 10px;
            width: 90%;
            max-width: 600px;
            position: relative;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            animation: modalopen 0.4s;
        }
        
        @keyframes modalopen {
            from {opacity: 0; transform: translateY(-50px);}
            to {opacity: 1; transform: translateY(0);}
        }
        
        .modal-header {
            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
            color: var(--white);
            padding: 20px;
            border-radius: 10px 10px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .modal-title {
            font-size: 1.5rem;
            font-weight: 600;
        }
        
        .close {
            color: var(--white);
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
            transition: 0.3s;
        }
        
        .close:hover {
            opacity: 0.7;
        }
        
        .modal-body {
            padding: 20px;
            max-height: 70vh;
            overflow-y: auto;
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
            .title {
                font-size: 2rem;
            }
            
            .subtitle {
                font-size: 1.1rem;
            }
            
            .countdown {
                gap: 10px;
            }
            
            .countdown-item {
                min-width: 70px;
                padding: 10px;
            }
            
            .countdown-value {
                font-size: 1.5rem;
            }
            
            .author-image {
                width: 180px;
                height: 180px;
            }
            
            /* Always show sticky CTA on mobile */
            .sticky-cta {
                transform: translateY(0);
            }
            
            .modal-content {
                width: 95%;
                margin: 10% auto;
            }
            
            .cta-button {
                font-size: 1.2rem;
                padding: 18px 35px;
            }
        }
        
        @media (min-width: 769px) {
            /* Show sticky CTA on desktop when scrolling */
            .sticky-cta.show {
                transform: translateY(0);
            }
        }
    </style>
</head>
<body>
    <!-- Header Section -->
    <header class="header">
        <div class="container">
            <div class="institution-name">Emaan Power Educational Institute</div>
            <div class="free-class">FREE CLASS FOR MOTHERS</div>
            <h1 class="title">How to Help Your Child Love Islam Without Force - Even When the Whole World is Pulling Them Away</h1>
            <p class="subtitle">You''ve taught them. You''ve reminded them. They pray and listen… but deep down, you feel it — their heart isn''t fully in it.</p>
            <p class="description">There''s a deeper role every Muslim mom is meant to grow into — and in this free training, you''ll discover it.</p>
            
            <div class="trust-indicators">
                <div class="trust-item">
                    <i class="fas fa-check-circle"></i>
                    <span>18+ Years Experience</span>
                </div>
                <div class="trust-item">
                    <i class="fas fa-users"></i>
                    <span>114,000+ Students</span>
                </div>
                <div class="trust-item">
                    <i class="fas fa-globe"></i>
                    <span>Global Reach</span>
                </div>
            </div>
        </div>
    </header>
    
    <!-- Bonus Section -->
    <section class="bonus-section">
        <div class="container">
            <div class="bonus-content">
                <div class="bonus-text">
                    <div class="bonus-title">
                        <i class="fas fa-gift"></i> EXCLUSIVE BONUS GIFT
                    </div>
                    <p class="bonus-description">Attend this official masterclass and receive for FREE the inspiring storybook for mothers sharing stories of great mothers who raised great men - a $47 value, yours absolutely free!</p>
                </div>
                <img src="https://picsum.photos/seed/aribafarheenbook/200/200.jpg" alt="Ustadha Ariba Farheen with book" class="author-image">
            </div>
        </div>
    </section>
    
    <!-- Timer Section -->
    <section class="timer-section">
        <div class="container">
            <div class="limited-availability">Limited Spots Available</div>
            <div class="countdown">
                <div class="countdown-item">
                    <div class="countdown-value" id="days">0</div>
                    <div class="countdown-label">Days</div>
                </div>
                <div class="countdown-item">
                    <div class="countdown-value" id="hours">1</div>
                    <div class="countdown-label">Hours</div>
                </div>
                <div class="countdown-item">
                    <div class="countdown-value" id="minutes">2</div>
                    <div class="countdown-label">Minutes</div>
                </div>
                <div class="countdown-item">
                    <div class="countdown-value" id="seconds">58</div>
                    <div class="countdown-label">Seconds</div>
                </div>
            </div>
            <button class="cta-button" onclick="openModal()">Reserve My Free Seat</button>
        </div>
    </section>
    
    <!-- What You Will Learn Section -->
    <section class="learn-section">
        <div class="container">
            <h2 class="section-title">What You Will Learn In This Official Masterclass:</h2>
            
            <div class="learn-item">
                <div class="learn-title">
                    <span class="checkmark">✅</span>
                    The one thing missing between your child knowing Islam… and loving it enough to hold on when you''re not around
                </div>
                <p class="learn-description">
                    <span class="learn-arrow">→</span> You''ve taught the rituals. They''re doing the actions. But you can feel the spark fading — and this is why.
                </p>
            </div>
            
            <div class="learn-item">
                <div class="learn-title">
                    <span class="checkmark">✅</span>
                    How to reach a place in their heart no class, lecture, or screen-time limit ever could — even if they already feel far
                </div>
                <p class="learn-description">
                    <span class="learn-arrow">→</span> You don''t need to beg. You don''t need to bribe. You just need to speak to a part of them that''s been waiting for you.
                </p>
            </div>
            
            <div class="learn-item">
                <div class="learn-title">
                    <span class="checkmark">✅</span>
                    How to step into the one role no one taught you — not scholars, not teachers — but it''s the role Allah trusted you with
                </div>
                <p class="learn-description">
                    <span class="learn-arrow">→</span> You''ve been showing up. But no one showed you this role. And that''s what makes all the difference.
                </p>
            </div>
            
            <div style="text-align: center; margin-top: 40px;">
                <button class="cta-button" onclick="openModal()">Secure My Free Place Now</button>
            </div>
        </div>
    </section>
    
    <!-- Author Section -->
    <section class="author-section">
        <div class="container">
            <div class="author-container">
                <div class="author-image-container">
                    <img src="https://picsum.photos/seed/aribafarheen/220/220.jpg" alt="Ustadha Ariba Farheen">
                </div>
                <div class="author-info">
                    <h3 class="author-name">Ustadha Ariba Farheen</h3>
                    <p class="author-title">Founder & Director, Emaan Power</p>
                    <p class="author-bio">Benefit from the wisdom and experience of Ustadha Ariba Farheen, a dedicated mentor in faith-nurturing education with over 18 years of experience teaching thousands of families worldwide.</p>
                    <p class="author-bio">As the founder of Emaan Power, I have helped more than 114,000 young Muslims across the globe discover their potential and become confident Muslims who contribute to our society. My mission is to empower our young generations to be proud Muslims who can create a positive impact in the world and lead our Ummah in the future, inshaAllah.</p>
                    <p class="author-achievements"><strong>Ariba Farheen</strong> is the Creator of certified online courses including My Guide to My Mother''s Heart, Names of Allah, Enter My Paradise, Rising Heroes, Science in the Kingdom of Allah, Winner of Hearts, Humble Your Heart, Fly High, and many more.</p>
                    <p class="author-achievements">She is also the author of bestselling children''s books including Discover the Power of Salah, Moments from the Life of RasulAllah, 15 Ways to Develop Khushu, Power Up Your Salah, and the newly released Secrets to Raising Strong and Confident Muslims.</p>
                    
                    <div class="certifications">
                        <div class="cert-badge">
                            <i class="fas fa-award"></i> Certified Educator
                        </div>
                        <div class="cert-badge">
                            <i class="fas fa-book"></i> Published Author
                        </div>
                        <div class="cert-badge">
                            <i class="fas fa-graduation-cap"></i> Islamic Scholar
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
    
    <!-- Footer CTA -->
    <footer class="footer-cta">
        <div class="container">
            <button class="cta-button" onclick="openModal()">Claim My Official Free Seat</button>
        </div>
    </footer>
    
    <!-- Sticky CTA Button -->
    <div class="sticky-cta" id="stickyCta">
        <button class="cta-button" onclick="openModal()">Claim Your FREE Spot Now!</button>
    </div>
    
    <!-- Webinar Registration Modal -->
    <div id="webinarModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">Register for Free Class</h3>
                <span class="close" onclick="closeModal()">&times;</span>
            </div>
            <div class="modal-body">
                <!-- Webinar Registration Form -->
                <div id="webinar-embed-cmhewnysp000kjwasa35r6j1p"></div>
            </div>
        </div>
    </div>
    
    <script>
        // Countdown Timer
        function updateCountdown() {
            // Set the target date (3 days from now for this example)
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + 3);
            
            const now = new Date();
            const difference = targetDate - now;
            
            // Calculate days, hours, minutes, seconds
            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);
            
            // Update the DOM
            document.getElementById(''days'').textContent = days;
            document.getElementById(''hours'').textContent = hours;
            document.getElementById(''minutes'').textContent = minutes;
            document.getElementById(''seconds'').textContent = seconds;
        }
        
        // Update countdown immediately and then every second
        updateCountdown();
        setInterval(updateCountdown, 1000);
        
        // Sticky CTA Button Logic
        const stickyCta = document.getElementById(''stickyCta'');
        let lastScrollTop = 0;
        
        // Show/hide sticky CTA based on scroll position
        window.addEventListener(''scroll'', function() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            // On desktop, show when scrolled past first section
            if (window.innerWidth > 768) {
                if (scrollTop > 500) {
                    stickyCta.classList.add(''show'');
                } else {
                    stickyCta.classList.remove(''show'');
                }
            }
            
            lastScrollTop = scrollTop;
        });
        
        // Modal Functions
        function openModal() {
            document.getElementById(''webinarModal'').style.display = ''block'';
            document.body.style.overflow = ''hidden''; // Prevent scrolling when modal is open
            
            // Load the webinar embed script only when modal is opened
            if (!document.getElementById(''webinar-script'')) {
                const script = document.createElement(''script'');
                script.id = ''webinar-script'';
                script.src = ''http://localhost:3000/api/embed/cmhewnysp000kjwasa35r6j1p?theme=default&type=inline'';
                document.body.appendChild(script);
            }
        }
        
        function closeModal() {
            document.getElementById(''webinarModal'').style.display = ''none'';
            document.body.style.overflow = ''auto''; // Enable scrolling again
        }
        
        // Close modal when clicking outside of it
        window.onclick = function(event) {
            const modal = document.getElementById(''webinarModal'');
            if (event.target == modal) {
                closeModal();
            }
        }
        
        // Close modal with Escape key
        document.addEventListener(''keydown'', function(event) {
            if (event.key === ''Escape'') {
                closeModal();
            }
        });
    </script>
</body>
</html>', false, false, false, NULL, false, NULL, true, true, false, true, true, false, NULL, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '#4f46e5', '#8b5cf6', '#ffffff', '#1f2937', 'Register Now', 'solid', true, NULL, NULL, NULL, NULL, NULL, false, '2025-11-13 03:10:33.676', '2025-11-13 03:10:33.676');
INSERT INTO public.registration_pages VALUES ('cmhx9439p0002jwydpck1vr23', 'GREEN _ UM (2)', NULL, '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Free Class for Mothers | Help Your Child Love Islam</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --primary: #4a3b6b; /* Deep professional purple */
            --secondary: #2c7a7b; /* Professional teal */
            --accent: #d53f8c; /* Professional magenta */
            --gold: #d69e2e; /* Gold for official touches */
            --dark: #1a202c; /* Professional dark */
            --light: #f7fafc; /* Clean light */
            --white: #ffffff;
            --gray: #718096; /* Professional gray */
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: ''Poppins'', sans-serif;
            line-height: 1.6;
            color: var(--dark);
            background-color: var(--light);
            padding-bottom: 80px; /* Space for sticky CTA */
        }
        
        .container {
            width: 100%;
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
        }
        
        /* Header Section */
        .header {
            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
            color: var(--white);
            padding: 40px 0;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '''';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: url("data:image/svg+xml,%3Csvg width=''60'' height=''60'' viewBox=''0 0 60 60'' xmlns=''http://www.w3.org/2000/svg''%3E%3Cg fill=''none'' fill-rule=''evenodd''%3E%3Cg fill=''%23ffffff'' fill-opacity=''0.05''%3E%3Cpath d=''M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z''/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        
        .institution-name {
            font-size: 0.9rem;
            font-weight: 500;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-bottom: 10px;
            opacity: 0.9;
        }
        
        .free-class {
            font-size: 1rem;
            font-weight: 600;
            letter-spacing: 1px;
            text-transform: uppercase;
            margin-bottom: 15px;
            background: var(--accent);
            display: inline-block;
            padding: 5px 20px;
            border-radius: 20px;
        }
        
        .title {
            font-family: ''Playfair Display'', serif;
            font-size: 2.5rem;
            font-weight: 700;
            line-height: 1.2;
            margin-bottom: 20px;
            max-width: 900px;
            margin-left: auto;
            margin-right: auto;
        }
        
        .subtitle {
            font-size: 1.2rem;
            font-weight: 400;
            margin-bottom: 25px;
            max-width: 800px;
            margin-left: auto;
            margin-right: auto;
            opacity: 0.95;
        }
        
        .description {
            font-size: 1.1rem;
            margin-bottom: 30px;
            max-width: 700px;
            margin-left: auto;
            margin-right: auto;
            font-style: italic;
        }
        
        /* Trust Indicators */
        .trust-indicators {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin-top: 20px;
            flex-wrap: wrap;
        }
        
        .trust-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.9rem;
            background: rgba(255,255,255,0.1);
            padding: 8px 15px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
        }
        
        .trust-item i {
            color: var(--gold);
        }
        
        /* Bonus Section */
        .bonus-section {
            background-color: var(--white);
            padding: 30px 0;
            border-bottom: 3px solid var(--secondary);
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        
        .bonus-content {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-wrap: wrap;
            gap: 30px;
        }
        
        .bonus-text {
            flex: 1;
            min-width: 250px;
        }
        
        .bonus-title {
            font-size: 1.4rem;
            font-weight: 700;
            color: var(--primary);
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .bonus-description {
            font-size: 1.1rem;
            color: var(--dark);
            line-height: 1.7;
        }
        
        .author-image {
            flex: 0 0 auto;
            width: 200px;
            height: 200px;
            border-radius: 10px;
            object-fit: cover;
            border: 4px solid var(--secondary);
            box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        }
        
        /* Timer Section */
        .timer-section {
            background-color: var(--primary);
            padding: 30px 0;
            text-align: center;
            position: relative;
        }
        
        .timer-section::before {
            content: '''';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(45deg, rgba(255,255,255,0.05) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.05) 75%, transparent 75%, transparent);
            background-size: 20px 20px;
        }
        
        .limited-availability {
            font-size: 1.3rem;
            font-weight: 600;
            color: var(--white);
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 2px;
            position: relative;
        }
        
        .countdown {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-bottom: 30px;
            position: relative;
        }
        
        .countdown-item {
            background-color: var(--white);
            color: var(--primary);
            border-radius: 10px;
            padding: 15px;
            min-width: 80px;
            box-shadow: 0 8px 20px rgba(0,0,0,0.15);
            border: 2px solid var(--gold);
        }
        
        .countdown-value {
            font-size: 2rem;
            font-weight: 700;
            line-height: 1;
        }
        
        .countdown-label {
            font-size: 0.8rem;
            text-transform: uppercase;
            margin-top: 5px;
            color: var(--gray);
        }
        
        /* Enhanced CTA Button */
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, var(--accent) 0%, #97266d 100%);
            color: var(--white);
            font-size: 1.4rem;
            font-weight: 800;
            padding: 20px 45px;
            border-radius: 50px;
            text-decoration: none;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            box-shadow: 0 10px 30px rgba(213, 63, 140, 0.4);
            transition: all 0.3s ease;
            margin: 10px 0;
            position: relative;
            overflow: hidden;
            border: none;
            cursor: pointer;
            text-shadow: 0 1px 3px rgba(0,0,0,0.3);
            border: 2px solid rgba(255,255,255,0.3);
        }
        
        .cta-button::before {
            content: '''';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            transition: left 0.5s;
        }
        
        .cta-button:hover::before {
            left: 100%;
        }
        
        .cta-button:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 40px rgba(213, 63, 140, 0.5);
            background: linear-gradient(135deg, #e91e63 0%, #ad1457 100%);
        }
        
        .cta-button:active {
            transform: translateY(-2px);
        }
        
        /* What You Will Learn Section */
        .learn-section {
            padding: 50px 0;
            background-color: var(--white);
        }
        
        .section-title {
            font-family: ''Playfair Display'', serif;
            font-size: 2.3rem;
            font-weight: 700;
            color: var(--primary);
            text-align: center;
            margin-bottom: 40px;
            position: relative;
        }
        
        .section-title::after {
            content: '''';
            position: absolute;
            bottom: -15px;
            left: 50%;
            transform: translateX(-50%);
            width: 100px;
            height: 4px;
            background: linear-gradient(90deg, var(--primary), var(--secondary));
            border-radius: 2px;
        }
        
        .learn-item {
            margin-bottom: 30px;
            padding: 25px;
            border-radius: 15px;
            background-color: var(--light);
            box-shadow: 0 5px 20px rgba(0,0,0,0.08);
            transition: all 0.3s ease;
            border-left: 5px solid var(--secondary);
        }
        
        .learn-item:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.12);
        }
        
        .learn-title {
            font-size: 1.3rem;
            font-weight: 600;
            color: var(--primary);
            margin-bottom: 15px;
            display: flex;
            align-items: flex-start;
            gap: 15px;
        }
        
        .learn-description {
            font-size: 1.1rem;
            color: var(--dark);
            padding-left: 45px;
            line-height: 1.7;
        }
        
        .learn-arrow {
            color: var(--secondary);
            font-weight: 700;
        }
        
        /* Author Section */
        .author-section {
            padding: 50px 0;
            background-color: var(--light);
            position: relative;
        }
        
        .author-section::before {
            content: '''';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, var(--primary), var(--secondary), var(--accent));
        }
        
        .author-container {
            display: flex;
            flex-wrap: wrap;
            gap: 40px;
            align-items: center;
        }
        
        .author-image-container {
            flex: 0 0 auto;
            width: 220px;
            height: 220px;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 15px 30px rgba(0,0,0,0.15);
            border: 4px solid var(--white);
            position: relative;
        }
        
        .author-image-container::after {
            content: '''';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, var(--primary), var(--secondary));
        }
        
        .author-image-container img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .author-info {
            flex: 1;
            min-width: 250px;
        }
        
        .author-name {
            font-size: 2rem;
            font-weight: 700;
            color: var(--primary);
            margin-bottom: 10px;
        }
        
        .author-title {
            font-size: 1.3rem;
            font-weight: 600;
            color: var(--secondary);
            margin-bottom: 20px;
        }
        
        .author-bio {
            font-size: 1.1rem;
            margin-bottom: 20px;
            line-height: 1.7;
        }
        
        .author-achievements {
            font-size: 1.1rem;
            margin-bottom: 20px;
            line-height: 1.7;
        }
        
        .author-achievements strong {
            color: var(--primary);
        }
        
        /* Certifications */
        .certifications {
            display: flex;
            gap: 15px;
            margin-top: 20px;
            flex-wrap: wrap;
        }
        
        .cert-badge {
            background: var(--gold);
            color: var(--dark);
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        /* Footer CTA */
        .footer-cta {
            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
            padding: 40px 0;
            text-align: center;
            position: relative;
        }
        
        .footer-cta::before {
            content: '''';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: url("data:image/svg+xml,%3Csvg width=''60'' height=''60'' viewBox=''0 0 60 60'' xmlns=''http://www.w3.org/2000/svg''%3E%3Cg fill=''none'' fill-rule=''evenodd''%3E%3Cg fill=''%23ffffff'' fill-opacity=''0.05''%3E%3Cpath d=''M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z''/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        
        .footer-cta .cta-button {
            background-color: var(--white);
            color: var(--primary);
            position: relative;
            text-shadow: none;
            border: 2px solid var(--gold);
        }
        
        .footer-cta .cta-button:hover {
            background-color: var(--light);
            transform: translateY(-5px);
            box-shadow: 0 15px 40px rgba(0,0,0,0.3);
        }
        
        /* Sticky CTA Button */
        .sticky-cta {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
            padding: 15px;
            text-align: center;
            box-shadow: 0 -5px 20px rgba(0,0,0,0.15);
            z-index: 1000;
            transform: translateY(100%);
            transition: transform 0.3s ease;
        }
        
        .sticky-cta.show {
            transform: translateY(0);
        }
        
        .sticky-cta .cta-button {
            background-color: var(--accent);
            color: var(--white);
            font-size: 1.2rem;
            font-weight: 800;
            padding: 15px 35px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.2);
            text-shadow: 0 1px 3px rgba(0,0,0,0.3);
            border: 2px solid rgba(255,255,255,0.3);
        }
        
        .sticky-cta .cta-button:hover {
            background-color: #e91e63;
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.3);
        }
        
        /* Modal Styles */
        .modal {
            display: none;
            position: fixed;
            z-index: 10000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            overflow: auto;
            background-color: rgba(0,0,0,0.7);
        }
        
        .modal-content {
            background-color: var(--white);
            margin: 5% auto;
            padding: 0;
            border-radius: 10px;
            width: 90%;
            max-width: 600px;
            position: relative;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            animation: modalopen 0.4s;
        }
        
        @keyframes modalopen {
            from {opacity: 0; transform: translateY(-50px);}
            to {opacity: 1; transform: translateY(0);}
        }
        
        .modal-header {
            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
            color: var(--white);
            padding: 20px;
            border-radius: 10px 10px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .modal-title {
            font-size: 1.5rem;
            font-weight: 600;
        }
        
        .close {
            color: var(--white);
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
            transition: 0.3s;
        }
        
        .close:hover {
            opacity: 0.7;
        }
        
        .modal-body {
            padding: 20px;
            max-height: 70vh;
            overflow-y: auto;
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
            .title {
                font-size: 2rem;
            }
            
            .subtitle {
                font-size: 1.1rem;
            }
            
            .countdown {
                gap: 10px;
            }
            
            .countdown-item {
                min-width: 70px;
                padding: 10px;
            }
            
            .countdown-value {
                font-size: 1.5rem;
            }
            
            .author-image {
                width: 180px;
                height: 180px;
            }
            
            /* Always show sticky CTA on mobile */
            .sticky-cta {
                transform: translateY(0);
            }
            
            .modal-content {
                width: 95%;
                margin: 10% auto;
            }
            
            .cta-button {
                font-size: 1.2rem;
                padding: 18px 35px;
            }
        }
        
        @media (min-width: 769px) {
            /* Show sticky CTA on desktop when scrolling */
            .sticky-cta.show {
                transform: translateY(0);
            }
        }
    </style>
</head>
<body>
    <!-- Header Section -->
    <header class="header">
        <div class="container">
            <div class="institution-name">Emaan Power Educational Institute</div>
            <div class="free-class">FREE CLASS FOR MOTHERS</div>
            <h1 class="title">How to Help Your Child Love Islam Without Force - Even When the Whole World is Pulling Them Away</h1>
            <p class="subtitle">You''ve taught them. You''ve reminded them. They pray and listen… but deep down, you feel it — their heart isn''t fully in it.</p>
            <p class="description">There''s a deeper role every Muslim mom is meant to grow into — and in this free training, you''ll discover it.</p>
            
            <div class="trust-indicators">
                <div class="trust-item">
                    <i class="fas fa-check-circle"></i>
                    <span>18+ Years Experience</span>
                </div>
                <div class="trust-item">
                    <i class="fas fa-users"></i>
                    <span>114,000+ Students</span>
                </div>
                <div class="trust-item">
                    <i class="fas fa-globe"></i>
                    <span>Global Reach</span>
                </div>
            </div>
        </div>
    </header>
    
    <!-- Bonus Section -->
    <section class="bonus-section">
        <div class="container">
            <div class="bonus-content">
                <div class="bonus-text">
                    <div class="bonus-title">
                        <i class="fas fa-gift"></i> EXCLUSIVE BONUS GIFT
                    </div>
                    <p class="bonus-description">Attend this official masterclass and receive for FREE the inspiring storybook for mothers sharing stories of great mothers who raised great men - a $47 value, yours absolutely free!</p>
                </div>
                <img src="https://picsum.photos/seed/aribafarheenbook/200/200.jpg" alt="Ustadha Ariba Farheen with book" class="author-image">
            </div>
        </div>
    </section>
    
    <!-- Timer Section -->
    <section class="timer-section">
        <div class="container">
            <div class="limited-availability">Limited Spots Available</div>
            <div class="countdown">
                <div class="countdown-item">
                    <div class="countdown-value" id="days">0</div>
                    <div class="countdown-label">Days</div>
                </div>
                <div class="countdown-item">
                    <div class="countdown-value" id="hours">1</div>
                    <div class="countdown-label">Hours</div>
                </div>
                <div class="countdown-item">
                    <div class="countdown-value" id="minutes">2</div>
                    <div class="countdown-label">Minutes</div>
                </div>
                <div class="countdown-item">
                    <div class="countdown-value" id="seconds">58</div>
                    <div class="countdown-label">Seconds</div>
                </div>
            </div>
            <button class="cta-button" onclick="openModal()">Reserve My Free Seat</button>
        </div>
    </section>
    
    <!-- What You Will Learn Section -->
    <section class="learn-section">
        <div class="container">
            <h2 class="section-title">What You Will Learn In This Official Masterclass:</h2>
            
            <div class="learn-item">
                <div class="learn-title">
                    <span class="checkmark">✅</span>
                    The one thing missing between your child knowing Islam… and loving it enough to hold on when you''re not around
                </div>
                <p class="learn-description">
                    <span class="learn-arrow">→</span> You''ve taught the rituals. They''re doing the actions. But you can feel the spark fading — and this is why.
                </p>
            </div>
            
            <div class="learn-item">
                <div class="learn-title">
                    <span class="checkmark">✅</span>
                    How to reach a place in their heart no class, lecture, or screen-time limit ever could — even if they already feel far
                </div>
                <p class="learn-description">
                    <span class="learn-arrow">→</span> You don''t need to beg. You don''t need to bribe. You just need to speak to a part of them that''s been waiting for you.
                </p>
            </div>
            
            <div class="learn-item">
                <div class="learn-title">
                    <span class="checkmark">✅</span>
                    How to step into the one role no one taught you — not scholars, not teachers — but it''s the role Allah trusted you with
                </div>
                <p class="learn-description">
                    <span class="learn-arrow">→</span> You''ve been showing up. But no one showed you this role. And that''s what makes all the difference.
                </p>
            </div>
            
            <div style="text-align: center; margin-top: 40px;">
                <button class="cta-button" onclick="openModal()">Secure My Free Place Now</button>
            </div>
        </div>
    </section>
    
    <!-- Author Section -->
    <section class="author-section">
        <div class="container">
            <div class="author-container">
                <div class="author-image-container">
                    <img src="https://picsum.photos/seed/aribafarheen/220/220.jpg" alt="Ustadha Ariba Farheen">
                </div>
                <div class="author-info">
                    <h3 class="author-name">Ustadha Ariba Farheen</h3>
                    <p class="author-title">Founder & Director, Emaan Power</p>
                    <p class="author-bio">Benefit from the wisdom and experience of Ustadha Ariba Farheen, a dedicated mentor in faith-nurturing education with over 18 years of experience teaching thousands of families worldwide.</p>
                    <p class="author-bio">As the founder of Emaan Power, I have helped more than 114,000 young Muslims across the globe discover their potential and become confident Muslims who contribute to our society. My mission is to empower our young generations to be proud Muslims who can create a positive impact in the world and lead our Ummah in the future, inshaAllah.</p>
                    <p class="author-achievements"><strong>Ariba Farheen</strong> is the Creator of certified online courses including My Guide to My Mother''s Heart, Names of Allah, Enter My Paradise, Rising Heroes, Science in the Kingdom of Allah, Winner of Hearts, Humble Your Heart, Fly High, and many more.</p>
                    <p class="author-achievements">She is also the author of bestselling children''s books including Discover the Power of Salah, Moments from the Life of RasulAllah, 15 Ways to Develop Khushu, Power Up Your Salah, and the newly released Secrets to Raising Strong and Confident Muslims.</p>
                    
                    <div class="certifications">
                        <div class="cert-badge">
                            <i class="fas fa-award"></i> Certified Educator
                        </div>
                        <div class="cert-badge">
                            <i class="fas fa-book"></i> Published Author
                        </div>
                        <div class="cert-badge">
                            <i class="fas fa-graduation-cap"></i> Islamic Scholar
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
    
    <!-- Footer CTA -->
    <footer class="footer-cta">
        <div class="container">
            <button class="cta-button" onclick="openModal()">Claim My Official Free Seat</button>
        </div>
    </footer>
    
    <!-- Sticky CTA Button -->
    <div class="sticky-cta" id="stickyCta">
        <button class="cta-button" onclick="openModal()">Claim Your FREE Spot Now!</button>
    </div>
    
    <!-- Webinar Registration Modal -->
    <div id="webinarModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">Register for Free Class</h3>
                <span class="close" onclick="closeModal()">&times;</span>
            </div>
            <div class="modal-body">
                <!-- Webinar Registration Form -->
                <div id="webinar-embed-cmhewnysp000kjwasa35r6j1p"></div>
            </div>
        </div>
    </div>
    
    <script>
        // Countdown Timer
        function updateCountdown() {
            // Set the target date (3 days from now for this example)
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + 3);
            
            const now = new Date();
            const difference = targetDate - now;
            
            // Calculate days, hours, minutes, seconds
            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);
            
            // Update the DOM
            document.getElementById(''days'').textContent = days;
            document.getElementById(''hours'').textContent = hours;
            document.getElementById(''minutes'').textContent = minutes;
            document.getElementById(''seconds'').textContent = seconds;
        }
        
        // Update countdown immediately and then every second
        updateCountdown();
        setInterval(updateCountdown, 1000);
        
        // Sticky CTA Button Logic
        const stickyCta = document.getElementById(''stickyCta'');
        let lastScrollTop = 0;
        
        // Show/hide sticky CTA based on scroll position
        window.addEventListener(''scroll'', function() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            // On desktop, show when scrolled past first section
            if (window.innerWidth > 768) {
                if (scrollTop > 500) {
                    stickyCta.classList.add(''show'');
                } else {
                    stickyCta.classList.remove(''show'');
                }
            }
            
            lastScrollTop = scrollTop;
        });
        
        // Modal Functions
        function openModal() {
            document.getElementById(''webinarModal'').style.display = ''block'';
            document.body.style.overflow = ''hidden''; // Prevent scrolling when modal is open
            
            // Load the webinar embed script only when modal is opened
            if (!document.getElementById(''webinar-script'')) {
                const script = document.createElement(''script'');
                script.id = ''webinar-script'';
                script.src = ''http://localhost:3000/api/embed/cmhewnysp000kjwasa35r6j1p?theme=default&type=inline'';
                document.body.appendChild(script);
            }
        }
        
        function closeModal() {
            document.getElementById(''webinarModal'').style.display = ''none'';
            document.body.style.overflow = ''auto''; // Enable scrolling again
        }
        
        // Close modal when clicking outside of it
        window.onclick = function(event) {
            const modal = document.getElementById(''webinarModal'');
            if (event.target == modal) {
                closeModal();
            }
        }
        
        // Close modal with Escape key
        document.addEventListener(''keydown'', function(event) {
            if (event.key === ''Escape'') {
                closeModal();
            }
        });
    </script>
</body>
</html>', false, false, false, NULL, false, NULL, true, true, false, true, true, false, NULL, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '#4f46e5', '#8b5cf6', '#ffffff', '#1f2937', 'Register Now', 'solid', true, NULL, NULL, NULL, NULL, NULL, false, '2025-11-13 09:53:21.037', '2025-11-13 09:53:21.037');


--
-- Data for Name: templates; Type: TABLE DATA; Schema: public; Owner: aribafarheen
--



--
-- Data for Name: thank_you_templates; Type: TABLE DATA; Schema: public; Owner: aribafarheen
--

INSERT INTO public.thank_you_templates VALUES ('cmhwuxkem0003jw0hbqs6mjhg', 'GREEN', '', '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thank You for Registering | {{webinarTitle}}</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --primary: #4a3b6b;
            --secondary: #2c7a7b;
            --accent: #d53f8c;
            --gold: #d69e2e;
            --dark: #1a202c;
            --light: #f7fafc;
            --white: #ffffff;
            --gray: #718096;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: ''Poppins'', sans-serif;
            line-height: 1.6;
            color: var(--dark);
            background-color: var(--light);
        }
        
        .container {
            width: 100%;
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
        }
        
        .header {
            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
            color: var(--white);
            padding: 60px 0;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '''';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: url("data:image/svg+xml,%3Csvg width=''60'' height=''60'' viewBox=''0 0 60 60'' xmlns=''http://www.w3.org/2000/svg''%3E%3Cg fill=''none'' fill-rule=''evenodd''%3E%3Cg fill=''%23ffffff'' fill-opacity=''0.05''%3E%3Cpath d=''M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z''/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        
        .institution-name {
            font-size: 0.9rem;
            font-weight: 500;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-bottom: 10px;
            opacity: 0.9;
        }
        
        .thank-you {
            font-size: 1rem;
            font-weight: 600;
            letter-spacing: 1px;
            text-transform: uppercase;
            margin-bottom: 15px;
            background: var(--accent);
            display: inline-block;
            padding: 5px 20px;
            border-radius: 20px;
        }
        
        .title {
            font-family: ''Playfair Display'', serif;
            font-size: 2.5rem;
            font-weight: 700;
            line-height: 1.2;
            margin-bottom: 20px;
            max-width: 900px;
            margin-left: auto;
            margin-right: auto;
        }
        
        .subtitle {
            font-size: 1.2rem;
            font-weight: 400;
            margin-bottom: 25px;
            max-width: 800px;
            margin-left: auto;
            margin-right: auto;
            opacity: 0.95;
        }
        
        .success-animation {
            margin: 30px 0;
        }
        
        .success-icon {
            font-size: 5rem;
            color: var(--gold);
            animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
        
        .bonus-section {
            background-color: var(--white);
            padding: 50px 0;
            border-bottom: 3px solid var(--secondary);
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        
        .section-title {
            font-family: ''Playfair Display'', serif;
            font-size: 2.3rem;
            font-weight: 700;
            color: var(--primary);
            text-align: center;
            margin-bottom: 40px;
            position: relative;
        }
        
        .section-title::after {
            content: '''';
            position: absolute;
            bottom: -15px;
            left: 50%;
            transform: translateX(-50%);
            width: 100px;
            height: 4px;
            background: linear-gradient(90deg, var(--primary), var(--secondary));
            border-radius: 2px;
        }
        
        .bonus-content {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-wrap: wrap;
            gap: 40px;
        }
        
        .bonus-text {
            flex: 1;
            min-width: 250px;
        }
        
        .bonus-title {
            font-size: 1.4rem;
            font-weight: 700;
            color: var(--primary);
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .bonus-description {
            font-size: 1.1rem;
            color: var(--dark);
            line-height: 1.7;
        }
        
        .bonus-image {
            flex: 0 0 auto;
            width: 250px;
            height: 250px;
            border-radius: 10px;
            object-fit: cover;
            border: 4px solid var(--secondary);
            box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        }
        
        .next-steps-section {
            padding: 50px 0;
            background-color: var(--light);
        }
        
        .steps-container {
            display: flex;
            flex-wrap: wrap;
            gap: 30px;
            margin-top: 40px;
        }
        
        .step-card {
            flex: 1;
            min-width: 280px;
            background-color: var(--white);
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.08);
            transition: all 0.3s ease;
            border-top: 5px solid var(--secondary);
        }
        
        .step-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.12);
        }
        
        .step-card.important {
            border-top: 5px solid var(--accent);
            background: linear-gradient(to bottom, rgba(213, 63, 140, 0.05), var(--white));
        }
        
        .step-number {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 50px;
            height: 50px;
            background-color: var(--primary);
            color: var(--white);
            border-radius: 50%;
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 20px;
        }
        
        .step-card.important .step-number {
            background-color: var(--accent);
        }
        
        .step-title {
            font-size: 1.3rem;
            font-weight: 600;
            color: var(--primary);
            margin-bottom: 15px;
        }
        
        .step-card.important .step-title {
            color: var(--accent);
        }
        
        .step-description {
            font-size: 1.1rem;
            color: var(--dark);
            line-height: 1.7;
            margin-bottom: 20px;
        }
        
        .btn {
            display: inline-block;
            padding: 12px 25px;
            border-radius: 50px;
            font-size: 1rem;
            font-weight: 600;
            text-decoration: none;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            border: none;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, var(--accent) 0%, #97266d 100%);
            color: var(--white);
            box-shadow: 0 5px 15px rgba(213, 63, 140, 0.3);
        }
        
        .btn-primary:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 20px rgba(213, 63, 140, 0.4);
        }
        
        .btn-secondary {
            background-color: var(--secondary);
            color: var(--white);
            box-shadow: 0 5px 15px rgba(44, 122, 123, 0.3);
        }
        
        .btn-secondary:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 20px rgba(44, 122, 123, 0.4);
        }
        
        .social-sharing {
            display: flex;
            gap: 15px;
            margin-top: 20px;
        }
        
        .social-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            color: var(--white);
            font-size: 1.2rem;
            transition: all 0.3s ease;
            text-decoration: none;
        }
        
        .social-btn:hover {
            transform: translateY(-3px);
        }
        
        .whatsapp-btn {
            background-color: #25D366;
        }
        
        .facebook-btn {
            background-color: #1877F2;
        }
        
        .reward-text {
            font-style: italic;
            color: var(--secondary);
            margin-top: 15px;
            font-size: 0.9rem;
            padding: 10px;
            border-left: 3px solid var(--secondary);
            background-color: rgba(44, 122, 123, 0.05);
            border-radius: 0 5px 5px 0;
        }
        
        .webinar-details {
            background-color: var(--white);
            padding: 30px;
            border-radius: 15px;
            margin-top: 30px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.08);
        }
        
        .detail-item {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
            font-size: 1.1rem;
        }
        
        .detail-item i {
            color: var(--secondary);
            margin-right: 15px;
            font-size: 1.3rem;
        }
        
        .footer {
            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
            color: var(--white);
            padding: 40px 0;
            text-align: center;
        }
        
        .footer-logo {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 20px;
        }
        
        .footer-links {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }
        
        .footer-link {
            color: var(--white);
            text-decoration: none;
            transition: opacity 0.3s ease;
        }
        
        .footer-link:hover {
            opacity: 0.8;
        }
        
        .copyright {
            font-size: 0.9rem;
            opacity: 0.8;
        }
        
        /* Calendar Buttons - Platform-Styled */
        .calendar-buttons {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-top: 20px;
        }
        
        .google-calendar-button {
            background-color: #fff;
            color: #3c4043;
            border: 1px solid #dadce0;
            font-family: ''Google Sans'', ''Roboto'', Arial, sans-serif;
            font-size: 14px;
            font-weight: 500;
            padding: 9px 16px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: all 0.2s ease;
            box-shadow: 0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15);
            width: 100%;
        }
        
        .google-calendar-button:hover {
            background-color: #f8f9fa;
            box-shadow: 0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15);
            border-color: #dadce0;
        }
        
        .google-calendar-button:active {
            background-color: #f1f3f4;
            box-shadow: 0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15);
        }
        
        .google-calendar-button i {
            color: #4285f4;
            font-size: 18px;
        }
        
        .apple-calendar-button {
            background-color: #000;
            color: #fff;
            font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, Helvetica, Arial, sans-serif;
            font-size: 14px;
            font-weight: 400;
            padding: 9px 16px;
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: all 0.2s ease;
            border: none;
            width: 100%;
        }
        
        .apple-calendar-button:hover {
            background-color: #333;
            transform: translateY(-1px);
        }
        
        .apple-calendar-button:active {
            background-color: #222;
            transform: translateY(0);
        }
        
        .apple-calendar-button i {
            font-size: 18px;
        }
        
        .email-icon {
            font-size: 3rem;
            color: var(--accent);
            margin-bottom: 20px;
            text-align: center;
        }
        
        @media (max-width: 768px) {
            .title {
                font-size: 2rem;
            }
            
            .subtitle {
                font-size: 1.1rem;
            }
            
            .bonus-image {
                width: 200px;
                height: 200px;
            }
            
            .steps-container {
                flex-direction: column;
            }
            
            .calendar-buttons {
                flex-direction: row;
                gap: 12px;
            }
        }
    </style>
</head>
<body>
    <header class="header">
        <div class="container">
             <div class="thank-you">REGISTRATION SUCCESSFUL</div>
            <h1 class="title">You are In, {{attendeeName}}!</h1>
         
            
           
        </div>
    </header>
    
    <section class="bonus-section">
        <div class="container">
            <h2 class="section-title">Your Exclusive Bonus Gift</h2>
            <div class="bonus-content">
                <div class="bonus-text">
                    <div class="bonus-title">
                        <i class="fas fa-gift"></i> FREE BONUS RESOURCE
                    </div>
                    <p class="bonus-description">As promised, you''ll receive an exclusive bonus ebook when you attend , make sure to focus and pay attention!.</p>
              
                </div>
                <img src="/uploads/1763011387006-tdqy06asbrg6lj3n66lbkw.png?w=250&h=250&fit=crop" alt="Bonus Gift" class="bonus-image">
            </div>
        </div>
    </section>
    
    <section class="next-steps-section">
        <div class="container">
            <h2 class="section-title">What To Do Next</h2>
            
            <div class="steps-container">
                <div class="step-card important">
                    <div class="step-number">1</div>
                    <h3 class="step-title">Important: Check Your Email</h3>
                    <div class="email-icon">
                        <i class="fas fa-envelope"></i>
                    </div>
                    <p class="step-description">We''ve sent a confirmation email with all the webinar details to your registered email address. Please check your inbox (and spam folder) to ensure you receive all the updates.</p>
                </div>
                
                <div class="step-card">
                    <div class="step-number">2</div>
                    <h3 class="step-title">Mark Your Calendar</h3>
                    <p class="step-description">Don''t miss out on this transformative session. Add it to your calendar now to ensure you don''t forget.</p>
                    
                    <div class="webinar-details">
                        <div class="detail-item">
                            <i class="fas fa-calendar-alt"></i>
                            <span>{{webinarDate}}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-clock"></i>
                            <span>{{webinarTime}} ({{timeZone}})</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-hourglass-half"></i>
                            <span>Duration: {{webinarDuration}} minutes</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-laptop"></i>
                            <span>Platform: Online</span>
                        </div>
                    </div>
                    
                    <div class="calendar-buttons">
                        <button class="google-calendar-button" onclick="addToGoogleCalendar()">
                            <i class="fab fa-google"></i> Google Calendar
                        </button>
                        <button class="apple-calendar-button" onclick="addToAppleCalendar()">
                            <i class="fab fa-apple"></i> Apple Calendar
                        </button>
                    </div>
                </div>
                
                <div class="step-card">
                    <div class="step-number">3</div>
                    <h3 class="step-title"> Share & Earn rewards from Allah swt</h3>
                    <p class="step-description">Be a light for others! <b>Invite your friends to this free Masterclass</b> so they can also raise strong, confident Muslims, and you can<b> earn rewards from Allah just by sharing it :) </b>
</p>
                    
                    <div class="social-sharing">
                        <a href="#" onclick="shareOnWhatsApp(); return false;" class="social-btn whatsapp-btn">
                            <i class="fab fa-whatsapp"></i>
                        </a>
                        <a href="#" onclick="shareOnFacebook(); return false;" class="social-btn facebook-btn">
                            <i class="fab fa-facebook-f"></i>
                        </a>
                    </div>
                    
                    <p class="reward-text">"Whoever guides someone to goodness will have a reward like the one who did it.." - Prophet Muhammad ﷺ </p>
                    
                    <button class="btn btn-secondary" style="margin-top: 20px; width: 100%;" onclick="copyLink()">
                        <i class="fas fa-copy"></i> Copy Registration Link
                    </button>
                    
                    <a href="
{{joinLink}}" class="btn btn-primary" style="margin-top: 15px; width: 100%; display: block;">
                        <i class="fas fa-video"></i> Join Webinar Room
                    </a>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 40px; padding: 30px; background: white; border-radius: 15px; box-shadow: 0 5px 20px rgba(0,0,0,0.08);">
                <div id="countdown" style="font-size: 2.5rem; font-weight: 700; color: var(--primary); margin-bottom: 10px;">Loading...</div>
                <p style="color: var(--gray); font-size: 1.1rem;">Until Your Webinar Starts</p>
            </div>
        </div>
    </section>
    
    <footer class="footer">
        <div class="container">
            <div class="footer-logo">{{hostName}}</div>
            <div class="footer-links">
                <a href="#" class="footer-link">About Us</a>
                <a href="mailto:{{hostEmail}}" class="footer-link">Contact</a>
                <a href="#" class="footer-link">Privacy Policy</a>
            </div>
            <p class="copyright">© 2025 {{hostName}}. All rights reserved.</p>
            <p style="font-size: 0.8rem; opacity: 0.7; margin-top: 10px;">Registration ID: {{registrationId}}</p>
        </div>
    </footer>
    
    <script>
        {{countdown}}
        
        function copyLink() {
            const link = "{{referralLink}}";
            const dummy = document.createElement(''input'');
            document.body.appendChild(dummy);
            dummy.value = link;
            dummy.select();
            document.execCommand(''copy'');
            document.body.removeChild(dummy);
            
            const button = event.target;
            const originalText = button.innerHTML;
            button.innerHTML = ''<i class="fas fa-check"></i> Link Copied!'';
            button.style.backgroundColor = ''#48bb78'';
            
            setTimeout(() => {
                button.innerHTML = originalText;
                button.style.backgroundColor = '''';
            }, 2000);
        }
        
        // Add to Google Calendar function
        function addToGoogleCalendar() {
            const calendarUrl = ''{{googleCalendarLink}}'';
            window.open(calendarUrl, ''_blank'');
        }
        
        // Add to Apple/ICS Calendar function
        function addToAppleCalendar() {
            const calendarUrl = ''{{appleCalendarLink}}'';
            window.open(calendarUrl, ''_blank'');
        }
        
        // Share on WhatsApp function
        function shareOnWhatsApp() {
            const shareText = "Assalam aleykum sister,\n\nI found this FREE class for moms that I am sure you''ll love.\n\nIt''s about how to help our kids love Islam, without forcing them, even in a world that is pulling them away. It gave me so much hope and a new strategy to follow (something I never heard from anyone else before), so I thought of you.\n\nHere''s the link to reserve a FREE spot  " + "{{referralLink}}";
            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
            window.open(whatsappUrl, ''_blank'');
        }
        
        // Share on Facebook function
        function shareOnFacebook() {
            const shareUrl = "https://www.facebook.com/sharer/sharer.php?u=" + "{{referralLink}}";
            window.open(shareUrl, ''_blank'', ''width=600,height=400'');
        }
    </script>
</body>
</html>', NULL, false, '2025-11-13 03:16:22.019', '2025-11-13 08:51:39.238');


--
-- Data for Name: webinar_sales; Type: TABLE DATA; Schema: public; Owner: aribafarheen
--



--
-- Data for Name: webinar_schedules; Type: TABLE DATA; Schema: public; Owner: aribafarheen
--

INSERT INTO public.webinar_schedules VALUES ('cmhx9383z0000jwydceaqvnsn', 'cmhwvknlm0001jwauzd8qop5g', 'justInTime', NULL, NULL, false, 5, NULL, true, '2025-11-13 09:52:40.64', '2025-11-13 09:52:40.64');
INSERT INTO public.webinar_schedules VALUES ('cmhx9385r0001jwydrjomzhd6', 'cmhwvknlm0001jwauzd8qop5g', 'recurring', NULL, 'USER_TIMEZONE', true, NULL, '{"interval":"daily","time":"11:00"}', true, '2025-11-13 09:52:40.64', '2025-11-13 09:52:40.64');


--
-- PostgreSQL database dump complete
--

\unrestrict ZQ0CWxdPHpGmLuPUthK6asfUehPQSAEgCWiWWVmgoluYPKnufdIA3gXdLghLwHe

