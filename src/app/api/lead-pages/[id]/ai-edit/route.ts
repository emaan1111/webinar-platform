import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import OpenAI from 'openai';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
      const maybe = trimmed.slice(start, end + 1);
      const parsed = JSON.parse(maybe);
      return {
        html: typeof parsed.html === 'string' ? parsed.html : '',
        summary: typeof parsed.summary === 'string' ? parsed.summary : 'AI updated the lead page HTML.',
      };
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

    const content = completion.choices?.[0]?.message?.content || '';
    const parsed = extractJsonObject(content);

    if (!parsed.html.trim()) {
      return NextResponse.json({ error: 'AI returned an empty HTML result' }, { status: 500 });
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
