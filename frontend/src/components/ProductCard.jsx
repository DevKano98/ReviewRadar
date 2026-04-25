import { useState } from 'react';
import { StarIcon, ShoppingCartIcon, LocalMallIcon } from './icons';

export default function ProductCard({ product }) {
  const [imgError, setImgError] = useState(false);

  if (!product) return null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex gap-4 items-center animate-fade-in shadow-sm w-full">
      <div className="w-24 h-24 shrink-0 bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center border border-gray-700">
        {!imgError && product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.title} 
            className="w-full h-full object-contain bg-white"
            onError={() => setImgError(true)}
          />
        ) : (
          <LocalMallIcon className="text-gray-600" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          {product.platform === 'amazon' ? (
            <span className="text-xs font-bold bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded flex items-center border border-yellow-500/20">
              <ShoppingCartIcon sx={{ fontSize: 12 }} className="mr-1" /> Amazon
            </span>
          ) : (
            <span className="text-xs font-bold bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded flex items-center border border-blue-500/20">
              <LocalMallIcon sx={{ fontSize: 12 }} className="mr-1" /> Flipkart
            </span>
          )}
        </div>
        
        <h2 className="text-gray-100 font-semibold truncate mb-1" title={product.title}>
          {product.title}
        </h2>
        
        <div className="flex items-center text-sm">
          <span className="text-gray-300 font-medium mr-3">{product.price || 'Price unavailable'}</span>
          {product.rating && (
            <span className="flex items-center text-yellow-500">
              <StarIcon sx={{ fontSize: 16 }} className="mr-1" />
              <span className="text-gray-400">{product.rating}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
