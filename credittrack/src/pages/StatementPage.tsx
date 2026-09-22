import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Customer, Transaction, Business } from '../types';
import { api } from '../lib/api';
import { formatINR, formatDate, formatPhone } from '../lib/formatters';
import { generateCustomerStatementPDF } from '../lib/pdfReportGenerator';
import {
  ArrowLeft,
  Printer,
  Download,
  FileDown,
  Store,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertCircle,
  FileCheck,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface StatementPageProps {
  customerId: string;
  onBack: () => void;
}

export function StatementPage({ customerId, onBack }: StatementPageProps) {
  const { business } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await api.customers.getById(customerId);
        setCustomer(data.customer);
        setTransactions(data.transactions);
      } catch (err: any) {
        setError(err.message || 'Failed to load customer statement.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [customerId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    if (!customer) return;
    setIsGeneratingPdf(true);
    setPdfSuccess(false);
    try {
      generateCustomerStatementPDF({
        customer,
        transactions,
        business,
      });
      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to generate PDF statement report.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadCSV = async () => {
    if (!customer) return;
    try {
      await api.export.downloadStatementCSV(customer.id, customer.name);
    } catch (err: any) {
      alert(err.message || 'Could not export CSV');
    }
  };

  if (isLoading && !customer) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-4 animate-pulse">
        <div className="h-6 w-32 bg-slate-200 rounded-lg" />
        <div className="h-96 bg-white dark:bg-slate-900 rounded-2xl border" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-red-600 font-bold">Statement not available.</p>
        <button
          type="button"
          onClick={onBack}
          className="mt-3 px-4 py-2 text-xs font-semibold bg-slate-100 rounded-xl"
        >
          Back
        </button>
      </div>
    );
  }

  const statementDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Non-printable Screen Controls */}
      <div className="flex items-center justify-between print:hidden">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Customer Profile</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            id="print-statement-btn"
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print</span>
          </button>

          <motion.button
            id="download-statement-pdf-btn"
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleDownloadPDF}
            disabled={isGeneratingPdf}
            className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {pdfSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-100" />
                <span>PDF Downloaded!</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4" />
                <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download PDF Statement'}</span>
              </>
            )}
          </motion.button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 text-xs font-medium text-red-700 flex items-center gap-2 print:hidden">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Printable Statement Document Sheet */}
      <div className="bg-white text-slate-900 p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-md print:shadow-none print:border-none print:p-0 print:rounded-none">
        {/* Business Header */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-6 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Store className="w-6 h-6 text-emerald-700" />
              <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                {business?.business_name || 'CreditTrack Store'}
              </h1>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {business?.business_type || 'Retail Provision Store'}
            </p>
            {business?.address && (
              <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{business.address}</span>
              </p>
            )}
            {business?.phone && (
              <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Store Phone: {formatPhone(business.phone)}</span>
              </p>
            )}
          </div>

          <div className="text-right">
            <span className="inline-block text-[11px] font-black tracking-wider uppercase px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md border border-slate-300">
              Account Statement
            </span>
            <p className="text-xs text-slate-500 mt-2 font-medium">Date: {statementDate}</p>
            <p className="text-[11px] text-slate-400 font-mono">Ref: CT-{customer.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>

        {/* Customer Info & Balance Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-200 mb-6">
          <div>
            <h2 className="text-[11px] font-black uppercase text-slate-400 tracking-wider mb-1.5">
              Customer Details (Grahak)
            </h2>
            <p className="text-base font-bold text-slate-950">{customer.name}</p>
            <p className="text-xs text-slate-600 mt-0.5 font-medium">Phone: {formatPhone(customer.phone)}</p>
            {customer.address && <p className="text-xs text-slate-600 mt-0.5">Address: {customer.address}</p>}
            {customer.notes && <p className="text-xs text-slate-500 italic mt-1">{customer.notes}</p>}
          </div>

          <div className="sm:text-right flex flex-col justify-center sm:border-l sm:border-slate-200 sm:pl-6">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              Net Outstanding Balance
            </span>
            <span
              className={`text-2xl font-black mt-0.5 ${
                customer.outstandingBalance > 0 ? 'text-red-600' : 'text-emerald-700'
              }`}
            >
              {formatINR(customer.outstandingBalance)}
            </span>
            <div className="flex items-center gap-4 sm:justify-end text-xs text-slate-600 mt-2 pt-2 border-t border-slate-200">
              <span>Total Udhaar: <strong>{formatINR(customer.totalCredit)}</strong></span>
              <span>Total Paid: <strong>{formatINR(customer.totalPaid)}</strong></span>
            </div>
          </div>
        </div>

        {/* Transaction History Table */}
        <div className="space-y-2 mb-8">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">
            Chronological Statement Entries
          </h2>
          <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Type</th>
                <th className="p-3">Description / Mode</th>
                <th className="p-3 text-right">Credit (+)</th>
                <th className="p-3 text-right">Payment (-)</th>
                <th className="p-3 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400">
                    No transactions recorded for this customer.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="p-3 whitespace-nowrap text-slate-700 font-medium">
                      {formatDate(tx.transaction_date)}
                    </td>
                    <td className="p-3 whitespace-nowrap font-bold">
                      <span className={tx.type === 'CREDIT' ? 'text-red-700' : 'text-emerald-700'}>
                        {tx.type === 'CREDIT' ? 'UDHAAR' : 'JAMA'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-800">
                      <span>{tx.description || (tx.type === 'CREDIT' ? 'Goods purchased on credit' : 'Payment received')}</span>
                      {tx.payment_method && (
                        <span className="text-[10px] text-slate-400 block font-sans">
                          via {tx.payment_method}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right font-semibold text-red-700 whitespace-nowrap">
                      {tx.type === 'CREDIT' ? formatINR(tx.amount) : '-'}
                    </td>
                    <td className="p-3 text-right font-semibold text-emerald-700 whitespace-nowrap">
                      {tx.type === 'PAYMENT' ? formatINR(tx.amount) : '-'}
                    </td>
                    <td className="p-3 text-right font-bold text-slate-900 whitespace-nowrap">
                      {tx.runningBalance !== undefined ? formatINR(tx.runningBalance) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Verification / Signature Section */}
        <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs text-slate-600">
          <div>
            <div className="h-14 border-b border-dashed border-slate-300 mx-6 mb-2" />
            <p className="font-bold text-slate-800">Customer Signature</p>
            <p className="text-[10px] text-slate-400">Acknowledged receipt of statement</p>
          </div>

          <div>
            <div className="h-14 border-b border-dashed border-slate-300 mx-6 mb-2" />
            <p className="font-bold text-slate-800">Authorized Store Stamp & Sign</p>
            <p className="text-[10px] text-slate-400">{business?.business_name}</p>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center text-[10px] text-slate-400 pt-4 border-t border-slate-100">
          <p>Generated by CreditTrack — Digital Customer Credit Management System. Thank you for your business!</p>
        </div>
      </div>
    </div>
  );
}
