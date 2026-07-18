import type { Metadata } from 'next';
import Link from 'next/link';
// Self-hosted brand fonts (no runtime Google Fonts dependency)
import '@fontsource/nunito/600.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Doctor Gemma · Product Factory',
  description:
    'Turn your expertise into finished, on-brand digital products — PDFs, social posts, courses, clips and more.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-20 bg-card/90 backdrop-blur border-b border-cardborder">
          <div className="mx-auto max-w-6xl px-6 py-3 flex items-center justify-between">
            <Link href="/" className="leading-tight">
              <span className="font-heading font-extrabold text-ink text-lg tracking-tight">
                DR GEMMA
              </span>
              <span className="block text-[10px] tracking-[0.2em] text-slate font-medium">
                PRODUCT FACTORY
              </span>
              <span className="brand-underline block w-24 mt-0.5" />
            </Link>
            <nav className="flex items-center gap-6 text-sm font-medium text-slate">
              <Link href="/" className="hover:text-ink">Dashboard</Link>
              <Link href="/create" className="hover:text-ink">Create</Link>
              <Link href="/library" className="hover:text-ink">Library</Link>
            </nav>
          </div>
        </header>
        <main className="flex-1 mx-auto w-full max-w-6xl px-6 py-8">{children}</main>
        <footer className="border-t border-cardborder py-4 text-center text-xs text-lightslate">
          © 2026 DR GEMMA AUTISM CONSULTANT · www.doctorgemma.com
        </footer>
      </body>
    </html>
  );
}
