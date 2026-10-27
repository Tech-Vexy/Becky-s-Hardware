import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          'rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};
