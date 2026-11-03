/**
 * Shared Input primitives for Becky's Hardware Store.
 * Replaces scattered raw <input> / <select> / <textarea> elements with
 * a consistent, accessible, amber-accented design system.
 *
 * Usage:
 *   import { Input, Select, Textarea } from '@/components/ui/Input';
 */

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ─── Shared base ring + border ─────────────────────────────────────────────

const baseField =
  'block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 ' +
  'placeholder:text-slate-400 ' +
  'focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 ' +
  'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 ' +
  'transition-all duration-150';

// ─── Input ─────────────────────────────────────────────────────────────────

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Label rendered above the input */
  label?: string;
  /** Helper / error text below the input */
  helper?: string;
  /** Show helper in red (error state) */
  error?: boolean;
  /** Icon rendered on the left inside the input */
  leftIcon?: React.ReactNode;
  /** Icon rendered on the right inside the input */
  rightIcon?: React.ReactNode;
  /** Wrapper className */
  wrapperClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      helper,
      error = false,
      leftIcon,
      rightIcon,
      wrapperClassName,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={twMerge(clsx('flex flex-col gap-1', wrapperClassName))}>
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-slate-700 select-none">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={twMerge(
              clsx(
                baseField,
                leftIcon  && 'pl-9',
                rightIcon && 'pr-9',
                error && 'border-red-400 focus:border-red-500 focus:ring-red-500/20',
                className
              )
            )}
            {...props}
          />
          {rightIcon && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              {rightIcon}
            </span>
          )}
        </div>
        {helper && (
          <p className={clsx('text-[11px] font-medium', error ? 'text-red-600' : 'text-slate-400')}>
            {helper}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

// ─── Select ────────────────────────────────────────────────────────────────

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helper?: string;
  error?: boolean;
  wrapperClassName?: string;
  children: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, helper, error = false, wrapperClassName, id, children, ...props }, ref) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={twMerge(clsx('flex flex-col gap-1', wrapperClassName))}>
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-slate-700 select-none">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={inputId}
            className={twMerge(
              clsx(
                baseField,
                'appearance-none pr-9 cursor-pointer',
                error && 'border-red-400 focus:border-red-500 focus:ring-red-500/20',
                className
              )
            )}
            {...props}
          >
            {children}
          </select>
          {/* Chevron icon */}
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            <svg
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        </div>
        {helper && (
          <p className={clsx('text-[11px] font-medium', error ? 'text-red-600' : 'text-slate-400')}>
            {helper}
          </p>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';

// ─── Textarea ──────────────────────────────────────────────────────────────

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helper?: string;
  error?: boolean;
  wrapperClassName?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, helper, error = false, wrapperClassName, id, ...props }, ref) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={twMerge(clsx('flex flex-col gap-1', wrapperClassName))}>
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-slate-700 select-none">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          rows={3}
          className={twMerge(
            clsx(
              baseField,
              'resize-y min-h-[80px]',
              error && 'border-red-400 focus:border-red-500 focus:ring-red-500/20',
              className
            )
          )}
          {...props}
        />
        {helper && (
          <p className={clsx('text-[11px] font-medium', error ? 'text-red-600' : 'text-slate-400')}>
            {helper}
          </p>
        )}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
