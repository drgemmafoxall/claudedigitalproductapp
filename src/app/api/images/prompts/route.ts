import { NextRequest, NextResponse } from 'next/server';
import { buildNanoBananaPrompts } from '@/lib/adapters/image-prompts';

export const runtime = 'nodejs';

/**
 * POST /api/images/prompts
 * Body: { images: { subject: string }[], format?: 'square'|'story'|'landscape', audience?: string }
 * Returns ready-to-paste Nano Banana / Gemini prompts (no image generation, no API billing) —
 * Gemma pastes each into her Gemini Pro / AI Studio account and downloads the results herself.
 */
export async function POST(req: NextRequest) {
  try {
    const { images, format, audience } = await req.json();
    if (!Array.isArray(images) || !images.length) {
      return NextResponse.json({ error: 'images[] is required' }, { status: 400 });
    }
    const prompts = buildNanoBananaPrompts(images, { format, audience });
    return NextResponse.json({ prompts });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to build prompts';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
