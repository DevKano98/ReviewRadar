import { getVerdictStyles } from '../lib/analysis';

export default function VerdictBanner({ verdict, oneLineSummary, trustScore }) {
  const style = getVerdictStyles(verdict);

  return (
    <div className={`rounded-[28px] border ${style.border} ${style.bg} px-6 py-6`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink-soft)]">Final recommendation</p>
          <h2 className={`mt-2 text-3xl font-semibold tracking-tight ${style.text}`}>{style.title}</h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--ink-soft)]">{oneLineSummary}</p>
        </div>
        <div className="rounded-[24px] border border-white/70 bg-white/70 px-5 py-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">Trust score</p>
          <p className={`mt-2 text-4xl font-semibold tracking-tight ${style.text}`}>{Math.round(Number(trustScore || 0))}</p>
        </div>
      </div>
    </div>
  );
}
