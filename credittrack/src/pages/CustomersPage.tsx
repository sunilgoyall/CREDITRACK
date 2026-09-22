import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Customer, TransactionType } from '../types';
import { api } from '../lib/api';
import { formatINR, formatPhone, formatRelativeTime } from '../lib/formatters';
import {
  Search,
  UserPlus,
  Download,
  Filter,
  ArrowUpDown,
  Phone,
  MessageCircle,
  Smartphone,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  FileText,
  Users,
  AlertCircle,
  Bell,
} from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { TrustScoreBadge } from '../components/customer/TrustScoreBadge';

interface CustomersPageProps {
  onNavigate: (view: string) => void;
  onOpenAddCustomerModal: () => void;
  onOpenTransactionModal: (customerId: string, type: TransactionType) => void;
  onOpenWhatsAppModal: (customer: Customer, channel?: 'WHATSAPP' | 'SMS') => void;
  onOpenRemindersModal?: () => void;
}

export function CustomersPage({
  onNavigate,
  onOpenAddCustomerModal,
  onOpenTransactionModal,
  onOpenWhatsAppModal,
  onOpenRemindersModal,
}: CustomersPageProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'outstanding' | 'settled'>('all');
  const [sortBy, setSortBy] = useState<'balance_desc' | 'balance_asc' | 'name_asc' | 'recent'>('balance_desc');
  const [error, setError] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const fetchCustomers = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await api.customers.getAll({
        search: search.trim() || undefined,
        filter,
        sortBy,
      });
      setCustomers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load customer records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 200);
    return () => clearTimeout(timer);
  }, [search, filter, sortBy]);

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      await api.export.downloadCustomersCSV();
    } catch (err: any) {
      alert(err.message || 'Could not export customer CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const totalOutstanding = customers.reduce((acc, c) => acc + c.outstandingBalance, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Customer Khata Accounts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {customers.length} customer records • Total Outstanding:{' '}
            <strong className="text-red-600 dark:text-red-400">{formatINR(totalOutstanding)}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onOpenRemindersModal && (
            <button
              id="customers-open-reminders-btn"
              type="button"
              onClick={onOpenRemindersModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800/70 rounded-xl transition-colors cursor-pointer shadow-2xs"
            >
              <Bell className="w-3.5 h-3.5 text-amber-600" />
              <span>Reminders Center</span>
            </button>
          )}

          <button
            id="export-customers-csv-btn"
            type="button"
            onClick={handleExportCSV}
            disabled={isExporting || customers.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>

          <button
            id="customers-add-new-btn"
            type="button"
            onClick={onOpenAddCustomerModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add Customer</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs font-medium text-red-700 dark:text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search, Filter & Sort Controls */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search bar */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="customer-search-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer name or phone number..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Filter tabs */}
          <div className="sm:col-span-4 flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`flex-1 py-1.5 px-2 rounded-lg transition-colors cursor-pointer text-center ${
                filter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilter('outstanding')}
              className={`flex-1 py-1.5 px-2 rounded-lg transition-colors cursor-pointer text-center ${
                filter === 'outstanding'
                  ? 'bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Pending Udhaar
            </button>
            <button
              type="button"
              onClick={() => setFilter('settled')}
              className={`flex-1 py-1.5 px-2 rounded-lg transition-colors cursor-pointer text-center ${
                filter === 'settled'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Settled (₹0)
            </button>
          </div>

          {/* Sort dropdown */}
          <div className="sm:col-span-2">
            <select
              id="customer-sort-dropdown"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="balance_desc">Highest Balance</option>
              <option value="balance_asc">Lowest Balance</option>
              <option value="name_asc">Name (A to Z)</option>
              <option value="recent">Recently Added</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customer List Display */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="h-16 bg-white dark:bg-slate-900 rounded-2xl animate-pulse border border-slate-100 dark:border-slate-800" />
          ))}
        </div>
      ) : customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? 'No customers match your search' : 'No customers in your ledger yet'}
          description={
            search
              ? 'Try searching with a different name or mobile number'
              : 'Add your first customer to start tracking credit and repayments digitally.'
          }
          actionLabel={search ? 'Clear Search' : '+ Add First Customer'}
          onAction={search ? () => setSearch('') : onOpenAddCustomerModal}
        />
      ) : (
        <div className="space-y-3">
          {/* Desktop Table View (Hidden on mobile) */}
          <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Contact</th>
                  <th className="px-4 py-3.5">Trust Score</th>
                  <th className="px-4 py-3.5 text-right">Total Credit</th>
                  <th className="px-4 py-3.5 text-right">Total Paid</th>
                  <th className="px-4 py-3.5 text-right">Outstanding Balance</th>
                  <th className="px-5 py-3.5 text-center">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {customers.map((c, index) => (
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.4) }}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td
                      onClick={() => onNavigate(`customer-${c.id}`)}
                      className="px-5 py-3.5 cursor-pointer font-bold text-slate-900 dark:text-white"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">{c.name}</p>
                          {c.address && <p className="text-[11px] font-normal text-slate-400 truncate max-w-xs">{c.address}</p>}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatPhone(c.phone)}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <TrustScoreBadge
                        score={c.trustScore}
                        stars={c.trustStars}
                        rating={c.trustRating}
                        isHighRisk={c.isHighRisk}
                        daysOverdue={c.daysOverdue}
                        size="sm"
                      />
                    </td>

                    <td className="px-4 py-3.5 text-right font-medium text-slate-600 dark:text-slate-300">
                      {formatINR(c.totalCredit)}
                    </td>

                    <td className="px-4 py-3.5 text-right font-medium text-emerald-600 dark:text-emerald-400">
                      {formatINR(c.totalPaid)}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <span
                        className={`font-black text-sm block ${
                          c.outstandingBalance > 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {formatINR(c.outstandingBalance)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {c.transactionCount} txns • {formatRelativeTime(c.lastTransactionDate)}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => onOpenTransactionModal(c.id, 'CREDIT')}
                          className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Give Credit (+ Udhaar)"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </motion.button>

                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => onOpenTransactionModal(c.id, 'PAYMENT')}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Receive Payment (- Jama)"
                        >
                          <ArrowDownLeft className="w-4 h-4" />
                        </motion.button>

                        {c.outstandingBalance > 0 && (
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => onOpenWhatsAppModal(c)}
                            className="p-1.5 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Send WhatsApp Reminder"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </motion.button>
                        )}

                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => onNavigate(`statement-${c.id}`)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="View Statement"
                        >
                          <FileText className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View (Visible on screens < md) */}
          <div className="md:hidden space-y-3">
            {customers.map((c, index) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: Math.min(index * 0.035, 0.4) }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.99 }}
                className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 transition-shadow"
              >
                <div
                  onClick={() => onNavigate(`customer-${c.id}`)}
                  className="flex items-start justify-between cursor-pointer"
                >
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{c.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" />
                      <span>{c.phone}</span>
                    </p>
                    <div className="mt-1.5">
                      <TrustScoreBadge
                        score={c.trustScore}
                        stars={c.trustStars}
                        rating={c.trustRating}
                        isHighRisk={c.isHighRisk}
                        daysOverdue={c.daysOverdue}
                        size="sm"
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-sm font-black block ${
                        c.outstandingBalance > 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {formatINR(c.outstandingBalance)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {c.outstandingBalance > 0 ? 'Pending Udhaar' : 'Settled'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span>Credit: {formatINR(c.totalCredit)}</span>
                  <span>Paid: {formatINR(c.totalPaid)}</span>
                  <span>{formatRelativeTime(c.lastTransactionDate)}</span>
                </div>

                {/* Quick Action Button Pills */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.93 }}
                    onClick={() => onOpenTransactionModal(c.id, 'CREDIT')}
                    className="flex items-center justify-center gap-1 py-1.5 px-2 text-xs font-bold text-red-600 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900/60 cursor-pointer"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>+ Credit</span>
                  </motion.button>

                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.93 }}
                    onClick={() => onOpenTransactionModal(c.id, 'PAYMENT')}
                    className="flex items-center justify-center gap-1 py-1.5 px-2 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900/60 cursor-pointer"
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span>- Payment</span>
                  </motion.button>

                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.93 }}
                    onClick={() => onOpenWhatsAppModal(c)}
                    className="flex items-center justify-center gap-1 py-1.5 px-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/60 rounded-xl border border-emerald-300 dark:border-emerald-800 cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
