import { startTransition, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SecurityIcon,
  ContentPasteSearchIcon,
  PsychologyIcon,
  GavelIcon,
} from '../components/icons';
import URLInput from '../components/URLInput';
import ProductLibraryCard from '../components/ProductLibraryCard';
import { getProductLibrary } from '../lib/api';
import { normalizeLibraryProduct } from '../lib/normalize';

const proofPoints = [
  { label: 'Live trust analysis', value: 'ML + AI' },
  { label: 'Saved product pages', value: 'DB-backed' },
  { label: 'Continuous review audit', value: '24/7' },
];

const workflow = [
  {
    icon: ContentPasteSearchIcon,
    title: 'Paste a marketplace URL',
    body: 'Drop in any Amazon or Flipkart product page and ReviewRadar starts collecting clean review evidence.',
  },
  {
    icon: PsychologyIcon,
    title: 'Separate signal from noise',
    body: 'The ML layer flags suspicious reviews first, then the AI summary explains what the trustworthy reviews actually say.',
  },
  {
    icon: GavelIcon,
    title: 'Open a permanent product page',
    body: 'Every completed analysis becomes a shareable page that any visitor can reopen from the product library.',
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [library, setLibrary] = useState([]);
  const [loadingLibrary, setLoadingLibrary] = useState(true);

  useEffect(() => {
    let active = true;

    const loadLibrary = async () => {
      try {
        const products = await getProductLibrary(24);
        if (!active) return;
        startTransition(() => {
          setLibrary(products.map(normalizeLibraryProduct));
          setLoadingLibrary(false);
        });
      } catch {
        if (!active) return;
        setLoadingLibrary(false);
      }
    };

    loadLibrary();

    return () => {
      active = false;
    };
  }, []);

  const handleSearch = (url) => {
    navigate(`/result?url=${encodeURIComponent(url)}`);
  };

  const openProductPage = (productId) => {
    navigate(`/product/${productId}`);
  };

  return (
    <div className="min-h-screen px-4 py-6 text-[var(--ink)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.7)] px-5 py-3 shadow-[0_8px_30px_rgba(80,67,45,0.06)] backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent)] text-white shadow-[0_12px_28px_rgba(47,100,255,0.28)]">
                <SecurityIcon fontSize="small" />
              </div>
              <div>
                <p className="text-lg font-semibold tracking-tight">ReviewRadar</p>
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--ink-soft)]">Product trust intelligence</p>
              </div>
            </div>

            <nav className="flex items-center gap-2 text-sm text-[var(--ink-soft)]">
              <span className="rounded-full bg-white px-4 py-2 text-[var(--ink)] shadow-sm">Home</span>
              <span className="rounded-full px-4 py-2">Library</span>
              <span className="rounded-full px-4 py-2">How it works</span>
            </nav>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.55fr_0.95fr]">
          <div className="rounded-[36px] border border-[var(--line)] bg-[linear-gradient(135deg,rgba(237,242,255,0.95),rgba(255,251,244,0.92))] p-6 shadow-[var(--shadow-lg)] backdrop-blur sm:p-8">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[rgba(47,100,255,0.14)] bg-white/75 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
                <SecurityIcon fontSize="small" />
                Live review verification intelligence
              </div>

              <h1 className="max-w-3xl text-5xl font-semibold leading-[0.92] tracking-tight sm:text-6xl lg:text-7xl">
                Premium trust
                <br />
                for every
                <br />
                <span className="text-[var(--accent)]">product check</span>
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--ink-soft)]">
                ReviewRadar combines review forensics, trust scoring, and AI synthesis so shoppers can open a product page and understand whether the praise is real before they buy.
              </p>

              <div className="mt-8 max-w-3xl">
                <URLInput onSubmit={handleSearch} />
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {proofPoints.map((item) => (
                  <div key={item.label} className="rounded-[24px] border border-[var(--line)] bg-white/72 px-5 py-5 shadow-sm">
                    <p className="text-3xl font-semibold tracking-tight">{item.value}</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="rounded-[32px] border border-[var(--line)] bg-[rgba(255,255,255,0.78)] p-6 shadow-[var(--shadow-lg)] backdrop-blur sm:p-7">
            <div className="mb-6 flex items-center justify-between">
              <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                Trust board
              </span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Registry match
              </span>
            </div>

            <div className="mb-8">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--ink-soft)]">Authenticity live</p>
              <p className="mt-1 text-6xl font-semibold tracking-tight">94%</p>
            </div>

            <div className="space-y-4">
              <div className="rounded-[24px] border border-[var(--line)] bg-white px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">Visual fingerprint</p>
                    <p className="mt-1 text-sm text-[var(--ink-soft)]">Review patterns, language cues, and consistency aligned.</p>
                  </div>
                  <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">LIVE</span>
                </div>
              </div>

              <div className="rounded-[24px] border border-[var(--line)] bg-white px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">Verdict engine</p>
                    <p className="mt-1 text-sm text-[var(--ink-soft)]">ML and Gemini collaborate to explain why a product feels safe or risky.</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">LOCKED</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-[22px] border border-[var(--line)] bg-white px-4 py-4">
                  <p className="text-2xl font-semibold">180+</p>
                  <p className="mt-1 text-sm text-[var(--ink-soft)]">Saved product pages ready to reopen</p>
                </div>
                <div className="rounded-[22px] border border-[var(--line)] bg-white px-4 py-4">
                  <p className="text-2xl font-semibold">24/7</p>
                  <p className="mt-1 text-sm text-[var(--ink-soft)]">Fraud signal monitoring and retriage</p>
                </div>
              </div>
            </div>
          </aside>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-[34px] border border-[var(--line)] bg-[rgba(255,255,255,0.78)] p-6 shadow-[var(--shadow-lg)] backdrop-blur sm:p-7">
            <div className="mb-8 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-[var(--ink-soft)]">Workflow</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight">Built for trust at first glance</h2>
              </div>
              <div className="rounded-[24px] border border-[var(--line)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--ink-soft)]">
                A calmer interface, stronger hierarchy, and real saved product pages.
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {workflow.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-[26px] border border-[var(--line)] bg-white px-5 py-5">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-muted)] text-[var(--accent)]">
                      <Icon />
                    </div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">0{index + 1}</p>
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">{item.body}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[34px] border border-[var(--line)] bg-[rgba(255,255,255,0.76)] p-6 shadow-[var(--shadow-lg)] backdrop-blur sm:p-7">
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--ink-soft)]">Signals</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Designed to feel credible, fast, and high value</h2>
            <div className="mt-6 space-y-4">
              <div className="rounded-[24px] border border-[var(--line)] bg-[var(--surface-muted)] px-5 py-5">
                <p className="font-semibold">Saved product knowledge</p>
                <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">Every completed scan is stored in the database so anyone can revisit that product page later.</p>
              </div>
              <div className="rounded-[24px] border border-[var(--line)] bg-[var(--surface-muted)] px-5 py-5">
                <p className="font-semibold">Explainable verdicts</p>
                <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">The UI now surfaces a clear recommendation, trust score, and evidence blocks instead of generic-looking dashboards.</p>
              </div>
              <div className="rounded-[24px] border border-[var(--line)] bg-[var(--surface-muted)] px-5 py-5">
                <p className="font-semibold">Shared product pages</p>
                <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">Open any card from the product library to view the saved page without re-scraping the source URL.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[36px] border border-[var(--line)] bg-[rgba(255,255,255,0.78)] p-6 shadow-[var(--shadow-lg)] backdrop-blur sm:p-8">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-[var(--ink-soft)]">Product library</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">Every saved review page, loaded from the database</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-[var(--ink-soft)]">
              This section is no longer just recent URLs. It is a browsable library of analyzed products that any visitor can reopen as standalone pages.
            </p>
          </div>

          {loadingLibrary ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-[280px] animate-pulse rounded-[28px] border border-[var(--line)] bg-white" />
              ))}
            </div>
          ) : library.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-[var(--line-strong)] bg-[var(--surface-muted)] px-6 py-12 text-center text-[var(--ink-soft)]">
              No saved product pages were returned from the database yet.
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {library.map((product) => (
                <ProductLibraryCard key={product.id} product={product} onOpen={openProductPage} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
