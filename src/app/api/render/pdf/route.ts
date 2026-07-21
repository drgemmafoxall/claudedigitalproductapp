import { NextRequest, NextResponse } from 'next/server';
import { renderDocumentHtml, type RenderContent } from '@/lib/render/templates/base';
import { audienceLabelFor } from '@/lib/brand/tokens';
import { getProduct } from '@/lib/registry/products';
import { uploadPdfToDrive } from '@/lib/adapters/drive';

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
 * Body: { content: RenderContent, audiences?: AudienceId[], productId?: string,
 *         html?: string, format?: 'pdf'|'html'|'drive' }
 * format: 'html' returns the branded HTML (live preview); 'pdf' returns the file;
 * 'drive' renders the PDF and uploads it straight to Gemma's Drive exports folder,
 * returning { driveUrl }.
 * Render settings follow the brand render spec (printBackground on, no header/footer, 0 margins).
 * Single-page product types (product.pages === '1') are auto-shrunk to fit one sheet.
 */
export async function POST(req: NextRequest) {
  try {
    const {
      content,
      audiences: audienceIds,
      audience,
      productId,
      html: providedHtml,
      format = 'pdf',
      kind = 'document',
      pageLength,
    } = await req.json();
    const audienceLabel = audienceLabelFor(audienceIds ?? (audience ? [audience] : []));
    const product = productId ? getProduct(productId) : undefined;
    const html: string =
      providedHtml ??
      (kind === 'ebook'
        ? (await import('@/lib/render/templates/ebook')).renderEbookHtml(content, audienceLabel)
        : renderDocumentHtml(content as RenderContent, audienceLabel));

    if (format === 'html') {
      return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
    }

    const browser = await launchBrowser();
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'load' });
      // Wait for the Google Fonts (Nunito/Inter) to be ready before printing
      await page.evaluateHandle('document.fonts.ready');

      // Single-page-by-design document outputs (pages === '1', e.g. one-pager,
      // infographic) — or any product where Gemma has explicitly chosen a target
      // page count via pageLengthOptions — must fit on exactly that many A4 sheets.
      // Shrink content proportionally if it slightly overflows. Multi-page-by-design
      // types (workbook, resource-guide, etc.) are left alone since they're meant
      // to span several pages and have no pageLengthOptions.
      const targetPages =
        pageLength && product?.pageLengthOptions?.includes(pageLength)
          ? pageLength
          : product?.pages === '1'
            ? 1
            : null;
      if (kind === 'document' && targetPages) {
        const A4_HEIGHT_PX = 1123 * targetPages; // 297mm at 96dpi, per target page
        const contentHeight = await page.evaluate(() => {
          const el = document.querySelector('.page');
          return el ? el.scrollHeight : 0;
        });
        if (contentHeight > A4_HEIGHT_PX) {
          const scale = Math.max(0.75, A4_HEIGHT_PX / contentHeight - 0.01);
          await page.addStyleTag({ content: `.page { zoom: ${scale}; }` });
        }
      }

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true, // required — tints drop out without it
        displayHeaderFooter: false, // kills date/about:blank/page-number artifacts
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
      });
      const title = (content as RenderContent)?.title ?? 'product';
      const filename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60)}.pdf`;

      if (format === 'drive') {
        const drive = await uploadPdfToDrive(Buffer.from(pdf), filename);
        return NextResponse.json({ driveUrl: drive.webViewLink });
      }

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
