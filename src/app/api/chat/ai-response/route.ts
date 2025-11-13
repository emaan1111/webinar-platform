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

    // Create system prompt
    const systemPrompt = webinar.aiChatConfig.systemPrompt || generateDefaultSystemPrompt(webinar);

    // Generate AI response
    const aiResponse = await generateAIResponse(
      systemPrompt,
      programContext,
      question,
      webinar.aiChatConfig.temperature || 0.7,
      webinar.aiChatConfig.maxTokens || 500
    );

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

Your role is to answer questions about the program ONLY. Follow these rules:

1. ONLY answer questions related to the program, pricing, curriculum, benefits, or logistics.
2. Be friendly, professional, and concise.
3. If someone asks something off-topic, politely redirect them to program-related questions.
4. Use the program information provided to give accurate answers.
5. If you don't have the information to answer, say "I don't have that specific information, but I can connect you with our team."
6. Encourage interested attendees to take action (enroll, sign up, etc.)
7. Never make up information - only use what's provided in the context.

Remember: You're here to help attendees learn about the program and make an informed decision.`;
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
