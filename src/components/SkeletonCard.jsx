import React from 'react';
export default function SkeletonCard() {
  return (
    <div className="card-container p-4 animate-pulse">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-border/50"></div>
          <div>
            <div className="h-4 w-24 bg-brand-border/50 rounded mb-2"></div>
            <div className="h-3 w-16 bg-brand-border/30 rounded"></div>
          </div>
        </div>
        <div className="h-8 w-12 bg-brand-border/50 rounded-lg"></div>
      </div>
      
      <div className="flex gap-2 mb-4">
        <div className="h-5 w-16 bg-brand-border/40 rounded-full"></div>
        <div className="h-5 w-20 bg-brand-border/40 rounded-full"></div>
        <div className="h-5 w-14 bg-brand-border/40 rounded-full"></div>
      </div>
      
      <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-brand-border/50">
        <div className="flex flex-col gap-1">
          <div className="h-3 w-12 bg-brand-border/30 rounded"></div>
          <div className="h-1.5 w-full bg-brand-border/50 rounded-full"></div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="h-3 w-12 bg-brand-border/30 rounded"></div>
          <div className="h-1.5 w-full bg-brand-border/50 rounded-full"></div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="h-3 w-12 bg-brand-border/30 rounded"></div>
          <div className="h-1.5 w-full bg-brand-border/50 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
