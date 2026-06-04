import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import OpenAI from 'openai';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

// gpt-4o-mini caps output at 16,384 tokens (~50-60KB of HTML). Because we ask the
// model to return the FULL page, anything bigger than this gets truncated and the
// JSON can't be parsed. Reject oversized input up front with a clear message
// instead of spinning for a minute and failing silently.
const MAX_HTML_CHARS = 48000;
const MAX_OUTPUT_TOKENS = 16384;

let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  if (!openai) {
    throw new Error('OpenAI API key is not configured');
  }

  return openai;
}

function extractJsonObject(input: string): { html: string; summary: string } {
  const trimmed = input.trim();

  try {
    const parsed = JSON.parse(trimmed);
    return {
      html: typeof parsed.html === 'string' ? parsed.html : '',
      summary: typeof parsed.summary === 'string' ? parsed.summary : 'AI updated the lead page HTML.',
    };
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        const maybe = trimmed.slice(start, end + 1);
        const parsed = JSON.parse(maybe);
        return {
          html: typeof parsed.html === 'string' ? parsed.html : '',
          summary: typeof parsed.summary === 'string' ? parsed.summary : 'AI updated the lead page HTML.',
        };
      } catch {
        // fall through to the empty fallback below
      }
    }
  }

  return {
    html: '',
    summary: 'AI response could not be parsed.',
  };
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI API key is not configured' }, { status: 500 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const instruction = typeof body?.instruction === 'string' ? body.instruction.trim() : '';
    const currentHtml = typeof body?.currentHtml === 'string' ? body.currentHtml : '';

    if (!instruction) {
      return NextResponse.json({ error: 'instruction is required' }, { status: 400 });
    }

    const leadPage = await prisma.leadPage.findUnique({
      where: { id },
      select: { id: true, name: true, type: true },
    });

    if (!leadPage) {
      return NextResponse.json({ error: 'Lead page not found' }, { status: 404 });
    }

    if (leadPage.type !== 'CUSTOM') {
      return NextResponse.json({ error: 'AI editing is only available for custom HTML lead pages' }, { status: 400 });
    }

    if (!currentHtml.trim()) {
      return NextResponse.json({ error: 'Current HTML is empty' }, { status: 400 });
    }

    if (currentHtml.length > MAX_HTML_CHARS) {
      return NextResponse.json(
        {
          error: `This page is too large for the AI to rewrite in one pass (${currentHtml.length.toLocaleString()} characters, limit ${MAX_HTML_CHARS.toLocaleString()}). Edit a smaller section of the HTML, or split the page, then try again.`,
        },
        { status: 413 }
      );
    }

    const prompt = [
      'You are an expert conversion-focused HTML editor for marketing lead pages.',
      'Apply the user instruction to the provided HTML and preserve all unrelated content.',
      'Do not remove scripts or attributes related to webinar popup tracking such as openModal(), cta-button, lp/leadPageId tracking, or modal/embed hooks unless explicitly requested.',
      'Return ONLY valid JSON with this exact shape:',
      '{"html":"<full updated html>","summary":"short plain-English summary"}',
      'Do not wrap in markdown or code fences.',
      '',
      `Lead page name: ${leadPage.name}`,
      `User instruction: ${instruction}`,
      '',
      'Current HTML:',
      currentHtml,
    ].join('\n');

    const client = getOpenAIClient();
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      max_tokens: MAX_OUTPUT_TOKENS,
      messages: [
        {
          role: 'system',
          content: 'You strictly return JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const choice = completion.choices?.[0];

    // The model ran out of output room mid-response: the JSON is truncated and
    // unparseable. Tell the user exactly what happened instead of "empty result".
    if (choice?.finish_reason === 'length') {
      return NextResponse.json(
        {
          error:
            'The AI ran out of room while rewriting this page (it is too long to return in one response). Edit a smaller section of the HTML and try again.',
        },
        { status: 413 }
      );
    }

    const content = choice?.message?.content || '';
    const parsed = extractJsonObject(content);

    if (!parsed.html.trim()) {
      return NextResponse.json(
        { error: 'AI returned an empty or unparseable result. Try rephrasing your instruction or editing a smaller section.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      html: parsed.html,
      summary: parsed.summary,
      instruction,
    });
  } catch (error) {
    console.error('Failed to generate AI lead page edit preview:', error);
    return NextResponse.json({ error: 'Failed to generate AI preview' }, { status: 500 });
  }
}
