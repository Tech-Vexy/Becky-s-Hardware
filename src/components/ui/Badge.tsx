import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline' | 'secondary';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  children,
  ...props
}) => {
  const variants = {
    default:   'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-800 border-slate-300 shadow-sm',
    secondary: 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-800 border-slate-300 shadow-sm',
    success:   'bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-800 border-emerald-300 shadow-sm',
    warning:   'bg-gradient-to-r from-amber-50 to-amber-100 text-amber-800 border-amber-300 shadow-sm',
    danger:    'bg-gradient-to-r from-red-50 to-red-100 text-red-800 border-red-300 shadow-sm',
    info:      'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 border-blue-300 shadow-sm',
    outline:   'bg-transparent text-slate-700 border-slate-300 hover:bg-slate-50 transition-colors',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide transition-all duration-200',
          variants[variant],
          className
        )
      )}
      {...props}
    >
      {children}
    </span>
  );
};
