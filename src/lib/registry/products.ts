/**
 * Product registry — the single place output types are defined.
 * Adding a product type = one entry here (anatomy + prompt hints + renderer + model tier).
 */

export type Renderer =
  | 'html-pdf' // branded HTML template → Puppeteer → PDF
  | 'canva-static' // Canva Connect autofill → PNG
  | 'canva-animated' // Canva Connect autofill → MP4
  | 'course-pack' // markdown lessons + workbook PDF → Systeme.io / ZIP
  | 'ebook' // multi-chapter HTML → PDF (+ EPUB/KDP variants)
  | 'vizard-clips' // Vizard API: audio/video → captioned social clips
  | 'prompt-kit-suno' // ready-to-paste Suno prompt package
  | 'prompt-kit-magiclight' // ready-to-paste MagicLight scene package
  | 'image-set'; // Batch of ready-to-paste Nano Banana/Gemini prompts (no image-gen API call)

export type ModelTier = 'haiku' | 'sonnet' | 'top';

export interface ProductDef {
  id: string;
  label: string;
  group: 'documents' | 'social' | 'courses' | 'audio-video' | 'distribution';
  renderer: Renderer;
  tier: ModelTier;
  pages?: string;
  description: string;
  /** Anatomy injected into the generation prompt. */
  anatomy: string;
  /** When set, the wizard offers a page-count choice (e.g. 1 or 2 A4 pages) for this product. */
  pageLengthOptions?: number[];
}

