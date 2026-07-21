'use client';

import { useEffect, useState } from 'react';
import { getProduct } from '@/lib/registry/products';

interface LibraryProduct {
  id: string;
  project_id: string;
  product_id: string;
  audience: string;
  content: { title?: string } | null;
  status: string;
  file_url: string | null;
  created_at: string;
  updated_at: string;
  projects?: {
    raw_input: string | null;
    source_briefs?: { brief: string }[] | null;
  } | null;
}

export default function Library() {
  const [products, setProducts] = useState<LibraryProduct[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/library')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        setProducts(data.products ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'));
  }, []);

  const download = async (p: LibraryProduct) => {
    setBusyId(p.id);
    try {
      const res = await fetch('/api/render/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: p.content,
          audiences: p.audience ? p.audience.split(', ') : [],
          productId: p.product_id,
          format: 'pdf',
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Render failed');
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${p.content?.title ?? 'product'}.pdf`;
      a.click();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Download failed');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center py-6">
        <h1 className="text-2xl font-extrabold">Your library</h1>
        <div className="brand-underline w-32 mx-auto my-4" />
        <p className="text-sm">
          Every product you generate is saved here automatically, with its content and export
          history.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-ctaurgent/40 bg-ctaurgent/5 text-ink p-4 text-sm">
          {error}
          {error.includes('Supabase') && (
            <div className="mt-1 text-xs">
              Set SUPABASE_SERVICE_ROLE_KEY in Netlify to enable the Library.
            </div>
          )}
        </div>
      )}

      {products === null && !error && (
        <div className="text-center text-sm text-lightslate">Loading…</div>
      )}

      {products && products.length === 0 && !error && (
        <div className="text-center text-sm text-lightslate py-12">
          Nothing here yet — generate a product in Create and it'll show up here automatically.
        </div>
      )}

      {products && products.length > 0 && (
        <div className="grid gap-3">
          {products.map((p) => {
            const def = getProduct(p.product_id);
            const brief = p.projects?.source_briefs?.[0]?.brief;
            const rawInput = p.projects?.raw_input;
            const hasSource = Boolean(brief || rawInput);
            const isExpanded = expandedId === p.id;
            return (
              <div key={p.id} className="rounded-xl border border-cardborder bg-card p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-heading font-bold text-ink truncate">
                      {p.content?.title ?? 'Untitled'}
                    </div>
                    <div className="text-xs text-lightslate mt-0.5">
                      {def?.label ?? p.product_id} · {p.audience || 'General'} ·{' '}
                      {new Date(p.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {hasSource && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : p.id)}
                        className="rounded-full border border-cardborder px-4 py-1.5 text-sm font-medium text-slate hover:border-sage/50"
                      >
                        {isExpanded ? 'Hide source' : 'View source'}
                      </button>
                    )}
                    <button
                      onClick={() => download(p)}
                      disabled={busyId === p.id}
                      className="rounded-full border border-sage px-4 py-1.5 text-sm font-medium text-ink hover:bg-sage/10 disabled:opacity-40"
                    >
                      {busyId === p.id ? 'Rendering…' : 'Download PDF'}
                    </button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="mt-3 space-y-2 border-t border-cardborder pt-3">
                    {rawInput && (
                      <div>
                        <div className="text-xs uppercase tracking-wide text-lightslate mb-1">
                          Original input
                        </div>
                        <pre className="text-xs whitespace-pre-wrap rounded-lg bg-cream p-3 max-h-48 overflow-auto">
                          {rawInput}
                        </pre>
                      </div>
                    )}
                    {brief && (
                      <div>
                        <div className="text-xs uppercase tracking-wide text-lightslate mb-1">
                          Source brief
                        </div>
                        <pre className="text-xs whitespace-pre-wrap rounded-lg bg-cream p-3 max-h-48 overflow-auto">
                          {brief}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
