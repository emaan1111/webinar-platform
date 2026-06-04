import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

type Provider = 'openai' | 'anthropic';

// Both providers are asked to return the FULL page, so the binding constraint is
// the model's OUTPUT budget: the whole page must fit once JSON-escaped. We cap
// the input up front with a clear message instead of spinning for a minute and
// truncating silently. The ceiling is per-provider because the two models have
// very different output limits (see token caps below).
const MAX_HTML_CHARS: Record<Provider, number> = {
  // gpt-4o-mini caps output at 16,384 tokens (~48KB of JSON-escaped HTML).
  openai: 48000,
  // Opus 4.7 streams up to 128K output tokens; 64K comfortably round-trips a
  // page this size with escaping overhead to spare.
  anthropic: 150000,
};

// gpt-4o-mini caps output at 16,384 tokens (~50-60KB of HTML).
const OPENAI_MODEL = 'gpt-4o-mini';
const OPENAI_MAX_OUTPUT_TOKENS = 16384;

// Claude Opus 4.7 — highly capable; supports structured outputs and up to
// 128K output tokens. Streaming is required above ~16K to avoid HTTP timeouts.
// Swap to 'claude-sonnet-4-6' here for a cheaper/faster option (also 64K output).
const ANTHROPIC_MODEL = 'claude-opus-4-7';
const ANTHROPIC_MAX_OUTPUT_TOKENS = 64000;

// Stable editor instructions. Kept separate from the per-request HTML so it can
// be prompt-cached on the Anthropic side (cache_control on the system block).
const SYSTEM_PROMPT = [
  'You are an expert conversion-focused HTML editor for marketing lead pages.',
  'Apply the user instruction to the provided HTML and preserve all unrelated content.',
  'Do not remove scripts or attributes related to webinar popup tracking such as openModal(), cta-button, lp/leadPageId tracking, or modal/embed hooks unless explicitly requested.',
  'Return the FULL updated HTML document, not a fragment or a diff.',
].join('\n');

// JSON shape both providers must return.
const HTML_EDIT_SCHEMA = {
  type: 'object',
  properties: {
    html: { type: 'string', description: 'The full updated HTML document.' },
    summary: { type: 'string', description: 'Short plain-English summary of the changes.' },
  },
  required: ['html', 'summary'],
  additionalProperties: false,
} as const;

let openai: OpenAI | null = null;
let anthropic: Anthropic | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  if (!openai) {
    throw new Error('OpenAI API key is not configured');
  }
  return openai;
}

function getAnthropicClient(): Anthropic {
  if (!anthropic && process.env.ANTHROPIC_API_KEY) {
    anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  if (!anthropic) {
    throw new Error('Anthropic API key is not configured');
  }
  return anthropic;
}

function buildUserContent(leadPageName: string, instruction: string, currentHtml: string): string {
  return [
    `Lead page name: ${leadPageName}`,
    `User instruction: ${instruction}`,
    '',
    'Current HTML:',
    currentHtml,
  ].join('\n');
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

/** Returns the raw model output text plus whether it was truncated by the token cap. */
async function runOpenAI(userContent: string): Promise<{ content: string; truncated: boolean }> {
  const client = getOpenAIClient();
  const completion = await client.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: 0.2,
    max_tokens: OPENAI_MAX_OUTPUT_TOKENS,
    messages: [
      { role: 'system', content: `${SYSTEM_PROMPT}\nReturn ONLY valid JSON: {"html":"<full updated html>","summary":"short summary"}. Do not wrap in markdown or code fences.` },
      { role: 'user', content: userContent },
    ],
    response_format: { type: 'json_object' },
  });

  const choice = completion.choices?.[0];
  return {
    content: choice?.message?.content || '',
    truncated: choice?.finish_reason === 'length',
  };
}

async function runAnthropic(userContent: string): Promise<{ content: string; truncated: boolean }> {
  const client = getAnthropicClient();
  // Stream and await the final message: required above ~16K max_tokens to avoid
  // the SDK's HTTP-timeout guard. No temperature/top_p — Opus 4.7 rejects them.
  const stream = client.messages.stream({
    model: ANTHROPIC_MODEL,
    max_tokens: ANTHROPIC_MAX_OUTPUT_TOKENS,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        // Prompt-cache the stable instructions (read-cheap on repeat edits).
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: userContent }],
    // Structured output — guarantees a valid {html, summary} JSON object.
    output_config: { format: { type: 'json_schema', schema: HTML_EDIT_SCHEMA } },
  });

  const message = await stream.finalMessage();
  const content = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('');

  return { content, truncated: message.stop_reason === 'max_tokens' };
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const instruction = typeof body?.instruction === 'string' ? body.instruction.trim() : '';
    const currentHtml = typeof body?.currentHtml === 'string' ? body.currentHtml : '';
    const provider: Provider = body?.provider === 'anthropic' ? 'anthropic' : 'openai';

    // Validate the selected provider has a configured key.
    if (provider === 'openai' && !process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key is not configured' }, { status: 500 });
    }
    if (provider === 'anthropic' && !process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Anthropic (Claude) API key is not configured' }, { status: 500 });
    }

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

    const maxHtmlChars = MAX_HTML_CHARS[provider];
    if (currentHtml.length > maxHtmlChars) {
      // If the page would fit Claude but not GPT-4o mini, point the user there
      // instead of telling them to shrink a page that the better model can handle.
      const claudeWouldFit = provider === 'openai' && currentHtml.length <= MAX_HTML_CHARS.anthropic;
      const suggestion = claudeWouldFit
        ? ' Switch the AI model to Claude (Opus 4.7), which handles larger pages, then try again.'
        : ' Edit a smaller section of the HTML, or split the page, then try again.';
      const modelLabel = provider === 'anthropic' ? 'Claude' : 'GPT-4o mini';
      return NextResponse.json(
        {
          error: `This page is too large for ${modelLabel} to rewrite in one pass (${currentHtml.length.toLocaleString()} characters, limit ${maxHtmlChars.toLocaleString()}).${suggestion}`,
        },
        { status: 413 }
      );
    }

    const userContent = buildUserContent(leadPage.name, instruction, currentHtml);

    const { content, truncated } =
      provider === 'anthropic' ? await runAnthropic(userContent) : await runOpenAI(userContent);

    // The model ran out of output room mid-response: the JSON is truncated and
    // unparseable. Tell the user exactly what happened instead of "empty result".
    if (truncated) {
      return NextResponse.json(
        {
          error:
            'The AI ran out of room while rewriting this page (it is too long to return in one response). Edit a smaller section of the HTML and try again.',
        },
        { status: 413 }
      );
    }

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
      provider,
    });
  } catch (error) {
    console.error('Failed to generate AI lead page edit preview:', error);
    return NextResponse.json({ error: 'Failed to generate AI preview' }, { status: 500 });
  }
}
