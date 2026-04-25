import { useEffect, useRef } from 'react';
import { TerminalIcon } from './icons';

export default function ScrapeTerminal({ events, status }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events]);

  const getEventStyle = (type) => {
    switch (type) {
      case "info": return { color: "text-gray-400", prefix: "⚡" };
      case "success": return { color: "text-emerald-400", prefix: "✓" };
      case "review_raw": return { color: "text-gray-500", prefix: "→" };
      case "fake": return { color: "text-red-400", prefix: "✗ FAKE" };
      case "real": return { color: "text-emerald-400", prefix: "✓ REAL" };
      case "ml": return { color: "text-indigo-400", prefix: "🤖" };
      case "stats": return { color: "text-yellow-400", prefix: "📊" };
      case "ai": return { color: "text-purple-400", prefix: "✦ AI" };
      case "error": return { color: "text-red-500", prefix: "✗ ERROR" };
      default: return { color: "text-gray-300", prefix: "›" };
    }
  };

  return (
    <div className="flex flex-col bg-gray-950 border border-gray-800 rounded-xl overflow-hidden shadow-2xl h-[500px] font-mono text-sm">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50"></div>
        </div>
        <div className="flex items-center text-gray-500 space-x-2 font-display text-xs tracking-wider uppercase">
          <TerminalIcon fontSize="inherit" />
          <span>ReviewRadar Scanner</span>
        </div>
      </div>

      {/* Terminal Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {events.map((ev) => {
          if (ev.type === "verdict") {
            const colors = {
              "BUY": "bg-emerald-900/30 text-emerald-400 border-emerald-800",
              "CAUTION": "bg-yellow-900/30 text-yellow-400 border-yellow-800",
              "AVOID": "bg-red-900/30 text-red-400 border-red-800"
            };
            return (
              <div key={ev.id} className={`w-full py-2 px-3 border rounded text-center font-bold tracking-widest uppercase animate-fade-in ${colors[ev.verdict] || colors["CAUTION"]}`}>
                FINAL VERDICT: {ev.verdict}
              </div>
            );
          }

          const style = getEventStyle(ev.type);
          return (
            <div key={ev.id} className="animate-fade-in flex space-x-3">
              <span className={`select-none ${style.color} w-16 shrink-0`}>{style.prefix}</span>
              <span className="text-gray-300">
                {ev.msg}
                {ev.confidence && <span className="ml-2 px-1.5 py-0.5 rounded bg-gray-800 text-xs text-gray-400 border border-gray-700">{Math.round(ev.confidence * 100)}%</span>}
                {ev.fake !== undefined && ` Fake: ${ev.fake} | Real: ${ev.real} | Trust Score: ${ev.score}/100`}
              </span>
            </div>
          );
        })}
        {status === "connecting" && <div className="text-gray-500 animate-pulse">Establishing secure connection...</div>}
        <div ref={endRef} />
      </div>

      {/* Terminal Footer */}
      <div className="bg-gray-900 border-t border-gray-800 px-4 py-2 flex justify-between items-center text-xs text-gray-500">
        <div className="flex items-center space-x-2">
          <span className="uppercase tracking-wider">Status:</span>
          <span className="text-indigo-400 animate-pulse">{status.toUpperCase()}</span>
        </div>
        <div>Events: {events.length}</div>
      </div>
    </div>
  );
}
