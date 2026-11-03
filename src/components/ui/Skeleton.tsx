import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'dark' | 'amber';
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

const roundedClasses = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  full: 'rounded-full',
};

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'default',
  rounded = 'xl',
  ...props
}) => {
  const variantClass =
    variant === 'dark' ? 'skeleton-dark' : variant === 'amber' ? 'skeleton shimmer-amber' : 'skeleton';

  return (
    <div
      className={twMerge(clsx(variantClass, roundedClasses[rounded], className))}
      {...props}
    />
  );
};

export const SkeletonText: React.FC<{
  lines?: number;
  className?: string;
  gap?: string;
}> = ({ lines = 3, className = '', gap = 'space-y-2' }) => (
  <div className={gap}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        className={twMerge('h-4', i === lines - 1 ? 'w-3/5' : 'w-full', className)}
      />
    ))}
  </div>
);

export const SkeletonStatCard: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={twMerge(
      'rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-3',
      className
    )}
  >
    <div className="flex items-center justify-between">
      <Skeleton className="h-3.5 w-24" />
      <Skeleton className="h-9 w-9 rounded-xl" />
    </div>
    <Skeleton className="h-7 w-36" />
    <Skeleton className="h-3 w-28" />
  </div>
);

export const SkeletonTableRow: React.FC<{ columns?: number; className?: string }> = ({
  columns = 4,
  className,
}) => (
  <div className={twMerge('flex items-center gap-4 py-3.5 px-4 border-b border-slate-100', className)}>
    {Array.from({ length: columns }).map((_, i) => (
      <Skeleton
        key={i}
        className={twMerge('h-4', i === 0 ? 'w-1/3' : 'flex-1')}
      />
    ))}
  </div>
);
