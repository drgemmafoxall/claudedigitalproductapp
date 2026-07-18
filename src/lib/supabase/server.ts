import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase client (service role) — used by API routes for
 * job logging, asset storage and project persistence. Never import client-side.
 */
let _sb: SupabaseClient | null = null;
export function supabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars not set');
  _sb ??= createClient(url, key, { auth: { persistSession: false } });
  return _sb;
}

/** Log a generation job (model routing audit + cost tracking). */
export async function logJob(job: {
  project_id?: string;
  kind: string; // 'normalise' | 'generate' | 'render' | ...
  product_id?: string;
  model?: string;
  input_tokens?: number;
  output_tokens?: number;
  status: 'ok' | 'error';
  error?: string;
}) {
  try {
    await supabaseAdmin().from('jobs').insert(job);
  } catch {
    // job logging must never break the pipeline
  }
}
