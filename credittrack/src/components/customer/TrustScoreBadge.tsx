import React from 'react';
import { Star, AlertTriangle, ShieldCheck, ShieldAlert } from 'lucide-react';
import { TrustRating } from '../../types';

interface TrustScoreBadgeProps {
  score?: number;
  stars?: number;
  rating?: TrustRating;
  isHighRisk?: boolean;
  daysOverdue?: number;
  size?: 'sm' | 'md' | 'lg';
  showStars?: boolean;
  showScore?: boolean;
  showLabel?: boolean;
}

export function TrustScoreBadge({
  score = 75,
  stars = 4,
  rating = 'GOOD',
  isHighRisk = false,
  daysOverdue = 0,
  size = 'md',
  showStars = true,
  showScore = true,
  showLabel = true,
}: TrustScoreBadgeProps) {
  // Determine color scheme based on rating or risk
  let colorConfig = {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-900/60',
    text: 'text-emerald-700 dark:text-emerald-300',
    starFill: 'text-amber-400 fill-amber-400',
    starEmpty: 'text-slate-200 dark:text-slate-700',
    label: 'Excellent',
  };

  if (isHighRisk || rating === 'HIGH_RISK' || score < 50) {
    colorConfig = {
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      border: 'border-rose-200 dark:border-rose-900/60',
      text: 'text-rose-700 dark:text-rose-300',
      starFill: 'text-rose-500 fill-rose-500',
      starEmpty: 'text-slate-200 dark:text-slate-700',
      label: 'At Risk',
    };
  } else if (rating === 'FAIR' || (score >= 50 && score < 70)) {
    colorConfig = {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      border: 'border-amber-200 dark:border-amber-900/60',
      text: 'text-amber-700 dark:text-amber-300',
      starFill: 'text-amber-400 fill-amber-400',
      starEmpty: 'text-slate-200 dark:text-slate-700',
      label: 'Fair',
    };
  } else if (rating === 'GOOD' || (score >= 70 && score < 85)) {
    colorConfig = {
      bg: 'bg-teal-50 dark:bg-teal-950/40',
      border: 'border-teal-200 dark:border-teal-900/60',
      text: 'text-teal-700 dark:text-teal-300',
      starFill: 'text-amber-400 fill-amber-400',
      starEmpty: 'text-slate-200 dark:text-slate-700',
      label: 'Good',
    };
  }

  // Size mapping
  const sizeClasses = {
    sm: {
      wrap: 'text-[10px] px-2 py-0.5 gap-1',
      star: 'w-2.5 h-2.5',
      icon: 'w-3 h-3',
    },
    md: {
      wrap: 'text-xs px-2.5 py-1 gap-1.5',
      star: 'w-3 h-3',
      icon: 'w-3.5 h-3.5',
    },
    lg: {
      wrap: 'text-sm px-3.5 py-1.5 gap-2',
      star: 'w-4 h-4',
      icon: 'w-4 h-4',
    },
  }[size];

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      <div
        className={`inline-flex items-center rounded-xl border font-bold ${colorConfig.bg} ${colorConfig.border} ${colorConfig.text} ${sizeClasses.wrap}`}
        title={`Trust Score: ${score}/100 • ${colorConfig.label}${daysOverdue > 0 ? ` • ${daysOverdue} days since last transaction` : ''}`}
      >
        {isHighRisk ? (
          <ShieldAlert className={`${sizeClasses.icon} text-rose-600 shrink-0`} />
        ) : (
          <ShieldCheck className={`${sizeClasses.icon} ${colorConfig.text} shrink-0`} />
        )}

        {showScore && (
          <span className="font-extrabold tracking-tight">
            {score}<span className="text-[10px] opacity-70">/100</span>
          </span>
        )}

        {showLabel && (
          <span className="font-semibold text-[11px] opacity-90 hidden sm:inline">
            {colorConfig.label}
          </span>
        )}

        {showStars && (
          <div className="flex items-center gap-0.5 ml-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`${sizeClasses.star} ${
                  s <= stars ? colorConfig.starFill : colorConfig.starEmpty
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {isHighRisk && daysOverdue >= 30 && (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
          <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
          <span>{daysOverdue}d overdue</span>
        </span>
      )}
    </div>
  );
}
