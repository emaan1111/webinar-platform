# 🔧 AI Silent Mode Troubleshooting

## Issue: AI Still Responding When It Should Stay Quiet

If you see responses like:
```
"I'm sorry, but I don't have information on 'lbtw'..."
```

The AI should have stayed completely quiet instead. Here's how to fix it:

---

## ✅ Latest Updates (Applied)

### 1. Enhanced Detection
The system now catches ALL forms of "I don't know" responses:
- "I don't have information"
- "I'm sorry, but I don't have"
- "I apologize"
- "I don't know"
- Any response with "sorry" that's short (<150 chars)

### 2. Stronger System Prompt
Added **explicit examples** showing the AI exactly when to use `[SKIP]`:
```
Question: "lbtw"
Your Response: [SKIP]

Question: "What's the weather?"
Your Response: [SKIP]
```

### 3. Forced [SKIP] Instructions
Even if you have a custom system prompt, the [SKIP] override is automatically appended.

---

## 🧪 Testing After Updates

### Test These Questions (After CTA):

**Should Output [SKIP] and Stay Silent:**
```
lbtw
What's the weather?
hi
hello
thanks
lol
Tell me a joke
Who won the game?
Can you help me with my homework?
```

**Should Respond Normally:**
```
What's included in the program?
How much does it cost?
What will I learn?
When does it start?
What's in Module 1?
```

---

## 🔍 Debugging Steps

### 1. Check Console Logs

Open browser console and send a test message like "lbtw". You should see:

**If working correctly:**
```javascript
🤫 AI staying quiet: [SKIP]
🤖 AI chose to stay quiet for this question
```

**If still broken:**
```javascript
🤖 AI Response: {
  shouldRespond: true,
  response: "I'm sorry, but I don't have information..."
}
```

### 2. Check Your AI Settings

Go to: `Dashboard → Webinars → [Your Webinar] → AI Assistant → AI Settings`

**Check:**
- ✅ Temperature: 0.7 or lower (lower = more conservative)
- ✅ "Activate After CTA/Offer" is enabled
- ⚠️ **Custom System Prompt**: If you have one, it might override defaults

### 3. Clear Custom System Prompt (If You Have One)

If you customized the system prompt:

1. Go to AI Settings
2. Look for "System Prompt" field
3. If there's custom text, **delete it** or add this at the end:
```
IMPORTANT: If you cannot answer confidently or the question is off-topic, 
output ONLY the text "[SKIP]" with no other words.
```

4. Save and test again

---

## 🎛️ Additional Fixes

### Option 1: Lower Temperature

Making the AI more conservative:

1. Go to AI Settings
2. Set Temperature to **0.3** or **0.4**
3. Save and test

**Effect:** AI will be VERY selective about when to respond.

### Option 2: Add More Explicit Documents

If AI is trying to answer but shouldn't:

1. Add a document titled "**What Not to Answer**"
2. Category: **General**
3. Content:
```
DO NOT ANSWER:
- Off-topic questions (weather, sports, jokes, etc.)
- Casual chat (hi, hello, thanks, lol)
- Gibberish or unclear text (lbtw, etc.)
- Questions about topics not covered in program documents

When you see these, respond with ONLY: [SKIP]
```

4. Make sure it's **Active** ✅
5. Test again

---

## 🚨 Emergency Override

If AI keeps responding when it shouldn't, add this to your **Custom System Prompt**:

```
CRITICAL OVERRIDE - READ THIS FIRST:

Your ONLY two possible outputs are:
1. A helpful answer about the program
2. Exactly: [SKIP]

If you see:
- Off-topic questions → Output: [SKIP]
- Gibberish (lbtw, asdf, etc.) → Output: [SKIP]
- Casual chat (hi, lol, thanks) → Output: [SKIP]
- Questions you can't answer → Output: [SKIP]

NEVER say "I don't have information"
NEVER apologize
NEVER explain why you can't answer

Just output: [SKIP]

Everything else follows below...
[Your existing prompt]
```

