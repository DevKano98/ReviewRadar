import { useState } from 'react';
import { ContentPasteIcon, SearchIcon, ShoppingCartIcon, LocalMallIcon } from './icons';
import { isValidProductURL, detectPlatform } from '../lib/urlUtils';

export default function URLInput({ onSubmit, recentSearches = [] }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState(null);

  const platform = detectPlatform(url);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
      setError(null);
    } catch (err) {
      console.error("Failed to read clipboard");
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
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative group">
        <div className={`flex items-center bg-gray-900 border ${error ? 'border-red-500' : 'border-gray-800'} rounded-lg focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all shadow-sm`}>
          
          <div className="pl-4 pr-2 flex items-center justify-center text-gray-500">
            {platform === 'amazon' ? <ShoppingCartIcon className="text-yellow-500" fontSize="small"/> : 
             platform === 'flipkart' ? <LocalMallIcon className="text-blue-500" fontSize="small"/> : 
             <SearchIcon fontSize="small"/>}
          </div>

          <input
            type="text"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setError(null); }}
            placeholder="Paste Amazon or Flipkart product URL..."
            className="flex-1 bg-transparent py-4 px-2 text-gray-100 placeholder-gray-600 focus:outline-none font-body text-lg"
          />

          <button
            type="button"
            onClick={handlePaste}
            className="px-3 text-gray-500 hover:text-gray-300 transition-colors"
            title="Paste from clipboard"
          >
            <ContentPasteIcon fontSize="small" />
          </button>

          <button
            type="submit"
            className="m-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md font-medium transition-colors"
          >
            Analyze
          </button>
        </div>
        
        {error && <p className="absolute -bottom-6 left-0 text-red-400 text-sm mt-1">{error}</p>}
      </form>

      {recentSearches.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2 items-center text-sm">
          <span className="text-gray-500 mr-2">Recent:</span>
          {recentSearches.map((search, i) => (
            <button
              key={i}
              onClick={() => { setUrl(search.url); onSubmit(search.url); }}
              className="px-3 py-1 bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-full text-gray-300 transition-colors truncate max-w-[150px]"
            >
              {search.title || "Product URL"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
