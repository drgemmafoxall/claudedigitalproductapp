'use client';

import { useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PRODUCTS } from '@/lib/registry/products';
import { audiences } from '@/lib/brand/tokens';

type Step = 'capture' | 'brief' | 'select' | 'review';

interface GeneratedContent {
  title: string;
  subtitle?: string;
  sections: { heading: string; kind: string; body: string; items?: string[] }[];
  guidingPrinciple?: string;
  cta: string;
  caption?: string;
  meta?: { needsGemma?: string[] };
}

export default function CreateWizard() {
  const params = useSearchParams();
  const [step, setStep] = useState<Step>('capture');
  const [rawText, setRawText] = useState('');
  const [brief, setBrief] = useState('');
  const [productId, setProductId] = useState(params.get('product') ?? 'tip-sheet');
  const [audience, setAudience] = useState('parent');
  const [notes, setNotes] = useState('');
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const api = async (url: string, body: unknown) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Request failed');
    return data;
  };

  const transcribe = async (blob: Blob, name: string) => {
    setBusy('Transcribing your audio…');
    setError(null);
    try {
      const form = new FormData();
      form.append('audio', new File([blob], name));
      const res = await fetch('/api/transcribe', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Transcription failed');
      setRawText((t) => (t ? `${t}\n\n${data.transcript}` : data.transcript));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Transcription failed');
    } finally {
      setBusy(null);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => chunksRef.current.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        transcribe(new Blob(chunksRef.current, { type: 'audio/webm' }), 'recording.webm');
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
    } catch {
      setError('Microphone access was blocked — you can upload an mp3 instead');
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setRecording(false);
  };

  const onFile = async (f: File) => {
    if (f.type.startsWith('audio/')) return transcribe(f, f.name);
    const text = await f.text();
    setRawText((t) => (t ? `${t}\n\n${text}` : text));
  };

  const normalise = async () => {
    setBusy('Preparing your source brief…');
    setError(null);
    try {
      const data = await api('/api/normalise', { text: rawText, sourceType: 'typed' });
      setBrief(data.brief);
      setStep('brief');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setBusy(null);
    }
  };

  const generate = async () => {
    setBusy('Generating your product…');
    setError(null);
    try {
      const data = await api('/api/generate', { brief, productId, audience, notes });
      setContent(data.content);
      setStep('review');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setBusy(null);
    }
  };

  const downloadPdf = async () => {
    setBusy('Rendering your PDF…');
    setError(null);
    try {
      const res = await fetch('/api/render/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, audience, format: 'pdf' }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Render failed');
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${content?.title ?? 'product'}.pdf`;
      a.click();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Render failed');
    } finally {
      setBusy(null);
    }
  };

  const previewHtml = async () => {
    const res = await fetch('/api/render/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, audience, format: 'html' }),
    });
    const html = await res.text();
    const w = window.open('', '_blank');
    w?.document.write(html);
    w?.document.close();
  };

  const steps: { id: Step; label: string }[] = [
    { id: 'capture', label: '1 · Your input' },
    { id: 'brief', label: '2 · Source brief' },
    { id: 'select', label: '3 · Product & audience' },
    { id: 'review', label: '4 · Review & export' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <nav className="flex gap-2 text-sm">
        {steps.map((s) => (
          <span
            key={s.id}
            className={`px-3 py-1.5 rounded-full border ${
              step === s.id
                ? 'bg-sage/20 border-sage text-ink font-semibold'
                : 'border-cardborder text-lightslate'
            }`}
          >
            {s.label}
          </span>
        ))}
      </nav>

      {error && (
        <div className="rounded-xl border border-ctaurgent/40 bg-ctaurgent/5 text-ink p-4 text-sm">
          {error} — let’s try that again.
        </div>
      )}
      {busy && (
        <div className="rounded-xl border border-sage bg-sage/10 text-ink p-4 text-sm animate-pulse">
          {busy}
        </div>
      )}

      {step === 'capture' && (
        <section className="rounded-2xl bg-card border border-cardborder p-6 space-y-4">
          <h1 className="text-2xl font-extrabold">Share your expertise</h1>
          <p className="text-sm">
            Type or paste your notes, upload a document or voice note, or just talk — your words
            and phrasing are kept, always.
          </p>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={10}
            placeholder="Paste or type your raw notes, transcript, or ideas here…"
            className="w-full rounded-xl border border-cardborder p-4 focus:outline-none focus:border-sage bg-cream"
          />
          <div className="flex flex-wrap gap-3">
            <label className="cursor-pointer rounded-full border border-sage px-4 py-2 text-sm font-medium text-ink hover:bg-sage/10">
              Upload file
              <input
                type="file"
                accept=".txt,.md,audio/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
              />
            </label>
            {!recording ? (
              <button
                onClick={startRecording}
                className="rounded-full border border-sage px-4 py-2 text-sm font-medium text-ink hover:bg-sage/10"
              >
                Record voice
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="rounded-full bg-ctaurgent text-white px-4 py-2 text-sm font-medium"
              >
                Stop recording
              </button>
            )}
            <button
              onClick={normalise}
              disabled={!rawText.trim() || !!busy}
              className="ml-auto rounded-full bg-cta text-ink font-heading font-bold px-6 py-2 disabled:opacity-40"
            >
              Continue
            </button>
          </div>
        </section>
      )}

      {step === 'brief' && (
        <section className="rounded-2xl bg-card border border-cardborder p-6 space-y-4">
          <h1 className="text-2xl font-extrabold">Your source brief</h1>
          <p className="text-sm">
            This is your input, tidied up with your phrasing kept. Edit anything before we generate.
          </p>
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            rows={16}
            className="w-full rounded-xl border border-cardborder p-4 focus:outline-none focus:border-sage bg-cream font-mono text-sm"
          />
          <div className="flex justify-between">
            <button onClick={() => setStep('capture')} className="text-sm text-lightslate hover:text-ink">
              Back
            </button>
            <button
              onClick={() => setStep('select')}
              className="rounded-full bg-cta text-ink font-heading font-bold px-6 py-2"
            >
              Continue
            </button>
          </div>
        </section>
      )}

      {step === 'select' && (
        <section className="rounded-2xl bg-card border border-cardborder p-6 space-y-5">
          <h1 className="text-2xl font-extrabold">Choose your product</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PRODUCTS.map((p) => (
              <button
                key={p.id}
                onClick={() => setProductId(p.id)}
                className={`text-left rounded-xl border p-4 ${
                  productId === p.id
                    ? 'border-sage bg-sage/10'
                    : 'border-cardborder hover:border-sage/50'
                }`}
              >
                <div className="font-heading font-bold text-ink">{p.label}</div>
                <div className="text-sm mt-1">{p.description}</div>
              </button>
            ))}
          </div>
          <div>
            <h2 className="font-bold text-base mb-2">Who is it for?</h2>
            <div className="flex flex-wrap gap-2">
              {audiences.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAudience(a.id)}
                  className={`rounded-full px-4 py-1.5 text-sm border ${
                    audience === a.id
                      ? 'border-sage bg-sage/15 text-ink font-semibold'
                      : 'border-cardborder text-slate hover:border-sage/50'
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any extra direction? (optional)"
            className="w-full rounded-xl border border-cardborder p-3 text-sm focus:outline-none focus:border-sage bg-cream"
          />
          <div className="flex justify-between">
            <button onClick={() => setStep('brief')} className="text-sm text-lightslate hover:text-ink">
              Back
            </button>
            <button
              onClick={generate}
              disabled={!!busy}
              className="rounded-full bg-cta text-ink font-heading font-bold px-6 py-2 disabled:opacity-40"
            >
              Generate
            </button>
          </div>
        </section>
      )}

      {step === 'review' && content && !content.sections && (
        <section className="rounded-2xl bg-card border border-cardborder p-6 space-y-4">
          <h1 className="text-2xl font-extrabold">Review before it ships</h1>
          <p className="text-sm">
            This product type has its own structure — here’s everything that was generated.
            Copy it, or download it as a file to use with the target platform.
          </p>
          <pre className="rounded-xl border border-cardborder bg-cream p-4 text-xs overflow-auto max-h-[60vh] whitespace-pre-wrap">
            {JSON.stringify(content, null, 2)}
          </pre>
          <div className="flex justify-between items-center">
            <button onClick={() => setStep('select')} className="text-sm text-lightslate hover:text-ink">
              Back
            </button>
            <button
              onClick={() => {
                const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `${productId}.json`;
                a.click();
              }}
              className="rounded-full bg-cta text-ink font-heading font-bold px-6 py-2"
            >
              Download
            </button>
          </div>
        </section>
      )}

      {step === 'review' && content && content.sections && (
        <section className="rounded-2xl bg-card border border-cardborder p-6 space-y-4">
          <h1 className="text-2xl font-extrabold">Review before it ships</h1>
          {content.meta?.needsGemma?.length ? (
            <div className="rounded-xl border-2 border-dashed border-cta bg-cta/5 p-4 text-sm">
              <strong className="text-ink">Needs your expertise ({content.meta.needsGemma.length}):</strong>
              <ul className="list-disc pl-5 mt-1">
                {content.meta.needsGemma.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <input
            value={content.title}
            onChange={(e) => setContent({ ...content, title: e.target.value })}
            className="w-full text-xl font-heading font-extrabold text-ink rounded-xl border border-cardborder p-3 bg-cream"
          />
          {content.sections.map((s, i) => (
            <div key={i} className="rounded-xl border border-cardborder p-4 space-y-2">
              <input
                value={s.heading}
                onChange={(e) => {
                  const sections = [...content.sections];
                  sections[i] = { ...s, heading: e.target.value };
                  setContent({ ...content, sections });
                }}
                className="w-full font-heading font-bold text-ink bg-transparent focus:outline-none"
              />
              <textarea
                value={s.items?.length ? s.items.join('\n') : s.body}
                rows={Math.min(8, Math.max(2, (s.items?.length ?? 2) + 1))}
                onChange={(e) => {
                  const sections = [...content.sections];
                  sections[i] = s.items?.length
                    ? { ...s, items: e.target.value.split('\n') }
                    : { ...s, body: e.target.value };
                  setContent({ ...content, sections });
                }}
                className="w-full text-sm rounded-lg border border-cardborder p-3 bg-cream focus:outline-none focus:border-sage"
              />
            </div>
          ))}
          {content.caption && (
            <div className="rounded-xl border border-cardborder p-4">
              <div className="text-xs uppercase tracking-wide text-lightslate mb-1">
                Social caption
              </div>
              <textarea
                value={content.caption}
                rows={6}
                onChange={(e) => setContent({ ...content, caption: e.target.value })}
                className="w-full text-sm bg-transparent focus:outline-none"
              />
            </div>
          )}
          <div className="flex flex-wrap gap-3 justify-between items-center pt-2">
            <button onClick={() => setStep('select')} className="text-sm text-lightslate hover:text-ink">
              Back
            </button>
            <div className="flex gap-3">
              <button
                onClick={previewHtml}
                className="rounded-full border border-sage px-5 py-2 text-sm font-medium text-ink hover:bg-sage/10"
              >
                Preview
              </button>
              <button
                onClick={downloadPdf}
                disabled={!!busy}
                className="rounded-full bg-cta text-ink font-heading font-bold px-6 py-2 disabled:opacity-40"
              >
                Download PDF
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
