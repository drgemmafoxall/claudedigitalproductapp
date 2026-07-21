import { colors, gradient, fixedElements } from '@/lib/brand/tokens';
import { EMBEDDED_FONTS_CSS } from '@/lib/render/embedded-fonts';

export interface EbookChapter {
  title: string;
  sections: { heading?: string; body: string }[];
  summary?: string;
}

export interface EbookContent {
  title: string;
  subtitle?: string;
  chapters: EbookChapter[];
  introduction: string;
  conclusion: string;
  aboutCta: string;
  meta?: { needsGemma?: string[] };
}

const esc = (s: string) =>
  s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const md = (s: string) =>
  esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .split(/\n\n+/)
    .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
    .join('');

/**
 * Branded e-book HTML: cover → copyright → TOC → intro → chapters → conclusion → about/CTA.
 * A4 print layout; chapter openers get the pastel gradient rule; type floors respected.
 */
export function renderEbookHtml(book: EbookContent, audienceLabel?: string): string {
  const toc = book.chapters
    .map((c, i) => `<li><span class="n">${i + 1}</span> ${esc(c.title)}</li>`)
    .join('');

  const chapters = book.chapters
    .map(
      (c, i) => `
  <div class="page chapter">
    <div class="ch-label">Chapter ${i + 1}</div>
    <h2 class="ch-title">${esc(c.title)}</h2>
    <div class="rule"></div>
    ${c.sections
      .map((s) => `${s.heading ? `<h3>${esc(s.heading)}</h3>` : ''}${md(s.body)}`)
      .join('')}
    ${c.summary ? `<div class="summary"><strong>In short:</strong> ${md(c.summary)}</div>` : ''}
    <div class="pfoot">${esc(fixedElements.footer)}</div>
  </div>`,
    )
    .join('');

  return `<!doctype html><html><head><meta charset="utf-8">
<style>
  ${EMBEDDED_FONTS_CSS}
  @page { size: A4; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; color: ${colors.slate}; font-size: 10.5pt; line-height: 1.6; }
  .page { padding: 52pt 56pt; page-break-after: always; background: #fff; min-height: 100vh;
    position: relative; }
  .pfoot { position: absolute; bottom: 20pt; left: 56pt; right: 56pt; font-size: 7pt;
    color: ${colors.lightSlate}; display: flex; justify-content: space-between; }
  h1, h2, h3 { font-family: 'Nunito', sans-serif; color: ${colors.ink}; }
  p { margin-bottom: 8pt; }
  strong { color: ${colors.ink}; }

  .cover { background: ${colors.cream}; display: flex; flex-direction: column;
    justify-content: center; align-items: center; text-align: center; }
  .cover h1 { font-size: 34pt; font-weight: 800; max-width: 80%; line-height: 1.15; }
  .cover .sub { font-size: 13pt; margin-top: 12pt; color: ${colors.slate}; font-weight: 300; }
  .cover .rule { margin-top: 22pt; }
  .cover .author { margin-top: 40pt; font-family: 'Nunito', sans-serif; font-weight: 800;
    color: ${colors.ink}; letter-spacing: 0.02em; }
  .cover .author small { display: block; font-weight: 600; font-size: 7.5pt;
    letter-spacing: 0.2em; color: ${colors.slate}; }
  .cover .aud { margin-top: 10pt; font-size: 8pt; letter-spacing: 0.15em;
    text-transform: uppercase; color: ${colors.lightSlate}; }

  .rule { height: 3.5pt; width: 150pt; border-radius: 2pt; background: ${gradient}; }

  .copyright { display: flex; flex-direction: column; justify-content: flex-end;
    font-size: 8.5pt; color: ${colors.lightSlate}; }
  .toc h2 { font-size: 22pt; font-weight: 800; margin-bottom: 16pt; }
  .toc ul { list-style: none; margin-top: 10pt; }
  .toc li { padding: 7pt 0; border-bottom: 1pt solid ${colors.cardBorder}; font-size: 11pt;
    color: ${colors.ink}; }
  .toc .n { display: inline-block; width: 22pt; font-family: 'Nunito', sans-serif;
    font-weight: 800; color: ${colors.forest}; }

  .ch-label { font-size: 8.5pt; letter-spacing: 0.2em; text-transform: uppercase;
    color: ${colors.forest}; font-weight: 600; }
  .ch-title { font-size: 21pt; font-weight: 800; margin: 4pt 0 10pt; }
  .chapter .rule { margin-bottom: 16pt; }
  .chapter h3 { font-size: 12.5pt; font-weight: 700; margin: 12pt 0 5pt; }
  .summary { background: ${colors.cream}; border-left: 3pt solid ${colors.sage};
    border-radius: 6pt; padding: 10pt 12pt; margin-top: 14pt; }

  .end .cta { display: inline-block; background: ${colors.sage}; color: ${colors.ink};
    font-family: 'Nunito', sans-serif; font-weight: 700; padding: 9pt 22pt;
    border-radius: 22pt; margin-top: 16pt; }
  .disclaimer { margin-top: 14pt; font-size: 7.5pt; color: ${colors.lightSlate}; }
</style></head><body>

<div class="page cover">
  <h1>${esc(book.title)}</h1>
  ${book.subtitle ? `<div class="sub">${esc(book.subtitle)}</div>` : ''}
  <div class="rule"></div>
  <div class="author">DR GEMMA<small>AUTISM CONSULTANT</small></div>
  ${audienceLabel ? `<div class="aud">For ${esc(audienceLabel)}</div>` : ''}
</div>

<div class="page copyright">
  <div>
    <p>${esc(book.title)}</p>
    <p>${esc(fixedElements.copyright)}</p>
    <p>${esc(fixedElements.footer)} · ${fixedElements.version}</p>
    <p class="disclaimer">${esc(fixedElements.disclaimer)}</p>
  </div>
</div>

<div class="page toc">
  <h2>Contents</h2>
  <div class="rule"></div>
  <ul>${toc}</ul>
  <div class="pfoot">${esc(fixedElements.footer)}</div>
</div>

<div class="page">
  <h2 class="ch-title">Welcome</h2>
  <div class="rule" style="margin-bottom:16pt"></div>
  ${md(book.introduction)}
  <div class="pfoot">${esc(fixedElements.footer)}</div>
</div>

${chapters}

<div class="page end">
  <h2 class="ch-title">Where to from here</h2>
  <div class="rule" style="margin-bottom:16pt"></div>
  ${md(book.conclusion)}
  ${md(book.aboutCta)}
  <a class="cta" href="${fixedElements.websiteUrl}">Explore more</a>
  <div class="disclaimer">${esc(fixedElements.disclaimer)}</div>
  <div class="pfoot">${esc(fixedElements.footer)}</div>
</div>

</body></html>`;
}
