// Shared UI components for EcoPulse
import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils';

// Loading spinner
export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('animate-spin', className)} />;
}

// Loading skeleton
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse bg-gradient-to-r from-sage-light via-white to-sage-light rounded-lg', className)} />
  );
}

// Empty state
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 bg-sage-light rounded-2xl flex items-center justify-center mb-4">
        <Icon size={28} className="text-eco-muted" />
      </div>
      <h3 className="font-semibold text-eco-text text-lg mb-1">{title}</h3>
      {description && <p className="text-eco-muted text-sm max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// Error state
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
        <span className="text-2xl">⚠️</span>
      </div>
      <h3 className="font-semibold text-eco-text mb-1">Something went wrong</h3>
      <p className="text-eco-muted text-sm mb-4">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-primary btn-sm">
          Try again
        </button>
      )}
    </div>
  );
}

// Progress bar
export function ProgressBar({
  value,
  max,
  className,
  colorClass = 'bg-eco-green',
}: {
  value: number;
  max: number;
  className?: string;
  colorClass?: string;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className={cn('progress-bar', className)}>
      <div
        className={cn('progress-fill', colorClass)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// Stat card
export function StatCard({
  label,
  value,
  unit,
  icon: Icon,
  trend,
  colorClass = 'text-emerald-700',
  bgClass = 'bg-emerald-50',
}: {
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  trend?: string;
  colorClass?: string;
  bgClass?: string;
}) {
  return (
    <div className="card-studio p-5 flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-mono tracking-widest text-slate-500 font-bold uppercase">{label}</span>
        {Icon && (
          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shadow-xs', bgClass)}>
            <Icon size={16} className={colorClass} />
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-1 mt-3">
        <span className="text-3xl font-display font-black text-slate-900 tracking-tight">{value}</span>
        {unit && <span className="text-xs text-slate-400 font-mono font-medium">{unit}</span>}
      </div>
      {trend && <span className="text-xs text-emerald-700 font-mono mt-1 font-semibold">{trend}</span>}
    </div>
  );
}

// Badge pill
export function CategoryBadge({ category }: { category: string }) {
  const config: Record<string, string> = {
    travel: 'bg-forest-100 text-forest-800',
    meals: 'bg-lime-100 text-lime-800',
    movement: 'bg-purple-100 text-purple-800',
    hydration: 'bg-blue-100 text-blue-800',
  };
  const labels: Record<string, string> = {
    travel: 'Travel',
    meals: 'Meals',
    movement: 'Movement',
    hydration: 'Hydration',
  };
  return (
    <span className={cn('badge text-[11px]', config[category] || 'bg-gray-100 text-gray-700')}>
      {labels[category] || category}
    </span>
  );
}

// Demo data notice
export function DemoNotice() {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
      <span>⚠️</span>
      <span>You are viewing <strong>demo data</strong>. Create an account to track your real progress.</span>
    </div>
  );
}

// Points badge
export function PointsBadge({ points }: { points: number }) {
  return (
    <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-eco-green-light/60 rounded-full">
      <span className="text-xs font-bold text-eco-green-dark">+{points}</span>
      <span className="text-[10px] text-eco-green font-medium">pts</span>
    </div>
  );
}

// Difficulty badge
export function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const config: Record<string, string> = {
    easy: 'bg-green-100 text-green-700',
    medium: 'bg-amber-100 text-amber-700',
    hard: 'bg-red-100 text-red-700',
  };
  return (
    <span className={cn('badge', config[difficulty] || 'bg-gray-100 text-gray-700')}>
      {difficulty}
    </span>
  );
}

// Section header
export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="section-subtitle">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// Avatar circle
export function AvatarCircle({
  name,
  color,
  size = 'md',
}: {
  name: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClass = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base' }[size];
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div
      className={cn('rounded-full flex items-center justify-center text-white font-bold flex-shrink-0', sizeClass)}
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
}
