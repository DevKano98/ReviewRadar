import { useState } from 'react';
import { ContentPasteIcon, SearchIcon, ShoppingCartIcon, LocalMallIcon } from './icons';
import { isValidProductURL, detectPlatform } from '../lib/urlUtils';

export default function URLInput({ onSubmit }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState(null);

  const platform = detectPlatform(url);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
      setError(null);
    } catch {
      setError('Clipboard access was blocked. Paste the link manually.');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validation = isValidProductURL(url);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }
    setError(null);
    onSubmit(url);
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="relative">
        <div className={`rounded-[28px] border bg-white/90 p-2 shadow-[0_10px_30px_rgba(89,76,53,0.08)] ${error ? 'border-rose-300' : 'border-[var(--line)]'}`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center rounded-[22px] bg-[var(--surface-muted)] px-4 py-3">
              <div className="mr-3 text-[var(--ink-soft)]">
                {platform === 'amazon' ? (
                  <ShoppingCartIcon className="text-amber-600" fontSize="small" />
                ) : platform === 'flipkart' ? (
                  <LocalMallIcon className="text-sky-600" fontSize="small" />
                ) : (
                  <SearchIcon fontSize="small" />
                )}
              </div>

              <input
                type="text"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setError(null);
                }}
                placeholder="Paste an Amazon or Flipkart product URL"
                className="w-full bg-transparent text-base text-[var(--ink)] outline-none placeholder:text-[var(--ink-soft)]"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePaste}
                className="inline-flex items-center justify-center rounded-[18px] border border-[var(--line)] bg-white px-4 py-3 text-[var(--ink-soft)] transition hover:text-[var(--ink)]"
                title="Paste from clipboard"
              >
                <ContentPasteIcon fontSize="small" />
              </button>

              <button
                type="submit"
                className="rounded-[18px] bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(47,100,255,0.25)] transition hover:opacity-95"
              >
                Start analysis
              </button>
            </div>
          </div>
        </div>

        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      </form>
    </div>
  );
}
