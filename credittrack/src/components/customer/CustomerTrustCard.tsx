import React from 'react';
import { Customer } from '../../types';
import { formatINR, formatRelativeTime } from '../../lib/formatters';
import { TrustScoreBadge } from './TrustScoreBadge';
import { ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2, TrendingUp, Info } from 'lucide-react';

interface CustomerTrustCardProps {
  customer: Customer;
}

export function CustomerTrustCard({ customer }: CustomerTrustCardProps) {
  const score = customer.trustScore ?? 75;
  const rating = customer.trustRating ?? 'GOOD';
  const stars = customer.trustStars ?? 4;
  const isHighRisk = customer.isHighRisk ?? false;
  const daysOverdue = customer.daysOverdue ?? 0;

  const totalCredit = customer.totalCredit || 0;
  const totalPaid = customer.totalPaid || 0;
  const repaymentRate = totalCredit > 0 ? Math.min(100, Math.round((totalPaid / totalCredit) * 100)) : 100;

  // Recommendation text based on rating
  let recommendation = {
    title: 'High Trust Account',
    description: 'Strong history of timely repayments. Safe to extend credit under standard store terms.',
    border: 'border-emerald-200 dark:border-emerald-800/80',
    bg: 'bg-emerald-50/50 dark:bg-emerald-950/20',
    text: 'text-emerald-800 dark:text-emerald-300',
    icon: CheckCircle2,
  };

  if (isHighRisk || rating === 'HIGH_RISK' || score < 50) {
    recommendation = {
      title: 'High Credit Risk Account',
      description: daysOverdue >= 30
        ? `Customer has unpaid credit older than 30 days (${daysOverdue} days). We advise collecting pending dues before issuing further goods on credit.`
        : 'Payment history indicates inconsistent or delayed repayments. Limit additional credit.',
      border: 'border-rose-200 dark:border-rose-800/80',
      bg: 'bg-rose-50/60 dark:bg-rose-950/30',
      text: 'text-rose-800 dark:text-rose-300',
      icon: ShieldAlert,
    };
  } else if (rating === 'FAIR' || score < 70) {
    recommendation = {
      title: 'Moderate Trust Account',
      description: 'Customer occasionally carries pending balance. Keep outstanding dues within comfortable limits.',
      border: 'border-amber-200 dark:border-amber-800/80',
      bg: 'bg-amber-50/50 dark:bg-amber-950/20',
      text: 'text-amber-800 dark:text-amber-300',
      icon: AlertTriangle,
    };
  }

  const RecIcon = recommendation.icon;

  return (
    <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Customer Trust & Credit Risk Score
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              AI Algorithm
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluates repayment timeliness, credit-to-payment ratio, and account activity
          </p>
        </div>

        <TrustScoreBadge
          score={score}
          stars={stars}
          rating={rating}
          isHighRisk={isHighRisk}
          daysOverdue={daysOverdue}
          size="lg"
        />
      </div>

      {/* Metric Breakdown Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Trust Score
          </span>
          <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
            {score}<span className="text-xs font-normal text-slate-400">/100</span>
          </p>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">
            {stars} of 5 Star Rating
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Repayment Rate
          </span>
          <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
            {repaymentRate}%
          </p>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">
            {formatINR(totalPaid)} repaid of {formatINR(totalCredit)}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Account Activity
          </span>
          <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
            {customer.transactionCount || 0}
          </p>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">
            Total transactions logged
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Last Transaction
          </span>
          <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-1 truncate">
            {formatRelativeTime(customer.lastTransactionDate)}
          </p>
          <span className={`text-[10px] font-semibold ${isHighRisk ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>
            {daysOverdue > 0 ? `${daysOverdue} days since last txn` : 'Recent activity'}
          </span>
        </div>
      </div>

      {/* Recommendation Banner */}
      <div className={`p-3.5 rounded-2xl border ${recommendation.border} ${recommendation.bg} flex items-start gap-3`}>
        <RecIcon className={`w-4 h-4 mt-0.5 shrink-0 ${recommendation.text}`} />
        <div className="text-xs space-y-0.5">
          <p className={`font-bold ${recommendation.text}`}>
            {recommendation.title}
          </p>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            {recommendation.description}
          </p>
        </div>
      </div>
    </div>
  );
}
