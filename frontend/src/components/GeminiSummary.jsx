import { CheckCircleOutlineIcon, HighlightOffIcon, AutoAwesomeIcon } from './icons';

export default function GeminiSummary({ summary }) {
  if (!summary) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-gray-800 rounded w-1/3 mb-6"></div>
        <div className="space-y-3 mb-6">
          <div className="h-4 bg-gray-800 rounded w-full"></div>
          <div className="h-4 bg-gray-800 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-sm animate-fade-in">
      <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
        <h3 className="font-display font-semibold text-gray-100 flex items-center">
          <AutoAwesomeIcon className="text-purple-400 mr-2" fontSize="small" />
          AI Analysis
        </h3>
        <span className="text-[10px] uppercase tracking-widest text-purple-400 bg-purple-500/10 px-2 py-1 rounded border border-purple-500/20 font-bold">
          Powered by Gemini
        </span>
      </div>

      <div className="space-y-6">
        <div>
          <h4 className="text-gray-500 text-xs uppercase tracking-wider mb-3">Verified Pros</h4>
          <ul className="space-y-2">
            {summary.pros?.map((pro, i) => (
              <li key={i} className="flex items-start text-sm text-gray-300">
                <CheckCircleOutlineIcon className="text-emerald-500 mr-2 mt-0.5 shrink-0" sx={{ fontSize: 16 }} />
                <span>{pro}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-gray-500 text-xs uppercase tracking-wider mb-3">Identified Issues</h4>
          <ul className="space-y-2">
            {summary.cons?.map((con, i) => (
              <li key={i} className="flex items-start text-sm text-gray-300">
                <HighlightOffIcon className="text-red-500 mr-2 mt-0.5 shrink-0" sx={{ fontSize: 16 }} />
                <span>{con}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-4 border-t border-gray-800">
          <p className="text-gray-400 text-sm italic pl-4 border-l-2 border-indigo-500">
            "{summary.bottom_line}"
          </p>
        </div>
      </div>
    </div>
  );
}
