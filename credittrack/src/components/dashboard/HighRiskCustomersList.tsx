import React from 'react';
import { HighRiskCustomerSummary, Customer } from '../../types';
import { formatINR, formatPhone, formatRelativeTime } from '../../lib/formatters';
import { TrustScoreBadge } from '../customer/TrustScoreBadge';
import { AlertTriangle, MessageCircle, Smartphone, ChevronRight, ShieldCheck, Clock, Bell } from 'lucide-react';

interface HighRiskCustomersListProps {
  customers?: HighRiskCustomerSummary[];
  onNavigate: (view: string) => void;
  onOpenWhatsAppModal: (customer: Customer, channel?: 'WHATSAPP' | 'SMS') => void;
  onOpenRemindersModal?: () => void;
  businessId?: string;
}

export function HighRiskCustomersList({
  customers = [],
  onNavigate,
  onOpenWhatsAppModal,
  onOpenRemindersModal,
  businessId = '',
}: HighRiskCustomersListProps) {
  return (
    <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              High-Risk Accounts
            </h3>
            <p className="text-xs text-slate-400">
              Customers with outstanding credit older than 30 days
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {customers.length > 0 ? (
            <>
              <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                {customers.length} Overdue Account{customers.length > 1 ? 's' : ''}
              </span>
              {onOpenRemindersModal && (
                <button
                  type="button"
                  onClick={onOpenRemindersModal}
                  className="text-xs font-bold px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                >
                  <Bell className="w-3 h-3" />
                  <span>Automate</span>
                </button>
              )}
            </>
          ) : (
            <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>All Accounts Healthy</span>
            </span>
          )}
        </div>
      </div>

      {customers.length === 0 ? (
        <div className="p-6 text-center space-y-2 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/40">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <p className="text-xs sm:text-sm font-bold text-emerald-950 dark:text-emerald-200">
            No customers with dues older than 30 days
          </p>
          <p className="text-xs text-emerald-700/80 dark:text-emerald-400 max-w-md mx-auto">
            Great credit discipline! Customers are either fully settled or actively making payments within the 30-day window.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {customers.map((c) => (
            <div
              key={c.id}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 -mx-2 px-2 rounded-xl transition-colors"
            >
              <div
                onClick={() => onNavigate(`customer-${c.id}`)}
                className="cursor-pointer space-y-1"
              >
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-900 dark:text-white hover:text-emerald-600 transition-colors">
                    {c.name}
                  </p>
                  <TrustScoreBadge
                    score={c.trustScore}
                    rating={c.trustRating}
                    isHighRisk={true}
                    daysOverdue={c.daysOverdue}
                    size="sm"
                    showStars={false}
                  />
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span>{formatPhone(c.phone)}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold">
                    <Clock className="w-3 h-3" />
                    <span>{c.daysOverdue} days overdue</span>
                  </span>
                  {c.lastTransactionDate && (
                    <>
                      <span>•</span>
                      <span>Last txn: {formatRelativeTime(c.lastTransactionDate)}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 self-stretch sm:self-auto pt-2 sm:pt-0 border-t sm:border-0 border-slate-100 dark:border-slate-800">
                <div className="text-left sm:text-right">
                  <span className="text-xs text-slate-400 block font-medium">Pending Due</span>
                  <span className="text-sm sm:text-base font-black text-rose-600 dark:text-rose-400 block">
                    {formatINR(c.outstandingBalance)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      onOpenWhatsAppModal({
                        id: c.id,
                        business_id: businessId,
                        name: c.name,
                        phone: c.phone,
                        created_at: '',
                        updated_at: '',
                        totalCredit: 0,
                        totalPaid: 0,
                        outstandingBalance: c.outstandingBalance,
                        transactionCount: 0,
                        daysOverdue: c.daysOverdue,
                      }, 'WHATSAPP')
                    }
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 rounded-xl border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
                    title="Send WhatsApp Overdue Reminder"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onOpenWhatsAppModal({
                        id: c.id,
                        business_id: businessId,
                        name: c.name,
                        phone: c.phone,
                        created_at: '',
                        updated_at: '',
                        totalCredit: 0,
                        totalPaid: 0,
                        outstandingBalance: c.outstandingBalance,
                        transactionCount: 0,
                        daysOverdue: c.daysOverdue,
                      }, 'SMS')
                    }
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    title="Send SMS Overdue Reminder"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">SMS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigate(`customer-${c.id}`)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                    title="View Customer Profile"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
