import 'server-only';

/**
 * Image generation adapter — Gemini image model ("Nano Banana" /
 * gemini-2.5-flash-image). Generates brand-safe illustrations for social
 * posts, PDF covers and lead magnets. NEVER produces real/photorealistic
 * people (brand rule: no real photos of Gemma, ever — illustration only).
 *
 * Output: PNG bytes (base64 in the API response), which callers store to
 * Supabase Storage and/or Google Drive, then reference by URL from Canva
 * autofill or the Content360 CSV.
 */

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const MODEL = process.env.GEMINI_IMAGE_MODEL ?? 'gemini-2.5-flash-image';

/** Brand visual style — prepended to every image prompt, never overridable per-call. */
export const BRAND_IMAGE_STYLE = `
Soft, warm, hand-illustrated style (flat vector / gentle gradients, rounded shapes,
generous whitespace). Palette strictly limited to: sage green #81B29A, forest green
#6A9B84, cream #FDFBF7, charcoal #2D3748, plus soft pastel accents (blush pink #FFADAD,
peach #FFD6A5, soft yellow #FFE66D, sky blue #A8DADC, lilac #DDA0DD, aqua #E0F7FA,
lavender #E8E4F3). No pure black, no harsh red, no neon colours.
Mood: calm, tender, inclusive, therapeutic — never clinical, never cluttered, never scary.
Composition: plenty of breathing room, rounded/soft edges, no sharp aggressive shapes.

CRITICAL — NEVER include:
- Any real or photorealistic human face or person (this brand uses illustration only,
  never real photos of anyone, including "Dr Gemma" herself).
- Text, letters, or words rendered inside the image (text is added separately in Canva).
- Logos other than describing a small blank space reserved bottom-left for a logo.
- Any medical/clinical iconography that reads as scary, sterile, or stigmatising.
`.trim();

export interface ImagePromptSpec {
  subject: string; // what the image should depict, in plain language
  format?: 'square' | 'story' | 'landscape'; // aspect hint
  audience?: string; // e.g. "parents", "educators" — tone hint only
}

export function buildImagePrompt(spec: ImagePromptSpec): string {
  const aspect =
    spec.format === 'story'
      ? 'Vertical 9:16 composition suitable for an Instagram/Facebook story.'
      : spec.format === 'landscape'
        ? 'Horizontal 16:9 composition.'
        : 'Square 1:1 composition suitable for an Instagram post.';
  return [
    BRAND_IMAGE_STYLE,
    '',
    `SUBJECT: ${spec.subject}`,
    spec.audience ? `AUDIENCE TONE: warm and appropriate for ${spec.audience}.` : '',
    aspect,
    'Leave clear negative space for a headline to be overlaid later.',
  ]
    .filter(Boolean)
    .join('\n');
}

export interface GeneratedImage {
  base64: string; // PNG bytes, base64
  mimeType: string;
}

/** Calls Gemini's image generation model. Throws on failure. */
export async function generateImage(prompt: string): Promise<GeneratedImage> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY not set');

  const res = await fetch(`${API_BASE}/models/${MODEL}:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['IMAGE'] },
    }),
  });
  if (!res.ok) {
    throw new Error(`Gemini image generation failed: ${await res.text()}`);
  }
  const data = await res.json();
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((p: { inlineData?: { data: string; mimeType: string } }) => p.inlineData);
  if (!imagePart?.inlineData) {
    throw new Error('Gemini returned no image data');
  }
  return {
    base64: imagePart.inlineData.data,
    mimeType: imagePart.inlineData.mimeType ?? 'image/png',
  };
}
