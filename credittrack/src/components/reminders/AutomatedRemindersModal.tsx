import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Bell,
  MessageCircle,
  Smartphone,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Send,
  Sliders,
  History,
  Users,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';
import { api } from '../../lib/api';
import { formatINR, formatPhone, formatRelativeTime } from '../../lib/formatters';
import {
  OverdueOverviewResponse,
  OverdueCustomerReport,
  ReminderLog,
  ReminderSettings,
  ReminderChannel,
} from '../../types';
import { TrustScoreBadge } from '../customer/TrustScoreBadge';

interface AutomatedRemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCustomerDetail?: (customerId: string) => void;
  initialThreshold?: number;
}

export function AutomatedRemindersModal({
  isOpen,
  onClose,
  onOpenCustomerDetail,
  initialThreshold = 15,
}: AutomatedRemindersModalProps) {
  const [activeTab, setActiveTab] = useState<'queue' | 'history' | 'rules'>('queue');
  const [thresholdDays, setThresholdDays] = useState<number>(initialThreshold);
  const [isLoading, setIsLoading] = useState(true);
  const [report, setReport] = useState<OverdueOverviewResponse | null>(null);
  const [logs, setLogs] = useState<ReminderLog[]>([]);
  const [isSendingBatch, setIsSendingBatch] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<'WHATSAPP' | 'SMS'>('WHATSAPP');
  const [selectedLang, setSelectedLang] = useState<'en' | 'hi'>('en');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [previewCustomer, setPreviewCustomer] = useState<OverdueCustomerReport | null>(null);
  const [customDraft, setCustomDraft] = useState('');
  const [copiedText, setCopiedText] = useState(false);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState<Partial<ReminderSettings>>({});
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const fetchOverdueData = async (threshold?: number) => {
    setIsLoading(true);
    try {
      const data = await api.reminders.getOverdue(threshold ?? thresholdDays);
      setReport(data);
      setLogs(data.recentLogs || []);
      setSettingsForm(data.settings);
      if (data.settings.preferred_channel === 'SMS') {
        setSelectedChannel('SMS');
      } else {
        setSelectedChannel('WHATSAPP');
      }
    } catch (err: any) {
      console.error('Failed to load overdue report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchOverdueData(thresholdDays);
    }
  }, [isOpen, thresholdDays]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleSendSingle = async (customerReport: OverdueCustomerReport, channel: 'WHATSAPP' | 'SMS') => {
    try {
      const res = await api.reminders.sendReminder({
        customerId: customerReport.customer.id,
        channel,
        lang: selectedLang,
        customMessage: customDraft.trim() || undefined,
      });

      // Launch link
      const targetUrl = channel === 'WHATSAPP' ? res.whatsappUrl : res.smsUrl;
      window.open(targetUrl, '_blank');

      showToast(`Reminder logged & sent to ${customerReport.customer.name} via ${channel}!`);
      setPreviewCustomer(null);
      setCustomDraft('');
      // Refresh list to update cooldown & logs
      fetchOverdueData();
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch payment reminder.');
    }
  };

  const handleBatchSend = async () => {
    if (!report || report.eligibleCount === 0) return;

    const confirmMsg = `Send automated payment reminders to ${report.eligibleCount} overdue customers (total ₹${report.totalOverdueAmount.toLocaleString('en-IN')}) via ${selectedChannel}?`;
    if (!window.confirm(confirmMsg)) return;

    setIsSendingBatch(true);
    try {
      const res = await api.reminders.sendBatch({
        thresholdDays,
        channel: selectedChannel,
        lang: selectedLang,
      });

      showToast(`Successfully prepared & logged reminders for ${res.dispatched} overdue customers!`);

      // If single or small batch, open first one
      if (res.results && res.results.length > 0) {
        const first = res.results[0];
        const url = selectedChannel === 'WHATSAPP' ? first.whatsappUrl : first.smsUrl;
        window.open(url, '_blank');
      }

      fetchOverdueData();
    } catch (err: any) {
      alert(err.message || 'Failed to process batch reminders.');
    } finally {
      setIsSendingBatch(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const updated = await api.reminders.updateSettings(settingsForm);
      setSettingsForm(updated);
      showToast('Automation reminder settings updated successfully!');
      fetchOverdueData(updated.threshold_days);
    } catch (err: any) {
      alert(err.message || 'Could not update reminder settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="automated-reminders-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.22 }}
        className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 bg-linear-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-xs">
              <Bell className="w-5 h-5 text-emerald-100 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight">Automated Payment Reminders</h2>
                <span className="text-[11px] px-2 py-0.5 font-bold uppercase rounded-full bg-white/20 border border-white/25 text-emerald-50">
                  Khata Engine
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Target overdue customer balances based on days unpaid using transaction history
              </p>
            </div>
          </div>

          <button
            id="close-automated-reminders-modal-btn"
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toast Alert */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-emerald-50 dark:bg-emerald-950/60 border-b border-emerald-200 dark:border-emerald-800 px-4 py-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{toastMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setToastMessage(null)}
                className="text-emerald-600 hover:text-emerald-800 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Navigation */}
        <div className="px-4 sm:px-6 pt-3 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0 overflow-x-auto gap-4">
          <div className="flex items-center gap-2">
            <button
              id="tab-overdue-queue"
              type="button"
              onClick={() => setActiveTab('queue')}
              className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'queue'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Overdue Accounts ({report?.overdueCount ?? 0})</span>
            </button>

            <button
              id="tab-reminder-history"
              type="button"
              onClick={() => setActiveTab('history')}
              className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'history'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Reminder History ({logs.length})</span>
            </button>

            <button
              id="tab-reminder-rules"
              type="button"
              onClick={() => setActiveTab('rules')}
              className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'rules'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Automation Rules & Templates</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => fetchOverdueData()}
            disabled={isLoading}
            className="pb-3 text-xs text-slate-500 hover:text-emerald-600 flex items-center gap-1 cursor-pointer disabled:opacity-50"
            title="Refresh list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: OVERDUE QUEUE */}
          {activeTab === 'queue' && (
            <div className="space-y-6">
              {/* Threshold Selector & Metrics Banner */}
              <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Overdue Threshold Filter:
                    </label>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {[7, 15, 30, 45, 60].map((days) => (
                        <button
                          key={days}
                          type="button"
                          onClick={() => setThresholdDays(days)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                            thresholdDays === days
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-600'
                          }`}
                        >
                          &gt; {days} Days {days === 15 && '⭐'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Channel Selector */}
                    <div className="flex items-center p-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setSelectedChannel('WHATSAPP')}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                          selectedChannel === 'WHATSAPP'
                            ? 'bg-emerald-600 text-white'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedChannel('SMS')}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                          selectedChannel === 'SMS'
                            ? 'bg-emerald-600 text-white'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>SMS</span>
                      </button>
                    </div>

                    {/* Language Selector */}
                    <div className="flex items-center p-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setSelectedLang('en')}
                        className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                          selectedLang === 'en'
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        English
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedLang('hi')}
                        className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                          selectedLang === 'hi'
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        हिंदी
                      </button>
                    </div>
                  </div>
                </div>

                {/* Overdue Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Overdue Customers
                    </span>
                    <span className="text-lg font-black text-slate-900 dark:text-white mt-0.5 block">
                      {report?.overdueCount ?? 0}
                    </span>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Total Overdue Balance
                    </span>
                    <span className="text-lg font-black text-red-600 dark:text-red-400 mt-0.5 block">
                      {formatINR(report?.totalOverdueAmount ?? 0)}
                    </span>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Ready to Remind
                    </span>
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                      {report?.eligibleCount ?? 0}
                    </span>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Current Threshold
                    </span>
                    <span className="text-lg font-black text-slate-700 dark:text-slate-300 mt-0.5 block">
                      &gt; {thresholdDays} Days
                    </span>
                  </div>
                </div>

                {/* Batch Action Banner */}
                {report && report.eligibleCount > 0 && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-emerald-100/60 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                    <div className="flex items-center gap-2 text-xs text-emerald-900 dark:text-emerald-200">
                      <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        <strong>{report.eligibleCount}</strong> accounts have exceeded the {thresholdDays}-day overdue threshold and are eligible for reminders.
                      </span>
                    </div>

                    <button
                      id="batch-send-overdue-reminders-btn"
                      type="button"
                      onClick={handleBatchSend}
                      disabled={isSendingBatch}
                      className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>
                        {isSendingBatch
                          ? 'Dispatching Reminders...'
                          : `Automate & Remind All (${report.eligibleCount})`}
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* Customer Overdue List */}
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-20 bg-slate-100 dark:bg-slate-800/60 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : !report || report.customers.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-slate-200/80 dark:border-slate-800">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    No customers overdue &gt; {thresholdDays} days!
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    All customer accounts with outstanding dues are within their grace period. Try switching the threshold filter or check again later.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
                    <span>Overdue Customers ({report.customers.length})</span>
                    <span>Sorted by oldest unpaid balance</span>
                  </div>

                  {report.customers.map((item) => {
                    const isCooldown = !item.isEligible && item.isOverdue;
                    return (
                      <div
                        key={item.customer.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          item.isEligible
                            ? 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700/60 shadow-xs'
                            : 'bg-slate-50/80 dark:bg-slate-850 border-slate-200/60 dark:border-slate-800/60 opacity-90'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          {/* Left: Customer Info */}
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-black text-slate-700 dark:text-slate-300 shrink-0">
                              {item.customer.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4
                                  onClick={() => onOpenCustomerDetail?.(item.customer.id)}
                                  className="text-sm font-bold text-slate-900 dark:text-white hover:text-emerald-600 transition-colors cursor-pointer"
                                >
                                  {item.customer.name}
                                </h4>
                                <TrustScoreBadge
                                  score={item.customer.trustScore}
                                  stars={item.customer.trustStars}
                                  rating={item.customer.trustRating}
                                  isHighRisk={item.customer.isHighRisk}
                                  size="sm"
                                />
                              </div>

                              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                                <span>{formatPhone(item.customer.phone)}</span>
                                <span>•</span>
                                <span className="font-semibold text-red-600 dark:text-red-400">
                                  {item.daysUnpaid} days unpaid
                                </span>
                                {item.oldestUnpaidDate && (
                                  <>
                                    <span>•</span>
                                    <span>Since {new Date(item.oldestUnpaidDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Center / Right: Balance & Actions */}
                          <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                            <div className="text-left sm:text-right">
                              <span className="text-base font-black text-red-600 dark:text-red-400 block">
                                {formatINR(item.customer.outstandingBalance)}
                              </span>
                              <span className="text-[10px] text-slate-400 block">
                                {item.lastReminderSent ? (
                                  `Reminded ${formatRelativeTime(item.lastReminderSent)}`
                                ) : (
                                  'Never reminded'
                                )}
                              </span>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1.5">
                              {/* WhatsApp Direct */}
                              <button
                                type="button"
                                onClick={() => handleSendSingle(item, 'WHATSAPP')}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 rounded-xl border border-emerald-300 dark:border-emerald-800 transition-colors cursor-pointer"
                                title="Send WhatsApp reminder"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">WhatsApp</span>
                              </button>

                              {/* SMS Direct */}
                              <button
                                type="button"
                                onClick={() => handleSendSingle(item, 'SMS')}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                                title="Send SMS reminder"
                              >
                                <Smartphone className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">SMS</span>
                              </button>

                              {/* Preview / Edit message */}
                              <button
                                type="button"
                                onClick={() => {
                                  setPreviewCustomer(item);
                                  setCustomDraft(selectedLang === 'hi' ? item.reminderMessageHi : item.reminderMessageEn);
                                }}
                                className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                                title="Preview & Customize message"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Cooldown notice if applicable */}
                        {isCooldown && (
                          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-400">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              Cooldown active: Reminded {item.daysSinceLastReminder ?? 0} day(s) ago (rule: min {report?.settings.cooldown_days || 3} days cooldown). You can still send manually above.
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: REMINDER HISTORY / AUDIT LOG */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Reminder History & Audit Log</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Track all automated and manual reminder messages dispatched to customers
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300">
                  {logs.length} logged dispatches
                </span>
              </div>

              {logs.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-slate-200/80 dark:border-slate-800">
                  <History className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">No reminders sent yet</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    When you send WhatsApp or SMS payment reminders to overdue accounts, they will appear here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
                  {logs.map((log) => (
                    <div key={log.id} className="p-3.5 sm:p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                              log.channel === 'WHATSAPP'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            }`}
                          >
                            {log.channel === 'WHATSAPP' ? (
                              <MessageCircle className="w-3.5 h-3.5" />
                            ) : (
                              <Smartphone className="w-3.5 h-3.5" />
                            )}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                                {log.customer_name}
                              </span>
                              <span className="text-[10px] text-slate-400">({log.customer_phone})</span>
                            </div>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              Dispatched {formatRelativeTime(log.sent_at)} • Unpaid: {log.days_overdue} days
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs sm:text-sm font-black text-red-600 dark:text-red-400 block">
                            {formatINR(log.amount)}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                            {log.status}
                          </span>
                        </div>
                      </div>

                      {log.message_preview && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-100 dark:border-slate-800 italic">
                          &ldquo;{log.message_preview}...&rdquo;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AUTOMATION RULES & SETTINGS */}
          {activeTab === 'rules' && (
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-700/80">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Threshold & Delivery Configuration</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Configure when customer dues are flagged as overdue and how reminders are sent
                    </p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsForm.enabled ?? true}
                      onChange={(e) => setSettingsForm({ ...settingsForm, enabled: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Enable Reminders</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Overdue Threshold */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Overdue Threshold (Days)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={settingsForm.threshold_days ?? 15}
                      onChange={(e) => setSettingsForm({ ...settingsForm, threshold_days: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Flag balance as overdue if unpaid for more than this many days (e.g. 15).
                    </p>
                  </div>

                  {/* Preferred Channel */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Default Delivery Channel
                    </label>
                    <select
                      value={settingsForm.preferred_channel ?? 'WHATSAPP'}
                      onChange={(e) => setSettingsForm({ ...settingsForm, preferred_channel: e.target.value as ReminderChannel })}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="WHATSAPP">WhatsApp (Direct Link)</option>
                      <option value="SMS">SMS Text Message</option>
                      <option value="BOTH">Both (Choice in UI)</option>
                    </select>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Default message medium selected during batch reminders.
                    </p>
                  </div>

                  {/* Cooldown Days */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Reminder Cooldown (Days)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={60}
                      value={settingsForm.cooldown_days ?? 3}
                      onChange={(e) => setSettingsForm({ ...settingsForm, cooldown_days: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Minimum buffer before re-reminding the same customer.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsForm.include_upi ?? true}
                      onChange={(e) => setSettingsForm({ ...settingsForm, include_upi: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Include Store UPI ID in reminder messages for instant payments
                    </span>
                  </label>
                </div>
              </div>

              {/* Message Templates */}
              <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Customizable Message Templates</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Placeholders: <code className="text-emerald-600">&#123;customerName&#125;</code>, <code className="text-emerald-600">&#123;amount&#125;</code>, <code className="text-emerald-600">&#123;daysOverdue&#125;</code>, <code className="text-emerald-600">&#123;storeName&#125;</code>, <code className="text-emerald-600">&#123;upiInfo&#125;</code>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      English Reminder Template
                    </label>
                    <textarea
                      rows={5}
                      value={settingsForm.message_template_en ?? ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, message_template_en: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Hindi (हिंदी) Reminder Template
                    </label>
                    <textarea
                      rows={5}
                      value={settingsForm.message_template_hi ?? ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, message_template_hi: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    id="save-reminder-rules-btn"
                    type="submit"
                    disabled={isSavingSettings}
                    className="px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSavingSettings ? 'Saving...' : 'Save Automation Rules'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            Automated thresholds calculated live from customer debit/credit transactions
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200 dark:border-slate-600 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>

      {/* Message Preview & Customization Drawer/Modal */}
      {previewCustomer && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Preview & Send Reminder to {previewCustomer.customer.name}
                </h3>
                <p className="text-xs text-slate-400">
                  {formatINR(previewCustomer.customer.outstandingBalance)} • {previewCustomer.daysUnpaid} days overdue
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewCustomer(null)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Message Text:
              </label>
              <textarea
                rows={6}
                value={customDraft}
                onChange={(e) => setCustomDraft(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(customDraft);
                  setCopiedText(true);
                  setTimeout(() => setCopiedText(false), 2000);
                }}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedText ? 'Copied!' : 'Copy Text'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSendSingle(previewCustomer, 'SMS')}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Send SMS</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSendSingle(previewCustomer, 'WHATSAPP')}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Send WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
