import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Spinner, type SpinnerSize } from '@/components/ui/Spinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-xl';

  const variants = {
    primary: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 active:from-amber-700 active:to-amber-800 shadow-md hover:shadow-lg',
    secondary: 'bg-slate-800 text-white hover:bg-slate-900 active:bg-black shadow-md hover:shadow-lg',
    outline: 'border-2 border-slate-300 bg-white text-slate-800 hover:border-amber-500 hover:bg-amber-50 active:bg-amber-100 transition-colors',
    destructive: 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 active:from-red-700 active:to-red-800 shadow-md hover:shadow-lg',
    ghost: 'text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors',
    success: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 active:from-emerald-700 active:to-emerald-800 shadow-md hover:shadow-lg',
  };

  const sizes = {
    sm: 'h-9 px-4 text-xs font-semibold',
    md: 'h-11 px-5 text-sm font-semibold',
    lg: 'h-14 px-7 text-base font-bold',
    icon: 'h-11 w-11 p-0',
  };

  const spinnerSizes: Record<string, SpinnerSize> = {
    sm: 'xs',
    md: 'sm',
    lg: 'md',
    icon: 'sm',
  };

  const spinnerVariant =
    variant === 'outline' || variant === 'ghost' ? 'primary' : 'white';

  return (
    <button
      className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <Spinner size={spinnerSizes[size]} variant={spinnerVariant} />
          {size !== 'icon' && <span>Loading…</span>}
        </span>
      ) : (
        children
      )}
    </button>
  );
};
