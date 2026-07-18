import 'server-only';

/**
 * Vizard adapter — official API. Push audio/video, get back captioned
 * social-ready clips. Docs: https://docs.vizard.ai
 * Requires VIZARD_API_KEY (API access is plan-gated — confirm plan tier).
 */

const API = 'https://elb-api.vizard.ai/hvizard-server-front/open-api/v1';

function headers() {
  const key = process.env.VIZARD_API_KEY;
  if (!key) throw new Error('VIZARD_API_KEY not set');
  return { VIZARDAI_API_KEY: key, 'Content-Type': 'application/json' };
}

export interface VizardProjectOptions {
  videoUrl: string; // public URL of the uploaded audio/video (e.g. Supabase Storage)
  videoType?: number; // 1 = remote file
  lang?: string;
  preferLength?: number[]; // e.g. [1] auto, [2] <30s, [3] 30-60s, [4] 60-90s
  subtitleSwitch?: 0 | 1;
  headlineSwitch?: 0 | 1;
  projectName?: string;
}

/** Create a clipping project. Returns { projectId } to poll. */
export async function createClipProject(opts: VizardProjectOptions) {
  const res = await fetch(`${API}/project/create`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      videoUrl: opts.videoUrl,
      videoType: opts.videoType ?? 1,
      lang: opts.lang ?? 'en',
      preferLength: opts.preferLength ?? [1],
      subtitleSwitch: opts.subtitleSwitch ?? 1,
      headlineSwitch: opts.headlineSwitch ?? 1,
      projectName: opts.projectName ?? 'Doctor Gemma clips',
    }),
  });
  if (!res.ok) throw new Error(`Vizard create failed: ${await res.text()}`);
  return res.json();
}

/** Poll clip results for a project. */
export async function getClips(projectId: string | number) {
  const res = await fetch(`${API}/project/query/${projectId}`, { headers: headers() });
  if (!res.ok) throw new Error(`Vizard query failed: ${await res.text()}`);
  return res.json();
}
