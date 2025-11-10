# Webinar Platform

A modern, full-featured webinar platform built with Next.js, PostgreSQL, and deployed on Railway.

## Features

- 🎥 **Live Webinar Hosting** - Host live webinars with video streaming
- 📝 **Registration Pages** - Custom registration pages for each webinar
- 👥 **Community Features** - Posts, comments, and user profiles
- 💬 **AI-Powered Chat** - OpenAI integration for intelligent chat responses
- 📊 **Analytics Dashboard** - Track registrations, attendance, and engagement
- 📱 **Mobile-First Design** - Responsive design that works on all devices
- 🔐 **Authentication** - Secure user authentication with NextAuth.js
- 🎬 **Recording & Playback** - Record webinars for later viewing

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Real-time**: Socket.io
- **AI**: OpenAI API
- **Hosting**: Railway
- **Video**: WebRTC

## Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or Railway)
- OpenAI API key (optional, for AI chat features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd "Webinar Play 2"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your values:
   ```
   DATABASE_URL="postgresql://..."
   NEXTAUTH_SECRET="your-secret-key"
   OPENAI_API_KEY="sk-..."
   ```

4. **Set up the database**
   ```bash
   npm run db:push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Database Schema

The application uses the following main models:

- **User** - User accounts with roles (ADMIN, HOST, ATTENDEE)
- **Webinar** - Webinar events with scheduling and status
- **Registration** - User registrations for webinars
- **Post** - Community posts
- **Comment** - Comments on posts
- **Analytics** - Event tracking for analytics

## Project Structure

```
src/
├── app/              # Next.js app directory
│   ├── api/          # API routes
│   ├── (auth)/       # Authentication pages
│   ├── dashboard/    # Dashboard pages
│   ├── webinars/     # Webinar pages
│   └── community/    # Community pages
├── components/       # React components
├── lib/             # Utility functions
└── types/           # TypeScript types

prisma/
└── schema.prisma    # Database schema
```

## Deployment to Railway

1. **Create a Railway account** at [railway.app](https://railway.app)

2. **Create a new project** and add a PostgreSQL database

3. **Connect your GitHub repository**

4. **Add environment variables** in Railway dashboard:
   - `DATABASE_URL` (automatically set by Railway)
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (your Railway app URL)
   - `OPENAI_API_KEY`

5. **Deploy** - Railway will automatically build and deploy your app

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Push Prisma schema to database
- `npm run db:studio` - Open Prisma Studio

## Features Roadmap

- [x] User authentication
- [x] Webinar scheduling
- [x] Registration pages
- [x] Community posts
- [x] Analytics dashboard
- [ ] Live video streaming (WebRTC)
- [ ] Screen sharing
- [ ] Recording functionality
- [ ] Email notifications
- [ ] Payment integration
- [ ] Mobile apps (React Native)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for your own purposes.

## Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ using Next.js and PostgreSQL
