import { StarIcon, ShoppingCartIcon, LocalMallIcon } from './icons';

function verdictTone(verdict) {
  const value = String(verdict || '').toLowerCase();
  if (value.includes('avoid') || value.includes('skip')) {
    return 'bg-rose-100 text-rose-700 border-rose-200';
  }
  if (value.includes('buy')) {
    return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  }
  return 'bg-amber-100 text-amber-700 border-amber-200';
}

export default function ProductLibraryCard({ product, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(product.id)}
      className="group rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-4 text-left shadow-[var(--shadow-lg)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-[var(--line-strong)] hover:bg-white"
    >
      <div className="mb-4 flex items-start gap-4">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[22px] bg-[var(--surface-muted)]">
          {product.image_url ? (
            <img src={product.image_url} alt={product.title} className="h-full w-full object-contain bg-white" />
          ) : (
            <div className="text-[var(--ink-soft)]">
              {product.platform === 'amazon' ? <ShoppingCartIcon /> : <LocalMallIcon />}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[var(--line)] bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-soft)]">
              {product.platform || 'Marketplace'}
            </span>
            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${verdictTone(product.verdict)}`}>
              {product.gemini_summary?.verdict || product.verdict || 'In Review'}
            </span>
          </div>

          <h3 className="line-clamp-2 text-lg font-semibold text-[var(--ink)]">{product.title}</h3>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            {product.gemini_summary?.one_line || 'Open the saved product page to review the full verdict and evidence.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-[20px] border border-[var(--line)] bg-white px-3 py-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--ink-soft)]">Trust</p>
          <p className="mt-1 text-xl font-semibold text-[var(--ink)]">{Math.round(product.trust_score || 0)}%</p>
        </div>
        <div className="rounded-[20px] border border-[var(--line)] bg-white px-3 py-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--ink-soft)]">Reviews</p>
          <p className="mt-1 text-xl font-semibold text-[var(--ink)]">{product.total_reviews || 0}</p>
        </div>
        <div className="rounded-[20px] border border-[var(--line)] bg-white px-3 py-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--ink-soft)]">Rating</p>
          <p className="mt-1 flex items-center gap-1 text-xl font-semibold text-[var(--ink)]">
            <StarIcon sx={{ fontSize: 16 }} className="text-amber-500" />
            {product.rating ? product.rating.toFixed(1) : '--'}
          </p>
        </div>
      </div>
    </button>
  );
}
