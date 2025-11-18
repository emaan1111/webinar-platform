import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Initialize OpenAI only when API key is available
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  if (!openai) {
    throw new Error('OpenAI API key is not configured');
  }
  return openai;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { webinarId, question, currentVideoTime, registrationId } = body;

    if (!webinarId || !question) {
      return NextResponse.json(
        { error: 'webinarId and question are required' },
        { status: 400 }
      );
    }

    // Get webinar with offers and AI config
    const webinar = await prisma.webinar.findUnique({
      where: { id: webinarId },
      include: {
        offers: {
          where: { isActive: true },
          orderBy: { videoTimestamp: 'asc' },
        },
        aiChatConfig: true,
        programDocuments: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!webinar) {
      return NextResponse.json(
        { error: 'Webinar not found' },
        { status: 404 }
      );
    }

    // Check if AI is enabled
    if (!webinar.aiChatConfig?.enabled) {
      return NextResponse.json(
        { error: 'AI chat is not enabled for this webinar' },
        { status: 403 }
      );
    }

    // Check if we should activate AI (only after offer is shown)
    const shouldActivate = checkIfShouldActivate(
      webinar.aiChatConfig,
      webinar.offers,
      currentVideoTime
    );

    if (!shouldActivate) {
      return NextResponse.json(
        {
          shouldRespond: false,
          message: 'AI is not active yet. Will activate after the offer is shown.',
        },
        { status: 200 }
      );
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    // Build context from program documents
    const programContext = buildProgramContext(webinar.programDocuments);

    // Create system prompt and ensure [SKIP] instructions are included
    let systemPrompt = webinar.aiChatConfig.systemPrompt || generateDefaultSystemPrompt(webinar);
    
    // Always append [SKIP] instructions to ensure AI stays quiet when appropriate
    if (!systemPrompt.includes('[SKIP]')) {
      systemPrompt += `\n\nIMPORTANT OVERRIDE: If you cannot answer confidently or the question is off-topic, output ONLY the text "[SKIP]" with no other words or explanations. Do NOT apologize or say you don't know - just output [SKIP].`;
    }

    // Generate AI response
    const aiResponse = await generateAIResponse(
      systemPrompt,
      programContext,
      question,
      webinar.aiChatConfig.temperature || 0.7,
      webinar.aiChatConfig.maxTokens || 500
    );

    // Check if AI decided to skip this question
    const trimmedResponse = aiResponse.trim();
    const shouldSkip = 
      trimmedResponse === '[SKIP]' ||
      trimmedResponse.includes('[SKIP]') ||
      trimmedResponse.toLowerCase().includes("i don't have information") ||
      trimmedResponse.toLowerCase().includes("i don't have that information") ||
      trimmedResponse.toLowerCase().includes("i'm sorry, but i don't have") ||
      trimmedResponse.toLowerCase().includes("i apologize") ||
      trimmedResponse.toLowerCase().includes("i don't know") ||
      (trimmedResponse.toLowerCase().includes("sorry") && trimmedResponse.length < 150);

    if (shouldSkip) {
      console.log('🤫 AI staying quiet:', trimmedResponse.substring(0, 100));
      return NextResponse.json({
        shouldRespond: false,
        message: 'AI chose not to respond to this question (outside scope or insufficient information)',
        skipped: true,
      });
    }

    // If auto-respond is enabled, save the response as a chat message
    if (webinar.aiChatConfig.autoRespond && !webinar.aiChatConfig.requireApproval) {
      await prisma.chatMessage.create({
        data: {
          webinarId,
          userName: 'Program Assistant (AI)',
          message: aiResponse,
          videoTimestamp: currentVideoTime || null,
          isScripted: false,
          isHidden: false,
          isApproved: true,
          registrationId: registrationId || null,
        },
      });
    }

    return NextResponse.json({
      shouldRespond: true,
      response: aiResponse,
      autoSent: webinar.aiChatConfig.autoRespond && !webinar.aiChatConfig.requireApproval,
      requiresApproval: webinar.aiChatConfig.requireApproval,
    });

  } catch (error) {
    console.error('AI Response Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI response' },
      { status: 500 }
    );
  }
}

// Check if AI should be activated based on offer timing
function checkIfShouldActivate(
  config: any,
  offers: any[],
  currentVideoTime: number | null
): boolean {
  // If activation is not tied to offers, activate immediately
  if (!config.activateAfterOffer) {
    return true;
  }

  // If no offers exist, don't activate
  if (!offers || offers.length === 0) {
    return false;
  }

  // If we don't have current video time, don't activate
  if (currentVideoTime === null || currentVideoTime === undefined) {
    return false;
  }

  // Check if any offer has been shown (current time >= first offer timestamp)
  const firstOffer = offers[0];
  return currentVideoTime >= firstOffer.videoTimestamp;
}

// Build program context from documents
function buildProgramContext(documents: any[]): string {
  if (!documents || documents.length === 0) {
    return 'No program information available.';
  }

  let context = '=== PROGRAM INFORMATION ===\n\n';

  for (const doc of documents) {
    context += `## ${doc.title}\n`;
    context += `${doc.content}\n\n`;
  }

  return context;
}

// Generate default system prompt
function generateDefaultSystemPrompt(webinar: any): string {
  return `You are a helpful assistant for the "${webinar.title}" program. 

CRITICAL INSTRUCTION: Your ONLY allowed outputs are either:
1. A helpful answer about the program (if you have the information)
2. EXACTLY the text "[SKIP]" with no other words

EXAMPLES OF CORRECT BEHAVIOR:

Question: "lbtw"
Your Response: [SKIP]

Question: "What's the weather?"
Your Response: [SKIP]

Question: "hi"
Your Response: [SKIP]

Question: "Can you tell me about the refund policy?"
(If no refund info in program documents)
Your Response: [SKIP]

Question: "What's included in the program?"
(If you have program information)
Your Response: The program includes [specific details from documents]...

Question: "How much does it cost?"
(If you have pricing information)
Your Response: The program is priced at [specific pricing from documents]...

RULES:

1. ONLY answer questions directly related to the program, pricing, curriculum, benefits, or logistics
2. If off-topic → Output ONLY: [SKIP]
3. If insufficient information → Output ONLY: [SKIP]
4. If casual chat or gibberish → Output ONLY: [SKIP]
5. If you don't understand → Output ONLY: [SKIP]
6. NEVER say "I don't have information" → Just output: [SKIP]
7. NEVER apologize or explain → Just output: [SKIP]
8. NEVER add extra text to [SKIP] → Just output: [SKIP]

When you output [SKIP] (and ONLY [SKIP]), you become invisible in chat.
This is BETTER than apologizing because it keeps the conversation natural.

Use the program information provided to give accurate answers ONLY when:
- Question is directly about the program
- You have clear information
- You can answer with 100% confidence

Otherwise → Output EXACTLY: [SKIP]

Remember: [SKIP] means "stay silent". Use it liberally. Better to stay silent than to say you don't know.`;
}

// Generate AI response using OpenAI
async function generateAIResponse(
  systemPrompt: string,
  programContext: string,
  question: string,
  temperature: number,
  maxTokens: number
): Promise<string> {
  const client = getOpenAIClient();
  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'system',
        content: programContext,
      },
      {
        role: 'user',
        content: question,
      },
    ],
    temperature,
    max_tokens: maxTokens,
  });

  return completion.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response. Please try again.';
}
