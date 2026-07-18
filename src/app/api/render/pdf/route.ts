import { NextRequest, NextResponse } from 'next/server';
import { renderDocumentHtml, type RenderContent } from '@/lib/render/templates/base';
import { audiences } from '@/lib/brand/tokens';

export const runtime = 'nodejs';
export const maxDuration = 60;

async function launchBrowser() {
  // Local/dev: PUPPETEER_EXECUTABLE_PATH; Netlify: @sparticuz/chromium
  const puppeteer = await import('puppeteer-core');
  const localPath = process.env.PUPPETEER_EXECUTABLE_PATH;
  if (localPath) {
    return puppeteer.launch({ executablePath: localPath, args: ['--no-sandbox'] });
  }
  const chromium = (await import('@sparticuz/chromium')).default;
  return puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  });
}

/**
 * POST /api/render/pdf
 * Body: { content: RenderContent, audience?: AudienceId, html?: string, format?: 'pdf'|'html' }
 * format: 'html' returns the branded HTML (used for live preview); 'pdf' returns the file.
 * Render settings follow the brand render spec (printBackground on, no header/footer, 0 margins).
 */
export async function POST(req: NextRequest) {
  try {
    const { content, audience, html: providedHtml, format = 'pdf' } = await req.json();
    const audienceLabel = audiences.find((a) => a.id === audience)?.label;
    const html: string =
      providedHtml ?? renderDocumentHtml(content as RenderContent, audienceLabel);

    if (format === 'html') {
      return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
    }

    const browser = await launchBrowser();
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'load' });
      // Wait for the Google Fonts (Nunito/Inter) to be ready before printing
      await page.evaluateHandle('document.fonts.ready');
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true, // required — tints drop out without it
        displayHeaderFooter: false, // kills date/about:blank/page-number artifacts
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
      });
      const title = (content as RenderContent)?.title ?? 'product';
      const filename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60)}.pdf`;
      return new NextResponse(Buffer.from(pdf), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    } finally {
      await browser.close();
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Render failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
