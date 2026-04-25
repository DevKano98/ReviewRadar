import { useState } from 'react';
import ReviewCard from './ReviewCard';
import { FilterListIcon } from './icons';
import { sortReviews, filterReviews } from '../lib/analysis';

export default function ReviewGrid({ reviews, isLoading }) {
  const [filter, setFilter] = useState('all'); // all, fake, real
  const [sortBy, setSortBy] = useState('confidence');

  const fakeReviews = filterReviews(reviews, 'fake');
  const realReviews = filterReviews(reviews, 'real');
  const displayedReviews = filterReviews(reviews, filter);
  
  const sortedReviews = sortReviews(displayedReviews, sortBy);

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-gray-800 pb-4">
        <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-800">
          <button onClick={() => setFilter('all')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === 'all' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}>
            All ({reviews.length || 0})
          </button>
          <button onClick={() => setFilter('fake')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === 'fake' ? 'bg-red-500/20 text-red-400 shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}>
            Fake ({fakeReviews.length}) 🚨
          </button>
          <button onClick={() => setFilter('real')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === 'real' ? 'bg-emerald-500/20 text-emerald-400 shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}>
            Real ({realReviews.length}) ✓
          </button>
        </div>

        <div className="flex items-center text-gray-400 text-sm bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5">
          <FilterListIcon sx={{ fontSize: 18 }} className="mr-2" />
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-transparent border-none focus:ring-0 cursor-pointer text-gray-200 outline-none"
          >
            <option value="confidence">By Confidence</option>
            <option value="rating">By Rating</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-lg p-5 h-48 animate-pulse">
              <div className="flex space-x-4 mb-4">
                <div className="w-10 h-10 bg-gray-800 rounded-full"></div>
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-gray-800 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-800 rounded w-1/2"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-800 rounded"></div>
                <div className="h-4 bg-gray-800 rounded w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      ) : sortedReviews.length === 0 ? (
        <div className="text-center py-12 bg-gray-900 border border-gray-800 rounded-lg border-dashed">
          <p className="text-gray-500">No reviews found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 transition-all">
          {sortedReviews.map(review => (
            <ReviewCard key={review.id || Math.random()} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}
