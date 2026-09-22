import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Transaction, TransactionType } from '../types';
import { api } from '../lib/api';
import { formatINR, formatDate, formatPhone } from '../lib/formatters';
import { generateTransactionsLedgerPDF } from '../lib/pdfReportGenerator';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Download,
  FileDown,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Receipt,
  Calendar,
  CreditCard,
  AlertCircle,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';

interface TransactionsPageProps {
  onNavigate: (view: string) => void;
  onOpenNewTransaction: () => void;
}

export function TransactionsPage({
  onNavigate,
  onOpenNewTransaction,
}: TransactionsPageProps) {
  const { business } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | TransactionType>('ALL');
  const [dateRange, setDateRange] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');
  const [error, setError] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);

  const fetchTransactions = async () => {
    setIsLoading(true);
    setError('');
    try {
      let startDate: string | undefined;
      let endDate: string | undefined;

      const now = new Date();
      if (dateRange === 'TODAY') {
        startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
      } else if (dateRange === 'WEEK') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate = weekAgo.toISOString();
      } else if (dateRange === 'MONTH') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate = monthAgo.toISOString();
      }

      const data = await api.transactions.getAll({
        type: typeFilter === 'ALL' ? undefined : typeFilter,
        startDate,
        endDate,
      });

      // Filter by search in memory if search query entered
      let filtered = data.transactions;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        filtered = data.transactions.filter(
          (t: Transaction) =>
            t.customerName?.toLowerCase().includes(q) ||
            t.customerPhone?.includes(q) ||
            t.description?.toLowerCase().includes(q)
        );
      }

      setTransactions(filtered);
    } catch (err: any) {
      setError(err.message || 'Failed to load transaction ledger.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [typeFilter, dateRange]);

  const handleDownloadPDF = () => {
    if (transactions.length === 0) return;
    setIsGeneratingPdf(true);
    setPdfSuccess(false);
    try {
      generateTransactionsLedgerPDF({
        transactions,
        business,
        filters: {
          dateRange: dateRange !== 'ALL' ? dateRange : undefined,
          typeFilter: typeFilter !== 'ALL' ? typeFilter : undefined,
          search: search.trim() || undefined,
        },
      });
      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to generate PDF transaction ledger.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      await api.export.downloadTransactionsCSV();
    } catch (err: any) {
      alert(err.message || 'Could not export transaction ledger CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const totalCredit = transactions
    .filter((t) => t.type === 'CREDIT')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPayment = transactions
    .filter((t) => t.type === 'PAYMENT')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Transaction Ledger (Khata)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {transactions.length} recorded entries across all customer accounts
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="export-transactions-csv-btn"
            type="button"
            onClick={handleExportCSV}
            disabled={isExporting || transactions.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            title="Export full CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>

          <motion.button
            id="download-ledger-pdf-btn"
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleDownloadPDF}
            disabled={isGeneratingPdf || transactions.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {pdfSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-700 dark:text-emerald-300">PDF Ready!</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download PDF Report'}</span>
              </>
            )}
          </motion.button>

          <motion.button
            id="add-transaction-page-btn"
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={onOpenNewTransaction}
            className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <span>+ Add Entry</span>
          </motion.button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs font-medium text-red-700 dark:text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Stat Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] uppercase font-bold text-slate-400 block tracking-wider">
            Total Credit in View
          </span>
          <span className="text-lg sm:text-xl font-black text-red-600 dark:text-red-400 block mt-1">
            {formatINR(totalCredit)}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] uppercase font-bold text-slate-400 block tracking-wider">
            Total Payments in View
          </span>
          <span className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 block mt-1">
            {formatINR(totalPayment)}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[11px] uppercase font-bold text-slate-400 block tracking-wider">
            Net Change
          </span>
          <span
            className={`text-lg sm:text-xl font-black block mt-1 ${
              totalCredit - totalPayment > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {formatINR(totalCredit - totalPayment)}
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="transactions-search-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer, phone, note..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Type Filter */}
          <div className="sm:col-span-4 flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setTypeFilter('ALL')}
              className={`flex-1 py-1.5 px-2 rounded-lg transition-colors cursor-pointer text-center ${
                typeFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              All Types
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('CREDIT')}
              className={`flex-1 py-1.5 px-2 rounded-lg transition-colors cursor-pointer text-center ${
                typeFilter === 'CREDIT'
                  ? 'bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Credit (Udhaar)
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('PAYMENT')}
              className={`flex-1 py-1.5 px-2 rounded-lg transition-colors cursor-pointer text-center ${
                typeFilter === 'PAYMENT'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Payment (Jama)
            </button>
          </div>

          {/* Date Filter */}
          <div className="sm:col-span-3">
            <select
              id="transactions-date-range-select"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Dates</option>
              <option value="TODAY">Today</option>
              <option value="WEEK">Last 7 Days</option>
              <option value="MONTH">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="h-16 bg-white dark:bg-slate-900 rounded-2xl animate-pulse border border-slate-100 dark:border-slate-800" />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No transactions match this view"
          description="Try changing the type filter, date range, or search term."
          actionLabel="+ Record New Transaction"
          onAction={onOpenNewTransaction}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-4 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Type</th>
                  <th className="px-4 py-3.5">Details & Note</th>
                  <th className="px-5 py-3.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {transactions.map((tx, index) => (
                  <motion.tr
                    key={tx.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(index * 0.025, 0.4) }}
                    onClick={() => onNavigate(`customer-${tx.customer_id}`)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-500 dark:text-slate-400 font-medium">
                      {formatDate(tx.transaction_date)}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <p className="font-bold text-slate-900 dark:text-white hover:text-emerald-600 transition-colors">
                        {tx.customerName}
                      </p>
                      {tx.customerPhone && (
                        <p className="text-[11px] text-slate-400">{formatPhone(tx.customerPhone)}</p>
                      )}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold ${
                          tx.type === 'CREDIT'
                            ? 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                        }`}
                      >
                        {tx.type === 'CREDIT' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                        <span>{tx.type === 'CREDIT' ? 'UDHAAR' : 'JAMA'}</span>
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                      <p className="font-medium text-slate-900 dark:text-white">
                        {tx.description || (tx.type === 'CREDIT' ? 'Credit udhaar' : 'Customer payment')}
                      </p>
                      {tx.payment_method && (
                        <span className="inline-block text-[10px] text-slate-400 mt-0.5">
                          Mode: {tx.payment_method}
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <span
                        className={`font-black text-sm block ${
                          tx.type === 'CREDIT' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {tx.type === 'CREDIT' ? '+' : '-'}{formatINR(tx.amount)}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
