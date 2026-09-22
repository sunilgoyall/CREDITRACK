import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { DashboardStats, Customer } from '../types';
import { api } from '../lib/api';
import { CreditTrendChart } from '../components/dashboard/CreditTrendChart';
import { RepaymentMethodsPieChart } from '../components/dashboard/RepaymentMethodsPieChart';
import { HighRiskCustomersList } from '../components/dashboard/HighRiskCustomersList';
import { OverdueRemindersWidget } from '../components/dashboard/OverdueRemindersWidget';
import { AnimatedCounter } from '../components/common/AnimatedCounter';
import { formatINR, formatDate, formatRelativeTime } from '../lib/formatters';
import {
  IndianRupee,
  Users,
  ArrowUpRight,
  ArrowDownLeft,
  MessageCircle,
  Smartphone,
  Plus,
  RefreshCw,
  Sparkles,
  ChevronRight,
  TrendingDown,
  AlertCircle,
  Receipt,
  Bell,
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (view: string) => void;
  onOpenCreditModal: () => void;
  onOpenPaymentModal: () => void;
  onOpenAddCustomerModal: () => void;
  onOpenWhatsAppModal: (customer: Customer, channel?: 'WHATSAPP' | 'SMS') => void;
  onOpenRemindersModal: () => void;
}

