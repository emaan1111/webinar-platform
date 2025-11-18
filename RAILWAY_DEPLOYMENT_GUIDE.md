# 🚀 Railway Deployment Guide

## Quick Deploy (5 Minutes)

### Prerequisites
- Railway account (sign up at https://railway.app)
- GitHub repository (your code should be pushed to GitHub)
- Database setup on Railway (PostgreSQL)

---

## Option 1: Deploy via Railway CLI (Recommended)

### Step 1: Install Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Or using Homebrew (macOS)
brew install railway
```

### Step 2: Login to Railway

```bash
railway login
```

This will open your browser to authenticate.

### Step 3: Link Your Project

```bash
# In your project directory
railway link
```

Select your Railway project or create a new one.

### Step 4: Add Environment Variables

```bash
# Add environment variables one by one
railway variables set NEXTAUTH_SECRET=$(openssl rand -base64 32)
railway variables set DATABASE_URL="your-railway-postgres-url"
railway variables set NEXTAUTH_URL="https://your-app.railway.app"
railway variables set OPENAI_API_KEY="your-openai-key"

# Optional: Add ClickFunnels variables if needed
railway variables set CLICKFUNNELS_API_KEY="your-key"
railway variables set CLICKFUNNELS_WORKSPACE_ID="your-workspace-id"
# ... add other ClickFunnels variables
```

### Step 5: Deploy!

```bash
# Deploy to Railway
railway up

# Or if using GitHub (automatic deployments)
git push origin main
```

---

## Option 2: Deploy via Railway Dashboard (GUI)

### Step 1: Create New Project

1. Go to https://railway.app/new
2. Click **"Deploy from GitHub repo"**
3. Select your repository: `webinar-platform`
4. Click **"Deploy Now"**

### Step 2: Add PostgreSQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database" → "PostgreSQL"**
3. Railway will create a database and generate `DATABASE_URL`
4. The `DATABASE_URL` is automatically linked to your app

### Step 3: Configure Environment Variables

Click on your service → **"Variables"** tab → Add these:

```bash
# Required Variables
NEXTAUTH_SECRET=<generate-random-32-char-string>
NEXTAUTH_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}
DATABASE_URL=${{Postgres.DATABASE_URL}}
OPENAI_API_KEY=your-openai-api-key-here

# Optional: Node Environment
NODE_ENV=production
PORT=8080

# Optional: ClickFunnels Integration
CLICKFUNNELS_API_KEY=your-key
CLICKFUNNELS_WORKSPACE_ID=your-workspace-id
CLICKFUNNELS_WEBINAR_TAG=UM-Webinar-Registered
CLICKFUNNELS_WEBINAR_TAG_ID=your-tag-id
CLICKFUNNELS_TAG_ATTENDED=your-tag-id
CLICKFUNNELS_TAG_MOSTLY_ATTENDED=your-tag-id
CLICKFUNNELS_TAG_PARTLY_ATTENDED=your-tag-id
CLICKFUNNELS_TAG_MISSED=your-tag-id
CLICKFUNNELS_TAG_REPLAY_ATTENDED=your-tag-id
```

### Step 4: Configure Build & Deploy

Railway should auto-detect your Next.js app, but verify:

**Settings → Deploy:**
- Build Command: `npm run build`
- Start Command: `npm run start:railway`
- Root Directory: `/`

### Step 5: Deploy

Railway will automatically deploy when you:
- Push to GitHub (if connected)
- Click **"Deploy"** button in dashboard

---

## Post-Deployment Setup

### 1. Run Database Migrations

```bash
# Via Railway CLI
railway run npx prisma db push

# Or directly in Railway shell
# Go to your service → "Shell" tab
npx prisma db push
```

### 2. Create Admin User

```bash
# Via Railway CLI
railway run node create-admin-user.js

# Or in Railway shell
node create-admin-user.js
```

### 3. Verify Deployment

Visit your Railway URL: `https://your-app.railway.app`