---

## 📊 What's Happening Behind the Scenes

### Detection Flow:

1. **AI generates response**
2. **System checks if response contains:**
   - Exact text `[SKIP]`
   - Phrase "I don't have information"
   - Phrase "I'm sorry, but I don't have"
   - Word "apologize"
   - Phrase "I don't know"
   - Word "sorry" in short responses

3. **If ANY match:** Message is blocked, AI stays silent
4. **If no match:** Message is posted to chat

### Current Detection Code:
```typescript
const shouldSkip = 
  trimmedResponse === '[SKIP]' ||
  trimmedResponse.includes('[SKIP]') ||
  trimmedResponse.toLowerCase().includes("i don't have information") ||
  trimmedResponse.toLowerCase().includes("i don't have that information") ||
  trimmedResponse.toLowerCase().includes("i'm sorry, but i don't have") ||
  trimmedResponse.toLowerCase().includes("i apologize") ||
  trimmedResponse.toLowerCase().includes("i don't know") ||
  (trimmedResponse.toLowerCase().includes("sorry") && trimmedResponse.length < 150);
```

---

## 🎯 Expected Behavior After Fix

### Test: "lbtw"

**Before Fix:**
```
Program Assistant (AI): I'm sorry, but I don't have information on "lbtw."...
```

**After Fix:**
```
[Nothing - AI stays completely silent]
```

Console log:
```
🤫 AI staying quiet: [SKIP]
🤖 AI chose to stay quiet for this question
```

---

## 💡 Pro Tips

### 1. Test Systematically
Create a test checklist:
- [ ] "lbtw" → Silent
- [ ] "What's the weather?" → Silent
- [ ] "How much is it?" → Responds
- [ ] "What's included?" → Responds

### 2. Monitor Console
Always have console open during testing to see AI decisions in real-time.

### 3. Restart Dev Server
After making changes to system prompt or detection logic:
```bash
# Stop the server (Ctrl+C)
npm run dev
# Test again
```

### 4. Check OpenAI Model
We're using `gpt-4o-mini` which should follow instructions well. If it's still not working, the issue is likely:
- Custom system prompt overriding
- Temperature too high (>0.8)
- Not enough emphasis in prompt

---

## 🆘 Still Not Working?

If AI is STILL responding when it shouldn't:

### Double-check these files were updated:

1. **`/src/app/api/chat/ai-response/route.ts`**
   - Line ~108: Should have enhanced detection logic
   - Line ~203: Should have updated system prompt with examples
   - Line ~96: Should append [SKIP] override if missing

2. **`/src/app/w/[slug]/live/page-client.tsx`**
   - Line ~1316: Should check for `skipped` flag

### Verify changes:
```bash
# Check if detection logic is present
grep -n "shouldSkip" src/app/api/chat/ai-response/route.ts

# Check if [SKIP] examples are in prompt
grep -n "lbtw" src/app/api/chat/ai-response/route.ts
```

### Nuclear option - Hard reset:
```bash
# Stop server
# Clear Next.js cache
rm -rf .next
# Rebuild
npm run build
# Start fresh
npm run dev
```

---

## 📞 Need More Help?

Check these logs in console:
1. What question was asked
2. What AI response was generated
3. Whether `shouldSkip` was triggered
4. Whether message was posted or blocked

Share these details for further debugging.

---

## ✅ Success Checklist

- [ ] Console shows "🤫 AI staying quiet" for off-topic questions
- [ ] No messages appear from AI for "lbtw", "hi", etc.
- [ ] AI still responds normally to program questions
- [ ] No "I don't have information" messages in chat
- [ ] Temperature at 0.7 or lower
- [ ] Custom system prompt includes [SKIP] instructions (if you have one)

Once all checked, the silent mode is working! 🎉

