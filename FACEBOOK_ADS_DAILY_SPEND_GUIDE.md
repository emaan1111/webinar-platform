# 💰 Facebook Ads API - Daily Ad Spend Integration Guide

## Overview

Yes! You can get **daily ad spend** data from Facebook Ads API. This guide shows you how to fetch:
- Daily ad spend by campaign
- Cost per registration
- ROAS (Return on Ad Spend)
- Campaign performance metrics

---

## 🎯 What You'll Get

### Daily Metrics:
- **Total Spend** - How much you spent today/this week/this month
- **Impressions** - How many people saw your ads
- **Clicks** - How many clicked
- **CTR** - Click-through rate
- **CPC** - Cost per click
- **CPM** - Cost per thousand impressions
- **Registrations** - From your database
- **Cost Per Registration** - Spend ÷ Registrations
- **ROAS** - Revenue ÷ Spend

---

## 🔧 Setup (5 Steps)

### Step 1: Get Facebook Marketing API Access

1. Go to [Facebook Business Manager](https://business.facebook.com)
2. Create or select your Business
3. Go to **Business Settings** → **Users** → **System Users**
4. Click **Add** and create a system user (name it "API User")
5. Assign **Admin** access to your Ad Account

### Step 2: Generate Access Token

1. In System User settings, click **Generate New Token**
2. Select your **Ad Account**
3. Check these permissions:
   - `ads_read` - Read ad account data
   - `ads_management` - Manage ads (optional)
   - `read_insights` - Read ad insights/reports
4. Copy the access token (starts with `EAA...`)
5. **Important:** This token expires, so set it to "Never Expire" in settings

### Step 3: Get Your Ad Account ID

1. Go to [Ads Manager](https://business.facebook.com/adsmanager)
2. Look at the URL: `act_123456789`
3. Copy the number part: `123456789`
4. Or go to **Business Settings** → **Accounts** → **Ad Accounts**

### Step 4: Add to .env

```bash
# Facebook Conversions API (already have)
FB_PIXEL_ID="your-pixel-id"
FB_ACCESS_TOKEN="your-pixel-access-token"

# Facebook Marketing API (NEW - for ad spend data)
FB_ADS_API_ACCESS_TOKEN="EAAxxxxxxxxxxxxxxxxx"
FB_AD_ACCOUNT_ID="act_123456789"
```

### Step 5: Install Dependencies

You already have `facebook-nodejs-business-sdk` installed! ✅

---

## 💻 Implementation

### Create Facebook Ads Utility

**File:** `/src/lib/facebookAds.ts`

```typescript
/**
 * Facebook Ads API Integration
 * Get daily ad spend, campaign performance, and ROI metrics
 */

const bizSdk = require('facebook-nodejs-business-sdk')

const accessToken = process.env.FB_ADS_API_ACCESS_TOKEN
const adAccountId = process.env.FB_AD_ACCOUNT_ID

// Initialize Facebook Ads API
if (accessToken && adAccountId) {
  bizSdk.FacebookAdsApi.init(accessToken)
}

const AdAccount = bizSdk.AdAccount
const Campaign = bizSdk.Campaign
const AdsInsights = bizSdk.AdsInsights

/**
 * Get daily ad spend for a date range
 */
export async function getDailyAdSpend(
  startDate: string, // Format: 'YYYY-MM-DD'
  endDate: string     // Format: 'YYYY-MM-DD'
) {
  if (!accessToken || !adAccountId) {
    console.warn('⚠️ Facebook Ads API not configured')
    return null
  }

  try {
    const account = new AdAccount(adAccountId)
    
    const insights = await account.getInsights(
      [
        AdsInsights.Fields.date_start,
        AdsInsights.Fields.date_stop,
        AdsInsights.Fields.spend,
        AdsInsights.Fields.impressions,
        AdsInsights.Fields.clicks,
        AdsInsights.Fields.cpc,
        AdsInsights.Fields.cpm,
        AdsInsights.Fields.ctr,
        AdsInsights.Fields.actions, // Conversions (registrations)
      ],
      {
        time_range: {
          since: startDate,
          until: endDate,
        },
        time_increment: 1, // Daily breakdown
        level: 'account',
      }
    )

    const dailyData = insights.map((insight: any) => ({
      date: insight.date_start,
      spend: parseFloat(insight.spend || '0'),
      impressions: parseInt(insight.impressions || '0'),
      clicks: parseInt(insight.clicks || '0'),
      cpc: parseFloat(insight.cpc || '0'),
      cpm: parseFloat(insight.cpm || '0'),
      ctr: parseFloat(insight.ctr || '0'),
      registrations: getRegistrationsFromActions(insight.actions),
    }))

    return dailyData
  } catch (error: any) {
    console.error('❌ Facebook Ads API error:', error.message)
    return null
  }
}

/**
 * Get today's ad spend
 */
export async function getTodayAdSpend() {
  const today = new Date().toISOString().split('T')[0]
  const data = await getDailyAdSpend(today, today)
  return data && data.length > 0 ? data[0] : null
}

/**
 * Get campaign-level ad spend
 */
export async function getCampaignAdSpend(
  startDate: string,
  endDate: string
) {
  if (!accessToken || !adAccountId) {
    console.warn('⚠️ Facebook Ads API not configured')
    return null
  }

  try {
    const account = new AdAccount(adAccountId)
    
    const campaigns = await account.getCampaigns(
      [
        Campaign.Fields.id,
        Campaign.Fields.name,
        Campaign.Fields.status,
        Campaign.Fields.objective,
      ]
    )

    const campaignData = []

    for (const campaign of campaigns) {
      const insights = await campaign.getInsights(
        [
          AdsInsights.Fields.campaign_name,
          AdsInsights.Fields.spend,
          AdsInsights.Fields.impressions,
          AdsInsights.Fields.clicks,
          AdsInsights.Fields.actions,
        ],
        {
          time_range: {
            since: startDate,
            until: endDate,
          },
        }
      )

      if (insights && insights.length > 0) {
        const insight = insights[0]
        campaignData.push({
          campaignId: campaign.id,
          campaignName: campaign.name,
          status: campaign.status,
          objective: campaign.objective,
          spend: parseFloat(insight.spend || '0'),
          impressions: parseInt(insight.impressions || '0'),
          clicks: parseInt(insight.clicks || '0'),
          registrations: getRegistrationsFromActions(insight.actions),
        })
      }
    }

    return campaignData
  } catch (error: any) {
    console.error('❌ Facebook Ads API error:', error.message)
    return null
  }
}

/**
 * Helper: Extract registration count from actions array
 */
function getRegistrationsFromActions(actions: any[]): number {
  if (!actions || !Array.isArray(actions)) return 0
  
  // Look for CompleteRegistration action (the event we send via Conversions API)
  const registration = actions.find(
    (action: any) => action.action_type === 'offsite_conversion.fb_pixel_complete_registration'
  )
  
  return registration ? parseInt(registration.value || '0') : 0
}

/**
 * Get ad spend summary with ROI calculation
 */
export async function getAdSpendSummary(
  startDate: string,
  endDate: string,
  webinarId?: string
) {
  const adData = await getDailyAdSpend(startDate, endDate)
  
  if (!adData) return null

  // Get registrations from your database
  const { prisma } = await import('@/lib/prisma')
  const registrations = await prisma.registration.count({
    where: {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate + 'T23:59:59Z'),
      },
      ...(webinarId ? { webinarId } : {}),
    },
  })

  // Calculate totals
  const totals = adData.reduce(
    (acc, day) => ({
      spend: acc.spend + day.spend,
      impressions: acc.impressions + day.impressions,
      clicks: acc.clicks + day.clicks,
      fbRegistrations: acc.fbRegistrations + day.registrations,
    }),
    { spend: 0, impressions: 0, clicks: 0, fbRegistrations: 0 }
  )

  return {
    dateRange: { start: startDate, end: endDate },
    totalSpend: totals.spend,
    totalImpressions: totals.impressions,
    totalClicks: totals.clicks,
    avgCPC: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
    avgCPM: totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0,
    
    // Registration metrics
    registrationsFromFB: totals.fbRegistrations, // From Facebook attribution
    registrationsInDB: registrations, // From your database
    costPerRegistration: registrations > 0 ? totals.spend / registrations : 0,
    
    // Daily breakdown
    daily: adData.map(day => ({
      ...day,
      costPerRegistration: day.registrations > 0 ? day.spend / day.registrations : 0,
    })),
  }
}
```

---

## 📊 API Endpoint

### Create Ad Spend Endpoint

**File:** `/src/app/api/analytics/ad-spend/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getAdSpendSummary, getTodayAdSpend, getCampaignAdSpend } from '@/lib/facebookAds'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || 'today' // today, week, month, custom
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const webinarId = searchParams.get('webinarId') || undefined

    let data

    switch (period) {
      case 'today':
        data = await getTodayAdSpend()
        break

      case 'week':
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        data = await getAdSpendSummary(
          weekAgo.toISOString().split('T')[0],
          new Date().toISOString().split('T')[0],
          webinarId
        )
        break

      case 'month':
        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        data = await getAdSpendSummary(
          monthAgo.toISOString().split('T')[0],
          new Date().toISOString().split('T')[0],
          webinarId
        )
        break

      case 'custom':
        if (!startDate || !endDate) {
          return NextResponse.json(
            { error: 'startDate and endDate required for custom period' },
            { status: 400 }
          )
        }
        data = await getAdSpendSummary(startDate, endDate, webinarId)
        break

      case 'campaigns':
        if (!startDate || !endDate) {
          return NextResponse.json(
            { error: 'startDate and endDate required for campaigns' },
            { status: 400 }
          )
        }
        data = await getCampaignAdSpend(startDate, endDate)
        break

      default:
        data = await getTodayAdSpend()
    }

    return NextResponse.json({
      success: true,
      period,
      data,
    })
  } catch (error: any) {
    console.error('Ad spend API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ad spend data' },
      { status: 500 }
    )
  }
}
```

---

## 🎯 Usage Examples

### 1. Get Today's Ad Spend

```bash
GET /api/analytics/ad-spend?period=today
```

**Response:**
```json
{
  "success": true,
  "period": "today",
  "data": {
    "date": "2025-11-18",
    "spend": 127.45,
    "impressions": 15234,
    "clicks": 456,
    "cpc": 0.28,
    "cpm": 8.37,
    "ctr": 2.99,
    "registrations": 23
  }
}
```

### 2. Get Last 7 Days Summary

```bash
GET /api/analytics/ad-spend?period=week&webinarId=abc123
```

**Response:**
```json
{
  "success": true,
  "period": "week",
  "data": {
    "dateRange": {
      "start": "2025-11-11",
      "end": "2025-11-18"
    },
    "totalSpend": 892.50,
    "totalImpressions": 106780,
    "totalClicks": 3192,
    "avgCPC": 0.28,
    "avgCPM": 8.36,
    "registrationsFromFB": 161,
    "registrationsInDB": 168,
    "costPerRegistration": 5.31,
    "daily": [
      {
        "date": "2025-11-11",
        "spend": 127.50,
        "impressions": 15234,
        "clicks": 456,
        "registrations": 23,
        "costPerRegistration": 5.54
      },
      // ... more days
    ]
  }
}
```

### 3. Get Campaign Breakdown

```bash
GET /api/analytics/ad-spend?period=campaigns&startDate=2025-11-01&endDate=2025-11-18
```

**Response:**
```json
{
  "success": true,
  "period": "campaigns",
  "data": [
    {
      "campaignId": "123456789",
      "campaignName": "Webinar Registration - Q4",
      "status": "ACTIVE",
      "objective": "CONVERSIONS",
      "spend": 650.75,
      "impressions": 78920,
      "clicks": 2340,
      "registrations": 142
    },
    {
      "campaignId": "987654321",
      "campaignName": "Retargeting Campaign",
      "status": "ACTIVE",
      "objective": "CONVERSIONS",
      "spend": 241.75,
      "impressions": 27860,
      "clicks": 852,
      "registrations": 26
    }
  ]
}
```

---

## 📈 Dashboard Integration

### Add to Analytics Dashboard

**File:** `/src/app/dashboard/analytics/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'

export default function AnalyticsDashboard() {
  const [adSpend, setAdSpend] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAdSpend()
  }, [])

  const fetchAdSpend = async () => {
    try {
      const response = await fetch('/api/analytics/ad-spend?period=week')
      const result = await response.json()
      setAdSpend(result.data)
    } catch (error) {
      console.error('Failed to fetch ad spend:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Ad Spend Analytics</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="p-6">
            <p className="text-sm text-gray-600">Total Spend (7d)</p>
            <p className="text-3xl font-bold">${adSpend?.totalSpend?.toFixed(2)}</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <p className="text-sm text-gray-600">Registrations</p>
            <p className="text-3xl font-bold">{adSpend?.registrationsInDB}</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <p className="text-sm text-gray-600">Cost Per Registration</p>
            <p className="text-3xl font-bold">${adSpend?.costPerRegistration?.toFixed(2)}</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <p className="text-sm text-gray-600">Avg CPC</p>
            <p className="text-3xl font-bold">${adSpend?.avgCPC?.toFixed(2)}</p>
          </div>
        </Card>
      </div>

      {/* Daily Breakdown */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Daily Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Date</th>
                  <th className="text-right py-2">Spend</th>
                  <th className="text-right py-2">Clicks</th>
                  <th className="text-right py-2">Registrations</th>
                  <th className="text-right py-2">Cost/Reg</th>
                </tr>
              </thead>
              <tbody>
                {adSpend?.daily?.map((day: any) => (
                  <tr key={day.date} className="border-b">
                    <td className="py-2">{day.date}</td>
                    <td className="text-right">${day.spend.toFixed(2)}</td>
                    <td className="text-right">{day.clicks}</td>
                    <td className="text-right">{day.registrations}</td>
                    <td className="text-right">
                      ${day.costPerRegistration > 0 ? day.costPerRegistration.toFixed(2) : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  )
}
```

---

## 🔄 Automated Daily Reports

### Create Cron Job for Daily Reports

**File:** `/src/app/api/cron/daily-ad-report/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getTodayAdSpend } from '@/lib/facebookAds'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get yesterday's data
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const dateStr = yesterday.toISOString().split('T')[0]

    const { getDailyAdSpend } = await import('@/lib/facebookAds')
    const adData = await getDailyAdSpend(dateStr, dateStr)

    if (!adData || adData.length === 0) {
      return NextResponse.json({ message: 'No ad data for yesterday' })
    }

    const data = adData[0]

    // Get registrations from database
    const registrations = await prisma.registration.count({
      where: {
        createdAt: {
          gte: new Date(dateStr),
          lt: new Date(yesterday.setDate(yesterday.getDate() + 1)),
        },
      },
    })

    // Save to database for historical tracking
    await prisma.dailyAdSpend.create({
      data: {
        date: new Date(dateStr),
        spend: data.spend,
        impressions: data.impressions,
        clicks: data.clicks,
        cpc: data.cpc,
        cpm: data.cpm,
        ctr: data.ctr,
        registrations,
        costPerRegistration: registrations > 0 ? data.spend / registrations : 0,
      },
    })

    // TODO: Send email notification with daily report
    console.log(`📊 Daily Ad Report for ${dateStr}:`)
    console.log(`   Spend: $${data.spend.toFixed(2)}`)
    console.log(`   Registrations: ${registrations}`)
    console.log(`   Cost/Reg: $${registrations > 0 ? (data.spend / registrations).toFixed(2) : 'N/A'}`)

    return NextResponse.json({
      success: true,
      date: dateStr,
      data: {
        ...data,
        registrations,
        costPerRegistration: registrations > 0 ? data.spend / registrations : 0,
      },
    })
  } catch (error: any) {
    console.error('Daily ad report error:', error)
    return NextResponse.json(
      { error: 'Failed to generate daily ad report' },
      { status: 500 }
    )
  }
}
```

### Add Database Schema for Historical Tracking

**File:** `prisma/schema.prisma`

Add this model:

```prisma
model DailyAdSpend {
  id                   String   @id @default(cuid())
  date                 DateTime @unique
  spend                Float
  impressions          Int
  clicks               Int
  cpc                  Float
  cpm                  Float
  ctr                  Float
  registrations        Int
  costPerRegistration  Float
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}
```

Then run:
```bash
npx prisma db push
```

---

## ⚡ Quick Start Checklist

### Setup (15 minutes):
- [ ] Create system user in Facebook Business Manager
- [ ] Generate access token with `ads_read` and `read_insights` permissions
- [ ] Get ad account ID from Ads Manager
- [ ] Add `FB_ADS_API_ACCESS_TOKEN` and `FB_AD_ACCOUNT_ID` to `.env`
- [ ] Create `/src/lib/facebookAds.ts` file (copy code above)
- [ ] Create `/src/app/api/analytics/ad-spend/route.ts` (copy code above)
- [ ] Test API: `curl http://localhost:3000/api/analytics/ad-spend?period=today`

### Optional Enhancements:
- [ ] Add dashboard UI component
- [ ] Set up automated daily reports (cron job)
- [ ] Add database model for historical tracking
- [ ] Create email notifications for daily spend
- [ ] Add campaign comparison charts
- [ ] Set up spend alerts (if over budget)

---

## 🎯 Common Use Cases

### 1. Daily Morning Report
Get yesterday's performance every morning at 8 AM

### 2. Real-Time Dashboard
Show current day's spend and registrations in real-time

### 3. Campaign Optimization
Compare campaigns to see which has best Cost Per Registration

### 4. Budget Tracking
Alert when daily spend exceeds target

### 5. ROI Calculation
Calculate revenue from registrations vs ad spend

---

## 🐛 Troubleshooting

### Error: "Invalid Access Token"
- Token expired - generate new one in Business Manager
- Token doesn't have `ads_read` permission
- Check token is for correct ad account

### Error: "Ad Account ID Not Found"
- Make sure ID starts with `act_`
- Verify you have access to this ad account
- Check Business Manager permissions

### No Data Returned
- Campaigns might not have run on that date
- Check date format: `YYYY-MM-DD`
- Verify campaigns have spend in date range

### Registrations Don't Match
- Facebook attribution vs actual registrations can differ
- Facebook uses 7-day click, 1-day view attribution
- Some registrations may come from organic sources

---

## 📚 API Reference

### Metrics You Can Get:
- `spend` - Total amount spent
- `impressions` - Ad views
- `reach` - Unique people reached
- `clicks` - Link clicks
- `cpc` - Cost per click
- `cpm` - Cost per 1000 impressions
- `ctr` - Click-through rate
- `frequency` - Avg times each person saw ad
- `actions` - Conversions (registrations)
- `cost_per_action_type` - Cost per conversion

### Time Ranges:
- Today: `{ since: 'today', until: 'today' }`
- Yesterday: Calculate date -1 day
- Last 7 days: Calculate date -7 days
- This month: First day of month to today
- Custom: Any start/end date

---

## ✨ Next Steps

1. **Implement the code above** (15 minutes)
2. **Test with today's data** (2 minutes)
3. **Add to dashboard** (30 minutes)
4. **Set up daily reports** (optional, 20 minutes)
5. **Monitor and optimize** campaigns based on Cost Per Registration

---

**Ready to implement?** The code is copy-paste ready! Just add your Facebook Ads API credentials to `.env` and you're good to go! 🚀

Would you like me to create the files for you?
