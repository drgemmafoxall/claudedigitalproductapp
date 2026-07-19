# Doctor Gemma · Product Factory

Turns Doctor Gemma's expertise (typed text, documents, mp3 audio, live speech) into finished,
on-brand digital products: PDFs (checklists, tip sheets, workbooks…), social posts, e-books,
mini-courses, clips and more.

Rebuilt July 2026 from the bolt.new prototype per `Rebuild-Plan-July-2026.md` (project doc).

## Stack

Next.js (App Router) on Netlify · Supabase (auth/DB/storage) · Claude API (model-routed
generation) · Gemini (transcription) · Puppeteer (HTML→PDF) · Canva Connect (social autofill) ·
Vizard API (clips) · Systeme.io (courses) · Content360 via bulk CSV.

## Pipeline

INPUT → NORMALISE (source brief, verbatim phrasing kept) → SELECT (product + audience) →
GENERATE (brand-voice-constrained, model-routed) → RENDER (adapter per product) →
REVIEW (nothing ships without Gemma) → EXPORT / DISTRIBUTE.

## Key modules

- `src/lib/brand/tokens.ts` — brand tokens + the contrast law (`textOn`). Single source of truth.
- `src/lib/brand/voice.ts` — brand voice rules injected into every generation.
- `src/lib/registry/products.ts` — product registry. **Add a product type = one entry here.**
- `src/lib/ai/client.ts` — Claude client + model routing (haiku/sonnet/top). Cost rule enforced.
- `src/lib/render/templates/base.ts` — branded A4 HTML template (footer, disclaimer, type floors).
- `src/lib/adapters/` — canva, vizard, content360 (CSV), course-pack (Systeme.io), prompt-kits (Suno/MagicLight).
- `src/app/api/` — normalise, generate, transcribe, render/pdf, export/content360.
- `supabase/migrations/` — schema (projects, source_briefs, products, assets, jobs, calendar_posts).

## Setup

1. `npm install`
2. Copy `.env.example` → `.env.local` and fill keys.
3. Run the migration in Supabase (SQL editor or CLI).
4. `npm run dev`

## Deploy (Netlify)

Connect this repo; build command `npm run build`. Add all env vars from `.env.example`.
PDF rendering uses `@sparticuz/chromium` on Netlify functions automatically
(set `PUPPETEER_EXECUTABLE_PATH` only for local dev).

## Guardrails

Clinical accuracy over speed · her voice, not generic AI · `[NEEDS GEMMA]` markers for gaps ·
AA contrast + type floors baked into templates · human review before anything ships.
