import { useState } from 'react';
import { StarIcon, VerifiedIcon, ExpandMoreIcon } from './icons';

export default function ReviewCard({ review }) {
  const [expanded, setExpanded] = useState(false);
  const isFake = review.is_fake;
  
  return (
    <div className={`bg-gray-900 border ${isFake ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-emerald-500'} border-y-gray-800 border-r-gray-800 rounded-lg p-5 shadow-sm transition-all animate-fade-in`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-100">{review.reviewer_name}</span>
            <VerifiedIcon className="text-blue-400" sx={{ fontSize: 16 }} />
          </div>
          <div className="flex items-center mt-1 space-x-2 text-sm text-gray-400">
            <div className="flex text-yellow-500">
              {[...Array(5)].map((_, i) => (
                <StarIcon key={i} sx={{ fontSize: 14 }} className={i < review.rating ? "opacity-100" : "opacity-30"} />
              ))}
            </div>
            <span>• {review.date || 'Recent'}</span>
          </div>
        </div>
        <div className={`px-2.5 py-1 rounded text-xs font-bold ${isFake ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
          {isFake ? 'FAKE' : 'REAL'} {Math.round((isFake ? review.fake_confidence : 1 - review.fake_confidence) * 100)}%
        </div>
      </div>

      <div className="mb-3">
        <h4 className="font-semibold text-gray-200 mb-1">{review.title}</h4>
        <p className={`text-gray-400 text-sm leading-relaxed ${!expanded && 'line-clamp-3'}`}>
          {review.body}
        </p>
        {review.body?.length > 150 && (
          <button 
            onClick={() => setExpanded(!expanded)}
            className="text-indigo-400 text-sm mt-1 hover:text-indigo-300 flex items-center"
          >
            {expanded ? "Show less" : "Read more"}
            <ExpandMoreIcon sx={{ fontSize: 16 }} className={`ml-1 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {isFake && review.reasons?.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-800">
          {review.reasons.map((reason, i) => (
            <span key={i} className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded-md border border-gray-700">
              {reason}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
