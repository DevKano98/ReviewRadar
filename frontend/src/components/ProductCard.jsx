import { useState } from 'react';
import { StarIcon, ShoppingCartIcon, LocalMallIcon } from './icons';

export default function ProductCard({ product }) {
  const [imgError, setImgError] = useState(false);

  if (!product) return null;

  return (
    <div className="rounded-[28px] border border-[var(--line)] bg-[rgba(255,255,255,0.78)] p-4 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-[24px] bg-[var(--surface-muted)]">
          {!imgError && product.image_url ? (
            <img
              src={product.image_url}
              alt={product.title}
              className="h-full w-full object-contain bg-white"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="text-[var(--ink-soft)]">
              <LocalMallIcon />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {product.platform === 'amazon' ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                <ShoppingCartIcon sx={{ fontSize: 12 }} /> Amazon
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                <LocalMallIcon sx={{ fontSize: 12 }} /> Flipkart
              </span>
            )}
            <span className="rounded-full border border-[var(--line)] bg-white px-3 py-1 text-xs font-medium text-[var(--ink-soft)]">
              Saved analysis
            </span>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-[var(--ink)]" title={product.title}>
            {product.title}
          </h2>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
            <span className="text-base font-semibold text-[var(--ink)]">
              {product.price || 'Price unavailable'}
            </span>
            {product.rating ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[var(--ink)]">
                <StarIcon sx={{ fontSize: 16 }} className="text-amber-500" />
                {Number(product.rating).toFixed(1)}
              </span>
            ) : null}
            {product.total_reviews ? (
              <span className="text-[var(--ink-soft)]">{product.total_reviews} analyzed reviews</span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
