import { useEffect, useState } from 'react';
import { getScoreColorClass, getVerdictStyles } from '../lib/analysis';

export default function TrustScoreMeter({ score, verdict, fakeCount, realCount, totalReviews }) {
  const numericScore = Math.round(Number(score || 0));
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(numericScore), 100);
    return () => clearTimeout(timer);
  }, [numericScore]);

  const colorStyle = getScoreColorClass(numericScore);
  const verdictStyle = getVerdictStyles(verdict);

  return (
    <div className="rounded-[30px] border border-[var(--line)] bg-[rgba(255,255,255,0.78)] p-6 text-center shadow-sm">
      <p className="text-sm uppercase tracking-[0.18em] text-[var(--ink-soft)]">Trust score</p>

      <div className="relative mx-auto mb-6 mt-5 h-36 w-36">
        <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
          <circle className="stroke-[var(--surface-muted)]" strokeWidth="8" fill="transparent" r={radius} cx="50" cy="50" />
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
          <span className={`text-5xl font-semibold tracking-tight ${colorStyle.split(' ')[0]}`}>{animatedScore}</span>
          <span className="text-xs uppercase tracking-[0.16em] text-[var(--ink-soft)]">out of 100</span>
        </div>
      </div>

      <div className={`mx-auto mb-4 inline-flex rounded-full border px-4 py-2 text-sm font-semibold ${verdictStyle.badge}`}>
        {verdictStyle.title}
      </div>

      <div className="grid grid-cols-3 gap-3 text-left">
        <div className="rounded-[20px] border border-[var(--line)] bg-white px-4 py-4">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--ink-soft)]">Fake</p>
          <p className="mt-2 text-2xl font-semibold text-rose-600">{fakeCount ?? 0}</p>
        </div>
        <div className="rounded-[20px] border border-[var(--line)] bg-white px-4 py-4">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--ink-soft)]">Real</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-600">{realCount ?? 0}</p>
        </div>
        <div className="rounded-[20px] border border-[var(--line)] bg-white px-4 py-4">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--ink-soft)]">Total</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--ink)]">{totalReviews ?? 0}</p>
        </div>
      </div>
    </div>
  );
}
