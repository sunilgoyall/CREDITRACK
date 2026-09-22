import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Customer, Business } from '../../types';
import { formatINR, formatPhone, generateWhatsAppReminder, generateSmsReminder } from '../../lib/formatters';
import { MessageSquare, Send, Check, Smartphone, Clock, AlertTriangle } from 'lucide-react';
import { api } from '../../lib/api';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  business: Business | null;
  initialChannel?: 'WHATSAPP' | 'SMS';
}

export function WhatsAppModal({
  isOpen,
  onClose,
  customer,
  business,
  initialChannel = 'WHATSAPP',
}: WhatsAppModalProps) {
  const [channel, setChannel] = useState<'WHATSAPP' | 'SMS'>(initialChannel);
  const [lang, setLang] = useState<'en' | 'hi'>('hi');
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);

  if (!customer || !business) return null;

  const daysOverdue = customer.daysOverdue ?? (
    customer.lastTransactionDate
      ? Math.max(0, Math.floor((Date.now() - new Date(customer.lastTransactionDate).getTime()) / (1000 * 60 * 60 * 24)))
      : 0
  );

  const isOverdueThreshold = daysOverdue >= 15;

  const reminderUrl = channel === 'WHATSAPP'
    ? generateWhatsAppReminder({
        customerName: customer.name,
        customerPhone: customer.phone,
        businessName: business.business_name,
        outstandingAmount: customer.outstandingBalance,
        daysOverdue,
        upiId: business.upi_id,
        lang,
      })
    : generateSmsReminder({
        customerName: customer.name,
        customerPhone: customer.phone,
        businessName: business.business_name,
        outstandingAmount: customer.outstandingBalance,
        daysOverdue,
        upiId: business.upi_id,
        lang,
      });

  const upiText = business.upi_id ? `\n\nUPI Payment ID: ${business.upi_id}` : '';
  const messageText = channel === 'WHATSAPP'
    ? (lang === 'hi'
        ? `नमस्ते ${customer.name} जी,\n\nयह ${business.business_name} की तरफ से एक विनम्र अनुस्मारक (reminder) है।\n\nआपके खाते में बकाया राशि (Outstanding Balance): ${formatINR(customer.outstandingBalance)} है${daysOverdue > 0 ? ` (पिछले ${daysOverdue} दिनों से बकाया)` : ''}।\n\nकृपया सुविधानुसार इसका भुगतान करें${upiText}।\n\nधन्यवाद! 🙏`
        : `Dear ${customer.name},\n\nThis is a friendly reminder from ${business.business_name} regarding your store account.\n\nYour current outstanding balance is ${formatINR(customer.outstandingBalance)}${daysOverdue > 0 ? ` (unpaid for ${daysOverdue} days)` : ''}.\n\nKindly arrange the payment at your earliest convenience${upiText}.\n\nThank you for your business! 🙏`)
    : (lang === 'hi'
        ? `नमस्ते ${customer.name} जी, ${business.business_name} की ओर से बकाया राशि ${formatINR(customer.outstandingBalance)}${daysOverdue > 0 ? ` (${daysOverdue} दिन से बकाया)` : ''} का अनुस्मारक। कृपया भुगतान करें${business.upi_id ? ` UPI: ${business.upi_id}` : ''}। धन्यवाद!`
        : `Dear ${customer.name}, Reminder from ${business.business_name}: Balance ${formatINR(customer.outstandingBalance)}${daysOverdue > 0 ? ` unpaid for ${daysOverdue} days` : ''}.${business.upi_id ? ` UPI: ${business.upi_id}` : ''} Please arrange payment. Thank you!`);

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = async () => {
    setIsSending(true);
    try {
      // Record reminder dispatch on server
      await api.reminders.sendReminder({
        customerId: customer.id,
        channel,
        lang,
        customMessage: messageText,
      });
    } catch (err) {
      console.warn('Logging reminder on server failed, launching URL anyway:', err);
    } finally {
      setIsSending(false);
      window.open(reminderUrl, '_blank', 'noopener,noreferrer');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Send Payment Reminder"
      subtitle={`${channel === 'WHATSAPP' ? 'WhatsApp' : 'SMS'} notice for ${customer.name}`}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Overdue threshold alert if >= 15 days */}
        {isOverdueThreshold && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-800/60 flex items-center gap-2.5 text-xs text-red-800 dark:text-red-300">
            <Clock className="w-4 h-4 text-red-600 shrink-0" />
            <div>
              <span className="font-bold">Overdue Threshold Exceeded:</span> Unpaid for{' '}
              <strong>{daysOverdue} days</strong>. Payment reminder recommended.
            </div>
          </div>
        )}

        {/* Customer Balance Banner */}
        <div className="flex items-center justify-between p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
          <div>
            <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Outstanding Balance</p>
            <p className="text-xl font-extrabold text-emerald-700 dark:text-emerald-200">{formatINR(customer.outstandingBalance)}</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500 dark:text-slate-400">Customer Phone</span>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{formatPhone(customer.phone)}</p>
          </div>
        </div>

        {/* Channel and Language Selectors */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Channel selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Channel:</span>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setChannel('WHATSAPP')}
                className={`flex items-center gap-1 px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  channel === 'WHATSAPP'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={() => setChannel('SMS')}
                className={`flex items-center gap-1 px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  channel === 'SMS'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>SMS</span>
              </button>
            </div>
          </div>

          {/* Language selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Language:</span>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setLang('hi')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  lang === 'hi' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                हिन्दी
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  lang === 'en' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                English
              </button>
            </div>
          </div>
        </div>

        {/* Message Preview */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Preview {channel === 'WHATSAPP' ? 'WhatsApp' : 'SMS'} Message
          </label>
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line font-sans leading-relaxed">
            {messageText}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <MessageSquare className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Text'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="send-whatsapp-btn"
              type="button"
              onClick={handleSend}
              disabled={isSending}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer ${
                channel === 'WHATSAPP'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>{channel === 'WHATSAPP' ? 'Open in WhatsApp' : 'Send via SMS'}</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