export function DashboardPage({
  onNavigate,
  onOpenCreditModal,
  onOpenPaymentModal,
  onOpenAddCustomerModal,
  onOpenWhatsAppModal,
  onOpenRemindersModal,
}: DashboardPageProps) {
  const { business } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await api.dashboard.getStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard statistics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (isLoading && !stats) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner / Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {business?.business_name || 'My Store Dashboard'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Digital Bahi-Khata & Customer Credit Overview
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchStats}
            className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
            title="Refresh ledger data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            id="dashboard-header-add-customer-btn"
            type="button"
            onClick={onOpenAddCustomerModal}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs font-medium text-red-700 dark:text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 4 Core Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Outstanding Balance */}
        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="p-5 rounded-3xl bg-gradient-to-br from-red-600 via-rose-600 to-red-700 text-white shadow-md hover:shadow-lg hover:shadow-rose-600/20 space-y-2 transition-shadow"
        >
          <div className="flex items-center justify-between text-red-100 text-xs font-bold uppercase tracking-wider">
            <span>Total Outstanding</span>
            <IndianRupee className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black">
            <AnimatedCounter value={stats?.totalOutstanding || 0} isCurrency={true} />
          </div>
          <p className="text-xs text-red-100 font-medium pt-1">
            Udhaar to collect from {stats?.activeAccounts || 0} customers
          </p>
        </motion.div>

        {/* Total Credit Given */}
        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs hover:shadow-md hover:border-red-200 dark:hover:border-red-900/50 transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Total Credit Given</span>
            <div className="p-1 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            <AnimatedCounter value={stats?.totalCreditGiven || 0} isCurrency={true} />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Cumulative goods provided on credit
          </p>
        </motion.div>

        {/* Total Payments Received */}
        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-900/50 transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Payments Received</span>
            <div className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <ArrowDownLeft className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            <AnimatedCounter value={stats?.totalPaymentsReceived || 0} isCurrency={true} />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Repayments (Jama) collected to date
          </p>
        </motion.div>

        {/* Customers Count */}
        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-900/50 transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Total Customers</span>
            <div className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            <AnimatedCounter value={stats?.totalCustomers || 0} />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {stats?.settledAccounts || 0} fully settled accounts
          </p>
        </motion.div>
      </div>

      {/* Clean Slate Onboarding Banner when no customers exist yet */}
      {stats?.totalCustomers === 0 && (
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm sm:text-base font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Store Ledger Clean & Ready
            </h3>
            <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 max-w-xl leading-relaxed">
              No sample or demo records are loaded. All text fields and ledgers start completely empty for your actual store accounts.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={onOpenAddCustomerModal}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer text-center"
            >
              + Add First Customer
            </button>
            <button
              type="button"
              onClick={onOpenCreditModal}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer text-center"
            >
              + Record Credit
            </button>
          </div>
        </div>
      )}

      {/* Overdue Payment Reminders Automated Alert Widget */}
      <OverdueRemindersWidget
        onOpenRemindersModal={onOpenRemindersModal}
        onOpenCustomerDetail={(id) => onNavigate(`customer-${id}`)}
      />

      {/* Quick Action Shortcuts Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Quick Counter Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <motion.button
            id="quick-give-credit-btn"
            type="button"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            onClick={onOpenCreditModal}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/40 text-red-700 dark:text-red-300 font-bold text-xs sm:text-sm border border-red-200 dark:border-red-900/60 transition-colors cursor-pointer shadow-2xs"
          >
            <ArrowUpRight className="w-4 h-4 text-red-600" />
            <span>Give Credit (+ Udhaar)</span>
          </motion.button>

          <motion.button
            id="quick-receive-payment-btn"
            type="button"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            onClick={onOpenPaymentModal}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs sm:text-sm border border-emerald-200 dark:border-emerald-900/60 transition-colors cursor-pointer shadow-2xs"
          >
            <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
            <span>Receive Payment (- Jama)</span>
          </motion.button>

          <motion.button
            id="quick-automate-reminders-btn"
            type="button"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            onClick={onOpenRemindersModal}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-bold text-xs sm:text-sm border border-amber-200 dark:border-amber-800/80 transition-colors cursor-pointer shadow-2xs"
          >
            <Bell className="w-4 h-4 text-amber-600 animate-pulse" />
            <span>Reminders Center</span>
          </motion.button>

          <motion.button
            id="quick-add-customer-btn"
            type="button"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            onClick={onOpenAddCustomerModal}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shadow-2xs"
          >
            <Plus className="w-4 h-4 text-slate-500" />
            <span>Add Customer</span>
          </motion.button>

          <motion.button
            id="quick-view-ledger-btn"
            type="button"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onNavigate('transactions')}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shadow-2xs"
          >
            <Receipt className="w-4 h-4 text-slate-500" />
            <span>All Transactions</span>
          </motion.button>
        </div>
      </div>

      {/* Interactive Visual Analytics: Monthly Trends Line/Bar + Repayment Methods Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CreditTrendChart data={stats?.monthlyTrends || []} />
        </div>
        <div className="lg:col-span-1">
          <RepaymentMethodsPieChart data={stats?.paymentMethodsBreakdown || []} />
        </div>
      </div>

      {/* High-Risk Customers List (Dues older than 30 days) */}
      <HighRiskCustomersList
        customers={stats?.highRiskCustomers || []}
        onNavigate={onNavigate}
        onOpenWhatsAppModal={onOpenWhatsAppModal}
        onOpenRemindersModal={onOpenRemindersModal}
        businessId={business?.id || ''}
      />

      {/* 2-Column Section: Top Debtors & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Highest Outstanding Balances (Top Debtors) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Highest Outstanding Balances</h3>
              <p className="text-xs text-slate-400">Customers with pending credit</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('customers')}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {stats?.topDebtors && stats.topDebtors.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {stats.topDebtors.map((debtor) => (
                <div key={debtor.id} className="py-3 flex items-center justify-between gap-3">
                  <div
                    onClick={() => onNavigate(`customer-${debtor.id}`)}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{debtor.name}</p>
                    <p className="text-[11px] text-slate-400">{debtor.phone}</p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="text-right">
                      <span className="text-xs sm:text-sm font-black text-red-600 dark:text-red-400 block">
                        {formatINR(debtor.outstandingBalance)}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {formatRelativeTime(debtor.lastTransactionDate)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenWhatsAppModal({
                        id: debtor.id,
                        business_id: business?.id || '',
                        name: debtor.name,
                        phone: debtor.phone,
                        created_at: '',
                        updated_at: '',
                        totalCredit: 0,
                        totalPaid: 0,
                        outstandingBalance: debtor.outstandingBalance,
                        transactionCount: 0,
                      })}
                      className="p-2 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 rounded-xl border border-emerald-200 dark:border-emerald-800/80 transition-colors cursor-pointer"
                      title="Send WhatsApp payment reminder"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              No outstanding customer balances right now. Excellent!
            </div>
          )}
        </div>

        {/* Recent Ledger Transactions */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Transactions</h3>
              <p className="text-xs text-slate-400">Latest credit & repayments</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('transactions')}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Full Ledger</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {stats.recentTransactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                        tx.type === 'CREDIT'
                          ? 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400'
                          : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {tx.type === 'CREDIT' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{tx.customerName}</p>
                      <p className="text-[11px] text-slate-400 truncate max-w-[160px] sm:max-w-xs">
                        {tx.description || (tx.type === 'CREDIT' ? 'Credit udhaar' : `Payment (${tx.payment_method || 'Cash'})`)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-xs sm:text-sm font-black block ${
                        tx.type === 'CREDIT' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {tx.type === 'CREDIT' ? '+' : '-'}{formatINR(tx.amount)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">{formatDate(tx.transaction_date)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              No transactions recorded yet. Click "+ Add Transaction" to start.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