Check:
- ✅ Homepage loads
- ✅ Login works
- ✅ Dashboard accessible
- ✅ Database connected
- ✅ WebSocket/Socket.io works (for live webinars)

---

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_URL` | Your app's public URL | `https://your-app.railway.app` |
| `NEXTAUTH_SECRET` | Random 32+ character string | Generate with `openssl rand -base64 32` |
| `OPENAI_API_KEY` | OpenAI API key for AI chat | `sk-proj-...` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `8080` (Railway auto-assigns) |
| `CLICKFUNNELS_API_KEY` | ClickFunnels integration | - |
| `CLICKFUNNELS_WORKSPACE_ID` | Your CF workspace | - |
| `CLICKFUNNELS_*_TAG*` | Attendance tagging | - |

---

## Railway Configuration Files

Your project already has these configured:

### `railway.json`
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### `next.config.js`
- ✅ Output: `standalone` (optimized for Railway)
- ✅ Image optimization configured
- ✅ Production optimizations enabled

### `package.json`
- ✅ Build script: `prisma generate && next build`
- ✅ Start script: Custom Railway start command
- ✅ Postinstall: Generates Prisma client

---

## Troubleshooting

### Build Fails

**Issue:** Prisma generate fails
```bash
# Solution: Ensure DATABASE_URL is set during build
railway variables set DATABASE_URL="your-db-url"
```

**Issue:** Next.js build timeout
```bash
# Solution: Increase Railway build timeout
# Go to Settings → Deploy → Advanced
# Set "Build Timeout" to 10-15 minutes
```

### Database Connection Issues

**Issue:** "Can't reach database server"
```bash
# Solution 1: Check DATABASE_URL format
echo $DATABASE_URL  # Should be postgresql://...

# Solution 2: Ensure database is in same Railway project
# The database should auto-link via ${{Postgres.DATABASE_URL}}

# Solution 3: Whitelist Railway IPs (not needed for Railway Postgres)
```

### WebSocket/Socket.io Not Working

**Issue:** Real-time chat/reactions not working
```bash
# Solution: Railway supports WebSockets by default
# Ensure your Socket.io client connects to correct URL

# In your frontend, use:
const socket = io(window.location.origin, {
  transports: ['websocket', 'polling']
});
```

### Environment Variables Not Loading

```bash
# Verify variables are set
railway variables

# Restart deployment after adding variables
railway up --detach
```

---

## Monitoring & Logs

### View Logs

**Via CLI:**
```bash
railway logs
```

**Via Dashboard:**
1. Go to your service
2. Click **"Deployments"** tab
3. Click on latest deployment
4. View real-time logs

### Metrics

Railway provides:
- CPU usage
- Memory usage
- Network I/O
- Request counts

Access via: Service → **"Metrics"** tab

---

## Custom Domain (Optional)

### Step 1: Add Domain in Railway

1. Go to your service → **"Settings"** → **"Domains"**
2. Click **"Add Domain"**
3. Enter your domain: `webinar.yourdomain.com`

### Step 2: Configure DNS

Add these DNS records at your domain provider:

**For subdomain (recommended):**
```
CNAME  webinar  your-app.railway.app
```

**For root domain:**
```
ALIAS/ANAME  @  your-app.railway.app
```

### Step 3: Update Environment Variables

```bash
railway variables set NEXTAUTH_URL="https://webinar.yourdomain.com"
```

### Step 4: SSL Certificate

