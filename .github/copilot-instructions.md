# WebinarJam-Like Application - Copilot Instructions

## Project Overview
This is a modern web application similar to WebinarJam, featuring live webinar hosting, registration, interactive features, and analytics.

## Tech Stack
- **Frontend**: Next.js 14+ with App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Real-time**: Socket.io for chat, WebRTC for video/audio
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **AI**: OpenAI API for intelligent chat responses
- **Hosting**: Railway (optimized for real-time features, no Vercel)
- **Storage**: AWS S3 or similar for recordings (future)
- **Email**: SendGrid/Resend for notifications (future)

## Key Features
- User authentication and authorization
- Webinar creation and scheduling
- Registration pages with custom forms
- Live streaming with WebRTC
- Interactive chat and Q&A
- Screen sharing capabilities
- Recording and playback
- Analytics dashboard
- Email notifications
- Attendee management

## Development Guidelines
- Use TypeScript for type safety
- Follow Next.js 14+ App Router conventions
- Use server components where possible
- Implement proper error handling
- Use environment variables for sensitive data
- Follow accessibility best practices
- Write clean, maintainable code
