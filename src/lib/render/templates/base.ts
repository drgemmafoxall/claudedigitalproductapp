import { colors, pastels, gradient, fixedElements, textOn } from '@/lib/brand/tokens';

export interface RenderSection {
  heading: string;
  kind: 'text' | 'list' | 'check' | 'numbered' | 'scenario' | 'exercise' | 'table' | 'quote';
  body: string;
  items?: string[];
}

export interface RenderContent {
  title: string;
  subtitle?: string;
  sections: RenderSection[];
  guidingPrinciple?: string;
  cta: string;
  meta?: { needsGemma?: string[] };
}

const esc = (s: string) =>
  s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

/** Minimal inline markdown: **bold** and line breaks. */
const md = (s: string) =>
  esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');

function sectionHtml(s: RenderSection, i: number): string {
  const accent = pastels[i % pastels.length];
  const items = s.items ?? [];
  let inner = '';
  switch (s.kind) {
    case 'check':
      inner = `<ul class="check">${items.map((it) => `<li><span class="box"></span><span>${md(it)}</span></li>`).join('')}</ul>`;
      break;
    case 'numbered':
      inner = `<ol class="numbered">${items.map((it) => `<li>${md(it)}</li>`).join('')}</ol>`;
      break;
    case 'list':
      inner = `<ul class="bullets">${items.map((it) => `<li>${md(it)}</li>`).join('')}</ul>`;
      break;
    case 'quote':
      inner = `<blockquote>${md(s.body)}</blockquote>`;
      break;
    case 'exercise':
      inner = `<p>${md(s.body)}</p><div class="writein">${'<div class="line"></div>'.repeat(4)}</div>`;
      break;
    default:
      inner = `<p>${md(s.body)}</p>${items.length ? `<ul class="bullets">${items.map((it) => `<li>${md(it)}</li>`).join('')}</ul>` : ''}`;
  }
  const bodyPart = ['check', 'numbered', 'list'].includes(s.kind) && s.body ? `<p>${md(s.body)}</p>` : '';
  return `<section class="card" style="border-top: 3px solid ${accent}">
    <h2>${esc(s.heading)}</h2>${bodyPart}${inner}
  </section>`;
}

/**
 * Base branded A4 document. Every document renderer builds on this:
 * brand tokens only, contrast law enforced, fixed footer + disclaimer,
 * type floors respected, logo lockup bottom-left, guiding principle bottom-right.
 */
