import { useNavigate } from 'react-router-dom';
import { SecurityIcon, ContentPasteSearchIcon, PsychologyIcon, GavelIcon } from '../components/icons';
import URLInput from '../components/URLInput';

export default function HomePage() {
  const navigate = useNavigate();

  const handleSearch = (url) => {
    navigate(`/result?url=${encodeURIComponent(url)}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden bg-gray-950">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[400px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center text-center">
        
        <div className="mb-6 inline-flex items-center space-x-2 bg-gray-900 border border-gray-800 px-4 py-1.5 rounded-full text-indigo-400 font-mono text-sm shadow-sm">
          <SecurityIcon fontSize="small" />
          <span>v1.0.0 Scraper Online</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-b from-gray-100 to-gray-500 mb-6 tracking-tight">
          Don't get fooled.<br/>Know before you buy.
        </h1>
        
        <p className="text-xl text-gray-400 mb-12 max-w-2xl font-body">
          The enterprise-grade fake review detector for Amazon & Flipkart. We analyze patterns, identify bots, and extract the real truth.
        </p>

        <div className="w-full mb-20">
          <URLInput onSubmit={handleSearch} recentSearches={[]} />
        </div>

        {/* How it works */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full border-t border-gray-800 pt-16">
          <div className="flex flex-col items-center text-center p-6 rounded-xl bg-gray-900/50 border border-gray-800/50">
            <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center text-indigo-400 mb-4 border border-gray-700 shadow-sm">
              <ContentPasteSearchIcon />
            </div>
            <h3 className="text-gray-200 font-semibold mb-2">1. Paste URL</h3>
            <p className="text-gray-500 text-sm">Drop any Amazon or Flipkart product link into the scanner. We bypass the fluff and pull raw review data.</p>
          </div>

          <div className="flex flex-col items-center text-center p-6 rounded-xl bg-gray-900/50 border border-gray-800/50">
            <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center text-indigo-400 mb-4 border border-gray-700 shadow-sm">
              <PsychologyIcon />
            </div>
            <h3 className="text-gray-200 font-semibold mb-2">2. ML Extraction</h3>
            <p className="text-gray-500 text-sm">Our NLP models parse linguistic patterns, repetition, and timing to flag bot-generated content.</p>
          </div>

          <div className="flex flex-col items-center text-center p-6 rounded-xl bg-gray-900/50 border border-gray-800/50">
            <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center text-indigo-400 mb-4 border border-gray-700 shadow-sm">
              <GavelIcon />
            </div>
            <h3 className="text-gray-200 font-semibold mb-2">3. The Verdict</h3>
            <p className="text-gray-500 text-sm">Get a definitive Trust Score and an AI summary highlighting what real humans are actually saying.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
