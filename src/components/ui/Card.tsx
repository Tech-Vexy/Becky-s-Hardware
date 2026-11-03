import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ─── Card Variants ─────────────────────────────────────────────────────────

type CardVariant = 'default' | 'elevated' | 'flat' | 'stat' | 'outline';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  /** Removes default padding, useful when nesting CardHeader / CardContent */
  noPadding?: boolean;
}

const variantStyles: Record<CardVariant, string> = {
  default:  'bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300',
  elevated: 'bg-white border border-slate-100 shadow-md hover:shadow-lg',
  flat:     'bg-slate-50 border border-slate-200',
  stat:     'bg-white border border-slate-200 shadow-sm hover:shadow-md',
  outline:  'bg-transparent border-2 border-slate-200 hover:border-amber-400',
};

export const Card: React.FC<CardProps> = ({
  className,
  variant = 'default',
  noPadding = false,
  children,
  ...props
}) => (
  <div
    className={twMerge(
      clsx(
        'rounded-2xl transition-all duration-200 animate-fade-in',
        variantStyles[variant],
        !noPadding && 'p-5',
        className
      )
    )}
    {...props}
  >
    {children}
  </div>
);

// ─── CardHeader ────────────────────────────────────────────────────────────

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Renders an icon container to the left of the title area */
  icon?: React.ReactNode;
  /** Small badge / label beside the title */
  badge?: React.ReactNode;
  /** Action element (e.g. link, button) aligned right */
  action?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  className,
  icon,
  badge,
  action,
  children,
  ...props
}) => (
  <div
    className={twMerge(
      clsx('flex items-start justify-between gap-3 px-5 pt-5 pb-0', className)
    )}
    {...props}
  >
    <div className="flex items-center gap-2.5 min-w-0">
      {icon && (
        <div className="flex-shrink-0">{icon}</div>
      )}
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {typeof children === 'string' ? (
            <h3 className="text-sm font-bold text-slate-900 truncate">{children}</h3>
          ) : (
            children
          )}
          {badge}
        </div>
      </div>
    </div>
    {action && <div className="flex-shrink-0">{action}</div>}
  </div>
);

// ─── CardContent ───────────────────────────────────────────────────────────

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Adds divider line above the content */
  divider?: boolean;
}

export const CardContent: React.FC<CardContentProps> = ({
  className,
  divider = false,
  children,
  ...props
}) => (
  <div
    className={twMerge(
      clsx(
        'px-5 py-4',
        divider && 'border-t border-slate-100 mt-3',
        className
      )
    )}
    {...props}
  >
    {children}
  </div>
);

// ─── StatCard (specialised KPI card) ──────────────────────────────────────

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  /** Short description / sub-label below the value */
  sub?: React.ReactNode;
  /** Icon element rendered in a coloured square */
  icon?: React.ReactNode;
  /** Tailwind gradient classes for the icon bubble, e.g. 'from-emerald-500 to-emerald-600' */
  iconColor?: string;
  /** Background gradient on the card itself */
  cardGradient?: string;
  /** Border / accent colour class, e.g. 'border-emerald-200 hover:border-emerald-300' */
  accentBorder?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  className,
  label,
  value,
  sub,
  icon,
  iconColor = 'from-slate-500 to-slate-600',
  cardGradient = 'from-white to-slate-50',
  accentBorder = 'border-slate-200 hover:border-slate-300',
  ...props
}) => (
  <div
    className={twMerge(
      clsx(
        `rounded-2xl border bg-gradient-to-br ${cardGradient} ${accentBorder} p-5 shadow-sm hover:shadow-md transition-all duration-200 animate-fade-in`,
        className
      )
    )}
    {...props}
  >
    <div className="flex items-start justify-between">
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 leading-none">
        {label}
      </span>
      {icon && (
        <div
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${iconColor} text-white shadow-md`}
        >
          {icon}
        </div>
      )}
    </div>
    <div className="mt-3">
      <div className="text-2xl font-black text-slate-900 leading-none tracking-tight">
        {value}
      </div>
      {sub && (
        <div className="mt-1.5 text-xs text-slate-500 font-medium leading-snug">{sub}</div>
      )}
    </div>
  </div>
);
