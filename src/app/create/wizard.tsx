'use client';

import { useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PRODUCTS } from '@/lib/registry/products';
import { audiences } from '@/lib/brand/tokens';

type Step = 'capture' | 'brief' | 'select' | 'review';

/** Gemma's Drive folder for exported PDFs — used by the "Open destination folder" link. */
const DRIVE_EXPORTS_FOLDER_URL =
  'https://drive.google.com/drive/folders/1zJUDUhNFbsKeNO8tAGE0FMofkMy318vS';

interface GeneratedContent {
  title: string;
  subtitle?: string;
  sections: { heading: string; kind: string; body: string; items?: string[] }[];
  guidingPrinciple?: string;
  cta: string;
  caption?: string;
  imageSubject?: string;
  images?: { subject: string }[];
  meta?: { needsGemma?: string[] };
}

interface ImageSetItem {
  subject: string;
  dataUrl: string;
  publicUrl?: string | null;
  driveUrl?: string | null;
  selected: boolean;
}

export default function CreateWizard() {
  const params = useSearchParams();
  const [step, setStep] = useState<Step>('capture');
  const [rawText, setRawText] = useState('');
  const [brief, setBrief] = useState('');
  const [productId, setProductId] = useState(params.get('product') ?? 'tip-sheet');
  const [audienceIds, setAudienceIds] = useState<string[]>(['general']);
  const [notes, setNotes] = useState('');
  const [pageLength, setPageLength] = useState<number | null>(null);
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageDriveUrl, setImageDriveUrl] = useState<string | null>(null);
  const [pdfDriveUrl, setPdfDriveUrl] = useState<string | null>(null);
  const [savedRowId, setSavedRowId] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [imageSet, setImageSet] = useState<ImageSetItem[] | null>(null);
  const [imageSetNotice, setImageSetNotice] = useState<string | null>(null);

  const toggleAudience = (id: string) => {
    setAudienceIds((prev) => {
      if (id === 'general') return ['general'];
      const withoutGeneral = prev.filter((a) => a !== 'general');
      return withoutGeneral.includes(id)
        ? withoutGeneral.filter((a) => a !== id).length
          ? withoutGeneral.filter((a) => a !== id)
          : ['general']
        : [...withoutGeneral, id];
    });
  };

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
    if (f.type.startsWith('audio/') || f.type.startsWith('video/')) {
      return transcribe(f, f.name);
    }
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
      const data = await api('/api/generate', {
        brief,
        productId,
        audiences: audienceIds,
        notes,
        pageLength,
      });
      setContent(data.content);
      setStep('review');
      if (data.content?.images?.length) {
        generateImageSetPreview(data.content.images);
      }
      // Note: we deliberately don't save to the Library here — only once Gemma
      // downloads or exports the PDF (see downloadPdf / exportPdfToDrive), so the
      // Library reflects finished work, not every draft generated along the way.
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setBusy(null);
    }
  };

  /** Renders every subject in an image-set as a preview (no Drive upload yet). */
  const generateImageSetPreview = async (images: { subject: string }[]) => {
    setImageSet(images.map((im) => ({ subject: im.subject, dataUrl: '', selected: true })));
    for (let i = 0; i < images.length; i++) {
      setBusy(`Generating illustration ${i + 1} of ${images.length}…`);
      try {
        const data = await api('/api/images/generate', {
          subject: images[i].subject,
          format: productId.includes('story') ? 'story' : 'square',
          audience: audienceIds.join(', '),
          pushToDrive: false,
        });
        setImageSet((prev) =>
          prev
            ? prev.map((item, idx) =>
                idx === i
                  ? { ...item, dataUrl: data.publicUrl ?? data.dataUrl, publicUrl: data.publicUrl }
                  : item,
              )
            : prev,
        );
      } catch (e) {
        setImageSetNotice(
          `Image ${i + 1} failed to generate (${e instanceof Error ? e.message : 'unknown error'}) — the rest continued.`,
        );
      }
    }
    setBusy(null);
  };

  const toggleImageSelected = (i: number) => {
    setImageSet((prev) =>
      prev ? prev.map((item, idx) => (idx === i ? { ...item, selected: !item.selected } : item)) : prev,
    );
  };

  const saveSelectedImagesToDrive = async () => {
    if (!imageSet) return;
    setBusy('Saving selected images to Drive…');
    setError(null);
    try {
      const updated = [...imageSet];
      for (let i = 0; i < updated.length; i++) {
        const item = updated[i];
        if (!item.selected || item.driveUrl || !item.dataUrl?.startsWith('data:')) continue;
        try {
          const data = await api('/api/images/save-to-drive', { dataUrl: item.dataUrl, subject: item.subject });
          updated[i] = { ...item, driveUrl: data.driveUrl };
        } catch (e) {
          setImageSetNotice(`Could not save "${item.subject}" to Drive: ${e instanceof Error ? e.message : 'error'}`);
        }
      }
      setImageSet(updated);
      const savedCount = updated.filter((i) => i.selected).length;
      setImageSetNotice(`Saved ${savedCount} selected image${savedCount === 1 ? '' : 's'} to your Drive folder.`);
      if (content) {
        await saveToLibrary({ ...content, images: updated as unknown as { subject: string }[] });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Drive save failed');
    } finally {
      setBusy(null);
    }
  };

  /** Best-effort: persist the generated product to the Library. Never blocks the UI. */
  const saveToLibrary = async (generatedContent: GeneratedContent, rowId?: string | null) => {
    try {
      const existingId = rowId ?? savedRowId;
      const data = await api('/api/library', {
        title: generatedContent.title,
        rawInput: rawText,
        brief,
        productId,
        audience: audienceIds.join(', '),
        content: generatedContent,
        existingProductRowId: existingId ?? undefined,
      });
      setSavedRowId(data.productRowId ?? existingId ?? null);
      setSaveNotice('Saved to your Library');
    } catch {
      setSaveNotice('Could not save to Library (Supabase not configured yet) — your work is still safe on this screen.');
    }
  };

  const downloadPdf = async () => {
    setBusy('Rendering your PDF…');
    setError(null);
    try {
      const res = await fetch('/api/render/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, audiences: audienceIds, productId, format: 'pdf', pageLength }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Render failed');
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${content?.title ?? 'product'}.pdf`;
      a.click();
      if (content) await saveToLibrary(content);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Render failed');
    } finally {
      setBusy(null);
    }
  };

  const exportPdfToDrive = async () => {
    setBusy('Exporting PDF to Drive…');
    setError(null);
    try {
      const data = await api('/api/render/pdf', {
        content,
        audiences: audienceIds,
        productId,
        format: 'drive',
        pageLength,
      });
      setPdfDriveUrl(data.driveUrl);
      if (data.driveUrl) window.open(data.driveUrl, '_blank');
      if (content) await saveToLibrary(content);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Drive export failed');
    } finally {
      setBusy(null);
    }
  };

  const generateImage = async () => {
    if (!content?.imageSubject) return;
    setBusy('Generating your illustration…');
    setError(null);
    try {
      const format = productId.includes('story') ? 'story' : 'square';
      const data = await api('/api/images/generate', {
        subject: content.imageSubject,
        format,
        audience: audienceIds.join(', '),
      });
      setImageUrl(data.publicUrl ?? data.dataUrl);
      setImageDriveUrl(data.driveUrl ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Image generation failed');
    } finally {
      setBusy(null);
    }
  };

  const previewHtml = async () => {
    const res = await fetch('/api/render/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, audiences: audienceIds, productId, format: 'html', pageLength }),
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
      {step === 'review' && saveNotice && (
        <div className="text-xs text-lightslate">{saveNotice}</div>
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
                accept=".txt,.md,audio/*,video/mp4,video/quicktime"
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
            <p className="text-xs text-lightslate mb-2">
              Pick one or more, or choose General / all audiences.
            </p>
            <div className="flex flex-wrap gap-2">
              {audiences.map((a) => (
                <button
                  key={a.id}
                  onClick={() => toggleAudience(a.id)}
                  className={`rounded-full px-4 py-1.5 text-sm border ${
                    audienceIds.includes(a.id)
                      ? 'border-sage bg-sage/15 text-ink font-semibold'
                      : 'border-cardborder text-slate hover:border-sage/50'
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
          {(() => {
            const selectedProduct = PRODUCTS.find((p) => p.id === productId);
            return selectedProduct?.pageLengthOptions ? (
              <div>
                <h2 className="font-bold text-base mb-2">Page length</h2>
                <p className="text-xs text-lightslate mb-2">
                  Keep it to 1 or 2 A4 pages — anything longer suits the e-book format instead.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setPageLength(null)}
                    className={`rounded-full px-4 py-1.5 text-sm border ${
                      pageLength === null
                        ? 'border-sage bg-sage/15 text-ink font-semibold'
                        : 'border-cardborder text-slate hover:border-sage/50'
                    }`}
                  >
                    Default
                  </button>
                  {selectedProduct.pageLengthOptions.map((n) => (
                    <button
                      key={n}
                      onClick={() => setPageLength(n)}
                      className={`rounded-full px-4 py-1.5 text-sm border ${
                        pageLength === n
                          ? 'border-sage bg-sage/15 text-ink font-semibold'
                          : 'border-cardborder text-slate hover:border-sage/50'
                      }`}
                    >
                      {n} page{n > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
              </div>
            ) : null;
          })()}
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

      {step === 'review' && content && content.images && (
        <section className="rounded-2xl bg-card border border-cardborder p-6 space-y-4">
          <h1 className="text-2xl font-extrabold">{content.title}</h1>
          <p className="text-sm">
            {imageSet?.length ?? content.images.length} illustrations generated from your content.
            Untick any you don't want, then save the rest straight to your Drive folder.
          </p>
          {imageSetNotice && <div className="text-xs text-lightslate">{imageSetNotice}</div>}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {(imageSet ?? []).map((img, i) => (
              <label
                key={i}
                className={`rounded-xl border-2 overflow-hidden cursor-pointer ${
                  img.selected ? 'border-sage' : 'border-cardborder opacity-50'
                }`}
              >
                <div className="aspect-square bg-cream flex items-center justify-center">
                  {img.dataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img.dataUrl} alt={img.subject} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-lightslate animate-pulse">Generating…</span>
                  )}
                </div>
                <div className="p-2 flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={img.selected}
                    onChange={() => toggleImageSelected(i)}
                    className="mt-0.5"
                  />
                  <span className="text-xs text-slate">{img.subject}</span>
                </div>
                {img.driveUrl && (
                  <a
                    href={img.driveUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="block px-2 pb-2 text-xs text-sage underline"
                  >
                    Saved to Drive →
                  </a>
                )}
              </label>
            ))}
          </div>
          <div className="flex justify-between items-center pt-2">
            <button onClick={() => setStep('select')} className="text-sm text-lightslate hover:text-ink">
              Back
            </button>
            <button
              onClick={saveSelectedImagesToDrive}
              disabled={!!busy || !imageSet?.some((i) => i.selected && i.dataUrl)}
              className="rounded-full bg-cta text-ink font-heading font-bold px-6 py-2 disabled:opacity-40"
            >
              Save selected to Drive
            </button>
          </div>
        </section>
      )}

      {step === 'review' && content && !content.sections && !content.images && (
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
          {content.imageSubject && (
            <div className="rounded-xl border border-cardborder p-4 space-y-3">
              <div className="text-xs uppercase tracking-wide text-lightslate">
                Suggested illustration
              </div>
              <textarea
                value={content.imageSubject}
                rows={2}
                onChange={(e) => setContent({ ...content, imageSubject: e.target.value })}
                className="w-full text-sm rounded-lg border border-cardborder p-3 bg-cream focus:outline-none focus:border-sage"
              />
              <button
                onClick={generateImage}
                disabled={!!busy}
                className="rounded-full border border-sage px-5 py-2 text-sm font-medium text-ink hover:bg-sage/10 disabled:opacity-40"
              >
                Generate image
              </button>
              {imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt="Generated brand illustration"
                  className="rounded-lg border border-cardborder max-w-xs"
                />
              )}
              {imageDriveUrl && (
                <a
                  href={imageDriveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-xs text-sage underline"
                >
                  Saved to your Drive library →
                </a>
              )}
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
                className="rounded-full border border-sage px-5 py-2 text-sm font-medium text-ink hover:bg-sage/10 disabled:opacity-40"
              >
                Print PDF
              </button>
              <button
                onClick={exportPdfToDrive}
                disabled={!!busy}
                className="rounded-full border border-sage px-5 py-2 text-sm font-medium text-ink hover:bg-sage/10 disabled:opacity-40"
              >
                Export PDF to Drive
              </button>
              <a
                href={DRIVE_EXPORTS_FOLDER_URL}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-sage px-5 py-2 text-sm font-medium text-ink hover:bg-sage/10"
              >
                Open destination folder
              </a>
            </div>
          </div>
          {pdfDriveUrl && (
            <div className="text-right">
              <a
                href={pdfDriveUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-sage underline"
              >
                Saved to your Drive exports folder →
              </a>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
