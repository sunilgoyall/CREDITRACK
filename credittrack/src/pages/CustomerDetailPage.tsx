import React, { useState, useEffect } from 'react';
import { Customer, Transaction, TransactionType } from '../types';
import { api } from '../lib/api';
import { formatINR, formatDate, formatPhone } from '../lib/formatters';
import { useAuth } from '../context/AuthContext';
import { DynamicUpiQrCode } from '../components/customer/DynamicUpiQrCode';
import { CustomerAttachments } from '../components/customer/CustomerAttachments';
import { TrustScoreBadge } from '../components/customer/TrustScoreBadge';
import { CustomerTrustCard } from '../components/customer/CustomerTrustCard';
import { generateCustomerStatementPDF } from '../lib/pdfReportGenerator';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  FileText,
  ArrowUpRight,
  ArrowDownLeft,
  MessageCircle,
  Printer,
  Download,
  FileDown,
  Edit2,
  Trash2,
  Calendar,
  CreditCard,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Modal } from '../components/common/Modal';

interface CustomerDetailPageProps {
  customerId: string;
  onBack: () => void;
  onNavigate: (view: string) => void;
  onOpenCreditModal: (customerId: string) => void;
  onOpenPaymentModal: (customerId: string) => void;
  onOpenWhatsAppModal: (customer: Customer) => void;
}

