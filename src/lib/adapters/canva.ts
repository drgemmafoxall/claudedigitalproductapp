import 'server-only';

/**
 * Canva Connect adapter — autofills brand templates with generated content.
 * Static templates → PNG, animated templates → MP4.
 * Field naming convention (per Canva-Template-Naming-Conventions):
 *   title, subtitle, point_1_heading, point_1_body, point_1_strategy, …, guiding_principle
 *
 * Requires: CANVA_ACCESS_TOKEN (Connect OAuth) and per-template brand template IDs
 * configured in CANVA_TEMPLATE_MAP (JSON env: { "social-info": "TEMPLATE_ID", ... }).
 */

const API = 'https://api.canva.com/rest/v1';

function token(): string {
  const t = process.env.CANVA_ACCESS_TOKEN;
  if (!t) throw new Error('CANVA_ACCESS_TOKEN not set');
  return t;
}

export function templateIdFor(productId: string): string {
  const map = JSON.parse(process.env.CANVA_TEMPLATE_MAP ?? '{}');
  const id = map[productId];
  if (!id) throw new Error(`No Canva brand template mapped for "${productId}"`);
  return id;
}

/** Flatten generated content into Canva autofill field values. */
export function toAutofillFields(content: {
  title: string;
  subtitle?: string;
  sections: { heading: string; body: string; items?: string[] }[];
  guidingPrinciple?: string;
  cta: string;
}): Record<string, { type: 'text'; text: string }> {
  const fields: Record<string, { type: 'text'; text: string }> = {
    title: { type: 'text', text: content.title },
  };
  if (content.subtitle) fields.subtitle = { type: 'text', text: content.subtitle };
  content.sections.forEach((s, i) => {
    const n = i + 1;
    fields[`point_${n}_heading`] = { type: 'text', text: s.heading };
    fields[`point_${n}_body`] = { type: 'text', text: s.body || (s.items ?? []).join('\n') };
  });
  if (content.guidingPrinciple)
    fields.guiding_principle = { type: 'text', text: content.guidingPrinciple };
  fields.cta = { type: 'text', text: content.cta };
  return fields;
}

/** Create an autofill job; returns job id to poll. */
export async function createAutofillJob(brandTemplateId: string, data: Record<string, unknown>) {
  const res = await fetch(`${API}/autofills`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ brand_template_id: brandTemplateId, data }),
  });
  if (!res.ok) throw new Error(`Canva autofill failed: ${await res.text()}`);
  return res.json();
}

export async function getAutofillJob(jobId: string) {
  const res = await fetch(`${API}/autofills/${jobId}`, {
    headers: { Authorization: `Bearer ${token()}` },
  });
  if (!res.ok) throw new Error(`Canva job fetch failed: ${await res.text()}`);
  return res.json();
}

/** Request an export (PNG for static, MP4 for animated designs). */
export async function exportDesign(designId: string, format: 'png' | 'mp4') {
  const res = await fetch(`${API}/exports`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ design_id: designId, format: { type: format } }),
  });
  if (!res.ok) throw new Error(`Canva export failed: ${await res.text()}`);
  return res.json();
}
