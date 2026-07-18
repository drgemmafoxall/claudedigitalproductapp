import Link from 'next/link';
import { PRODUCTS } from '@/lib/registry/products';

const groups = [
  { id: 'documents', label: 'Documents & PDFs' },
  { id: 'social', label: 'Social posts' },
  { id: 'courses', label: 'Courses' },
  { id: 'audio-video', label: 'Audio & video' },
  { id: 'distribution', label: 'Lead magnets & distribution' },
] as const;

export default function Dashboard() {
  return (
    <div className="space-y-10">
      <section className="rounded-2xl bg-card border border-cardborder p-8">
        <h1 className="text-3xl font-extrabold">Welcome back, Doctor Gemma</h1>
        <p className="mt-2 max-w-2xl">
          Drop in your expertise — typed, pasted, a document or a voice note — and turn it into
          finished, on-brand products ready to share and sell.
        </p>
        <div className="brand-underline w-40 my-5" />
        <Link
          href="/create"
          className="inline-block rounded-full bg-cta text-ink font-heading font-bold px-6 py-2.5 hover:brightness-105"
        >
          Create
        </Link>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">What you can make</h2>
        <div className="space-y-6">
          {groups.map((g) => (
            <div key={g.id}>
              <h3 className="text-sm font-semibold tracking-wide text-lightslate uppercase mb-2">
                {g.label}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {PRODUCTS.filter((p) => p.group === g.id).map((p) => (
                  <Link
                    key={p.id}
                    href={`/create?product=${p.id}`}
                    className="rounded-xl bg-card border border-cardborder p-4 hover:border-sage hover:shadow-sm"
                  >
                    <div className="font-heading font-bold text-ink">{p.label}</div>
                    <div className="text-sm mt-1">{p.description}</div>
                    {p.pages && (
                      <div className="text-xs text-lightslate mt-2">{p.pages} pages</div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
