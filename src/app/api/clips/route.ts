import { NextRequest, NextResponse } from 'next/server';
import { createClipProject, getClips } from '@/lib/adapters/vizard';

export const runtime = 'nodejs';

/**
 * POST /api/clips — start a Vizard clipping project.
 * Body: { videoUrl: string, projectName?: string, preferLength?: number[] }
 */
export async function POST(req: NextRequest) {
  try {
    const { videoUrl, projectName, preferLength } = await req.json();
    if (!videoUrl) return NextResponse.json({ error: 'videoUrl required' }, { status: 400 });
    const job = await createClipProject({ videoUrl, projectName, preferLength });
    return NextResponse.json(job);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Vizard request failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** GET /api/clips?projectId=… — poll clip results. */
export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get('projectId');
    if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });
    return NextResponse.json(await getClips(projectId));
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Vizard request failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
