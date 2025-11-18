# AI Chat Assistant - Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Add OpenAI API Key
```bash
# Add to .env file
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### Step 2: Enable AI for Your Webinar

```bash
curl -X POST http://localhost:3000/api/webinars/YOUR_WEBINAR_ID/ai-config \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "activateAfterOffer": true,
    "autoRespond": true,
    "requireApproval": false,
    "temperature": 0.7,
    "maxTokens": 500
  }'
```

### Step 3: Add Program Documents

```bash
# Add program overview
curl -X POST http://localhost:3000/api/webinars/YOUR_WEBINAR_ID/program-documents \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Program Overview",
    "content": "The Islamic Parenting Mastery Program includes 8 comprehensive modules covering: 1) Building Strong Faith Foundation, 2) Character Development, 3) Daily Islamic Practices, 4) Handling Peer Pressure, 5) Technology & Media Management, 6) Academic Success, 7) Emotional Intelligence, 8) Future Planning. Lifetime access included.",
    "category": "overview",
    "isActive": true
  }'

# Add pricing information
curl -X POST http://localhost:3000/api/webinars/YOUR_WEBINAR_ID/program-documents \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Pricing & Payment Plans",
    "content": "Full Program: $297 (one-time payment) or 3 payments of $99. Early bird special: $197 for webinar attendees only (valid for 48 hours). Includes: 8 video modules, workbook, private community access, monthly Q&A calls, and lifetime updates.",
    "category": "pricing",
    "isActive": true
  }'

# Add FAQs
curl -X POST http://localhost:3000/api/webinars/YOUR_WEBINAR_ID/program-documents \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Frequently Asked Questions",
    "content": "Q: How long is the program? A: 8 weeks of content, but you have lifetime access.\n\nQ: Is there a money-back guarantee? A: Yes, 30-day full refund if not satisfied.\n\nQ: Can I access on mobile? A: Yes, fully mobile-responsive.\n\nQ: Are there live sessions? A: Monthly live Q&A calls included.\n\nQ: What if I miss a session? A: All content is recorded and available 24/7.",
    "category": "faq",
    "isActive": true
  }'
```

### Step 4: Test It!

1. Start your webinar in live/replay mode
2. Fast-forward past the first CTA/offer timestamp
3. Send a chat message: "What's included in the program?"
4. Watch AI respond within 1-2 seconds! 🎉

---

## 📊 How It Works

```
┌─────────────────────────────────────────────────────────────┐
│  BEFORE CTA (0-30 min)                                      │
│  ─────────────────────────────────────────────────────────  │
│  User: "What's the price?"                                  │
│  AI: [Silent - no response]                                 │
│                                                             │
│  ✋ AI is NOT active yet                                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  AFTER CTA (30+ min)                                        │
│  ─────────────────────────────────────────────────────────  │
│  User: "What's the price?"                                  │
│  AI: "Great question! The full program is $297..."          │
│                                                             │
│  ✅ AI is ACTIVE and responding                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Example Conversation

**Before CTA appears:**
```
[10:15 AM] Sarah: What's included in the program?
[10:15 AM] Mike: Is there a payment plan?
[10:16 AM] Lisa: How long is it?
```
*AI is silent, collecting questions*

**After CTA appears (at 30:00 timestamp):**
```
[10:30 AM] Sarah: What's included in the program?
[10:30 AM] Program Assistant (AI): The program includes 8 comprehensive 
modules covering Islamic parenting principles, practical strategies, and 
lifetime access to all materials. You'll also get workbooks, private 
community access, and monthly Q&A calls!

[10:31 AM] Mike: Is there a payment plan?
[10:31 AM] Program Assistant (AI): Yes! You can choose the full payment 
of $297, or split it into 3 payments of $99. Special early bird pricing 
of $197 is available for webinar attendees for the next 48 hours.

[10:32 AM] Lisa: How long is it?
[10:32 AM] Program Assistant (AI): The program spans 8 weeks of content, 
but you have lifetime access so you can go at your own pace!
```

---

## ⚙️ Configuration Options

### Basic (Recommended)
```json
{
  "enabled": true,
  "activateAfterOffer": true,
  "autoRespond": true,
  "temperature": 0.7,
  "maxTokens": 500
}
```

### Conservative (Very Accurate)
```json
{
  "enabled": true,
  "activateAfterOffer": true,
  "autoRespond": true,
  "temperature": 0.4,
  "maxTokens": 300
}
```

### Detailed (Comprehensive Answers)
```json
{
  "enabled": true,
  "activateAfterOffer": true,
  "autoRespond": true,
  "temperature": 0.7,
  "maxTokens": 800
}
```

---

## 🐛 Troubleshooting

### "AI not responding"
✅ Check `.env` has `OPENAI_API_KEY`  
✅ Verify webinar has active offer/CTA  
✅ Confirm AI config is enabled  
✅ Check program documents exist  

### "Responses are inaccurate"
✅ Add more detailed program documents  
✅ Lower temperature to 0.4  
✅ Update documents with specific facts  

### "AI responds to off-topic questions"
✅ Lower temperature to 0.3  
✅ Add custom system prompt  
✅ Review AI responses and refine  

---

## 📚 API Endpoints

### Get AI Configuration
```bash
GET /api/webinars/[webinarId]/ai-config
```

### Update AI Configuration
```bash
POST /api/webinars/[webinarId]/ai-config
Content-Type: application/json

{
  "enabled": true,
  "activateAfterOffer": true,
  "systemPrompt": "Custom instructions...",
  "temperature": 0.7,
  "maxTokens": 500,
  "autoRespond": true,
  "requireApproval": false
}
```

### Get AI Response (Test)
```bash
POST /api/chat/ai-response
Content-Type: application/json

{
  "webinarId": "webinar_123",
  "question": "What's included?",
  "currentVideoTime": 1800
}
```

### Add Program Document
```bash
POST /api/webinars/[webinarId]/program-documents
Content-Type: application/json

{
  "title": "Document Title",
  "content": "Document content...",
  "category": "overview",
  "isActive": true
}
```

---

## 💡 Pro Tips

1. **Add 3-5 documents minimum** for best results
2. **Use clear, simple language** in documents
3. **Include specific numbers** (prices, dates, durations)
4. **Test before going live** with sample questions
5. **Monitor responses** and refine documents as needed

---

## 📞 Support

For issues or questions:
- Check `/AI_CHAT_ASSISTANT_COMPLETE.md` for full documentation
- Review console logs in browser DevTools
- Test API endpoints with curl/Postman
- Verify OpenAI API key is valid and has credits

---

**That's it! Your AI assistant is now ready to help convert attendees! 🎉**

