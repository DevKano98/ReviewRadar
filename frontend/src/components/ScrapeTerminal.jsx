import { useEffect, useRef } from 'react';
import { TerminalIcon } from './icons';

export default function ScrapeTerminal({ events, status }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  const getEventStyle = (type) => {
    switch (type) {
      case 'info':
        return { color: 'text-slate-500', prefix: 'INFO' };
      case 'success':
        return { color: 'text-emerald-600', prefix: 'FOUND' };
      case 'review_raw':
        return { color: 'text-slate-500', prefix: 'RAW' };
      case 'fake':
        return { color: 'text-rose-600', prefix: 'FAKE' };
      case 'real':
        return { color: 'text-emerald-600', prefix: 'REAL' };
      case 'ml':
        return { color: 'text-blue-600', prefix: 'ML' };
      case 'stats':
        return { color: 'text-amber-600', prefix: 'STATS' };
      case 'ai':
        return { color: 'text-indigo-600', prefix: 'AI' };
      case 'error':
        return { color: 'text-rose-600', prefix: 'ERROR' };
      default:
        return { color: 'text-slate-500', prefix: 'LOG' };
    }
  };

  return (
    <div className="flex h-[500px] flex-col overflow-hidden rounded-[28px] border border-[var(--line)] bg-[#faf7f2] font-mono text-sm shadow-inner">
      <div className="flex items-center justify-between border-b border-[var(--line)] bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-rose-300" />
          <div className="h-3 w-3 rounded-full bg-amber-300" />
          <div className="h-3 w-3 rounded-full bg-emerald-300" />
        </div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--ink-soft)]">
          <TerminalIcon fontSize="inherit" />
          ReviewRadar pipeline
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {events.map((event) => {
          if (event.type === 'verdict') {
            return (
              <div key={event.id} className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-center text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
                Final verdict: {event.verdict}
              </div>
            );
          }

          const style = getEventStyle(event.type);

          return (
            <div key={event.id} className="flex gap-3 rounded-2xl border border-white bg-white px-3 py-3">
              <span className={`w-14 shrink-0 text-[11px] font-semibold uppercase tracking-[0.16em] ${style.color}`}>{style.prefix}</span>
              <span className="text-[13px] leading-6 text-[var(--ink-soft)]">
                {event.msg}
                {event.confidence !== undefined ? (
                  <span className="ml-2 rounded-full border border-[var(--line)] bg-[var(--surface-muted)] px-2 py-0.5 text-xs">
                    {Math.round(event.confidence * 100)}%
                  </span>
                ) : null}
                {event.fake !== undefined ? ` Fake: ${event.fake} | Real: ${event.real} | Trust Score: ${event.score}/100` : null}
              </span>
            </div>
          );
        })}
        {status === 'connecting' ? (
          <div className="rounded-2xl border border-white bg-white px-3 py-3 text-[13px] text-[var(--ink-soft)] animate-pulse">
            Establishing secure connection...
          </div>
        ) : null}
        <div ref={endRef} />
      </div>

      <div className="flex items-center justify-between border-t border-[var(--line)] bg-white px-4 py-3 text-xs uppercase tracking-[0.16em] text-[var(--ink-soft)]">
        <div>Status: {status}</div>
        <div>Events: {events.length}</div>
      </div>
    </div>
  );
}
