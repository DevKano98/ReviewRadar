import { CheckCircleOutlineIcon, HighlightOffIcon, AutoAwesomeIcon } from './icons';

export default function GeminiSummary({ summary }) {
  if (!summary) {
    return (
      <div className="rounded-[30px] border border-[var(--line)] bg-[rgba(255,255,255,0.78)] p-6 animate-pulse">
        <div className="mb-5 h-6 w-1/3 rounded bg-[var(--surface-muted)]" />
        <div className="space-y-3">
          <div className="h-4 rounded bg-[var(--surface-muted)]" />
          <div className="h-4 w-5/6 rounded bg-[var(--surface-muted)]" />
          <div className="h-4 w-4/6 rounded bg-[var(--surface-muted)]" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[30px] border border-[var(--line)] bg-[rgba(255,255,255,0.78)] p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between border-b border-[var(--line)] pb-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-[var(--ink)]">
          <AutoAwesomeIcon className="text-[var(--accent)]" fontSize="small" />
          AI synthesis
        </h3>
        <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
          Gemini
        </span>
      </div>

      <div className="space-y-6">
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">Why this looks promising</h4>
          <ul className="space-y-2">
            {summary.pros?.map((pro, index) => (
              <li key={index} className="flex items-start gap-2 text-sm leading-6 text-[var(--ink-soft)]">
                <CheckCircleOutlineIcon className="mt-0.5 shrink-0 text-emerald-600" sx={{ fontSize: 16 }} />
                <span>{pro}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">What to watch</h4>
          <ul className="space-y-2">
            {summary.cons?.map((con, index) => (
              <li key={index} className="flex items-start gap-2 text-sm leading-6 text-[var(--ink-soft)]">
                <HighlightOffIcon className="mt-0.5 shrink-0 text-rose-600" sx={{ fontSize: 16 }} />
                <span>{con}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[22px] border border-[var(--line)] bg-[var(--surface-muted)] px-4 py-4">
          <p className="text-sm italic leading-7 text-[var(--ink-soft)]">"{summary.bottom_line}"</p>
        </div>
      </div>
    </div>
  );
}
