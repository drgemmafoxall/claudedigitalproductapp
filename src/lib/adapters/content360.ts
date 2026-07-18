/**
 * Content360 adapter — no public API, so the integration is a bulk-upload CSV
 * maintained as a content calendar (Google Sheet / Drive). A scheduled task
 * (or Claude in Chrome) performs the upload run.
 *
 * NOTE: column spec below is a sensible default — replace with the exact
 * columns from Content360's bulk upload screen once Gemma exports a sample.
 */

export interface ScheduledPost {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm (user's timezone)
  platforms: string[]; // e.g. ['instagram', 'facebook', 'linkedin']
  text: string; // caption / post text
  mediaUrl?: string; // public URL of PNG/MP4 (Supabase Storage / Drive)
  firstComment?: string;
  link?: string;
}

const CSV_COLUMNS = ['date', 'time', 'platforms', 'text', 'media_url', 'first_comment', 'link'];

function csvEscape(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v;
}

export function buildContent360Csv(posts: ScheduledPost[]): string {
  const rows = posts.map((p) =>
    [
      p.date,
      p.time,
      p.platforms.join('|'),
      p.text,
      p.mediaUrl ?? '',
      p.firstComment ?? '',
      p.link ?? '',
    ]
      .map(csvEscape)
      .join(','),
  );
  return [CSV_COLUMNS.join(','), ...rows].join('\n');
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
