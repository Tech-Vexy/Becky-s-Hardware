import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export function LoadingSpinner({ size = 'md', className = '', text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="relative">
        <div
          className={`${sizeClasses[size]} border-2 border-slate-200 border-t-amber-500 rounded-full animate-spin`}
        />
      </div>
      {text && <span className="ml-3 text-sm text-slate-500">{text}</span>}
    </div>
  );
}

interface FullPageLoaderProps {
  text?: string;
}

export function FullPageLoader({ text = 'Loading...' }: FullPageLoaderProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-600">{text}</p>
      </div>
    </div>
  );
}
