import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import { MonthlyTrendData } from '../../types';
import { formatINR } from '../../lib/formatters';
import { TrendingUp, BarChart3, LineChart, Activity } from 'lucide-react';

interface CreditTrendChartProps {
  data?: MonthlyTrendData[];
}

export function CreditTrendChart({ data = [] }: CreditTrendChartProps) {
  const [chartType, setChartType] = useState<'LINE' | 'BAR' | 'AREA'>('LINE');

  // Check if there is actual non-zero activity
  const hasData = data.some((d) => (d.credit > 0 || d.payment > 0));

  const totalCredit = data.reduce((acc, curr) => acc + curr.credit, 0);
  const totalPayment = data.reduce((acc, curr) => acc + curr.payment, 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl text-xs space-y-1.5 min-w-[170px]">
          <p className="font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1">
            {label}
          </p>
          {payload.map((item: any) => (
            <div key={item.name} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 font-medium text-slate-500 dark:text-slate-400">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.name}:
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {formatINR(item.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Credit vs. Payment Growth Trend
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              Last 6 Months
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare monthly credit issued (Udhaar) vs. collections received (Jama)
          </p>
        </div>

        {/* Chart View Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setChartType('LINE')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              chartType === 'LINE'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Line Chart</span>
          </button>
          <button
            type="button"
            onClick={() => setChartType('BAR')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              chartType === 'BAR'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Bars</span>
          </button>
          <button
            type="button"
            onClick={() => setChartType('AREA')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              chartType === 'AREA'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <LineChart className="w-3.5 h-3.5" />
            <span>Trend Area</span>
          </button>
        </div>
      </div>

      {/* Mini Stats Summary Pill Bar */}
      <div className="flex flex-wrap items-center gap-4 text-xs pt-1 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span className="text-slate-500 dark:text-slate-400">Total Credit:</span>
          <span className="font-bold text-slate-900 dark:text-white">{formatINR(totalCredit)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-slate-500 dark:text-slate-400">Total Collected:</span>
          <span className="font-bold text-slate-900 dark:text-white">{formatINR(totalPayment)}</span>
        </div>
        <div className="flex items-center gap-1.5 sm:ml-auto">
          <span className="text-slate-500 dark:text-slate-400">Net Growth:</span>
          <span className={`font-bold ${totalCredit >= totalPayment ? 'text-rose-600' : 'text-emerald-600'}`}>
            {formatINR(totalCredit - totalPayment)}
          </span>
        </div>
      </div>

      {/* Chart Canvas */}
      {!hasData ? (
        <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-2 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
          <TrendingUp className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            No transaction trends recorded yet
          </p>
          <p className="text-[11px] text-slate-400 max-w-sm">
            Monthly credit vs. payment growth trends will automatically render here as you record credit and payments.
          </p>
        </div>
      ) : (
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'LINE' ? (
              <RechartsLineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: '#888888' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#888888' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${Math.round(val / 1000)}k` : val}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
                  iconType="circle"
                />
                <Line
                  type="monotone"
                  dataKey="credit"
                  name="Credit Given (Udhaar)"
                  stroke="#f43f5e"
                  strokeWidth={3}
                  isAnimationActive={true}
                  animationDuration={1000}
                  animationEasing="ease-out"
                  dot={{ r: 4, fill: '#f43f5e', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="payment"
                  name="Payment Received (Jama)"
                  stroke="#10b981"
                  strokeWidth={3}
                  isAnimationActive={true}
                  animationDuration={1000}
                  animationEasing="ease-out"
                  dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
              </RechartsLineChart>
            ) : chartType === 'BAR' ? (
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: '#888888' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#888888' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${Math.round(val / 1000)}k` : val}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
                  iconType="circle"
                />
                <Bar
                  dataKey="credit"
                  name="Credit Given (Udhaar)"
                  fill="#f43f5e"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={38}
                  isAnimationActive={true}
                  animationDuration={900}
                />
                <Bar
                  dataKey="payment"
                  name="Payment Received (Jama)"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={38}
                  isAnimationActive={true}
                  animationDuration={900}
                />
              </BarChart>
            ) : (
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCredit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPayment" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: '#888888' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#888888' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${Math.round(val / 1000)}k` : val}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
                  iconType="circle"
                />
                <Area
                  type="monotone"
                  dataKey="credit"
                  name="Credit Given (Udhaar)"
                  stroke="#f43f5e"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorCredit)"
                  isAnimationActive={true}
                  animationDuration={900}
                />
                <Area
                  type="monotone"
                  dataKey="payment"
                  name="Payment Received (Jama)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorPayment)"
                  isAnimationActive={true}
                  animationDuration={900}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
