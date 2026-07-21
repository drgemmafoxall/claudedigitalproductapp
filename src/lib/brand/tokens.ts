/**
 * Doctor Gemma brand tokens — single source of truth for the app.
 * Synced to product-factory skill references/brand-tokens.md v1.0 (July 2026)
 * and Doctor-Gemma-Brand-Guidelines. Do NOT hardcode colours or fonts anywhere else.
 */

export const colors = {
  sage: '#81B29A', // primary brand fill — charcoal text on it, NEVER white
  forest: '#6A9B84', // dark sage — hover/depth; white text OK
  cream: '#FDFBF7', // page background
  ink: '#2D3748', // charcoal — headings & primary text
  slate: '#4A5568', // body text
  lightSlate: '#6B7280', // captions, metadata
  card: '#FFFFFF',
  cardBorder: '#EDEDE8',
  cta: '#F4A62A', // marigold — primary CTA ONLY, charcoal label, once per asset
  ctaUrgent: '#C1440E', // coral — launch/urgency CTA only, white text OK
} as const;

export const pastels = [
  '#FFADAD', // soft pink
  '#FFD6A5', // peach
  '#FFE66D', // yellow
  '#A8DADC', // sky blue
  '#DDA0DD', // lilac
  '#E0F7FA', // soft aqua
  '#E8E4F3', // lavender
] as const;

/** Pastel gradient — section dividers & logo underline only, never a background. */
export const gradient = `linear-gradient(90deg, ${pastels.join(', ')})`;

export const fonts = {
  heading: `'Nunito', sans-serif`, // 800 titles, 700 subheads
  body: `'Inter', sans-serif`, // 400 body, 500/600 emphasis, 300 large only
} as const;

/** Type floors (pt, for print/PDF). Do not go below. */
export const typeFloors = {
  h1: { min: 30, max: 34 },
  h2: { min: 13, max: 14 },
  body: 10, // 16px on screen
  strategy: 9,
  footer: 7,
} as const;

/**
 * THE CONTRAST LAW. Text on any coloured fill = charcoal, unless the fill is
 * dark enough (forest / coral / charcoal) for white.
 * Illegal combos (white-on-sage, sage-on-cream) are unrepresentable via this fn.
 */
const DARK_FILLS: string[] = [colors.forest, colors.ctaUrgent, colors.ink];
export function textOn(fill: string): string {
  return DARK_FILLS.includes(fill) ? '#FFFFFF' : colors.ink;
}

/** Fixed elements — every rendered product carries these. */
export const fixedElements = {
  footer: '© 2026 DR GEMMA AUTISM CONSULTANT • www.doctorgemma.com',
  disclaimer:
    'This is for informational purposes only. For medical advice please book an appointment with your family doctor or paediatrician.',
  copyright: 'Copyright 2025–2035 DoctorGemma.com. All rights reserved.',
  version: 'v1.0 · Jul 2026',
  page: { format: 'A4' as const, marginPt: 40 },
} as const;

export const audiences = [
  { id: 'general', label: 'General / all audiences' },
  { id: 'parent', label: 'Parents & caregivers' },
  { id: 'educator', label: 'Educators & teachers' },
  { id: 'clinician', label: 'Therapists & clinicians' },
  { id: 'autistic-adult', label: 'Autistic adults' },
  { id: 'leadership', label: 'School leaders & policy' },
  { id: 'children', label: 'Children (developmental age 3–12)' },
] as const;
export type AudienceId = (typeof audiences)[number]['id'];

/** Builds a display label from one or more selected audience ids. */
export function audienceLabelFor(ids: string[]): string {
  if (!ids.length || ids.includes('general')) return 'General / all audiences';
  const labels = ids
    .map((id) => audiences.find((a) => a.id === id)?.label as string | undefined)
    .filter((l): l is string => Boolean(l));
  return labels.length ? labels.join(' & ') : 'General / all audiences';
}
