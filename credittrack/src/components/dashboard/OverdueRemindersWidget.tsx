import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Bell,
  MessageCircle,
  Smartphone,
  ChevronRight,
  Clock,
  Send,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { api } from '../../lib/api';
import { formatINR, formatPhone } from '../../lib/formatters';
import { OverdueOverviewResponse, OverdueCustomerReport } from '../../types';
import { TrustScoreBadge } from '../customer/TrustScoreBadge';

interface OverdueRemindersWidgetProps {
  onOpenRemindersModal: () => void;
  onOpenCustomerDetail?: (customerId: string) => void;
}

export function OverdueRemindersWidget({
  onOpenRemindersModal,
  onOpenCustomerDetail,
}: OverdueRemindersWidgetProps) {
  const [data, setData] = useState<OverdueOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api.reminders
      .getOverdue(15)
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error fetching overdue data for widget:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleQuickSend = async (e: React.MouseEvent, item: OverdueCustomerReport, channel: 'WHATSAPP' | 'SMS') => {
    e.stopPropagation();
    try {
      const res = await api.reminders.sendReminder({
        customerId: item.customer.id,
        channel,
      });
      const url = channel === 'WHATSAPP' ? res.whatsappUrl : res.smsUrl;
      window.open(url, '_blank');
      // Refresh
      const updated = await api.reminders.getOverdue(15);
      setData(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch reminder');
    }
  };

  if (loading) {
    return (
      <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs animate-pulse h-36" />
    );
  }

  // If no overdue customers
  if (!data || data.overdueCount === 0) {
    return (
      <div className="p-5 bg-linear-to-br from-emerald-50/60 to-teal-50/40 dark:from-emerald-950/20 dark:to-slate-900 rounded-3xl border border-emerald-100 dark:border-emerald-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Zero Overdue Dues (&gt; 15 Days)
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              All active customer credit accounts are healthy and within standard terms.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenRemindersModal}
          className="px-3.5 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 rounded-xl border border-emerald-200 dark:border-emerald-800/80 transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shrink-0 shadow-xs"
        >
          <Bell className="w-3.5 h-3.5 text-emerald-600" />
          <span>Reminders Center</span>
        </button>
      </div>
    );
  }

  const topOverdue = data.customers.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 sm:p-6 bg-linear-to-br from-amber-500/10 via-white to-red-500/5 dark:from-amber-950/25 dark:via-slate-900 dark:to-slate-900 rounded-3xl border border-amber-300/80 dark:border-amber-800/50 shadow-md space-y-4"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 dark:bg-amber-500/25 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30 shadow-xs">
            <Bell className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                Overdue Payment Reminders
              </h3>
              <span className="text-[10px] px-2 py-0.5 font-bold uppercase rounded-full bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300 border border-red-200 dark:border-red-800">
                {data.overdueCount} Overdue (&gt; {data.thresholdDays}d)
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Total <strong className="text-red-600 dark:text-red-400">{formatINR(data.totalOverdueAmount)}</strong> unpaid past {data.thresholdDays} days across {data.overdueCount} customer(s).
            </p>
          </div>
        </div>

        <button
          id="open-reminders-center-btn"
          type="button"
          onClick={onOpenRemindersModal}
          className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Automate All ({data.eligibleCount})</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Top Overdue Customers Preview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
        {topOverdue.map((item) => (
          <div
            key={item.customer.id}
            onClick={() => onOpenCustomerDetail?.(item.customer.id)}
            className="p-3.5 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-600 transition-all shadow-xs flex flex-col justify-between cursor-pointer group"
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-amber-600 transition-colors">
                  {item.customer.name}
                </span>
                <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-1.5 py-0.5 rounded">
                  {item.daysUnpaid}d unpaid
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>{formatPhone(item.customer.phone)}</span>
                <span className="font-black text-slate-900 dark:text-white">
                  {formatINR(item.customer.outstandingBalance)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60">
              <button
                type="button"
                onClick={(e) => handleQuickSend(e, item, 'WHATSAPP')}
                className="flex-1 py-1.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer border border-emerald-200 dark:border-emerald-800"
                title="Send WhatsApp"
              >
                <MessageCircle className="w-3 h-3" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={(e) => handleQuickSend(e, item, 'SMS')}
                className="flex-1 py-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                title="Send SMS"
              >
                <Smartphone className="w-3 h-3" />
                <span>SMS</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {data.customers.length > 3 && (
        <div className="flex justify-between items-center pt-1 text-xs text-slate-500 dark:text-slate-400">
          <span>+ {data.customers.length - 3} more customers pending reminders</span>
          <button
            type="button"
            onClick={onOpenRemindersModal}
            className="font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            <span>View all overdue accounts</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </motion.div>
  );
}