export function CustomerDetailPage({
  customerId,
  onBack,
  onNavigate,
  onOpenCreditModal,
  onOpenPaymentModal,
  onOpenWhatsAppModal,
}: CustomerDetailPageProps) {
  const { isOwner, business, updateProfile } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'CREDIT' | 'PAYMENT'>('ALL');

  // Edit customer modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete customer state
  const [isDeleteCustomerOpen, setIsDeleteCustomerOpen] = useState(false);
  const [isDeletingCustomer, setIsDeletingCustomer] = useState(false);

  // Delete transaction state
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);
  const [isDeletingTx, setIsDeletingTx] = useState(false);

  // PDF report export state
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);

  const fetchCustomerData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await api.customers.getById(customerId);
      setCustomer(data.customer);
      setTransactions(data.transactions);

      // Seed edit form
      setEditName(data.customer.name);
      setEditPhone(data.customer.phone);
      setEditEmail(data.customer.email || '');
      setEditAddress(data.customer.address || '');
      setEditNotes(data.customer.notes || '');
    } catch (err: any) {
      setError(err.message || 'Failed to load customer profile.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerData();
  }, [customerId]);

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;
    setIsUpdating(true);
    try {
      const updated = await api.customers.update(customer.id, {
        name: editName.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim() || undefined,
        address: editAddress.trim() || undefined,
        notes: editNotes.trim() || undefined,
      });
      setCustomer(updated);
      setIsEditModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to update customer details.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteCustomerConfirm = async () => {
    if (!customer) return;
    setIsDeletingCustomer(true);
    try {
      await api.customers.delete(customer.id);
      setIsDeleteCustomerOpen(false);
      onBack();
    } catch (err: any) {
      alert(err.message || 'Failed to delete customer.');
    } finally {
      setIsDeletingCustomer(false);
    }
  };

  const handleDeleteTransaction = async () => {
    if (!deletingTxId) return;
    setIsDeletingTx(true);
    try {
      await api.transactions.delete(deletingTxId);
      setDeletingTxId(null);
      await fetchCustomerData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete transaction.');
    } finally {
      setIsDeletingTx(false);
    }
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
      alert('Failed to generate PDF statement: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadCSV = async () => {
    if (!customer) return;
    try {
      await api.export.downloadStatementCSV(customer.id, customer.name);
    } catch (err: any) {
      alert(err.message || 'Could not export statement CSV');
    }
  };

  if (isLoading && !customer) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-sm text-red-600 font-bold">Customer not found.</p>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 rounded-xl"
        >
          Back to Customers
        </button>
      </div>
    );
  }

  const filteredTransactions = transactions.filter((t) => {
    if (filterType === 'ALL') return true;
    return t.type === filterType;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to All Customers</span>
      </button>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs font-medium text-red-700 dark:text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Customer Profile Header Banner */}
      <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 font-extrabold text-xl flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {customer.name}
                </h1>
                <TrustScoreBadge
                  score={customer.trustScore}
                  stars={customer.trustStars}
                  rating={customer.trustRating}
                  isHighRisk={customer.isHighRisk}
                  daysOverdue={customer.daysOverdue}
                  size="md"
                />
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
                <a
                  href={`tel:${customer.phone}`}
                  className="flex items-center gap-1 hover:text-emerald-600 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{formatPhone(customer.phone)}</span>
                </a>
                {customer.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{customer.email}</span>
                  </span>
                )}
                {customer.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{customer.address}</span>
                  </span>
                )}
              </div>
              {customer.notes && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800 max-w-lg">
                  {customer.notes}
                </p>
              )}
            </div>
          </div>

          {/* Edit / Delete buttons */}
          <div className="flex items-center gap-2 self-start">
            <button
              id="customer-edit-btn"
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              title="Edit customer details"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            {isOwner && (
              <button
                id="customer-delete-btn"
                type="button"
                onClick={() => setIsDeleteCustomerOpen(true)}
                className="p-2 text-red-600 hover:text-red-700 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 rounded-xl transition-colors cursor-pointer"
                title="Delete customer (Owner only)"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 3 Financial Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Total Credit */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[11px] uppercase font-bold text-slate-400 block tracking-wider">
              Total Credit (Udhaar)
            </span>
            <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white block mt-1">
              {formatINR(customer.totalCredit)}
            </span>
          </div>

          {/* Total Paid */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[11px] uppercase font-bold text-slate-400 block tracking-wider">
              Total Paid (Jama)
            </span>
            <span className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 block mt-1">
              {formatINR(customer.totalPaid)}
            </span>
          </div>

          {/* Net Outstanding Balance */}
          <div
            className={`p-4 rounded-2xl border ${
              customer.outstandingBalance > 0
                ? 'bg-red-50/70 dark:bg-red-950/30 border-red-200 dark:border-red-900/60'
                : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60'
            }`}
          >
            <span
              className={`text-[11px] uppercase font-bold block tracking-wider ${
                customer.outstandingBalance > 0 ? 'text-red-700 dark:text-red-300' : 'text-emerald-700 dark:text-emerald-300'
              }`}
            >
              Current Outstanding Balance
            </span>
            <span
              className={`text-xl sm:text-2xl font-black block mt-1 ${
                customer.outstandingBalance > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {formatINR(customer.outstandingBalance)}
            </span>
          </div>
        </div>

        {/* Primary Action Button Bar */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            id="detail-give-credit-btn"
            type="button"
            onClick={() => onOpenCreditModal(customer.id)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Give Credit (+ Udhaar)</span>
          </button>

          <button
            id="detail-receive-payment-btn"
            type="button"
            onClick={() => onOpenPaymentModal(customer.id)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Receive Payment (- Jama)</span>
          </button>

          {customer.outstandingBalance > 0 && (
            <button
              id="detail-whatsapp-reminder-btn"
              type="button"
              onClick={() => onOpenWhatsAppModal(customer)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 hover:bg-emerald-200 rounded-xl border border-emerald-300 dark:border-emerald-800 transition-colors cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Reminder</span>
            </button>
          )}

          <button
            id="detail-download-pdf-btn"
            type="button"
            onClick={handleDownloadPDF}
            disabled={isGeneratingPdf}
            className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer ml-auto disabled:opacity-50"
            title="Download formatted PDF Statement"
          >
            {pdfSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-700 dark:text-emerald-300">PDF Saved!</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{isGeneratingPdf ? 'Generating...' : 'Download PDF'}</span>
              </>
            )}
          </button>

          <button
            id="detail-view-statement-btn"
            type="button"
            onClick={() => onNavigate(`statement-${customer.id}`)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print View</span>
          </button>

          <button
            id="detail-download-csv-btn"
            type="button"
            onClick={handleDownloadCSV}
            className="p-2.5 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            title="Download CSV Statement"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Customer Trust Score & Credit Risk Card */}
      <CustomerTrustCard customer={customer} />

      {/* Dynamic UPI QR Code Section */}
      <DynamicUpiQrCode
        businessName={business?.business_name || 'CreditTrack Store'}
        upiId={business?.upi_id}
        amount={customer.outstandingBalance}
        customerName={customer.name}
        isOwner={isOwner}
        onUpdateUpiId={async (newId) => {
          await updateProfile({ upiId: newId });
        }}
      />

      {/* Customer Attachments & Documents Section */}
      <CustomerAttachments
        customerId={customer.id}
        attachments={customer.attachments || []}
        isOwner={isOwner}
        onAttachmentChange={fetchCustomerData}
      />

      {/* Transactions History Ledger Section */}
      <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Transaction History</h2>
            <p className="text-xs text-slate-400">Complete itemized ledger with running balances</p>
          </div>

          {/* Filter Pills */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filterType === 'ALL'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              All ({transactions.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('CREDIT')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filterType === 'CREDIT'
                  ? 'bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Credit (+ Udhaar)
            </button>
            <button
              type="button"
              onClick={() => setFilterType('PAYMENT')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filterType === 'PAYMENT'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Payment (- Jama)
            </button>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No transactions found for this customer.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Description / Mode</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                  {isOwner && <th className="px-3 py-3 text-center"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 dark:text-slate-300 font-medium">
                      {formatDate(tx.transaction_date)}
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
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {tx.description || (tx.type === 'CREDIT' ? 'Credit purchase' : 'Payment')}
                      </p>

                      {/* Itemized Line Items Preview */}
                      {tx.items && tx.items.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {tx.items.map((item, idx) => (
                            <span
                              key={item.id || idx}
                              className="inline-flex items-center text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-700/60"
                            >
                              {item.quantity}× {item.name} (₹{item.unitPrice ?? item.price})
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                        {tx.payment_method && (
                          <span className="flex items-center gap-1">
                            <CreditCard className="w-3 h-3" />
                            <span>{tx.payment_method}</span>
                          </span>
                        )}
                        {tx.created_by && (
                          <span>Recorded by {tx.created_by}</span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <span
                        className={`font-black ${
                          tx.type === 'CREDIT' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {tx.type === 'CREDIT' ? '+' : '-'}{formatINR(tx.amount)}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right whitespace-nowrap font-bold text-slate-700 dark:text-slate-300">
                      {tx.runningBalance !== undefined ? formatINR(tx.runningBalance) : '-'}
                    </td>

                    {isOwner && (
                      <td className="px-3 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => setDeletingTxId(tx.id)}
                          className="p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Delete transaction record (Owner only)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Customer Details Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Customer Details"
        subtitle={`Updating information for ${customer.name}`}
      >
        <form onSubmit={handleUpdateCustomer} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Customer Name *
            </label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              required
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email (Optional)
            </label>
            <input
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Address (Optional)
            </label>
            <input
              type="text"
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notes
            </label>
            <textarea
              rows={2}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl disabled:opacity-50"
            >
              {isUpdating ? 'Saving...' : 'Update Customer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Customer Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteCustomerOpen}
        onClose={() => setIsDeleteCustomerOpen(false)}
        onConfirm={handleDeleteCustomerConfirm}
        title="Delete Customer Account"
        message={`Are you sure you want to permanently delete ${customer.name}? This will remove all their credit and payment transactions. This action cannot be undone.`}
        confirmLabel="Delete Customer"
        isDestructive={true}
        isLoading={isDeletingCustomer}
      />

      {/* Delete Transaction Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingTxId}
        onClose={() => setDeletingTxId(null)}
        onConfirm={handleDeleteTransaction}
        title="Delete Transaction Record"
        message="Are you sure you want to delete this transaction record? The customer's balance will automatically recalculate."
        confirmLabel="Delete Record"
        isDestructive={true}
        isLoading={isDeletingTx}
      />
    </div>
  );
}
