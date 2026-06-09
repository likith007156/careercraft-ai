import React from 'react';

export const SkeletonCard = ({ className = "" }) => (
  <div 
    className={`bg-fog dark:bg-white/5 rounded-card relative overflow-hidden h-48 w-full shadow-card border border-black/5 dark:border-white/5 ${className}`}
  >
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/[0.03] dark:via-white/[0.03] to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }}></div>
  </div>
);

export const SkeletonText = ({ lines = 3, className = "" }) => (
  <div className={`space-y-2.5 ${className}`}>
    {Array.from({ length: lines }).map((_, idx) => {
      const widths = ['w-full', 'w-11/12', 'w-3/4', 'w-5/6', 'w-1/2'];
      const width = widths[idx % widths.length];
      return (
        <div key={idx} className={`${width} h-4 bg-fog dark:bg-white/5 rounded-full relative overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/[0.03] dark:via-white/[0.03] to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }}></div>
        </div>
      );
    })}
  </div>
);

export const SkeletonCircle = ({ size = "h-12 w-12", className = "" }) => (
  <div className={`${size} bg-fog dark:bg-white/5 rounded-full relative overflow-hidden ${className}`}>
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/[0.03] dark:via-white/[0.03] to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }}></div>
  </div>
);

export const SkeletonChart = ({ className = "" }) => (
  <div 
    className={`bg-fog dark:bg-white/5 rounded-card relative overflow-hidden h-64 w-full flex items-end justify-between p-6 border border-black/5 dark:border-white/5 ${className}`}
  >
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/[0.03] dark:via-white/[0.03] to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }}></div>
    <div className="w-8 bg-black/5 dark:bg-white/5 rounded-t-lg h-3/4"></div>
    <div className="w-8 bg-black/5 dark:bg-white/5 rounded-t-lg h-1/2"></div>
    <div className="w-8 bg-black/5 dark:bg-white/5 rounded-t-lg h-5/6"></div>
    <div className="w-8 bg-black/5 dark:bg-white/5 rounded-t-lg h-2/3"></div>
    <div className="w-8 bg-black/5 dark:bg-white/5 rounded-t-lg h-3/5"></div>
  </div>
);
