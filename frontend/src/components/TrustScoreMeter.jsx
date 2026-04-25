import { useEffect, useState } from 'react';
import { getScoreColorClass, getVerdictStyles } from '../lib/analysis';

export default function TrustScoreMeter({ score, verdict, fakeCount, realCount, totalReviews }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  const colorStyle = getScoreColorClass(score);
  const verdictStyle = getVerdictStyles(verdict);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col items-center justify-center text-center">
      <h3 className="text-gray-400 font-display text-sm uppercase tracking-widest mb-6">Trust Score</h3>
      
      <div className="relative w-32 h-32 mb-6">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            className="stroke-gray-800"
            strokeWidth="8"
            fill="transparent"
            r={radius}
            cx="50"
            cy="50"
          />
          <circle
            className={`transition-all duration-1000 ease-out ${colorStyle.split(' ')[1]}`}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            fill="transparent"
            r={radius}
            cx="50"
            cy="50"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-display font-bold ${colorStyle.split(' ')[0]}`}>{animatedScore}</span>
          <span className="text-xs text-gray-500">/ 100</span>
        </div>
      </div>

      <div className={`px-4 py-1.5 rounded-full border text-sm font-bold tracking-wide mb-4 ${verdictStyle.badge}`}>
        {verdict || "CAUTION"}
      </div>

      <p className="text-gray-400 text-sm">
        <strong className="text-red-400">{fakeCount} fake</strong> reviews detected out of {totalReviews} total analyzed.
      </p>
    </div>
  );
}