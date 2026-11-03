/**
 * PageHeader — consistent section heading used across every inner page.
 *
 * Usage:
 *   <PageHeader
 *     title="Customer Credit Ledger"
 *     description="Manage on-account balances and record repayments."
 *     icon={<Users className="h-5 w-5" />}
 *     iconColor="from-emerald-500 to-emerald-600"
 *     action={<Button size="sm">+ Add Customer</Button>}
 *   />
 */

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Lucide icon element rendered inside the coloured badge */
  icon?: React.ReactNode;
  /** Tailwind gradient classes for the icon bubble */
  iconColor?: string;
  /** Action element (button, link, etc.) shown on the right */
  action?: React.ReactNode;
  /** Additional wrapper className */
  className?: string;
  /** Breadcrumb / back path — renders a small Back arrow above the title */
  breadcrumb?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  icon,
  iconColor = 'from-slate-600 to-slate-700',
  action,
  className,
  breadcrumb,
}) => (
  <div className={twMerge(clsx('mb-6', className))}>
    {breadcrumb && (
      <div className="mb-2 text-xs text-slate-400 font-medium">{breadcrumb}</div>
    )}
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <div
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${iconColor} text-white shadow-md`}
          >
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-xl font-extrabold text-slate-900 leading-tight tracking-tight truncate">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-slate-500 mt-0.5 font-medium leading-snug line-clamp-2">
              {description}
            </p>
          )}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  </div>
);

// ─── SectionHeader — lightweight divider inside a page ─────────────────────

interface SectionHeaderProps {
  title: string;
  action?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  action,
  className,
}) => (
  <div className={twMerge(clsx('flex items-center justify-between mb-3', className))}>
    <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider leading-none">
      {title}
    </h2>
    {action && <div>{action}</div>}
  </div>
);
