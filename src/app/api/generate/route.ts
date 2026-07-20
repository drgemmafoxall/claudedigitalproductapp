import { NextRequest, NextResponse } from 'next/server';
import { complete } from '@/lib/ai/client';
import { getProduct } from '@/lib/registry/products';
import { VOICE_RULES, QUALITY_GATE } from '@/lib/brand/voice';
import { audiences, fixedElements } from '@/lib/brand/tokens';

export const runtime = 'nodejs';
export const maxDuration = 120;

/** JSON output schema varies by renderer. */
function schemaFor(renderer: string): string {
  switch (renderer) {
    case 'ebook':
      return '{ "title": string, "subtitle": string?, "introduction": string, "chapters": [{ "title": string, "sections": [{ "heading": string?, "body": string }], "summary": string? }], "conclusion": string, "aboutCta": string, "meta": { "needsGemma": string[] } }';
    case 'course-pack':
      return '{ "title": string, "promise": string, "modules": [{ "title": string, "lessons": [{ "title": string, "objective": string, "content": string, "activity": string, "keyTakeaway": string }], "quiz": [{ "question": string, "options": string[], "answerIndex": number }] }], "workbookSpec": string, "optInCopy": { "headline": string, "benefits": string[], "cta": string }, "meta": { "needsGemma": string[] } }';
    case 'prompt-kit-suno':
      return '{ "trackTitle": string, "stylePrompt": string, "lyricsOrScript": string?, "description": string, "usageNotes": string, "meta": { "needsGemma": string[] } }';
    case 'prompt-kit-magiclight':
      return '{ "videoTitle": string, "logline": string, "styleNotes": string, "scenes": [{ "narration": string, "visualDirection": string }], "endCardCta": string, "meta": { "needsGemma": string[] } }';
    case 'vizard-clips':
      return '{ "projectName": string, "platforms": string[], "preferLength": string, "captionStyle": string, "keyMoments": string[], "suggestedTitles": string[], "meta": { "needsGemma": string[] } }';
    default:
      return '{ "title": string, "subtitle": string?, "sections": [{ "heading": string, "kind": "text"|"list"|"check"|"numbered"|"scenario"|"exercise"|"table"|"quote", "body": string, "items": string[]? }], "guidingPrinciple": string?, "cta": string, "caption": string?, "imageSubject": string?, "meta": { "needsGemma": string[] } }';
  }
}

/** Products that benefit from a suggested illustration (social/lead-magnet types). */
const IMAGE_ELIGIBLE_RENDERERS = ['canva-static', 'canva-animated'];

/**
 * POST /api/generate
 * Body: { brief: string, productId: string, audience: AudienceId, notes?: string }
 * Returns structured product content (JSON) generated in brand voice, model-routed
 * by product tier, with the quality gate applied.
 */
export async function POST(req: NextRequest) {
  try {
    const { brief, productId, audience = 'parent', notes = '' } = await req.json();
    const product = getProduct(productId);
    if (!product) {
      return NextResponse.json({ error: `Unknown product: ${productId}` }, { status: 400 });
    }
    if (!brief?.trim()) {
      return NextResponse.json({ error: 'No source brief provided' }, { status: 400 });
    }
    const audienceLabel =
      audiences.find((a) => a.id === audience)?.label ?? 'Parents & caregivers';

    const system = [
      VOICE_RULES,
      '',
      `PRODUCT TYPE: ${product.label} (${product.description})`,
      `ANATOMY (follow exactly): ${product.anatomy}`,
      product.pages ? `LENGTH: ${product.pages} pages.` : '',
      `AUDIENCE: ${audienceLabel} — use that register.`,
      '',
      'Return ONLY a JSON object with this shape:',
      schemaFor(product.renderer),
      IMAGE_ELIGIBLE_RENDERERS.includes(product.renderer)
        ? 'Also include "imageSubject": a one-sentence plain-language description of an ' +
          'illustration that would suit this post (no text/words in the image, no real ' +
          'people/photos — describe a scene, metaphor, or abstract shape only).'
        : '',
      'Put every [NEEDS GEMMA] gap into meta.needsGemma as well as inline.',
      `The renderer adds the fixed footer ("${fixedElements.footer}") and disclaimer automatically — do not include them.`,
      '',
      QUALITY_GATE,
    ]
      .filter(Boolean)
      .join('\n');

    const { text, usage } = await complete({
      tier: product.tier,
      system,
      prompt: `SOURCE BRIEF:\n${brief}\n${notes ? `\nEXTRA DIRECTION FROM GEMMA:\n${notes}` : ''}`,
      maxTokens: product.tier === 'top' ? 16384 : 8192,
    });

    // Parse the JSON payload out of the reply
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const raw = fenced ? fenced[1] : text;
    const start = raw.search(/[{]/);
    const content = JSON.parse(raw.slice(start));

    return NextResponse.json({ content, usage, product: product.id, audience });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
