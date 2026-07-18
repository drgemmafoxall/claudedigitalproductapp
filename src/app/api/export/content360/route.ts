import { NextRequest, NextResponse } from 'next/server';
import { buildContent360Csv, suggestSchedule, type ScheduledPost } from '@/lib/adapters/content360';

export const runtime = 'nodejs';

/**
 * POST /api/export/content360
 * Body: { posts: ScheduledPost[] } — or { texts: string[], startDate?: string, perWeek?: number }
 * Returns a Content360 bulk-upload CSV. The scheduled task uploads it (or saves to Drive).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let posts: ScheduledPost[] = body.posts ?? [];

    if (!posts.length && Array.isArray(body.texts)) {
      const start = body.startDate ? new Date(body.startDate) : new Date();
      const slots = suggestSchedule(body.texts.length, start, body.perWeek ?? 5);
      posts = body.texts.map((text: string, i: number) => ({
        ...slots[i],
        platforms: body.platforms ?? ['instagram', 'facebook'],
        text,
      }));
    }
    if (!posts.length) {
      return NextResponse.json({ error: 'No posts provided' }, { status: 400 });
    }

    const csv = buildContent360Csv(posts);
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="content360-schedule.csv"',
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Export failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
