# AI Chat Integration - Post-CTA Auto-Response

## 🎯 What Was Implemented

Added AI-powered chat responses that automatically activate **AFTER the CTA/offer is shown** to answer attendee questions about your program in real-time.

---

## ✅ Changes Made

### 1. Enhanced `handleSendMessage` Function
**File:** `/src/app/w/[slug]/live/page-client.tsx`

**What it does:**
- After a user sends a chat message, it checks if a CTA/offer is currently active (`activeOfferId`)
- If CTA is active, it calls the AI API to generate a response
- AI response is automatically added to the chat with a natural 800ms delay
- AI appears as "Program Assistant (AI)" in the chat

**Key Logic:**
```typescript
// Check if we should get an AI response (after CTA is shown)
if (activeOfferId) {
  console.log('🤖 Checking for AI response after CTA...');
  const aiResponse = await fetch('/api/chat/ai-response', {
    method: 'POST',
    body: JSON.stringify({
      webinarId: webinar.id,
      question: text,
      currentVideoTime: elapsedSeconds,
      registrationId: viewer?.id,
    }),
  });

  if (aiData.shouldRespond && aiData.autoSent) {
    // Add AI response to chat with slight delay
    setTimeout(() => addChatMessage(aiMessage), 800);
  }
}
```

---

## 🔧 How It Works

### Before CTA (e.g., first 30 minutes)
- User asks: "What's included in the program?"
- **AI:** *Silent - no response*
- Message saved to database for later review

### After CTA Appears (offer is active)
- User asks: "What's included in the program?"
- **AI:** Instantly responds with program details based on your documents
- Response appears in chat as "Program Assistant (AI)"
- Natural 800ms delay for human-like feel

---

## 📋 Setup Required

### 1. Configure OpenAI API Key
Add to your `.env` file:
```bash
OPENAI_API_KEY=sk-your-api-key-here
```

### 2. Enable AI for Your Webinar
Use the API or admin panel to configure:

```bash
POST /api/webinars/[webinarId]/ai-config
Content-Type: application/json

{
  "enabled": true,
  "activateAfterOffer": true,
  "autoRespond": true,
  "requireApproval": false,
  "temperature": 0.7,
  "maxTokens": 500,
  "systemPrompt": "You are a helpful assistant for the [Program Name]..."
}
```

### 3. Add Program Documents
Upload your program information so AI can answer questions:

```bash
POST /api/webinars/[webinarId]/program-documents
Content-Type: application/json

{
  "title": "Program Overview",
  "content": "The program includes 8 modules covering...",
  "category": "overview",
  "isActive": true
}
```

**Document Categories:**
- `overview` - General program information
- `pricing` - Pricing tiers, payment plans
- `faq` - Frequently asked questions
- `curriculum` - Course content, modules
- `testimonials` - Student success stories

---

## 🎨 User Experience

### Visual Flow:
1. **User types question** → Sends to chat
2. **Message appears** → "User: What's included?"
3. **AI thinks** → *800ms delay*
4. **AI responds** → "Program Assistant (AI): The program includes..."

### Chat Display:
```
[10:32 AM] Sarah: What's included in the program?
[10:32 AM] Program Assistant (AI): The program includes 8 comprehensive 
modules covering Islamic parenting principles, practical strategies for 
raising confident Muslims, and lifetime access to all materials and updates.
```

---

## ⚙️ Configuration Options

### Temperature (0.0 - 1.0)
- **0.3-0.5**: Very factual, stick to documents (recommended for pricing)
- **0.7**: Balanced creativity and accuracy (default)
- **0.9**: More creative, conversational (use with caution)

### Max Tokens (100 - 1000)
- **200-300**: Short, concise answers
- **500**: Medium length (default, recommended)
- **700-1000**: Detailed, comprehensive answers

### Auto-Respond
- **true**: AI posts response immediately to chat (recommended)
- **false**: Admin must manually post the response

### Require Approval
- **true**: Admin reviews before sending
- **false**: Sends automatically (recommended for best UX)

---

## 🧪 Testing

### Test Before CTA:
1. Start webinar before offer timestamp
2. Send chat message: "What's the price?"
3. **Expected:** No AI response (CTA not active yet)

### Test After CTA:
1. Fast-forward past offer timestamp
2. Send chat message: "What's included?"
3. **Expected:** AI responds within 1-2 seconds with program details

### Test Off-Topic:
1. Send: "What's the weather like?"
2. **Expected:** AI politely redirects to program-related questions

---

## 🐛 Troubleshooting

### AI Not Responding?
1. ✅ Check OpenAI API key is set in `.env`
2. ✅ Verify AI is enabled for webinar
3. ✅ Confirm offer/CTA is currently active (`activeOfferId` is set)
4. ✅ Check program documents exist and are active
5. ✅ Review browser console for errors

### Responses Not Accurate?
1. Update program documents with more details
2. Lower temperature to 0.4-0.5
3. Add specific FAQs to documents
4. Refine system prompt

### AI Responds to Off-Topic?
1. Update system prompt to be more strict
2. Lower temperature to 0.3
3. Add examples of off-topic questions to prompt

---

## 📊 Monitoring

### Console Logs:
```javascript
🤖 Checking for AI response after CTA...
🤖 AI Response: { shouldRespond: true, response: "...", autoSent: true }
✅ AI response automatically posted to chat
```

### Track AI Usage:
- View AI responses in chat moderation panel
- Monitor which questions trigger AI
- Review AI accuracy and adjust documents

---

## 🎓 Best Practices

### 1. Program Documents
- Keep documents up-to-date
- Use clear, concise language
- Cover common questions (pricing, access, duration)
- Include specific details (dates, prices, bonuses)

### 2. System Prompt
```
You are a helpful assistant for the [Program Name].

Your role is to answer questions about the program ONLY.

Rules:
1. Only answer program-related questions
2. Be friendly, professional, and encouraging
3. Use program documents for accurate information
4. If off-topic, politely redirect
5. Never make up information
6. Encourage enrollment when appropriate
```

### 3. Temperature Settings
- **Sales questions**: 0.4 (factual)
- **General info**: 0.7 (balanced)
- **Engagement**: 0.8 (conversational)

---

## 🚀 Next Steps

1. ✅ Add your OpenAI API key to `.env`
2. ✅ Enable AI config for your webinar
3. ✅ Upload program documents (at least 3-5)
4. ✅ Test with sample questions
5. ✅ Monitor and refine based on responses

---

## 📚 Related Files

- `/src/app/w/[slug]/live/page-client.tsx` - Frontend chat integration
- `/src/app/api/chat/ai-response/route.ts` - AI response API
- `/src/app/api/webinars/[id]/ai-config/route.ts` - AI configuration API
- `/prisma/schema.prisma` - Database schema (AIChatConfig, ProgramDocument)
- `/AI_CHAT_ASSISTANT_COMPLETE.md` - Full AI documentation

---

## ✨ Summary

The AI Chat Assistant now automatically responds to attendee questions **after the CTA is shown**, providing intelligent, context-aware answers based on your program documents. It feels natural, is easy to configure, and helps convert more attendees by answering their questions in real-time!

