/**
 * Profile Not Found Page
 * 
 * Displayed when a handle doesn't exist.
 */

import Link from 'next/link';

const BRAND_LAVENDER = "#e1a8f0";

export default function ProfileNotFound() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div 
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: `${BRAND_LAVENDER}15` }}
        >
          <svg 
            className="w-10 h-10" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            strokeWidth={1.5}
            style={{ color: BRAND_LAVENDER }}
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" 
            />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-3">
          User not found
        </h1>
        
        <p className="text-white/50 text-base mb-8">
          This account doesn&apos;t exist. Try searching for another.
        </p>
        
        <Link 
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 rounded-full text-sm font-medium transition-all"
          style={{ backgroundColor: BRAND_LAVENDER, color: 'black' }}
        >
          Go home
        </Link>
      </div>
    </div>
  );
}

