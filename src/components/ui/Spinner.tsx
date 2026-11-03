import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerVariant = 'primary' | 'white' | 'slate' | 'emerald' | 'orbital';

interface SpinnerProps extends React.SVGAttributes<SVGSVGElement> {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  label?: string;
  className?: string;
}

const sizeClasses: Record<SpinnerSize, string> = {
  xs: 'h-3.5 w-3.5',
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-9 w-9',
  xl: 'h-12 w-12',
};

const variantColors: Record<SpinnerVariant, { track: string; head: string; accent?: string }> = {
  primary: {
    track: 'stroke-amber-100/60 dark:stroke-amber-950/40',
    head: 'stroke-amber-500',
    accent: 'fill-amber-500',
  },
  white: {
    track: 'stroke-white/20',
    head: 'stroke-white',
    accent: 'fill-white',
  },
  slate: {
    track: 'stroke-slate-200 dark:stroke-slate-800',
    head: 'stroke-slate-700 dark:stroke-slate-300',
    accent: 'fill-slate-600',
  },
  emerald: {
    track: 'stroke-emerald-100/60 dark:stroke-emerald-950/40',
    head: 'stroke-emerald-500',
    accent: 'fill-emerald-500',
  },
  orbital: {
    track: 'stroke-amber-500/20',
    head: 'stroke-amber-500',
    accent: 'fill-amber-400',
  },
};

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  label = 'Loading…',
  className,
  ...props
}) => {
  const { track, head, accent } = variantColors[variant];

  if (variant === 'orbital') {
    return (
      <span
        role="status"
        aria-label={label}
        className={twMerge('relative inline-flex items-center justify-center', sizeClasses[size], className)}
      >
        <svg
          viewBox="0 0 40 40"
          className="h-full w-full animate-spin-smooth"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          {...props}
        >
          {/* Outer track */}
          <circle cx="20" cy="20" r="16" strokeWidth="2.5" className={track} />
          {/* Outer arc */}
          <circle
            cx="20"
            cy="20"
            r="16"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="25 75"
            className={head}
          />
          {/* Inner concentric track */}
          <circle cx="20" cy="20" r="10" strokeWidth="2" className={track} />
          {/* Inner counter-rotating runner */}
          <circle
            cx="20"
            cy="20"
            r="10"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="16 50"
            className={head}
            style={{ transformOrigin: 'center', animation: 'spin 1.8s linear infinite reverse' }}
          />
          {/* Center hardware pivot */}
          <circle cx="20" cy="20" r="2.5" className={accent} />
        </svg>
        <span className="sr-only">{label}</span>
      </span>
    );
  }

  return (
    <span
      role="status"
      aria-label={label}
      className={twMerge('inline-flex items-center justify-center', sizeClasses[size], className)}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full animate-spin"
        {...props}
      >
        {/* Static precision ring */}
        <circle
          cx="12"
          cy="12"
          r="9.5"
          strokeWidth="2.75"
          className={track}
        />
        {/* Dynamic spinning runner with rounded cap */}
        <path
          d="M12 2.5C6.75329 2.5 2.5 6.75329 2.5 12C2.5 14.1509 3.21404 16.1362 4.4184 17.7287"
          strokeWidth="2.75"
          strokeLinecap="round"
          className={head}
        />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
};
