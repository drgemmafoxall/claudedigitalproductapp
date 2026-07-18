import { NextRequest, NextResponse } from 'next/server';
import { complete } from '@/lib/ai/client';

export const runtime = 'nodejs';

/**
 * POST /api/normalise
 * Body: { text: string, sourceType: 'typed' | 'doc' | 'transcript' }
 * Turns raw input into a "source brief": cleaned, structured, with Gemma's
 * verbatim phrasing preserved (her voice is the asset — never paraphrase it away).
 */
export async function POST(req: NextRequest) {
  try {
    const { text, sourceType = 'typed' } = await req.json();
    if (!text?.trim()) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    const { text: brief, usage } = await complete({
      tier: 'haiku',
      system:
        'You clean raw expert input into a structured "source brief" for content generation. ' +
        'PRESERVE the author\'s verbatim phrasing, terminology and framework names exactly — ' +
        'her voice and named frameworks are the product. Remove only filler, transcription ' +
        'artifacts and repetition. Output markdown: a one-line topic, then the cleaned content ' +
        'under logical headings, then a "Key verbatim phrases" list of her most distinctive lines.',
      prompt: `Source type: ${sourceType}\n\nRaw input:\n${text}`,
      maxTokens: 4096,
    });

    return NextResponse.json({ brief, usage });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Normalise failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
