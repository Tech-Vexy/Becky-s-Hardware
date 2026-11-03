import React from 'react';

interface SkeletonLoaderProps {
  className?: string;
  height?: string;
  width?: string;
  variant?: 'text' | 'rect' | 'circle';
}

export function SkeletonLoader({ className = '', height = '1rem', width = '100%', variant = 'rect' }: SkeletonLoaderProps) {
  const style = { height, width };

  const baseClasses = 'skeleton';
  const variantClasses = {
    text: 'rounded',
    rect: 'rounded-lg',
    circle: 'rounded-full',
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}

interface SkeletonCardProps {
  count?: number;
}

export function SkeletonCard({ count = 1 }: SkeletonCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3">
          <SkeletonLoader height="1.5rem" width="60%" variant="text" />
          <SkeletonLoader height="1rem" width="100%" variant="text" />
          <SkeletonLoader height="1rem" width="80%" variant="text" />
        </div>
      ))}
    </div>
  );
}

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
}

export function SkeletonTable({ rows = 5, columns = 4 }: SkeletonTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-200">
        <SkeletonLoader height="1.5rem" width="40%" variant="text" />
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex gap-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <SkeletonLoader
                key={colIndex}
                height="1rem"
                width={`${100 / columns}%`}
                variant="text"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
