import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 120;

/**
 * POST /api/transcribe — multipart form with an `audio` file (mp3/wav/m4a/webm).
 * Uses OpenAI Whisper. Returns { transcript }.
 * The client should then POST the transcript to /api/normalise (sourceType: 'transcript').
 */
export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY not set — transcription unavailable' },
        { status: 501 },
      );
    }
    const form = await req.formData();
    const audio = form.get('audio');
    if (!(audio instanceof File)) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const body = new FormData();
    body.append('file', audio, audio.name || 'audio.webm');
    body.append('model', 'whisper-1');

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body,
    });
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `Whisper error: ${err}` }, { status: 502 });
    }
    const data = await res.json();
    return NextResponse.json({ transcript: data.text });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Transcription failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
