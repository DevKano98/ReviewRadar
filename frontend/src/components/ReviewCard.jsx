import { useState } from 'react';
import { StarIcon, VerifiedIcon, ExpandMoreIcon } from './icons';

export default function ReviewCard({ review }) {
  const [expanded, setExpanded] = useState(false);
  const isFake = review.is_fake;
  const confidenceBase = Number(review.fake_confidence ?? review.confidence ?? 0);
  const confidence = Math.round((isFake ? confidenceBase : 1 - confidenceBase) * 100);

  return (
    <div className="rounded-[28px] border border-[var(--line)] bg-white p-5 shadow-sm transition hover:-translate-y-0.5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--ink)]">{review.reviewer_name || 'Anonymous'}</span>
            <VerifiedIcon className="text-[var(--accent)]" sx={{ fontSize: 16 }} />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[var(--ink-soft)]">
            <div className="flex text-amber-500">
              {[...Array(5)].map((_, index) => (
                <StarIcon
                  key={index}
                  sx={{ fontSize: 14 }}
                  className={index < review.rating ? 'opacity-100' : 'opacity-25'}
                />
              ))}
            </div>
            <span>{review.date || 'Recent'}</span>
          </div>
        </div>

        <div className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${isFake ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
          {isFake ? 'Fake' : 'Real'} {Number.isFinite(confidence) ? `${confidence}%` : '--'}
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-lg font-semibold tracking-tight text-[var(--ink)]">{review.title || 'Untitled review'}</h4>
        <p className={`text-sm leading-7 text-[var(--ink-soft)] ${!expanded ? 'line-clamp-4' : ''}`}>
          {review.body}
        </p>
        {review.body?.length > 180 && (
          <button
            onClick={() => setExpanded((value) => !value)}
            className="mt-3 flex items-center gap-1 text-sm font-medium text-[var(--accent)]"
          >
            {expanded ? 'Show less' : 'Read more'}
            <ExpandMoreIcon sx={{ fontSize: 16 }} className={expanded ? 'rotate-180 transition-transform' : 'transition-transform'} />
          </button>
        )}
      </div>

      {isFake && review.reasons?.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2 border-t border-[var(--line)] pt-4">
          {review.reasons.map((reason, index) => (
            <span key={index} className="rounded-full border border-[var(--line)] bg-[var(--surface-muted)] px-3 py-1 text-xs text-[var(--ink-soft)]">
              {reason}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
