import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 120;

const GEMINI_MODEL = process.env.GEMINI_TRANSCRIBE_MODEL ?? 'gemini-2.5-flash';
const API_BASE = 'https://generativelanguage.googleapis.com';

/**
 * POST /api/transcribe — multipart form with an `audio` file (mp3/wav/m4a/webm).
 * Uses the Gemini API (server-side key, never exposed to the browser).
 * Small files go inline; larger files go through the Gemini Files API.
 * Returns { transcript }. The client then POSTs it to /api/normalise.
 */
export async function POST(req: NextRequest) {
  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY not set — transcription unavailable' },
        { status: 501 },
      );
    }
    const form = await req.formData();
    const audio = form.get('audio');
    if (!(audio instanceof File)) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }
    const bytes = Buffer.from(await audio.arrayBuffer());
    const mimeType = audio.type || 'audio/mpeg';

    const instruction =
      'Transcribe this audio verbatim. Keep the speaker\'s exact wording, phrasing and ' +
      'terminology — do not summarise, correct, or paraphrase. Use paragraph breaks at ' +
      'natural pauses. Output ONLY the transcript text.';

    let audioPart: Record<string, unknown>;

    if (bytes.length < 15 * 1024 * 1024) {
      // Inline for files under ~15MB
      audioPart = { inline_data: { mime_type: mimeType, data: bytes.toString('base64') } };
    } else {
      // Files API for larger uploads
      const upload = await fetch(
        `${API_BASE}/upload/v1beta/files?key=${key}`,
        {
          method: 'POST',
          headers: {
            'X-Goog-Upload-Protocol': 'raw',
            'Content-Type': mimeType,
          },
          body: new Uint8Array(bytes),
        },
      );
      if (!upload.ok) {
        return NextResponse.json(
          { error: `Gemini file upload failed: ${await upload.text()}` },
          { status: 502 },
        );
      }
      const uploaded = await upload.json();
      audioPart = { file_data: { mime_type: mimeType, file_uri: uploaded.file.uri } };
    }

    const res = await fetch(
      `${API_BASE}/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: instruction }, audioPart] }],
        }),
      },
    );
    if (!res.ok) {
      return NextResponse.json(
        { error: `Gemini transcription failed: ${await res.text()}` },
        { status: 502 },
      );
    }
    const data = await res.json();
    const transcript = data.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? '')
      .join('')
      .trim();
    if (!transcript) {
      return NextResponse.json({ error: 'Gemini returned no transcript' }, { status: 502 });
    }
    return NextResponse.json({ transcript });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Transcription failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