export const PRODUCTS: ProductDef[] = [
  // ---- documents (html-pdf) ----
  {
    id: 'checklist',
    label: 'Checklist',
    group: 'documents',
    renderer: 'html-pdf',
    tier: 'sonnet',
    pages: '1–3',
    pageLengthOptions: [1, 2],
    description: 'Task-based guide with checkboxes for tracking progress',
    anatomy:
      'Title, one-line purpose, 8–15 check items grouped under 2–4 subheads, each item ≤2 lines with an optional "why it matters" strategy line, closing encouragement, CTA.',
  },
  {
    id: 'tip-sheet',
    label: 'Tip sheet / cheat sheet',
    group: 'documents',
    renderer: 'html-pdf',
    tier: 'sonnet',
    pages: '1–3',
    pageLengthOptions: [1, 2],
    description: 'Numbered tips in a quick-reference format',
    anatomy:
      'Title, intro (2–3 sentences), 5–10 numbered tips each with heading + body + practical strategy line, guiding principle quote, CTA.',
  },
  {
    id: 'explainer',
    label: 'Explainer',
    group: 'documents',
    renderer: 'html-pdf',
    tier: 'sonnet',
    pages: '2–4',
    description: 'Deep-dive on a single topic with examples',
    anatomy:
      'Title, "what & why" intro, 3–5 sections with concrete examples, a "what this looks like" scenario, key takeaways box, CTA.',
  },
  {
    id: 'infographic',
    label: 'Infographic (PDF)',
    group: 'documents',
    renderer: 'html-pdf',
    tier: 'sonnet',
    pages: '1',
    pageLengthOptions: [1, 2],
    description: 'Visual one-page presentation of data or a framework',
    anatomy:
      'Punchy title, 3–6 visual blocks (stat, comparison, steps), minimal copy per block (≤25 words), one guiding principle, CTA.',
  },
  {
    id: 'one-pager',
    label: 'One-pager',
    group: 'documents',
    renderer: 'html-pdf',
    tier: 'sonnet',
    pages: '1',
    pageLengthOptions: [1, 2],
    description: 'Single-page summary for quick reference',
    anatomy: 'Title, 3–4 compact sections, key-points sidebar, CTA. Strict one page.',
  },
  {
    id: 'workbook',
    label: 'Workbook',
    group: 'documents',
    renderer: 'html-pdf',
    tier: 'sonnet',
    pages: '4–12',
    description: 'Interactive exercises with fill-in sections',
    anatomy:
      'Title page, how-to-use, 4–8 exercises each with context + prompt + write-in space (specify line counts), reflection page, CTA.',
  },
  {
    id: 'resource-guide',
    label: 'Resource guide',
    group: 'documents',
    renderer: 'html-pdf',
    tier: 'sonnet',
    pages: '2–6',
    description: 'Curated resources organised by category',
    anatomy:
      'Title, intro, 3–6 categories each with 3–8 resources (name, one-line description, where to find), "how to choose" note, CTA.',
  },
  {
    id: 'script',
    label: 'Script / conversation guide',
    group: 'documents',
    renderer: 'html-pdf',
    tier: 'sonnet',
    pages: '1–3',
    description: 'Word-for-word scripts for hard conversations',
    anatomy:
      'Title, when-to-use, 3–6 scenarios each with setup, verbatim script lines, "if they say X" branches, tone notes, CTA.',
  },
  {
    id: 'guide-toolkit',
    label: 'Short guide / toolkit',
    group: 'documents',
    renderer: 'html-pdf',
    tier: 'sonnet',
    pages: '2–6',
    description: 'Multi-section practical guide',
    anatomy:
      'Cover block, contents, 4–8 sections mixing explanation + strategies + examples, summary checklist, CTA.',
  },
  {
    id: 'planner-tracker',
    label: 'Planner / log / tracker',
    group: 'documents',
    renderer: 'html-pdf',
    tier: 'sonnet',
    pages: '1–4',
    description: 'Reusable planning or tracking template',
    anatomy:
      'Title, purpose, the template itself (tables/grids with clear labels), worked example, tips for use, CTA.',
  },
  {
    id: 'lead-magnet',
    label: 'Lead magnet bundle',
    group: 'distribution',
    renderer: 'html-pdf',
    tier: 'sonnet',
    pages: '2–5',
    description: 'PDF freebie + opt-in copy + matching social post',
    anatomy:
      'A high-value freebie PDF (pick best-fit document anatomy), PLUS: opt-in page headline + 3 bullet benefits + button copy, PLUS a matching social post (hook, body, CTA, 5 hashtags).',
  },
  // ---- e-book ----
  {
    id: 'ebook',
    label: 'E-book / manual',
    group: 'documents',
    renderer: 'ebook',
    tier: 'top',
    pages: '20–40+',
    description: 'Long-form book with chapters, TOC, cover — PDF + EPUB/KDP variants',
    anatomy:
      'Cover (title, subtitle, author lockup), copyright page, TOC, intro, 5–10 chapters with consistent internal structure (opener, body sections, examples, chapter summary), conclusion, about + CTA page. Maintain continuity of terminology and frameworks across chapters.',
  },
  // ---- social (canva) ----
  {
    id: 'social-info',
    label: 'Information post',
    group: 'social',
    renderer: 'canva-static',
    tier: 'sonnet',
    description: 'Educational carousel/single with clean layout',
    anatomy:
      'Hook headline (≤8 words), 3–5 teaching points (≤20 words each), takeaway, caption (150–250 words, line breaks, CTA, 5–8 hashtags).',
  },
  {
    id: 'social-engagement',
    label: 'Engagement post',
    group: 'social',
    renderer: 'canva-static',
    tier: 'sonnet',
    description: 'Question/prompt post to drive comments',
    anatomy:
      'Provocative-but-kind question or fill-in-the-blank, context line, caption inviting stories, 5 hashtags.',
  },
  {
    id: 'social-ad',
    label: 'Advertisement post',
    group: 'social',
    renderer: 'canva-static',
    tier: 'sonnet',
    description: 'CTA-focused conversion design',
    anatomy:
      'Benefit-led headline, 2–3 proof/benefit bullets, single CTA (marigold button copy, 1–3 words), primary text + headline + description variants for ads manager.',
  },
  {
    id: 'social-animated',
    label: 'Animated post / video (Canva)',
    group: 'audio-video',
    renderer: 'canva-animated',
    tier: 'sonnet',
    description: 'Animated brand template → MP4',
    anatomy:
      'Same fields as the matching static post, plus per-frame text timing notes (3–6 frames, ≤12 words per frame).',
  },
  {
    id: 'image-set',
    label: 'Image prompt set (paste into Nano Banana / Canva)',
    group: 'social',
    renderer: 'image-set',
    tier: 'sonnet',
    description:
      'A batch of ready-to-paste Nano Banana/Gemini prompts built from your content — no image-generation cost. Paste each into your Gemini Pro account, then feed the results into Canva Bulk Create.',
    anatomy:
      'A set of distinct image subjects (one-sentence plain-language scene descriptions, no text-in-image, no real people) that together illustrate the source material — varied scenes/metaphors, no duplicates. Count scales with how much source material there is.',
  },
  // ---- courses ----
  {
    id: 'mini-course',
    label: 'Mini-course (Systeme.io)',
    group: 'courses',
    renderer: 'course-pack',
    tier: 'sonnet',
    description: 'Module/lesson pack + quizzes + companion workbook + funnel copy',
    anatomy:
      'Course title + promise, 3–6 modules each with 2–5 lessons (lesson = objective, teaching content 300–600 words, activity, key takeaway), per-module quiz (3–5 questions), companion workbook spec, opt-in/sales copy (headline, benefits, CTA).',
  },
  // ---- audio/video ----
  {
    id: 'vizard-clips',
    label: 'Social clips (Vizard)',
    group: 'audio-video',
    renderer: 'vizard-clips',
    tier: 'haiku',
    description: 'mp3/video → captioned social-ready clips via Vizard API',
    anatomy:
      'Clip brief: target platforms, clip length preference, caption style, key moments to look for (timestamps if known), suggested titles per clip.',
  },
  {
    id: 'suno-audio',
    label: 'Calming audio (Suno kit)',
    group: 'audio-video',
    renderer: 'prompt-kit-suno',
    tier: 'sonnet',
    description: 'Ready-to-paste Suno prompt package for regulation/calming audio',
    anatomy:
      'Style prompt (genre, tempo, mood, instrumentation — tuned for calming/regulation), lyrics or spoken-word script in brand voice (if vocal), track title + description, usage notes.',
  },
  {
    id: 'magiclight-video',
    label: 'Explainer video (MagicLight kit — Dr Gemma avatar)',
    group: 'audio-video',
    renderer: 'prompt-kit-magiclight',
    tier: 'sonnet',
    description: 'Scene-by-scene script package for adult MagicLight explainer videos, hosted by the Dr Gemma cartoon avatar',
    anatomy:
      'Video title + logline, 6–12 scenes each with narration line (≤25 words), visual direction in brand style (sage/cream palette, soft rounded illustration, Dr Gemma avatar as consistent host), character/setting consistency notes, end-card CTA.',
  },
  {
    id: 'magiclight-kids-short',
    label: 'Kids animal short (MagicLight kit — Holiday Club cast)',
    group: 'audio-video',
    renderer: 'prompt-kit-magiclight',
    tier: 'sonnet',
    description:
      'Pixar-style "show not tell" short film using the Holiday Club animal ensemble — positive social/inclusion themes for a primary-school-aged audience, no narrated lessons',
    anatomy:
      'Video title + logline, 5–10 scenes each with a narration line (only if needed — many beats should carry with visual action alone, ≤15 words when used, simple literal vocabulary a 3–12 year old understands), visual direction per scene naming which cast member(s) appear and what they do, Pixar-style soft 3D visual notes, gentle end-card (no direct moral statement — end on a warm inclusive moment, not a lesson).',
  },
];

export const getProduct = (id: string) => PRODUCTS.find((p) => p.id === id);
export const byGroup = (g: ProductDef['group']) => PRODUCTS.filter((p) => p.group === g);
