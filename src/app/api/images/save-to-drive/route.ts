import { NextRequest, NextResponse } from 'next/server';
import { uploadImageToDrive } from '@/lib/adapters/drive';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * POST /api/images/save-to-drive
 * Body: { dataUrl: string, subject?: string }
 * Uploads an already-generated image (base64 data URL, from /api/images/generate)
 * into Gemma's Drive images folder. Used by the image-set review flow so only
 * the images she actually selects get pushed to Drive.
 */
export async function POST(req: NextRequest) {
  try {
    const { dataUrl, subject = 'image' } = await req.json();
    if (!dataUrl?.startsWith('data:')) {
      return NextResponse.json({ error: 'dataUrl is required' }, { status: 400 });
    }
    const [header, base64] = dataUrl.split(',');
    const mimeType = header.match(/data:(.*);base64/)?.[1] ?? 'image/png';
    const ext = mimeType.includes('png') ? 'png' : 'jpg';
    const bytes = Buffer.from(base64, 'base64');
    const filename = `${Date.now()}-${subject
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 40)}.${ext}`;

    const drive = await uploadImageToDrive(bytes, filename, mimeType);
    return NextResponse.json({ driveUrl: drive.webViewLink });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Drive save failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
