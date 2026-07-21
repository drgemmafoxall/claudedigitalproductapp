/**
 * Copy-paste Nano Banana / Gemini prompt builder — the free-tier-friendly
 * alternative to calling the paid Gemini image API directly (see
 * lib/adapters/image-gen.ts, which is kept for a possible future paid path).
 *
 * Instead of generating images itself, the app produces ready-to-paste
 * prompts that Gemma pastes into her Gemini Pro / AI Studio account
 * (covered by her subscription, no API billing involved), downloads the
 * results from, and feeds into the Canva Bulk Create + Google Sheet workflow.
 */
import { buildImagePrompt, type ImagePromptSpec } from './image-gen';

export interface NanoBananaPromptItem {
  subject: string;
  prompt: string;
}

/** Builds one ready-to-paste prompt per subject, reusing the same brand style rules. */
export function buildNanoBananaPrompts(
  subjects: { subject: string }[],
  opts: { format?: ImagePromptSpec['format']; audience?: string } = {},
): NanoBananaPromptItem[] {
  return subjects.map(({ subject }) => ({
    subject,
    prompt: buildImagePrompt({ subject, format: opts.format, audience: opts.audience }),
  }));
}