export function renderDocumentHtml(content: RenderContent, audienceLabel?: string): string {
  const needs = content.meta?.needsGemma?.length
    ? `<div class="needs-gemma"><strong>NEEDS GEMMA (${content.meta.needsGemma.length})</strong><ul>${content.meta.needsGemma.map((n) => `<li>${esc(n)}</li>`).join('')}</ul></div>`
    : '';

  return `<!doctype html><html><head><meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800&family=Inter:wght@300;400;500;600&display=swap');
  @page { size: A4; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; background: ${colors.cream}; color: ${colors.slate};
         font-size: 10.5pt; line-height: 1.5; }
  .page { padding: 40pt; min-height: 100vh; display: flex; flex-direction: column; }
  .audience-tag { position: absolute; top: 14pt; right: 40pt; font-size: 7.5pt;
    letter-spacing: 0.12em; text-transform: uppercase; color: ${colors.lightSlate}; }
  h1 { font-family: 'Nunito', sans-serif; font-weight: 800; font-size: 30pt;
       color: ${colors.ink}; line-height: 1.15; }
  .subtitle { font-size: 12pt; color: ${colors.slate}; margin-top: 6pt; font-weight: 300; }
  .title-underline { height: 4pt; width: 160pt; border-radius: 2pt; margin: 12pt 0 18pt;
       background: ${gradient}; }
  h2 { font-family: 'Nunito', sans-serif; font-weight: 700; font-size: 13.5pt;
       color: ${colors.ink}; margin-bottom: 6pt; }
  .card { background: ${colors.card}; border: 1px solid ${colors.cardBorder};
       border-radius: 10pt; padding: 12pt 14pt; margin-bottom: 10pt;
       page-break-inside: avoid; }
  p { margin-bottom: 6pt; }
  strong { color: ${colors.ink}; font-weight: 600; }
  ul.bullets { padding-left: 14pt; } ul.bullets li { margin-bottom: 4pt; }
  ol.numbered { padding-left: 16pt; } ol.numbered li { margin-bottom: 5pt; }
  ul.check { list-style: none; } ul.check li { display: flex; gap: 7pt; margin-bottom: 6pt; }
  .box { flex: 0 0 auto; width: 10pt; height: 10pt; border: 1.5pt solid ${colors.sage};
       border-radius: 2.5pt; margin-top: 2pt; }
  blockquote { border-left: 3pt solid ${colors.sage}; padding-left: 10pt;
       font-style: italic; color: ${colors.ink}; }
  .writein .line { border-bottom: 1pt solid ${colors.cardBorder}; height: 16pt; }
  .cta { display: inline-block; align-self: flex-start; background: ${colors.cta}; color: ${textOn(colors.cta)};
       font-family: 'Nunito', sans-serif; font-weight: 700; font-size: 11pt;
       padding: 8pt 20pt; border-radius: 20pt; margin: 10pt 0; }
  .principle { text-align: right; margin-top: auto; padding-top: 12pt; }
  .principle .label { font-size: 7.5pt; letter-spacing: 0.12em; text-transform: uppercase;
       color: ${colors.lightSlate}; }
  .principle .quote { font-style: italic; font-size: 10pt; color: ${colors.ink}; }
  .bottom { display: flex; justify-content: space-between; align-items: flex-end;
       margin-top: 14pt; }
  .logo-lockup { font-family: 'Nunito', sans-serif; font-weight: 800; font-size: 10pt;
       color: ${colors.ink}; line-height: 1.2; }
  .logo-lockup small { display: block; font-weight: 600; font-size: 6.5pt;
       letter-spacing: 0.18em; color: ${colors.slate}; }
  .logo-underline { height: 2.5pt; width: 90pt; background: ${gradient};
       border-radius: 2pt; margin-top: 3pt; }
  .footer { font-size: 7pt; color: ${colors.lightSlate}; margin-top: 8pt; }
  .disclaimer { font-size: 7pt; color: ${colors.lightSlate}; margin-top: 3pt; }
  .needs-gemma { background: #FFF7E8; border: 1.5pt dashed ${colors.cta};
       border-radius: 8pt; padding: 10pt 12pt; margin: 10pt 0; font-size: 9pt;
       color: ${colors.ink}; }
  .needs-gemma ul { padding-left: 14pt; margin-top: 4pt; }
</style></head><body>
<div class="page">
  ${audienceLabel ? `<div class="audience-tag">${esc(audienceLabel)}</div>` : ''}
  <h1>${esc(content.title)}</h1>
  ${content.subtitle ? `<div class="subtitle">${esc(content.subtitle)}</div>` : ''}
  <div class="title-underline"></div>
  ${needs}
  ${content.sections.map(sectionHtml).join('\n')}
  <div class="cta">${esc(content.cta)}</div>
  ${
    content.guidingPrinciple
      ? `<div class="principle"><div class="label">Guiding principle</div><div class="quote">${esc(content.guidingPrinciple)}</div></div>`
      : ''
  }
  <div class="bottom">
    <div>
      <div class="logo-lockup">DR GEMMA<small>AUTISM CONSULTANT</small><div class="logo-underline"></div></div>
      <div class="footer">${esc(fixedElements.footer)} · ${fixedElements.version}</div>
      <div class="disclaimer">${esc(fixedElements.disclaimer)}</div>
    </div>
  </div>
</div>
</body></html>`;
}
