# ⚡ ClickFunnels Cron Job - 5 Minute Setup

## What You Need:
1. Your Railway app URL (e.g., `myapp.up.railway.app`)
2. A CRON_SECRET (any random string)
3. Free EasyCron.com account

---

## Step 1: Add CRON_SECRET to Railway (1 min)

1. Go to Railway dashboard → Your project
2. Click **Variables** tab
3. Add new variable:
   ```
   CRON_SECRET=make-this-a-long-random-secret-string-123456
   ```
4. Click **Deploy** (redeploy your app)

---

## Step 2: Set Up EasyCron (3 minutes)

1. **Sign up**: https://www.easycron.com (FREE, no credit card)

2. **Click**: "Create New Cron Job"

3. **Fill in**:
   ```
   URL: https://YOUR-APP.up.railway.app/api/cron/process-reminders
   Method: POST
   Schedule: */10 * * * * (every 10 minutes)
   
   HTTP Headers:
   - Name: Authorization
   - Value: Bearer YOUR_CRON_SECRET_HERE
   ```

4. **Click**: "Create" then "Test Run"

---

## Step 3: Verify It Works (1 minute)

Run this in terminal (replace YOUR values):
```bash
curl -X POST https://YOUR-APP.up.railway.app/api/cron/process-reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

✅ **Success Response**:
```json
{
  "success": true,
  "clickFunnelsTagStats": {
    "processed": 0,
    "applied": 0,
    "failed": 0
  }
}
```

---

## Done! 🎉

Your ClickFunnels tags will now be applied automatically:
- ✅ **Registration tags** - Applied immediately when someone registers
- ✅ **Reminder tags** - Applied when each reminder is sent

---

## What Gets Tagged:

### Registration Tags (Immediate):
- Registered **24+ hours before** → `24HRREMINDER`
- Registered **2-24 hours before** → `2HRREMINDER`
- Registered **1-2 hours before** → `1HRREMINDER`
- Registered **15min-1hr before** → `15MINREMINDER`
- Registered **<15 min before** → `WESTARTED`

### Reminder Tags (Scheduled):
- Applied when you send each reminder (based on your reminder templates)
- You configure these in: Dashboard → Webinar → Reminders

---

## Troubleshooting

❌ **401 Error** → CRON_SECRET doesn't match  
❌ **404 Error** → Wrong URL or app not deployed  
❌ **500 Error** → Check `railway logs` for details  

**View logs**:
```bash
railway logs --tail
```

**Test ClickFunnels connection**:
```bash
node test-clickfunnels-tags.js
```

---

## Monitor Your Cron Job

- **EasyCron Dashboard**: Shows execution history
- **Railway Logs**: Shows tag applications in real-time
- **ClickFunnels**: See tags applied to contacts

---

**Need more details?** See `CLICKFUNNELS_CRON_SETUP.md`
