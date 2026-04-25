import { useState } from 'react';
import ReviewCard from './ReviewCard';
import { FilterListIcon } from './icons';
import { sortReviews, filterReviews } from '../lib/analysis';

export default function ReviewGrid({ reviews, isLoading }) {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('confidence');

  const fakeReviews = filterReviews(reviews, 'fake');
  const realReviews = filterReviews(reviews, 'real');
  const displayedReviews = filterReviews(reviews, filter);
  const sortedReviews = sortReviews(displayedReviews, sortBy);

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-col gap-4 border-b border-[var(--line)] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${filter === 'all' ? 'bg-[var(--ink)] text-white' : 'border border-[var(--line)] bg-white text-[var(--ink-soft)]'}`}
          >
            All ({reviews.length || 0})
          </button>
          <button
            onClick={() => setFilter('fake')}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${filter === 'fake' ? 'bg-rose-600 text-white' : 'border border-[var(--line)] bg-white text-[var(--ink-soft)]'}`}
          >
            Suspicious ({fakeReviews.length})
          </button>
          <button
            onClick={() => setFilter('real')}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${filter === 'real' ? 'bg-emerald-600 text-white' : 'border border-[var(--line)] bg-white text-[var(--ink-soft)]'}`}
          >
            Credible ({realReviews.length})
          </button>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm text-[var(--ink-soft)]">
          <FilterListIcon sx={{ fontSize: 16 }} />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="cursor-pointer bg-transparent text-[var(--ink)] outline-none"
          >
            <option value="confidence">Sort by confidence</option>
            <option value="rating">Sort by rating</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-56 animate-pulse rounded-[28px] border border-[var(--line)] bg-[var(--surface-muted)]" />
          ))}
        </div>
      ) : sortedReviews.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-[var(--line-strong)] bg-[var(--surface-muted)] px-6 py-12 text-center text-[var(--ink-soft)]">
          No reviews match this filter yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {sortedReviews.map((review, index) => (
            <ReviewCard key={review.id || `${review.reviewer_name}-${index}`} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}
