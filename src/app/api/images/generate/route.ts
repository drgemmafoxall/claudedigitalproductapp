import { NextRequest, NextResponse } from 'next/server';
import { buildImagePrompt, generateImage } from '@/lib/adapters/image-gen';
import { uploadImageToDrive } from '@/lib/adapters/drive';
import { supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

const STORAGE_BUCKET = 'generated-images';

/**
 * POST /api/images/generate
 * Body: { subject: string, format?: 'square'|'story'|'landscape', audience?: string,
 *         projectId?: string }
 * Generates a brand-safe illustration (Gemini "Nano Banana"), stores it in Supabase
 * Storage, and returns its public URL — ready to feed into Canva autofill or the
 * Content360 CSV media_url column.
 */
export async function POST(req: NextRequest) {
  try {
    const { subject, format = 'square', audience, projectId } = await req.json();
    if (!subject?.trim()) {
      return NextResponse.json({ error: 'subject is required' }, { status: 400 });
    }

    const prompt = buildImagePrompt({ subject, format, audience });
    const image = await generateImage(prompt);
    const bytes = Buffer.from(image.base64, 'base64');
    const ext = image.mimeType.includes('png') ? 'png' : 'jpg';
    const filename = `${Date.now()}-${subject
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 40)}.${ext}`;
    const path = projectId ? `${projectId}/${filename}` : filename;

    let publicUrl: string | null = null;
    try {
      const sb = supabaseAdmin();
      const { error: uploadError } = await sb.storage
        .from(STORAGE_BUCKET)
        .upload(path, bytes, { contentType: image.mimeType, upsert: false });
      if (!uploadError) {
        publicUrl = sb.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
      }
    } catch {
      // Supabase not configured yet — fall back to returning the image inline below
    }

    // Also push a copy straight into Gemma's Drive library, so every generated
    // image lands somewhere she can browse/reuse without touching the app —
    // best-effort: silently skipped if the Drive service account isn't configured.
    let driveUrl: string | null = null;
    try {
      const drive = await uploadImageToDrive(bytes, filename, image.mimeType);
      driveUrl = drive.webViewLink;
    } catch {
      // Drive integration not configured yet — not fatal, image is still returned/stored above
    }

    if (projectId) {
      try {
        await supabaseAdmin()
          .from('assets')
          .insert({
            project_id: projectId,
            kind: 'generated-image',
            storage_path: path,
            public_url: publicUrl,
            metadata: { subject, format, audience, model: 'gemini-image', driveUrl },
          });
      } catch {
        // best-effort logging only
      }
    }

    return NextResponse.json({
      publicUrl,
      driveUrl,
      // Always include the base64 too, so the UI can preview even before Supabase is wired
      dataUrl: `data:${image.mimeType};base64,${image.base64}`,
      path,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Image generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
