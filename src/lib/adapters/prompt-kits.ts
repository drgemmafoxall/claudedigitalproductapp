/**
 * Prompt-kit adapters — for platforms with no public API (Suno, MagicLight).
 * The generation step produces the structured kit; these helpers format it
 * into a copy-paste package. Claude in Chrome can drive the actual submission.
 */

export interface SunoKit {
  trackTitle: string;
  stylePrompt: string; // genre, tempo, mood, instrumentation
  lyricsOrScript?: string; // omit for instrumental
  description: string;
  usageNotes: string;
}

export function formatSunoKit(kit: SunoKit): string {
  return [
    `# Suno kit — ${kit.trackTitle}`,
    '',
    '## Style prompt (paste into "Style of Music")',
    '```',
    kit.stylePrompt,
    '```',
    kit.lyricsOrScript
      ? `## Lyrics / spoken word (paste into "Lyrics")\n\`\`\`\n${kit.lyricsOrScript}\n\`\`\``
      : '_Instrumental — leave lyrics empty, enable "Instrumental"._',
    '',
    `## Track description\n${kit.description}`,
    '',
    `## Usage notes\n${kit.usageNotes}`,
  ].join('\n');
}

export interface MagicLightScene {
  narration: string; // ≤25 words
  visualDirection: string; // brand-style visual notes
}

export interface MagicLightKit {
  videoTitle: string;
  logline: string;
  styleNotes: string; // global visual style (sage/cream, soft rounded illustration)
  scenes: MagicLightScene[];
  endCardCta: string;
}

export function formatMagicLightKit(kit: MagicLightKit): string {
  return [
    `# MagicLight kit — ${kit.videoTitle}`,
    '',
    `**Logline:** ${kit.logline}`,
    '',
    `## Global style (apply to every scene)\n${kit.styleNotes}`,
    '',
    '## Scenes',
    ...kit.scenes.map(
      (s, i) =>
        `### Scene ${i + 1}\n**Narration:** ${s.narration}\n**Visual:** ${s.visualDirection}`,
    ),
    '',
    `## End card\n${kit.endCardCta}`,
  ].join('\n');
}
