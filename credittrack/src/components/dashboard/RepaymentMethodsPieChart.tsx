import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { PaymentMethodBreakdown } from '../../types';
import { formatINR } from '../../lib/formatters';
import { CreditCard, Wallet } from 'lucide-react';

interface RepaymentMethodsPieChartProps {
  data?: PaymentMethodBreakdown[];
}

const METHOD_COLORS: Record<string, string> = {
  Cash: '#10b981', // emerald
  UPI: '#3b82f6', // blue
  'Bank Transfer': '#8b5cf6', // purple
  Cheque: '#f59e0b', // amber
  Card: '#ec4899', // pink
  Other: '#64748b', // slate
};

export function RepaymentMethodsPieChart({ data = [] }: RepaymentMethodsPieChartProps) {
  // Filter out any zero amounts
  const validData = data.filter((d) => d.totalAmount > 0);
  const totalAmount = validData.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalCount = validData.reduce((acc, curr) => acc + curr.count, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const pct = totalAmount > 0 ? ((item.totalAmount / totalAmount) * 100).toFixed(1) : 0;
      return (
        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl text-xs space-y-1 min-w-[150px]">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: payload[0].fill }}
            />
            <span>{item.method}</span>
          </div>
          <p className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
            {formatINR(item.totalAmount)}
          </p>
          <p className="text-[11px] text-slate-400">
            {item.count} payments • {pct}% of collections
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Repayment Methods Breakdown
            </h3>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
            {totalCount} Payments Received
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Distribution of customer collections across payment channels
        </p>
      </div>

      {validData.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-2 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 my-auto">
          <Wallet className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            No payments received yet
          </p>
          <p className="text-[11px] text-slate-400 max-w-xs">
            As you record customer repayments via Cash, UPI, or Bank Transfer, the repayment method distribution will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={validData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="totalAmount"
                  nameKey="method"
                  isAnimationActive={true}
                  animationDuration={1000}
                  animationEasing="ease-out"
                >
                  {validData.map((entry, index) => {
                    const color =
                      METHOD_COLORS[entry.method] ||
                      METHOD_COLORS.Other ||
                      `hsl(${(index * 60) % 360}, 70%, 50%)`;
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 11, paddingTop: 6 }}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Method Summary Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            {validData.map((item) => {
              const color = METHOD_COLORS[item.method] || '#64748b';
              const pct = totalAmount > 0 ? Math.round((item.totalAmount / totalAmount) * 100) : 0;
              return (
                <div
                  key={item.method}
                  className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="truncate">{item.method}</span>
                    <span className="ml-auto text-[10px] text-slate-400">{pct}%</span>
                  </div>
                  <p className="font-extrabold text-slate-900 dark:text-white mt-1 text-xs sm:text-sm">
                    {formatINR(item.totalAmount)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
