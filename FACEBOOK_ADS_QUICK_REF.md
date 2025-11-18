# 💰 Facebook Daily Ad Spend - Quick Reference

## ✅ Yes, You Can Get Daily Ad Spend!

Facebook Marketing API provides comprehensive daily ad spend data including:
- Daily spend amount ($)
- Impressions, clicks, CTR
- Cost per click (CPC)
- Cost per registration
- Campaign performance
- ROI metrics

---

## 🚀 Quick Setup (5 Minutes)

### 1. Get Access Token
1. [Facebook Business Manager](https://business.facebook.com) → Business Settings
2. System Users → Create "API User"
3. Generate Token with permissions:
   - `ads_read`
   - `read_insights`

### 2. Get Ad Account ID
- Go to Ads Manager
- URL shows: `act_123456789`
- Copy the number

### 3. Add to .env
```bash
FB_ADS_API_ACCESS_TOKEN="EAAxxxxxxxxxx"
FB_AD_ACCOUNT_ID="act_123456789"
```

---

## 📊 What You Get

### API Endpoint:
```
GET /api/analytics/ad-spend?period=today
GET /api/analytics/ad-spend?period=week
GET /api/analytics/ad-spend?period=month
GET /api/analytics/ad-spend?period=campaigns&startDate=2025-11-01&endDate=2025-11-18
```

### Response Data:
```json
{
  "totalSpend": 892.50,
  "totalImpressions": 106780,
  "totalClicks": 3192,
  "avgCPC": 0.28,
  "registrations": 168,
  "costPerRegistration": 5.31,
  "daily": [
    {
      "date": "2025-11-18",
      "spend": 127.50,
      "clicks": 456,
      "registrations": 23,
      "costPerRegistration": 5.54
    }
  ]
}
```

---

## 💻 Implementation Files

### 1. Create `/src/lib/facebookAds.ts`
- Core functions to fetch ad spend data
- Daily, weekly, monthly reports
- Campaign-level breakdown

### 2. Create `/src/app/api/analytics/ad-spend/route.ts`
- Public API endpoint
- Supports multiple time periods
- Returns formatted metrics

### 3. Add to Dashboard
- Display daily spend
- Show registrations and cost per reg
- Campaign comparison charts

---

## 📈 Key Metrics

| Metric | Description |
|--------|-------------|
| **Spend** | Total amount spent on ads |
| **Impressions** | How many times ads were shown |
| **Clicks** | Number of link clicks |
| **CPC** | Cost per click |
| **CPM** | Cost per 1000 impressions |
| **CTR** | Click-through rate (%) |
| **Registrations** | Completed registrations attributed to ads |
| **Cost/Reg** | Spend ÷ Registrations |
| **ROAS** | Return on Ad Spend (Revenue ÷ Spend) |

---

## 🎯 Use Cases

### 1. Daily Morning Report
```typescript
// Get yesterday's performance automatically
const yesterday = await getDailyAdSpend('2025-11-17', '2025-11-17')
console.log(`Spent: $${yesterday[0].spend}`)
console.log(`Registrations: ${yesterday[0].registrations}`)
```

### 2. Real-Time Dashboard
```typescript
// Show today's spend
const today = await getTodayAdSpend()
```

### 3. Campaign Comparison
```typescript
// Compare all campaigns
const campaigns = await getCampaignAdSpend('2025-11-01', '2025-11-18')
```

### 4. ROI Calculation
```typescript
// Calculate return on investment
const summary = await getAdSpendSummary('2025-11-01', '2025-11-18')
const roi = (revenue - summary.totalSpend) / summary.totalSpend * 100
```

---

## ⚡ Quick Test

```bash
# Test today's spend
curl http://localhost:3000/api/analytics/ad-spend?period=today

# Test last 7 days
curl http://localhost:3000/api/analytics/ad-spend?period=week

# Test specific campaign
curl "http://localhost:3000/api/analytics/ad-spend?period=campaigns&startDate=2025-11-01&endDate=2025-11-18"
```

---

## 🔧 Advanced Features

### Automated Daily Reports
- Set up cron job to fetch daily
- Save to database for historical tracking
- Send email notifications

### Budget Alerts
- Alert when spend exceeds daily limit
- Warning when cost per registration too high
- Notification for underperforming campaigns

### Historical Tracking
Add database model:
```prisma
model DailyAdSpend {
  id                   String   @id @default(cuid())
  date                 DateTime @unique
  spend                Float
  registrations        Int
  costPerRegistration  Float
}
```

---

## 📚 Full Documentation

See **`FACEBOOK_ADS_DAILY_SPEND_GUIDE.md`** for:
- ✅ Complete code examples
- ✅ Step-by-step setup instructions
- ✅ Dashboard integration
- ✅ Automated reporting
- ✅ Troubleshooting guide
- ✅ API reference

---

## 💡 Pro Tips

1. **Token Expiration**: Set token to "Never Expire" in settings
2. **Attribution Window**: Facebook uses 7-day click, 1-day view attribution
3. **Data Delay**: Ad spend data may have 1-2 hour delay
4. **Multiple Accounts**: Can track multiple ad accounts with different tokens
5. **Cost Optimization**: Focus on campaigns with lowest Cost/Reg

---

## ✅ Checklist

Setup:
- [ ] Generate Facebook Ads API access token
- [ ] Get ad account ID
- [ ] Add credentials to `.env`
- [ ] Create `/src/lib/facebookAds.ts`
- [ ] Create API endpoint
- [ ] Test with curl

Enhancement:
- [ ] Add to dashboard
- [ ] Set up daily cron job
- [ ] Create email notifications
- [ ] Add historical tracking
- [ ] Build campaign comparison charts

---

## 🎉 Summary

**Yes, you can get daily ad spend from Facebook!**

- ✅ Easy setup (5 minutes)
- ✅ Real-time data
- ✅ Campaign-level breakdown
- ✅ Cost per registration tracking
- ✅ ROI calculation
- ✅ Historical tracking
- ✅ Automated reports

**See full guide:** `FACEBOOK_ADS_DAILY_SPEND_GUIDE.md`

**Need help implementing?** Just say "implement Facebook ad spend tracking" and I'll create all the files for you! 🚀
