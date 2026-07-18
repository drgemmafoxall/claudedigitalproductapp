/**
 * Course pack adapter — turns generated mini-course content into a
 * Systeme.io-ready package: per-lesson markdown, quizzes, workbook spec,
 * funnel copy, and an import guide. Delivered as a structured object the
 * export route zips up (and, where the Systeme.io API allows, pushes directly).
 */

export interface Lesson {
  title: string;
  objective: string;
  content: string; // markdown, 300–600 words
  activity: string;
  keyTakeaway: string;
}

export interface CourseModule {
  title: string;
  lessons: Lesson[];
  quiz: { question: string; options: string[]; answerIndex: number }[];
}

export interface MiniCourse {
  title: string;
  promise: string;
  modules: CourseModule[];
  workbookSpec: string;
  optInCopy: { headline: string; benefits: string[]; cta: string };
}

export interface CoursePackFile {
  path: string;
  content: string;
}

export function buildCoursePack(course: MiniCourse): CoursePackFile[] {
  const files: CoursePackFile[] = [];

  files.push({
    path: '00-IMPORT-GUIDE.md',
    content: [
      `# ${course.title} — Systeme.io import guide`,
      '',
      '1. Systeme.io → Products/Sales → Courses → Create course.',
      `2. Course name: **${course.title}**. Description: ${course.promise}`,
      '3. Create one module per `module-N` folder below, one lecture per lesson file.',
      '4. Paste each lesson markdown into the lecture editor (it converts cleanly).',
      '5. Add the quiz questions from each module\'s `quiz.md` as a Systeme.io quiz.',
      '6. Attach the companion workbook PDF as a downloadable resource on module 1.',
      '7. Use `optin-copy.md` for the squeeze page and thank-you page.',
    ].join('\n'),
  });

  course.modules.forEach((m, mi) => {
    const mdir = `module-${mi + 1}`;
    m.lessons.forEach((l, li) => {
      files.push({
        path: `${mdir}/lesson-${li + 1}-${slug(l.title)}.md`,
        content: [
          `# ${l.title}`,
          '',
          `**Objective:** ${l.objective}`,
          '',
          l.content,
          '',
          `## Try this`,
          l.activity,
          '',
          `> **Key takeaway:** ${l.keyTakeaway}`,
        ].join('\n'),
      });
    });
    files.push({
      path: `${mdir}/quiz.md`,
      content: m.quiz
        .map(
          (q, qi) =>
            `**Q${qi + 1}. ${q.question}**\n${q.options
              .map((o, oi) => `- [${oi === q.answerIndex ? 'x' : ' '}] ${o}`)
              .join('\n')}`,
        )
        .join('\n\n'),
    });
  });

  files.push({
    path: 'optin-copy.md',
    content: [
      `# ${course.optInCopy.headline}`,
      '',
      ...course.optInCopy.benefits.map((b) => `- ${b}`),
      '',
      `**CTA:** ${course.optInCopy.cta}`,
    ].join('\n'),
  });

  files.push({ path: 'workbook-spec.md', content: course.workbookSpec });

  return files;
}

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
