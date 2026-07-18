import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { buildCoursePack, type MiniCourse } from '@/lib/adapters/course-pack';

export const runtime = 'nodejs';

/**
 * POST /api/export/course-pack
 * Body: { course: MiniCourse }
 * Returns a ZIP formatted for fast Systeme.io import (lessons, quizzes,
 * opt-in copy, workbook spec, import guide).
 */
export async function POST(req: NextRequest) {
  try {
    const { course } = (await req.json()) as { course: MiniCourse };
    if (!course?.title || !course?.modules?.length) {
      return NextResponse.json({ error: 'Invalid course payload' }, { status: 400 });
    }
    const zip = new JSZip();
    for (const f of buildCoursePack(course)) zip.file(f.path, f.content);
    const buf = await zip.generateAsync({ type: 'nodebuffer' });
    const name = course.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${name}-course-pack.zip"`,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Export failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
