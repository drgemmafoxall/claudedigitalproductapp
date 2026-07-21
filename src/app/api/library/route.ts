import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * GET /api/library
 * Lists saved products, most recent first, for the Library page.
 */
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin()
      .from('products')
      .select(
        'id, project_id, product_id, audience, content, status, file_url, created_at, updated_at, ' +
          'projects(raw_input, source_briefs(brief))',
      )
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    return NextResponse.json({ products: data ?? [] });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to load library';
    return NextResponse.json({ error: message, products: [] }, { status: 500 });
  }
}

/**
 * POST /api/library
 * Body: { title: string, rawInput?: string, brief?: string, productId: string,
 *         audience: string, content: unknown, existingProductRowId?: string }
 * Saves (or updates) a generated product. Creates a lightweight project +
 * source_brief on first save; subsequent saves for the same product update
 * the existing row (pass back existingProductRowId).
 */
export async function POST(req: NextRequest) {
  try {
    const {
      title,
      rawInput = '',
      brief = '',
      productId,
      audience,
      content,
      existingProductRowId,
    } = await req.json();
    const sb = supabaseAdmin();

    if (existingProductRowId) {
      const { error } = await sb
        .from('products')
        .update({ content, audience, updated_at: new Date().toISOString() })
        .eq('id', existingProductRowId);
      if (error) throw error;
      return NextResponse.json({ productRowId: existingProductRowId });
    }

    const { data: project, error: projErr } = await sb
      .from('projects')
      .insert({ title: title ?? 'Untitled', raw_input: rawInput, source_type: 'typed', status: 'completed' })
      .select('id')
      .single();
    if (projErr) throw projErr;

    if (brief) {
      await sb.from('source_briefs').insert({ project_id: project.id, brief });
    }

    const { data: product, error: prodErr } = await sb
      .from('products')
      .insert({
        project_id: project.id,
        product_id: productId,
        audience,
        content,
        status: 'draft',
      })
      .select('id')
      .single();
    if (prodErr) throw prodErr;

    return NextResponse.json({ productRowId: product.id, projectId: project.id });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to save to library';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
