/**
 * Content360 adapter — no public API; integration is their bulk-upload CSV.
 * Column spec matches Gemma's real template (Content360postACASpreadsheet /
 * os_bulk_template, verified 19 Jul 2026):
 *   Text | Year | Month (1 to 12) | Date | Hour (From 0 to 23) | Minutes |
 *   Post Type (Post, Story, Reel) | Media URL (.mp4 recommended for videos) |
 *   No. of Repetitions (From 1-100) | Time Gap between Repetitions (DAILY,
 *   WEEKLY, MONTHLY OR YEARLY) | Pinterest Title | Pinterest Link
 */

export type PostType = 'Post' | 'Story' | 'Reel';
export type RepetitionGap = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface ScheduledPost {
  text: string; // caption / post text
  date: string; // YYYY-MM-DD (local)
  time: string; // HH:mm
  postType?: PostType; // default 'Post'
  mediaUrl?: string; // public URL (.mp4 recommended for videos)
  repetitions?: number; // 1–100, default 1
  repetitionGap?: RepetitionGap; // required by Content360 when repetitions > 1
  pinterestTitle?: string;
  pinterestLink?: string;
}

const HEADER = [
  'Text',
  'Year',
  'Month (1 to 12)',
  'Date',
  'Hour (From 0 to 23)',
  'Minutes',
  'Post Type (Post, Story, Reel)',
  'Media URL (.mp4 recommended for videos)',
  'No. of Repetitions (From 1-100)',
  'Time Gap between Repetitions (DAILY, WEEKLY, MONTHLY OR YEARLY)',
  'Pinterest Title',
  'Pinterest Link',
];

function csvEscape(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

export function buildContent360Csv(posts: ScheduledPost[]): string {
  const rows = posts.map((p) => {
    const [y, m, d] = p.date.split('-').map(Number);
    const [hh, mm] = p.time.split(':').map(Number);
    return [
      p.text,
      y,
      m,
      d,
      hh,
      mm,
      p.postType ?? 'Post',
      p.mediaUrl ?? '',
      p.repetitions ?? 1,
      p.repetitionGap ?? '',
      p.pinterestTitle ?? '',
      p.pinterestLink ?? '',
    ]
      .map(csvEscape)
      .join(',');
  });
  return [HEADER.map(csvEscape).join(','), ...rows].join('\n');
}

/** Spread posts across a date range at a given cadence (posts per week). */
export function suggestSchedule(
  count: number,
  startDate: Date,
  perWeek = 5,
  postTime = '09:00',
): { date: string; time: string }[] {
  const gapDays = 7 / perWeek;
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + Math.round(i * gapDays));
    return { date: d.toISOString().slice(0, 10), time: postTime };
  });
}
