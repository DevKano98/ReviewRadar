import { getVerdictStyles } from '../lib/analysis';

export default function VerdictBanner({ verdict, oneLineSummary, trustScore }) {
  const style = getVerdictStyles(verdict);

  return (
    <div className={`w-full ${style.bg} border-y ${style.border} py-6 px-4 animate-slide-down mb-8`}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        <div>
          <h2 className={`font-display text-2xl md:text-3xl font-bold ${style.text} mb-2`}>
            {style.title}
          </h2>
          <p className="text-gray-300 text-lg">{oneLineSummary}</p>
        </div>
        <div className="flex flex-col items-center justify-center bg-gray-950/50 px-6 py-3 rounded-lg border border-gray-800 shadow-inner">
          <span className="text-gray-400 text-sm uppercase tracking-wider mb-1">Trust Score</span>
          <span className={`text-3xl font-mono font-bold ${style.text}`}>{trustScore}/100</span>
        </div>
      </div>
    </div>
  );
}