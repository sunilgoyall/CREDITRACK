export type UserRole = 'OWNER' | 'STAFF';

export interface User {
  id: string;
  name: string;
  email: string;
  role?: UserRole;
  createdAt?: string;
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Business {
  id: string;
  owner_id: string;
  business_name: string;
  phone: string;
  email?: string;
  address?: string;
  business_type: string;
  upi_id?: string;
  upi_name?: string;
  created_at: string;
  updated_at: string;
}

export type TransactionType = 'CREDIT' | 'PAYMENT';

export type PaymentMethod = 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque' | 'Other';

export interface CustomerAttachment {
  id: string;
  name: string;
  dataUrl: string;
  fileType: string;
  size: number;
  uploadedAt: string;
  uploadedBy?: string;
}

export type TrustRating = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'HIGH_RISK';

export interface Customer {
  id: string;
  business_id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  attachments?: CustomerAttachment[];
  created_at: string;
  updated_at: string;
  totalCredit: number;
  totalPaid: number;
  outstandingBalance: number;
  lastTransactionDate?: string;
  transactionCount: number;
  trustScore?: number;
  trustStars?: number;
  trustRating?: TrustRating;
  isHighRisk?: boolean;
  daysOverdue?: number;
}

export interface TransactionItem {
  id?: string;
  name: string;
  quantity: number;
  unitPrice?: number;
  price?: number;
  total?: number;
}

export interface Transaction {
  id: string;
  business_id: string;
  customer_id: string;
  type: TransactionType;
  amount: number;
  transaction_date: string;
  description: string;
  payment_method?: string;
  items?: TransactionItem[];
  created_by?: string;
  created_at: string;
  updated_at: string;
  customerName?: string;
  customerPhone?: string;
  runningBalance?: number;
}

export interface MonthlyTrendData {
  month: string;
  credit: number;
  payment: number;
  netGrowth: number;
}

export interface PaymentMethodBreakdown {
  method: string;
  totalAmount: number;
  count: number;
}

export interface HighRiskCustomerSummary {
  id: string;
  name: string;
  phone: string;
  outstandingBalance: number;
  daysOverdue: number;
  lastTransactionDate?: string;
  trustScore: number;
  trustRating: TrustRating;
}

export interface DashboardStats {
  totalCustomers: number;
  activeAccounts: number;
  settledAccounts: number;
  totalCreditGiven: number;
  totalPaymentsReceived: number;
  totalOutstanding: number;
  monthlyTrends?: MonthlyTrendData[];
  paymentMethodsBreakdown?: PaymentMethodBreakdown[];
  highRiskCustomers?: HighRiskCustomerSummary[];
  recentTransactions: Array<Transaction & { customerName: string; customerPhone: string }>;
  topDebtors: Array<{
    id: string;
    name: string;
    phone: string;
    outstandingBalance: number;
    lastTransactionDate?: string;
    trustScore?: number;
  }>;
  recentCustomers: Customer[];
  overdueCount?: number;
  overdueAmount?: number;
}

export type ReminderChannel = 'WHATSAPP' | 'SMS' | 'BOTH';

export interface ReminderSettings {
  business_id: string;
  enabled: boolean;
  threshold_days: number;
  preferred_channel: ReminderChannel;
  cooldown_days: number;
  include_upi: boolean;
  min_balance: number;
  message_template_en?: string;
  message_template_hi?: string;
  updated_at?: string;
}

export interface ReminderLog {
  id: string;
  business_id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  amount: number;
  days_overdue: number;
  channel: 'WHATSAPP' | 'SMS';
  status: 'SENT' | 'OPENED' | 'LOGGED';
  message_preview: string;
  sent_at: string;
}

export interface OverdueCustomerReport {
  customer: Customer;
  daysUnpaid: number;
  isOverdue: boolean;
  oldestUnpaidDate?: string;
  lastPaymentDate?: string;
  lastReminderSent?: string;
  daysSinceLastReminder?: number | null;
  isEligible: boolean;
  suggestedChannel: 'WHATSAPP' | 'SMS';
  whatsappUrl: string;
  smsUrl: string;
  reminderMessageEn: string;
  reminderMessageHi: string;
}

export interface OverdueOverviewResponse {
  thresholdDays: number;
  settings: ReminderSettings;
  overdueCount: number;
  totalOverdueAmount: number;
  eligibleCount: number;
  customers: OverdueCustomerReport[];
  recentLogs: ReminderLog[];
}
