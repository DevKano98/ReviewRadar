import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowBackIcon, ShareIcon, ErrorOutlineIcon } from '../components/icons';

import { useScrapeStream } from '../hooks/useScrapeStream';
import ScrapeTerminal from '../components/ScrapeTerminal';
import ProductCard from '../components/ProductCard';
import TrustScoreMeter from '../components/TrustScoreMeter';
import GeminiSummary from '../components/GeminiSummary';
import ReviewGrid from '../components/ReviewGrid';
import VerdictBanner from '../components/VerdictBanner';

export default function ResultPage() {
  const [searchParams] = useSearchParams();
  const { productId: routeProductId } = useParams();
  const navigate = useNavigate();
  const url = searchParams.get('url');

  const {
    status,
    events,
    product,
    reviews,
    mlStats,
    geminiSummary,
    productId,
    error,
    startScrape,
    loadProductFromDb,
  } = useScrapeStream();

  const [showTerminal, setShowTerminal] = useState(false);

  useEffect(() => {
    if (routeProductId) {
      loadProductFromDb(routeProductId);
      return undefined;
    }

    if (url) {
      const cleanup = startScrape(url);
      return cleanup;
    }

    navigate('/');
    return undefined;
  }, [routeProductId, url, loadProductFromDb, startScrape, navigate]);

  useEffect(() => {
    if (productId && url) {
      navigate(`/product/${productId}`, { replace: true });
    }
  }, [productId, url, navigate]);

  const shareUrl = useMemo(() => {
    if (productId || routeProductId) {
      return `${window.location.origin}/product/${productId || routeProductId}`;
    }
    return window.location.href;
  }, [productId, routeProductId]);

  const handleShare = async () => {
    await navigator.clipboard.writeText(shareUrl);
    toast.success('Link copied to clipboard', {
      style: { background: '#ffffff', color: '#171412', border: '1px solid rgba(66, 54, 33, 0.12)' },
    });
  };

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-[var(--page-bg)] px-4 py-12">
        <div className="mx-auto max-w-xl rounded-[32px] border border-rose-200 bg-white/80 p-10 text-center shadow-[var(--shadow-lg)]">
          <ErrorOutlineIcon className="mx-auto mb-4 text-rose-600" sx={{ fontSize: 52 }} />
          <h2 className="text-2xl font-semibold text-rose-700">Analysis failed</h2>
          <p className="mt-3 text-[15px] leading-7 text-[var(--ink-soft)]">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(47,100,255,0.25)]"
          >
            Return home
          </button>
        </div>
      </div>
    );
  }

  const isReady = status === 'done' || status === 'cached';
  const terminalVisible = !isReady || showTerminal;

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <nav className="mb-6 rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.72)] px-5 py-3 shadow-[0_8px_30px_rgba(80,67,45,0.06)] backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-[var(--ink-soft)] transition hover:bg-white hover:text-[var(--ink)]"
            >
              <ArrowBackIcon fontSize="small" />
              New analysis
            </button>

            <div className="text-center">
              <p className="text-lg font-semibold tracking-tight">ReviewRadar</p>
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--ink-soft)]">Saved product page</p>
            </div>

            <button
              onClick={handleShare}
              className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-medium text-[var(--ink)] transition hover:border-[var(--line-strong)]"
              disabled={!isReady}
            >
              <ShareIcon fontSize="small" />
              Share
            </button>
          </div>
        </nav>

        <div className="space-y-6">
          {product && (
            <section className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
              <div className="rounded-[36px] border border-[var(--line)] bg-[linear-gradient(135deg,rgba(238,243,255,0.9),rgba(255,252,247,0.94))] p-6 shadow-[var(--shadow-lg)]">
                <div className="max-w-3xl">
                  <div className="mb-5 inline-flex rounded-full border border-[rgba(47,100,255,0.14)] bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
                    Product analysis
                  </div>
                  <ProductCard product={product} />
                  <div className="mt-6">
                    <VerdictBanner
                      verdict={geminiSummary?.verdict || mlStats?.verdict || product.verdict}
                      oneLineSummary={
                        geminiSummary?.one_line ||
                        'We combined the ML review screen with the saved product record to produce this verdict.'
                      }
                      trustScore={mlStats?.trust_score ?? product.trust_score ?? 0}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <TrustScoreMeter
                  score={mlStats?.trust_score ?? product.trust_score}
                  verdict={geminiSummary?.verdict || mlStats?.verdict || product.verdict}
                  fakeCount={mlStats?.fake_count ?? product.fake_count}
                  realCount={mlStats?.real_count ?? product.real_count}
                  totalReviews={(mlStats?.fake_count ?? product.fake_count ?? 0) + (mlStats?.real_count ?? product.real_count ?? 0)}
                />
                <GeminiSummary summary={geminiSummary} />
              </div>
            </section>
          )}

          <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-[34px] border border-[var(--line)] bg-[rgba(255,255,255,0.78)] p-5 shadow-[var(--shadow-lg)]">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] text-[var(--ink-soft)]">Trace log</p>
                  <h3 className="mt-1 text-2xl font-semibold tracking-tight">Collection timeline</h3>
                </div>
                {isReady && (
                  <button
                    onClick={() => setShowTerminal((value) => !value)}
                    className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-medium text-[var(--ink)]"
                  >
                    {showTerminal ? 'Hide log' : 'View log'}
                  </button>
                )}
              </div>

              {terminalVisible ? (
                <ScrapeTerminal events={events} status={status} />
              ) : (
                <div className="rounded-[26px] border border-[var(--line)] bg-[var(--surface-muted)] p-6 text-sm leading-7 text-[var(--ink-soft)]">
                  The live scanner log is hidden right now so the saved product evidence stays front and center. You can reopen it at any time.
                </div>
              )}
            </div>

            <div className="rounded-[34px] border border-[var(--line)] bg-[rgba(255,255,255,0.78)] p-5 shadow-[var(--shadow-lg)]">
              <div className="mb-4">
                <p className="text-sm uppercase tracking-[0.18em] text-[var(--ink-soft)]">Evidence set</p>
                <h3 className="mt-1 text-2xl font-semibold tracking-tight">Review intelligence</h3>
              </div>
              <ReviewGrid reviews={reviews} isLoading={status === 'loading' || status === 'connecting' || status === 'scraping' || status === 'classifying' || status === 'summarizing'} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
