import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowBackIcon, ShareIcon, ErrorOutlineIcon } from '../components/icons';

import { useScrapeStream } from '../hooks/useScrapeStream';
import ScrapeTerminal from '../components/ScrapeTerminal';
import ProductCard from '../components/ProductCard';
import TrustScoreMeter from '../components/TrustScoreMeter';
import GeminiSummary from '../components/GeminiSummary';
import ReviewGrid from '../components/ReviewGrid';
import VerdictBanner from '../components/VerdictBanner';

export default function ResultPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const url = searchParams.get('url');
  
  const { 
    status, events, product, reviews, mlStats, geminiSummary, error, startScrape 
  } = useScrapeStream();

  const [showTerminal, setShowTerminal] = useState(true);

  useEffect(() => {
    if (url) {
      const cleanup = startScrape(url);
      return cleanup;
    } else {
      navigate('/');
    }
  }, [url]);

  useEffect(() => {
    if (status === "done" || status === "cached") {
      setShowTerminal(false);
    }
  }, [status]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard", {
      style: { background: '#1e1e20', color: '#fff', border: '1px solid #333' }
    });
  };

  if (status === "error") {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
        <div className="bg-red-950/30 border border-red-500/50 p-8 rounded-xl max-w-md text-center">
          <ErrorOutlineIcon className="text-red-500 mb-4" sx={{ fontSize: 48 }} />
          <h2 className="text-xl font-bold text-red-400 mb-2">Analysis Failed</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button onClick={() => navigate('/')} className="px-6 py-2 bg-gray-900 border border-gray-700 hover:bg-gray-800 rounded-md text-white transition-colors">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isComplete = status === "done" || status === "cached";

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-body pb-20">
      {/* Navbar */}
      <nav className="border-b border-gray-800 bg-gray-950 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center text-gray-400 hover:text-white transition-colors">
            <ArrowBackIcon fontSize="small" className="mr-2" />
            <span className="font-medium text-sm hidden sm:inline">New Analysis</span>
          </button>
          <div className="font-display font-bold tracking-tight text-lg text-gray-100">ReviewRadar</div>
          <button onClick={handleShare} className="flex items-center text-gray-400 hover:text-white transition-colors" disabled={!isComplete}>
            <ShareIcon fontSize="small" className="mr-2" />
            <span className="font-medium text-sm hidden sm:inline">Share</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 mt-8">
        
        {/* Banner (Visible only when done) */}
        {isComplete && geminiSummary && mlStats && (
          <VerdictBanner 
            verdict={geminiSummary.verdict} 
            oneLineSummary={geminiSummary.one_line} 
            trustScore={mlStats.trust_score} 
          />
        )}

        {/* Layout Switch based on state */}
        {!isComplete || showTerminal ? (
          <div className="flex flex-col gap-6 animate-fade-in max-w-4xl mx-auto">
            {product && <ProductCard product={product} />}
            <div className="w-full">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-gray-400 font-mono text-sm uppercase">Scanner Output</h3>
                {isComplete && (
                  <button onClick={() => setShowTerminal(false)} className="text-xs text-indigo-400 hover:text-indigo-300">
                    Collapse
                  </button>
                )}
              </div>
              <ScrapeTerminal events={events} status={status} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
            {/* Left Column: Metadata & AI */}
            <div className="lg:col-span-4 space-y-6">
              <ProductCard product={product} />
              <TrustScoreMeter 
                score={mlStats.trust_score} 
                verdict={geminiSummary.verdict} 
                fakeCount={mlStats.fake_count} 
                realCount={mlStats.real_count} 
                totalReviews={mlStats.fake_count + mlStats.real_count} 
              />
              <GeminiSummary summary={geminiSummary} />
              
              <button 
                onClick={() => setShowTerminal(true)}
                className="w-full py-3 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl text-sm text-gray-400 transition-colors flex items-center justify-center font-mono"
              >
                View Terminal Logs
              </button>
            </div>

            {/* Right Column: Reviews */}
            <div className="lg:col-span-8 bg-gray-950 rounded-xl">
              <ReviewGrid reviews={reviews} isLoading={status !== "done" && status !== "cached"} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
