import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Customer, TransactionType, PaymentMethod, TransactionItem } from '../../types';
import { formatINR } from '../../lib/formatters';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  FileText,
  CreditCard,
  AlertCircle,
  Plus,
  Trash2,
  Receipt,
  ListPlus,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../../lib/api';

interface RecordTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers?: Customer[];
  preselectedCustomerId?: string;
  defaultCustomerId?: string;
  initialType?: TransactionType;
  defaultType?: TransactionType;
  onSuccess?: (updatedCustomer?: Customer) => void;
  onTransactionRecorded?: () => void;
  onSubmitApi?: (data: {
    customerId: string;
    type: TransactionType;
    amount: number;
    transactionDate?: string;
    description?: string;
    paymentMethod?: PaymentMethod | string;
    items?: TransactionItem[];
    allowOverpayment?: boolean;
  }) => Promise<{ transaction: any; customer: Customer }>;
}

export function RecordTransactionModal({
  isOpen,
  onClose,
  customers: propCustomers,
  preselectedCustomerId,
  defaultCustomerId,
  initialType = 'CREDIT',
  defaultType,
  onSuccess,
  onTransactionRecorded,
  onSubmitApi,
}: RecordTransactionModalProps) {
  const activeInitialType = defaultType || initialType;
  const activeInitialCid = defaultCustomerId || preselectedCustomerId || '';

  const [type, setType] = useState<TransactionType>(activeInitialType);
  const [customers, setCustomers] = useState<Customer[]>(propCustomers || []);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(activeInitialCid);
  const [amount, setAmount] = useState<string>('');
  const [transactionDate, setTransactionDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [allowOverpayment, setAllowOverpayment] = useState<boolean>(false);
  const [overpaymentWarning, setOverpaymentWarning] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Itemized transaction state
  const [isItemized, setIsItemized] = useState<boolean>(false);
  const [items, setItems] = useState<Array<{ id: string; name: string; quantity: number; unitPrice: number; total: number }>>([
    { id: '1', name: '', quantity: 1, unitPrice: 0, total: 0 },
  ]);

  useEffect(() => {
    if (isOpen) {
      if (propCustomers && propCustomers.length > 0) {
        setCustomers(propCustomers);
      } else {
        api.customers.getAll().then((data) => {
          setCustomers(data);
          if (!selectedCustomerId && data.length > 0) {
            setSelectedCustomerId(activeInitialCid || data[0].id);
          }
        }).catch(() => {});
      }
    }
  }, [isOpen, propCustomers, activeInitialCid]);

  useEffect(() => {
    const target = defaultCustomerId || preselectedCustomerId;
    if (target) {
      setSelectedCustomerId(target);
    } else if (customers.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(customers[0].id);
    }
  }, [defaultCustomerId, preselectedCustomerId, customers, selectedCustomerId]);

  useEffect(() => {
    const targetType = defaultType || initialType;
    if (targetType) {
      setType(targetType);
    }
  }, [defaultType, initialType, isOpen]);

  // Recalculate amount if itemized entries change
  useEffect(() => {
    if (isItemized && items.length > 0) {
      const itemsSum = items.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
      if (itemsSum > 0) {
        setAmount(itemsSum.toString());
      }
    }
  }, [items, isItemized]);

  const handleAddItemRow = () => {
    setItems((prev) => [
      ...prev,
      { id: Date.now().toString(), name: '', quantity: 1, unitPrice: 0, total: 0 },
    ]);
  };

  const handleRemoveItemRow = (id: string) => {
    setItems((prev) => {
      const filtered = prev.filter((i) => i.id !== id);
      return filtered.length > 0 ? filtered : [{ id: Date.now().toString(), name: '', quantity: 1, unitPrice: 0, total: 0 }];
    });
  };

  const handleItemChange = (id: string, field: 'name' | 'quantity' | 'unitPrice', val: string | number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: val };
        const q = Math.max(1, Number(updated.quantity) || 1);
        const p = Math.max(0, Number(updated.unitPrice) || 0);
        updated.total = Math.round(q * p * 100) / 100;
        return updated;
      })
    );
  };

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const currentBalance = selectedCustomer ? selectedCustomer.outstandingBalance : 0;
  const numAmount = parseFloat(amount) || 0;

  // Compute live projected balance
  let projectedBalance = currentBalance;
  if (type === 'CREDIT') {
    projectedBalance = currentBalance + numAmount;
  } else {
    projectedBalance = currentBalance - numAmount;
  }

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setPaymentMethod('Cash');
    setAllowOverpayment(false);
    setOverpaymentWarning(null);
    setIsItemized(false);
    setItems([{ id: '1', name: '', quantity: 1, unitPrice: 0, total: 0 }]);
    setError('');
  };

  const handleQuickAmount = (val: number) => {
    setAmount(val.toString());
  };

  const handleSettleFull = () => {
    if (currentBalance > 0) {
      setAmount(currentBalance.toString());
      setDescription('Full settlement');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setOverpaymentWarning(null);

    if (!selectedCustomerId) {
      setError('Please select a customer.');
      return;
    }

    if (numAmount <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }

    // Filter valid line items if itemized is active
    let validItems: TransactionItem[] | undefined = undefined;
    if (isItemized) {
      validItems = items
        .filter((i) => i.name.trim() !== '')
        .map((i) => ({
          id: i.id,
          name: i.name.trim(),
          quantity: Number(i.quantity) || 1,
          unitPrice: Number(i.unitPrice) || 0,
          total: Number(i.total) || 0,
        }));
    }

    setIsSubmitting(true);
    try {
      const submitFn = onSubmitApi || api.transactions.create;
      const res = await submitFn({
        customerId: selectedCustomerId,
        type,
        amount: numAmount,
        transactionDate: new Date(transactionDate).toISOString(),
        description: description.trim() || (type === 'CREDIT' ? 'Goods purchased on credit' : 'Payment received'),
        paymentMethod: type === 'PAYMENT' ? paymentMethod : undefined,
        items: validItems && validItems.length > 0 ? validItems : undefined,
        allowOverpayment,
      });

      // If full payment was made and balance reached 0 or less, celebrate!
      if (type === 'PAYMENT' && res.customer.outstandingBalance <= 0) {
        try {
          confetti({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.7 },
          });
        } catch {}
      }

      resetForm();
      if (onSuccess) onSuccess(res.customer);
      if (onTransactionRecorded) onTransactionRecorded();
      onClose();
    } catch (err: any) {
      if (err.isOverpayment) {
        setOverpaymentWarning(err.message);
      } else {
        setError(err.message || 'Failed to save transaction.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetForm();
        onClose();
      }}
      title="Record Transaction"
      subtitle="Record customer credit (udhaar) or repayment (jama)"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Transaction Type Tabs */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setType('CREDIT');
              setOverpaymentWarning(null);
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              type === 'CREDIT'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Give Credit (+ Udhaar)</span>
          </button>

          <button
            type="button"
            onClick={() => setType('PAYMENT')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              type === 'PAYMENT'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Receive Payment (- Jama)</span>
          </button>
        </div>

        {error && (
          <div className="p-3 text-xs font-medium text-red-700 bg-red-50 dark:bg-red-950/50 dark:text-red-300 rounded-xl border border-red-200 dark:border-red-900">
            {error}
          </div>
        )}

        {overpaymentWarning && (
          <div className="p-3.5 text-xs text-amber-800 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-300 rounded-xl border border-amber-200 dark:border-amber-900 space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <p className="leading-relaxed">{overpaymentWarning}</p>
            </div>
            <label className="flex items-center gap-2 font-semibold pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={allowOverpayment}
                onChange={(e) => setAllowOverpayment(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Yes, allow advance overpayment</span>
            </label>
          </div>
        )}

        {/* Customer Select */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Select Customer *
          </label>
          {preselectedCustomerId && selectedCustomer ? (
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedCustomer.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{selectedCustomer.phone}</p>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Balance</span>
                <span className={`text-sm font-bold ${selectedCustomer.outstandingBalance > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {formatINR(selectedCustomer.outstandingBalance)}
                </span>
              </div>
            </div>
          ) : (
            <select
              id="customer-select-dropdown"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">-- Choose a customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone}) - Outstanding: {formatINR(c.outstandingBalance)}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Itemized Billing Toggle */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Itemized Bill Entries (Optional)
              </span>
              <span className="text-[11px] text-slate-400 block">
                Add line items (item name, quantity, unit price)
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsItemized(!isItemized)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              isItemized
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            {isItemized ? 'Items Active' : '+ Add Items'}
          </button>
        </div>

        {/* Itemized Line Items Table */}
        {isItemized && (
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Line Items
              </span>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Row</span>
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
                  <div className="col-span-5">
                    <input
                      type="text"
                      placeholder={`Item ${idx + 1} (e.g. Atta 5kg)`}
                      value={item.name}
                      onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                      className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-center"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="₹ Rate"
                      value={item.unitPrice || ''}
                      onChange={(e) => handleItemChange(item.id, 'unitPrice', e.target.value)}
                      className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-right"
                    />
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      ₹{item.total.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="col-span-1 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveItemRow(item.id)}
                      className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
              <span className="font-semibold text-slate-500 dark:text-slate-400">Total Calculated:</span>
              <span className="font-black text-sm text-slate-900 dark:text-white">
                ₹{items.reduce((sum, i) => sum + i.total, 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        )}

        {/* Amount Input & Presets */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Total Amount (₹) *
            </label>
            {type === 'PAYMENT' && currentBalance > 0 && (
              <button
                type="button"
                onClick={handleSettleFull}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Settle Full Balance ({formatINR(currentBalance)})
              </button>
            )}
          </div>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">₹</span>
            <input
              id="transaction-amount-input"
              type="number"
              min="1"
              step="any"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full pl-8 pr-4 py-2.5 text-lg font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Quick preset buttons */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {[100, 200, 500, 1000, 2000, 5000].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleQuickAmount(val)}
                className="px-2.5 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
              >
                +₹{val}
              </button>
            ))}
          </div>
        </div>

        {/* Date & Payment Mode Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Transaction Date
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="transaction-date-input"
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {type === 'PAYMENT' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Payment Method
              </label>
              <div className="relative">
                <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  id="transaction-payment-method-select"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Category
              </label>
              <select
                id="transaction-category-select"
                onChange={(e) => setDescription((prev) => (prev ? `${e.target.value} - ${prev}` : e.target.value))}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Standard Goods</option>
                <option value="Groceries & Ration">Groceries & Ration</option>
                <option value="Medicines">Medicines</option>
                <option value="Dairy & Milk">Dairy & Milk</option>
                <option value="Hardware Items">Hardware Items</option>
                <option value="Service Charge">Service Charge</option>
              </select>
            </div>
          )}
        </div>

        {/* Description / Item Details */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Note / Item Summary (Optional)
          </label>
          <div className="relative">
            <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              id="transaction-note-input"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={type === 'CREDIT' ? 'e.g. 5kg Atta, Cooking oil, Sugar' : 'e.g. Received via GPay'}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Live Calculation Preview Banner */}
        {selectedCustomer && numAmount > 0 && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Current: <strong className="text-slate-700 dark:text-slate-300">{formatINR(currentBalance)}</strong>
            </span>
            <span className="text-slate-400">→</span>
            <span>
              New Balance:{' '}
              <strong className={projectedBalance > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}>
                {formatINR(projectedBalance)}
              </strong>
            </span>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              resetForm();
              onClose();
            }}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            id="submit-transaction-btn"
            type="submit"
            disabled={isSubmitting || !selectedCustomerId || numAmount <= 0}
            className={`px-5 py-2 text-sm font-semibold text-white rounded-xl transition-all shadow-xs hover:shadow-md cursor-pointer disabled:opacity-50 ${
              type === 'CREDIT' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isSubmitting ? 'Recording...' : type === 'CREDIT' ? 'Give Credit' : 'Record Payment'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