Railway automatically provisions SSL certificates (Let's Encrypt) for custom domains.

---

## Cost Estimation

Railway pricing (as of 2024):

- **Hobby Plan:** $5/month + usage
  - $0.000463/GB-hour (memory)
  - $0.000231/vCPU-hour (CPU)
  
- **Pro Plan:** $20/month + usage
  - Better performance
  - Priority support

**Typical Webinar App:**
- Memory: 512MB = ~$17/month
- CPU: 1 vCPU = ~$17/month
- PostgreSQL: 1GB = ~$5/month
- **Total: ~$39/month** (for moderate traffic)

---

## Automatic Deployments

### GitHub Integration

Railway automatically deploys when you:

1. **Push to main branch**
   ```bash
   git add .
   git commit -m "Update AI silent mode"
   git push origin main
   ```

2. **Railway detects changes**
3. **Builds and deploys automatically**
4. **Zero downtime deployments**

### Deployment Branches

Configure in Railway:
- **Production:** `main` branch
- **Staging:** `develop` branch (create separate Railway service)

---

## Health Checks

Railway automatically monitors your app. Configure custom health checks:

**Settings → Health Checks:**
- Path: `/api/health`
- Interval: 30s
- Timeout: 10s
- Retries: 3

Create health check endpoint:

```typescript
// src/app/api/health/route.ts
export async function GET() {
  return Response.json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
  });
}
```

---

## Scaling

### Vertical Scaling (More Resources)

Railway auto-scales based on usage. Manual limits:

**Settings → Resources:**
- Memory: 512MB → 8GB
- CPU: 1 vCPU → 8 vCPUs

### Horizontal Scaling (Multiple Instances)

For high-traffic webinars:
- Deploy multiple instances
- Use Railway's load balancing
- Configure sticky sessions for Socket.io

---

## Backup Strategy

### Database Backups

Railway PostgreSQL includes automatic backups:
- Daily backups (last 7 days)
- Manual backups via dashboard

**Manual Backup:**
```bash
# Download database dump
railway run pg_dump $DATABASE_URL > backup.sql

# Restore backup
railway run psql $DATABASE_URL < backup.sql
```

### Code Backups

- GitHub serves as code backup
- Railway keeps deployment history
- Can rollback to previous deployments

---

## Security Best Practices

### 1. Environment Variables
- ✅ Never commit `.env` to Git
- ✅ Use Railway's variables system
- ✅ Rotate secrets regularly

### 2. Database Security
- ✅ Use Railway's private networking
- ✅ Enable SSL connections
- ✅ Regular security updates (automatic)

### 3. API Keys
- ✅ Restrict OpenAI API key usage
- ✅ Set spending limits
- ✅ Monitor usage in OpenAI dashboard

---

## Quick Deploy Checklist

Before deploying:

- [ ] Code pushed to GitHub
- [ ] `railway.json` configured
- [ ] `next.config.js` has `output: 'standalone'`
- [ ] `.env.example` updated with all variables
- [ ] Database schema finalized
- [ ] Build tested locally: `npm run build`

During deployment:

- [ ] Railway project created
- [ ] PostgreSQL database added
- [ ] All environment variables set
- [ ] Build completed successfully
- [ ] Database migrations run
- [ ] Admin user created

Post-deployment:

- [ ] Homepage accessible
- [ ] Login/signup works
- [ ] Database queries work
- [ ] WebSocket connections work
- [ ] AI chat responds correctly
- [ ] ClickFunnels integration tested (if used)

---

## Support & Resources

- **Railway Docs:** https://docs.railway.app
- **Railway Discord:** https://discord.gg/railway
- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **Prisma Railway Guide:** https://www.prisma.io/docs/guides/deployment/deployment-guides/railway

---

## Quick Commands Reference

```bash
# Install CLI
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# Set variables
railway variables set KEY=value

# Deploy
railway up

# View logs
railway logs

# Run commands
railway run <command>

# Open in browser
railway open

# Database migrations
railway run npx prisma db push

# Create admin
railway run node create-admin-user.js
```

---

**Ready to deploy?** Run these commands:

```bash
# 1. Ensure code is committed
git add .
git commit -m "Ready for Railway deployment"
git push origin main

# 2. Login to Railway
railway login

# 3. Create/link project
railway link

# 4. Deploy!
railway up
```

Your webinar platform will be live in ~5 minutes! 🚀
