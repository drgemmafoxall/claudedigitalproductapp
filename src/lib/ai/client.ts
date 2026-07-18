import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import type { ModelTier } from '../registry/products';

/**
 * Model routing — the cost rule from the handoff brief (§7). Enforced here;
 * nothing else in the app picks a model directly.
 *  - haiku: transcription cleanup, classification, tagging, clip briefs
 *  - sonnet: ~80% of generation (social, checklists, tip sheets, guides, lessons)
 *  - top: e-books/manuals/flagship synthesis ONLY (long-document coherence)
 */
export const MODEL_ROUTE: Record<ModelTier, string> = {
  haiku: process.env.MODEL_HAIKU ?? 'claude-haiku-4-5',
  sonnet: process.env.MODEL_SONNET ?? 'claude-sonnet-4-5',
  top: process.env.MODEL_TOP ?? 'claude-opus-4-6',
};

let _client: Anthropic | null = null;
export function anthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not set');
  }
  _client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

export interface CompletionUsage {
  model: string;
  inputTokens: number;
  outputTokens: number;
}

/** Single completion helper. Returns text + usage (for the jobs cost log). */
export async function complete(opts: {
  tier: ModelTier;
  system: string;
  prompt: string;
  maxTokens?: number;
}): Promise<{ text: string; usage: CompletionUsage }> {
  const model = MODEL_ROUTE[opts.tier];
  const msg = await anthropic().messages.create({
    model,
    max_tokens: opts.maxTokens ?? 4096,
    system: opts.system,
    messages: [{ role: 'user', content: opts.prompt }],
  });
  const text = msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n');
  return {
    text,
    usage: {
      model,
      inputTokens: msg.usage.input_tokens,
      outputTokens: msg.usage.output_tokens,
    },
  };
}

/** Extract the first JSON object/array from a model reply. */
export function extractJson<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const start = raw.search(/[[{]/);
  if (start === -1) throw new Error('No JSON found in model output');
  return JSON.parse(raw.slice(start)) as T;
}
