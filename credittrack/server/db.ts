import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import pg from 'pg';
import bcrypt from 'bcryptjs';

export type UserRole = 'OWNER' | 'STAFF';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role?: UserRole;
  business_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessRecord {
  id: string;
  owner_id: string;
  business_name: string;
  phone: string;
  email: string;
  address: string;
  business_type: string;
  upi_id?: string;
  upi_name?: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerAttachment {
  id: string;
  name: string;
  dataUrl: string;
  fileType: string;
  size: number;
  uploadedAt: string;
  uploadedBy?: string;
}

export interface CustomerRecord {
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
}

export type TransactionType = 'CREDIT' | 'PAYMENT';

export interface TransactionItem {
  id?: string;
  name: string;
  quantity: number;
  unitPrice?: number;
  price?: number;
  total?: number;
}

export interface TransactionRecord {
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
}

export type TrustRating = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'AT_RISK';

export interface CustomerWithBalance extends CustomerRecord {
  totalCredit: number;
  totalPaid: number;
  outstandingBalance: number;
  lastTransactionDate?: string;
  transactionCount: number;
  trustScore: number;
  trustStars: number;
  trustRating: TrustRating;
  isHighRisk: boolean;
  daysOverdue: number;
  attachments: CustomerAttachment[];
}

export interface MonthlyTrendData {
  month: string; // e.g. "Apr 2026"
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
  totalCreditGiven: number;
  totalPaymentsReceived: number;
  totalOutstanding: number;
  settledAccounts: number;
  monthlyTrends: MonthlyTrendData[];
  paymentMethodsBreakdown: PaymentMethodBreakdown[];
  highRiskCustomers: HighRiskCustomerSummary[];
  recentTransactions: Array<TransactionRecord & { customerName: string; customerPhone: string }>;
  topDebtors: Array<{
    id: string;
    name: string;
    phone: string;
    outstandingBalance: number;
    lastTransactionDate?: string;
    trustScore?: number;
  }>;
  recentCustomers: CustomerWithBalance[];
  overdueCount?: number;
  overdueAmount?: number;
}

export type ReminderChannel = 'WHATSAPP' | 'SMS' | 'BOTH';

export interface ReminderSettingsRecord {
  business_id: string;
  enabled: boolean;
  threshold_days: number;
  preferred_channel: ReminderChannel;
  cooldown_days: number;
  include_upi: boolean;
  min_balance: number;
  message_template_en?: string;
  message_template_hi?: string;
  updated_at: string;
}

export interface ReminderLogRecord {
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
  customer: CustomerWithBalance;
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
  settings: ReminderSettingsRecord;
  overdueCount: number;
  totalOverdueAmount: number;
  eligibleCount: number;
  customers: OverdueCustomerReport[];
  recentLogs: ReminderLogRecord[];
}

export function computeCustomerTrust(
  totalCredit: number,
  totalPaid: number,
  outstandingBalance: number,
  transactionCount: number,
  lastTransactionDate?: string
): { trustScore: number; trustStars: number; trustRating: TrustRating; isHighRisk: boolean; daysOverdue: number } {
  const daysSinceLastTx = lastTransactionDate
    ? Math.max(0, Math.floor((Date.now() - new Date(lastTransactionDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Repayment ratio (0 to 1)
  const ratio = totalCredit > 0 ? Math.min(1, totalPaid / totalCredit) : 1;
  const repaymentPoints = Math.round(ratio * 55); // up to 55 points

  // Settlement bonus
  let settlementBonus = 0;
  if (outstandingBalance <= 0) {
    settlementBonus = 30; // Paid off completely
  } else if (outstandingBalance < 1000) {
    settlementBonus = 18;
  } else if (outstandingBalance < 5000) {
    settlementBonus = 10;
  }

  // History depth points
  const historyPoints = Math.min(15, transactionCount * 3); // up to 15 points

  // Overdue penalties if outstanding > 0
  let overduePenalty = 0;
  const isHighRisk = outstandingBalance > 0 && daysSinceLastTx >= 30;
  const daysOverdue = outstandingBalance > 0 ? Math.max(0, daysSinceLastTx - 30) : 0;

  if (outstandingBalance > 0) {
    if (daysSinceLastTx > 60) {
      overduePenalty = Math.min(45, 20 + Math.floor((daysSinceLastTx - 60) / 3));
    } else if (daysSinceLastTx > 30) {
      overduePenalty = Math.min(25, 10 + Math.floor((daysSinceLastTx - 30) / 2));
    } else if (daysSinceLastTx > 15) {
      overduePenalty = 5;
    }
  }

  const rawScore = repaymentPoints + settlementBonus + historyPoints - overduePenalty;
  const trustScore = Math.max(10, Math.min(100, rawScore));

  let trustStars = 3;
  let trustRating: TrustRating = 'FAIR';

  if (trustScore >= 85) {
    trustStars = 5;
    trustRating = 'EXCELLENT';
  } else if (trustScore >= 70) {
    trustStars = 4;
    trustRating = 'GOOD';
  } else if (trustScore >= 50) {
    trustStars = 3;
    trustRating = 'FAIR';
  } else {
    trustStars = 2;
    trustRating = 'AT_RISK';
  }

  return {
    trustScore,
    trustStars,
    trustRating,
    isHighRisk,
    daysOverdue,
  };
}

interface DatabaseState {
  users: UserRecord[];
  businesses: BusinessRecord[];
  customers: CustomerRecord[];
  transactions: TransactionRecord[];
  reminder_settings?: ReminderSettingsRecord[];
  reminder_logs?: ReminderLogRecord[];
}

class DatabaseManager {
  private pgPool: pg.Pool | null = null;
  private isPostgres: boolean = false;
  private memoryDb: DatabaseState = {
    users: [],
    businesses: [],
    customers: [],
    transactions: [],
    reminder_settings: [],
    reminder_logs: [],
  };
  private dataFilePath: string;

  constructor() {
    const dataDir = path.join(process.cwd(), '.data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch (err) {
        console.error('Could not create .data directory:', err);
      }
    }
    this.dataFilePath = path.join(dataDir, 'credittrack.json');
    this.init();
  }

  private async init() {
    const databaseUrl = process.env.DATABASE_URL;

    if (databaseUrl && (databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://'))) {
      try {
        this.pgPool = new pg.Pool({
          connectionString: databaseUrl,
          ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
        });

        // Test connection
        const client = await this.pgPool.connect();
        try {
          console.log('[CreditTrack DB] Connected to PostgreSQL successfully.');
          this.isPostgres = true;
          await this.initPostgresTables(client);
        } finally {
          client.release();
        }
        return;
      } catch (err) {
        console.warn('[CreditTrack DB] PostgreSQL connection failed, falling back to embedded persistent storage:', (err as Error).message);
        this.pgPool = null;
        this.isPostgres = false;
      }
    }

    // Embedded persistent storage
    this.loadEmbeddedDb();
  }

  private async initPostgresTables(client: pg.PoolClient) {
    const schemaSql = `
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS businesses (
        id VARCHAR(64) PRIMARY KEY,
        owner_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        business_name VARCHAR(255) NOT NULL,
        phone VARCHAR(32) NOT NULL,
        email VARCHAR(255),
        address TEXT,
        business_type VARCHAR(100) DEFAULT 'General Store',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(64) PRIMARY KEY,
        business_id VARCHAR(64) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(32) NOT NULL,
        email VARCHAR(255),
        address TEXT,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(64) PRIMARY KEY,
        business_id VARCHAR(64) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        customer_id VARCHAR(64) NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        type VARCHAR(16) NOT NULL,
        amount NUMERIC(12, 2) NOT NULL,
        transaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        description TEXT,
        payment_method VARCHAR(32) DEFAULT 'Cash',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS reminder_settings (
        business_id VARCHAR(64) PRIMARY KEY REFERENCES businesses(id) ON DELETE CASCADE,
        enabled BOOLEAN DEFAULT true,
        threshold_days INT DEFAULT 15,
        preferred_channel VARCHAR(16) DEFAULT 'WHATSAPP',
        cooldown_days INT DEFAULT 3,
        include_upi BOOLEAN DEFAULT true,
        min_balance NUMERIC(12, 2) DEFAULT 1,
        message_template_en TEXT,
        message_template_hi TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS reminder_logs (
        id VARCHAR(64) PRIMARY KEY,
        business_id VARCHAR(64) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        customer_id VARCHAR(64) NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(32) NOT NULL,
        amount NUMERIC(12, 2) NOT NULL,
        days_overdue INT NOT NULL,
        channel VARCHAR(16) NOT NULL,
        status VARCHAR(16) DEFAULT 'SENT',
        message_preview TEXT,
        sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client.query(schemaSql);
  }

  private loadEmbeddedDb() {
    try {
      if (fs.existsSync(this.dataFilePath)) {
        const raw = fs.readFileSync(this.dataFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        this.memoryDb = {
          users: parsed.users || [],
          businesses: parsed.businesses || [],
          customers: parsed.customers || [],
          transactions: parsed.transactions || [],
          reminder_settings: parsed.reminder_settings || [],
          reminder_logs: parsed.reminder_logs || [],
        };
      } else {
        this.saveEmbeddedDb();
      }
    } catch (err) {
      console.error('[CreditTrack DB] Error loading embedded storage:', err);
      this.memoryDb = { users: [], businesses: [], customers: [], transactions: [], reminder_settings: [], reminder_logs: [] };
    }
  }

  private saveEmbeddedDb() {
    try {
      const tempPath = `${this.dataFilePath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.memoryDb, null, 2), 'utf-8');
      fs.renameSync(tempPath, this.dataFilePath);
    } catch (err) {
      console.error('[CreditTrack DB] Error saving embedded storage:', err);
    }
  }

  // --- USER & AUTH METHODS ---

  async findUserByEmail(email: string): Promise<UserRecord | null> {
    const cleanEmail = email.toLowerCase().trim();
    if (this.isPostgres && this.pgPool) {
      const res = await this.pgPool.query('SELECT * FROM users WHERE LOWER(email) = $1 LIMIT 1', [cleanEmail]);
      return res.rows[0] || null;
    }
    const user = this.memoryDb.users.find(u => u.email.toLowerCase() === cleanEmail);
    return user || null;
  }

  async findUserById(id: string): Promise<UserRecord | null> {
    if (this.isPostgres && this.pgPool) {
      const res = await this.pgPool.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
      return res.rows[0] || null;
    }
    const user = this.memoryDb.users.find(u => u.id === id);
    return user || null;
  }

  async createUser(data: {
    name: string;
    email: string;
    passwordHash: string;
    businessName: string;
    phone: string;
    businessType?: string;
    address?: string;
  }): Promise<{ user: UserRecord; business: BusinessRecord }> {
    const userId = 'usr_' + crypto.randomBytes(8).toString('hex');
    const businessId = 'biz_' + crypto.randomBytes(8).toString('hex');
    const now = new Date().toISOString();

    const userRecord: UserRecord = {
      id: userId,
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      password_hash: data.passwordHash,
      role: 'OWNER',
      created_at: now,
      updated_at: now,
    };

    const businessRecord: BusinessRecord = {
      id: businessId,
      owner_id: userId,
      business_name: data.businessName.trim(),
      phone: data.phone.trim(),
      email: data.email.toLowerCase().trim(),
      address: data.address?.trim() || '',
      business_type: data.businessType?.trim() || 'General Store',
      upi_id: '',
      upi_name: data.businessName.trim(),
      created_at: now,
      updated_at: now,
    };

    if (this.isPostgres && this.pgPool) {
      const client = await this.pgPool.connect();
      try {
        await client.query('BEGIN');
        await client.query(
          `INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [userRecord.id, userRecord.name, userRecord.email, userRecord.password_hash, 'OWNER', now, now]
        );
        await client.query(
          `INSERT INTO businesses (id, owner_id, business_name, phone, email, address, business_type, upi_id, upi_name, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [businessRecord.id, businessRecord.owner_id, businessRecord.business_name, businessRecord.phone, businessRecord.email, businessRecord.address, businessRecord.business_type, '', businessRecord.business_name, now, now]
        );
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } else {
      this.memoryDb.users.push(userRecord);
      this.memoryDb.businesses.push(businessRecord);
      this.saveEmbeddedDb();
    }

    return { user: userRecord, business: businessRecord };
  }

  // --- STAFF ACCOUNTS (ROLE-BASED ACCESS CONTROL) ---

  async createStaffUser(businessId: string, ownerId: string, data: { name: string; email: string; passwordHash: string }): Promise<UserRecord> {
    const userId = 'usr_staff_' + crypto.randomBytes(6).toString('hex');
    const now = new Date().toISOString();

    const userRecord: UserRecord = {
      id: userId,
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      password_hash: data.passwordHash,
      role: 'STAFF',
      business_id: businessId,
      created_by: ownerId,
      created_at: now,
      updated_at: now,
    };

    if (this.isPostgres && this.pgPool) {
      await this.pgPool.query(
        `INSERT INTO users (id, name, email, password_hash, role, business_id, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [userRecord.id, userRecord.name, userRecord.email, userRecord.password_hash, 'STAFF', businessId, ownerId, now, now]
      );
    } else {
      this.memoryDb.users.push(userRecord);
      this.saveEmbeddedDb();
    }

    return userRecord;
  }

  async getStaffUsers(businessId: string): Promise<Array<Pick<UserRecord, 'id' | 'name' | 'email' | 'role' | 'created_at'>>> {
    if (this.isPostgres && this.pgPool) {
      const res = await this.pgPool.query(
        `SELECT id, name, email, role, created_at FROM users WHERE business_id = $1 AND role = 'STAFF' ORDER BY created_at DESC`,
        [businessId]
      );
      return res.rows;
    }
    return this.memoryDb.users
      .filter(u => u.business_id === businessId && u.role === 'STAFF')
      .map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role || 'STAFF', created_at: u.created_at }));
  }

  async deleteStaffUser(staffId: string, businessId: string): Promise<boolean> {
    if (this.isPostgres && this.pgPool) {
      const res = await this.pgPool.query(
        `DELETE FROM users WHERE id = $1 AND business_id = $2 AND role = 'STAFF'`,
        [staffId, businessId]
      );
      return (res.rowCount ?? 0) > 0;
    }
    const idx = this.memoryDb.users.findIndex(u => u.id === staffId && u.business_id === businessId && u.role === 'STAFF');
    if (idx === -1) return false;
    this.memoryDb.users.splice(idx, 1);
    this.saveEmbeddedDb();
    return true;
  }

  async getBusinessByOwnerId(ownerId: string): Promise<BusinessRecord | null> {
    if (this.isPostgres && this.pgPool) {
      const res = await this.pgPool.query('SELECT * FROM businesses WHERE owner_id = $1 LIMIT 1', [ownerId]);
      return res.rows[0] || null;
    }
    const biz = this.memoryDb.businesses.find(b => b.owner_id === ownerId);
    return biz || null;
  }

  async getBusinessById(businessId: string): Promise<BusinessRecord | null> {
    if (this.isPostgres && this.pgPool) {
      const res = await this.pgPool.query('SELECT * FROM businesses WHERE id = $1 LIMIT 1', [businessId]);
      return res.rows[0] || null;
    }
    const biz = this.memoryDb.businesses.find(b => b.id === businessId);
    return biz || null;
  }

  async updateBusiness(businessId: string, data: Partial<Pick<BusinessRecord, 'business_name' | 'phone' | 'email' | 'address' | 'business_type' | 'upi_id' | 'upi_name'>>): Promise<BusinessRecord | null> {
    const now = new Date().toISOString();
    if (this.isPostgres && this.pgPool) {
      const res = await this.pgPool.query(
        `UPDATE businesses SET
          business_name = COALESCE($1, business_name),
          phone = COALESCE($2, phone),
          email = COALESCE($3, email),
          address = COALESCE($4, address),
          business_type = COALESCE($5, business_type),
          upi_id = COALESCE($6, upi_id),
          upi_name = COALESCE($7, upi_name),
          updated_at = $8
        WHERE id = $9 RETURNING *`,
        [data.business_name, data.phone, data.email, data.address, data.business_type, data.upi_id, data.upi_name, now, businessId]
      );
      return res.rows[0] || null;
    }

    const biz = this.memoryDb.businesses.find(b => b.id === businessId);
    if (!biz) return null;
    if (data.business_name !== undefined) biz.business_name = data.business_name.trim();
    if (data.phone !== undefined) biz.phone = data.phone.trim();
    if (data.email !== undefined) biz.email = data.email.trim();
    if (data.address !== undefined) biz.address = data.address.trim();
    if (data.business_type !== undefined) biz.business_type = data.business_type.trim();
    if (data.upi_id !== undefined) biz.upi_id = data.upi_id.trim();
    if (data.upi_name !== undefined) biz.upi_name = data.upi_name.trim();
    biz.updated_at = now;
    this.saveEmbeddedDb();
    return biz;
  }

  async updateUser(userId: string, data: { name?: string; passwordHash?: string }): Promise<UserRecord | null> {
    const now = new Date().toISOString();
    if (this.isPostgres && this.pgPool) {
      const res = await this.pgPool.query(
        `UPDATE users SET
          name = COALESCE($1, name),
          password_hash = COALESCE($2, password_hash),
          updated_at = $3
        WHERE id = $4 RETURNING *`,
        [data.name, data.passwordHash, now, userId]
      );
      return res.rows[0] || null;
    }

    const user = this.memoryDb.users.find(u => u.id === userId);
    if (!user) return null;
    if (data.name !== undefined) user.name = data.name.trim();
    if (data.passwordHash !== undefined) user.password_hash = data.passwordHash;
    user.updated_at = now;
    this.saveEmbeddedDb();
    return user;
  }

  // --- CUSTOMER METHODS (STRICT TENANT ISOLATION) ---

  async getCustomersWithBalances(
    businessId: string,
    options?: { search?: string; filter?: 'all' | 'outstanding' | 'settled' | 'recent'; sortBy?: 'balance_desc' | 'balance_asc' | 'name_asc' | 'recent' }
  ): Promise<CustomerWithBalance[]> {
    let rawCustomers: CustomerRecord[] = [];
    let rawTransactions: TransactionRecord[] = [];

    if (this.isPostgres && this.pgPool) {
      const custRes = await this.pgPool.query('SELECT * FROM customers WHERE business_id = $1 ORDER BY created_at DESC', [businessId]);
      rawCustomers = custRes.rows;
      const txRes = await this.pgPool.query('SELECT * FROM transactions WHERE business_id = $1 ORDER BY transaction_date DESC', [businessId]);
      rawTransactions = txRes.rows;
    } else {
      rawCustomers = this.memoryDb.customers.filter(c => c.business_id === businessId);
      rawTransactions = this.memoryDb.transactions.filter(t => t.business_id === businessId);
    }

    // Map balances per customer
    const txByCustomer = new Map<string, TransactionRecord[]>();
    for (const tx of rawTransactions) {
      const list = txByCustomer.get(tx.customer_id) || [];
      list.push(tx);
      txByCustomer.set(tx.customer_id, list);
    }

    let customersWithBalance: CustomerWithBalance[] = rawCustomers.map(c => {
      const txs = txByCustomer.get(c.id) || [];
      let totalCredit = 0;
      let totalPaid = 0;
      let lastTxDate: string | undefined = undefined;

      for (const t of txs) {
        const amt = Number(t.amount);
        if (t.type === 'CREDIT') {
          totalCredit += amt;
        } else if (t.type === 'PAYMENT') {
          totalPaid += amt;
        }
        if (!lastTxDate || new Date(t.transaction_date) > new Date(lastTxDate)) {
          lastTxDate = t.transaction_date;
        }
      }

      totalCredit = Math.round(totalCredit * 100) / 100;
      totalPaid = Math.round(totalPaid * 100) / 100;
      const outstandingBalance = Math.round((totalCredit - totalPaid) * 100) / 100;
      const trust = computeCustomerTrust(totalCredit, totalPaid, outstandingBalance, txs.length, lastTxDate);

      return {
        ...c,
        attachments: c.attachments || [],
        totalCredit,
        totalPaid,
        outstandingBalance,
        lastTransactionDate: lastTxDate,
        transactionCount: txs.length,
        trustScore: trust.trustScore,
        trustStars: trust.trustStars,
        trustRating: trust.trustRating,
        isHighRisk: trust.isHighRisk,
        daysOverdue: trust.daysOverdue,
      };
    });

    // Search filter
    if (options?.search) {
      const q = options.search.toLowerCase().trim();
      customersWithBalance = customersWithBalance.filter(
        c => c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q) || (c.email && c.email.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (options?.filter === 'outstanding') {
      customersWithBalance = customersWithBalance.filter(c => c.outstandingBalance > 0);
    } else if (options?.filter === 'settled') {
      customersWithBalance = customersWithBalance.filter(c => c.outstandingBalance <= 0);
    }

    // Sorting
    const sort = options?.sortBy || 'balance_desc';
    if (sort === 'balance_desc') {
      customersWithBalance.sort((a, b) => b.outstandingBalance - a.outstandingBalance);
    } else if (sort === 'balance_asc') {
      customersWithBalance.sort((a, b) => a.outstandingBalance - b.outstandingBalance);
    } else if (sort === 'name_asc') {
      customersWithBalance.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'recent') {
      customersWithBalance.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return customersWithBalance;
  }

  async getCustomerById(customerId: string, businessId: string): Promise<CustomerWithBalance | null> {
    let customer: CustomerRecord | null = null;
    let transactions: TransactionRecord[] = [];

    if (this.isPostgres && this.pgPool) {
      const custRes = await this.pgPool.query('SELECT * FROM customers WHERE id = $1 AND business_id = $2 LIMIT 1', [customerId, businessId]);
      if (custRes.rows.length === 0) return null;
      customer = custRes.rows[0];

      const txRes = await this.pgPool.query('SELECT * FROM transactions WHERE customer_id = $1 AND business_id = $2 ORDER BY transaction_date DESC', [customerId, businessId]);
      transactions = txRes.rows;
    } else {
      customer = this.memoryDb.customers.find(c => c.id === customerId && c.business_id === businessId) || null;
      if (!customer) return null;
      transactions = this.memoryDb.transactions.filter(t => t.customer_id === customerId && t.business_id === businessId);
    }

    let totalCredit = 0;
    let totalPaid = 0;
    let lastTxDate: string | undefined = undefined;

    for (const t of transactions) {
      const amt = Number(t.amount);
      if (t.type === 'CREDIT') {
        totalCredit += amt;
      } else if (t.type === 'PAYMENT') {
        totalPaid += amt;
      }
      if (!lastTxDate || new Date(t.transaction_date) > new Date(lastTxDate)) {
        lastTxDate = t.transaction_date;
      }
    }

    totalCredit = Math.round(totalCredit * 100) / 100;
    totalPaid = Math.round(totalPaid * 100) / 100;
    const outstandingBalance = Math.round((totalCredit - totalPaid) * 100) / 100;
    const trust = computeCustomerTrust(totalCredit, totalPaid, outstandingBalance, transactions.length, lastTxDate);

    const c = customer as CustomerRecord;
    return {
      id: c.id,
      business_id: c.business_id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      address: c.address,
      notes: c.notes,
      attachments: c.attachments || [],
      created_at: c.created_at,
      updated_at: c.updated_at || c.created_at,
      totalCredit,
      totalPaid,
      outstandingBalance,
      lastTransactionDate: lastTxDate,
      transactionCount: transactions.length,
      trustScore: trust.trustScore,
      trustStars: trust.trustStars,
      trustRating: trust.trustRating,
      isHighRisk: trust.isHighRisk,
      daysOverdue: trust.daysOverdue,
    };
  }

  async addCustomerAttachment(
    customerId: string,
    businessId: string,
    attachment: { name: string; dataUrl: string; fileType: string; size: number; uploadedBy?: string }
  ): Promise<CustomerAttachment> {
    const cust = await this.getCustomerById(customerId, businessId);
    if (!cust) {
      throw new Error('Customer not found');
    }
    const attachmentId = 'att_' + crypto.randomBytes(6).toString('hex');
    const newAtt: CustomerAttachment = {
      id: attachmentId,
      name: attachment.name,
      dataUrl: attachment.dataUrl,
      fileType: attachment.fileType,
      size: attachment.size,
      uploadedAt: new Date().toISOString(),
      uploadedBy: attachment.uploadedBy || 'Store User',
    };

    if (this.isPostgres && this.pgPool) {
      await this.pgPool.query(
        `UPDATE customers SET attachments = COALESCE(attachments, '[]'::jsonb) || $1::jsonb WHERE id = $2 AND business_id = $3`,
        [JSON.stringify([newAtt]), customerId, businessId]
      );
    } else {
      const memoryCust = this.memoryDb.customers.find(c => c.id === customerId && c.business_id === businessId);
      if (memoryCust) {
        if (!memoryCust.attachments) memoryCust.attachments = [];
        memoryCust.attachments.push(newAtt);
        this.saveEmbeddedDb();
      }
    }
    return newAtt;
  }

  async deleteCustomerAttachment(
    customerId: string,
    businessId: string,
    attachmentId: string
  ): Promise<boolean> {
    if (this.isPostgres && this.pgPool) {
      const res = await this.pgPool.query(
        `UPDATE customers
         SET attachments = (
           SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
           FROM jsonb_array_elements(COALESCE(attachments, '[]'::jsonb)) elem
           WHERE elem->>'id' <> $1
         )
         WHERE id = $2 AND business_id = $3`,
        [attachmentId, customerId, businessId]
      );
      return (res.rowCount ?? 0) > 0;
    }
    const memoryCust = this.memoryDb.customers.find(c => c.id === customerId && c.business_id === businessId);
    if (!memoryCust || !memoryCust.attachments) return false;
    const initialLen = memoryCust.attachments.length;
    memoryCust.attachments = memoryCust.attachments.filter(a => a.id !== attachmentId);
    if (memoryCust.attachments.length !== initialLen) {
      this.saveEmbeddedDb();
      return true;
    }
    return false;
  }

  async createCustomer(businessId: string, data: { name: string; phone: string; email?: string; address?: string; notes?: string }): Promise<CustomerRecord> {
    const id = 'cst_' + crypto.randomBytes(8).toString('hex');
    const now = new Date().toISOString();

    const record: CustomerRecord = {
      id,
      business_id: businessId,
      name: data.name.trim(),
      phone: data.phone.trim(),
      email: data.email?.trim() || '',
      address: data.address?.trim() || '',
      notes: data.notes?.trim() || '',
      created_at: now,
      updated_at: now,
    };

    if (this.isPostgres && this.pgPool) {
      await this.pgPool.query(
        `INSERT INTO customers (id, business_id, name, phone, email, address, notes, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [record.id, record.business_id, record.name, record.phone, record.email, record.address, record.notes, now, now]
      );
    } else {
      this.memoryDb.customers.push(record);
      this.saveEmbeddedDb();
    }

    return record;
  }

  async updateCustomer(customerId: string, businessId: string, data: Partial<Pick<CustomerRecord, 'name' | 'phone' | 'email' | 'address' | 'notes'>>): Promise<CustomerRecord | null> {
    const now = new Date().toISOString();

    if (this.isPostgres && this.pgPool) {
      const res = await this.pgPool.query(
        `UPDATE customers SET
          name = COALESCE($1, name),
          phone = COALESCE($2, phone),
          email = COALESCE($3, email),
          address = COALESCE($4, address),
          notes = COALESCE($5, notes),
          updated_at = $6
         WHERE id = $7 AND business_id = $8 RETURNING *`,
        [data.name, data.phone, data.email, data.address, data.notes, now, customerId, businessId]
      );
      return res.rows[0] || null;
    }

    const cust = this.memoryDb.customers.find(c => c.id === customerId && c.business_id === businessId);
    if (!cust) return null;
    if (data.name !== undefined) cust.name = data.name.trim();
    if (data.phone !== undefined) cust.phone = data.phone.trim();
    if (data.email !== undefined) cust.email = data.email.trim();
    if (data.address !== undefined) cust.address = data.address.trim();
    if (data.notes !== undefined) cust.notes = data.notes.trim();
    cust.updated_at = now;
    this.saveEmbeddedDb();
    return cust;
  }

  async deleteCustomer(customerId: string, businessId: string): Promise<boolean> {
    if (this.isPostgres && this.pgPool) {
      const client = await this.pgPool.connect();
      try {
        await client.query('BEGIN');
        await client.query('DELETE FROM transactions WHERE customer_id = $1 AND business_id = $2', [customerId, businessId]);
        const res = await client.query('DELETE FROM customers WHERE id = $1 AND business_id = $2', [customerId, businessId]);
        await client.query('COMMIT');
        return (res.rowCount ?? 0) > 0;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }

    const idx = this.memoryDb.customers.findIndex(c => c.id === customerId && c.business_id === businessId);
    if (idx === -1) return false;
    this.memoryDb.customers.splice(idx, 1);
    // Cascade delete transactions
    this.memoryDb.transactions = this.memoryDb.transactions.filter(t => !(t.customer_id === customerId && t.business_id === businessId));
    this.saveEmbeddedDb();
    return true;
  }

  // --- TRANSACTIONS METHODS (STRICT TENANT ISOLATION) ---

  async getTransactions(
    businessId: string,
    options?: {
      customerId?: string;
      type?: 'CREDIT' | 'PAYMENT';
      startDate?: string;
      endDate?: string;
      search?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ transactions: Array<TransactionRecord & { customerName: string; customerPhone: string; runningBalance?: number }>; total: number }> {
    let allCustomers: CustomerRecord[] = [];
    let allTx: TransactionRecord[] = [];

    if (this.isPostgres && this.pgPool) {
      const custRes = await this.pgPool.query('SELECT * FROM customers WHERE business_id = $1', [businessId]);
      allCustomers = custRes.rows;

      const txRes = await this.pgPool.query('SELECT * FROM transactions WHERE business_id = $1 ORDER BY transaction_date DESC, created_at DESC', [businessId]);
      allTx = txRes.rows;
    } else {
      allCustomers = this.memoryDb.customers.filter(c => c.business_id === businessId);
      allTx = this.memoryDb.transactions.filter(t => t.business_id === businessId);
    }

    const customerMap = new Map<string, CustomerRecord>();
    for (const c of allCustomers) {
      customerMap.set(c.id, c);
    }

    let filtered = allTx.map(t => {
      const cust = customerMap.get(t.customer_id);
      return {
        ...t,
        amount: Number(t.amount),
        customerName: cust?.name || 'Unknown Customer',
        customerPhone: cust?.phone || '',
      };
    });

    if (options?.customerId) {
      filtered = filtered.filter(t => t.customer_id === options.customerId);
    }

    if (options?.type) {
      filtered = filtered.filter(t => t.type === options.type);
    }

    if (options?.startDate) {
      const start = new Date(options.startDate).getTime();
      filtered = filtered.filter(t => new Date(t.transaction_date).getTime() >= start);
    }

    if (options?.endDate) {
      const end = new Date(options.endDate).getTime();
      filtered = filtered.filter(t => new Date(t.transaction_date).getTime() <= end);
    }

    if (options?.search) {
      const q = options.search.toLowerCase().trim();
      filtered = filtered.filter(
        t => t.customerName.toLowerCase().includes(q) || t.customerPhone.includes(q) || (t.description && t.description.toLowerCase().includes(q))
      );
    }

    // Sort by date DESC
    filtered.sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());

    // If specific customer is viewed, calculate running balance for them chronologically
    if (options?.customerId) {
      // Sort ASC to compute running balance from start to finish
      const chronological = [...filtered].sort((a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime());
      let currentBal = 0;
      const runningBalanceMap = new Map<string, number>();

      for (const t of chronological) {
        if (t.type === 'CREDIT') {
          currentBal += t.amount;
        } else {
          currentBal -= t.amount;
        }
        currentBal = Math.round(currentBal * 100) / 100;
        runningBalanceMap.set(t.id, currentBal);
      }

      filtered = filtered.map(t => ({
        ...t,
        runningBalance: runningBalanceMap.get(t.id) ?? 0,
      }));
    }

    const total = filtered.length;
    const offset = options?.offset || 0;
    const limit = options?.limit || 100;
    const paginated = filtered.slice(offset, offset + limit);

    return { transactions: paginated, total };
  }

  async createTransaction(businessId: string, data: {
    customerId: string;
    type: TransactionType;
    amount: number;
    transactionDate?: string;
    description?: string;
    paymentMethod?: string;
    items?: TransactionItem[];
    createdBy?: string;
  }): Promise<TransactionRecord> {
    if (data.amount <= 0) {
      throw new Error('Transaction amount must be greater than zero');
    }

    // Check customer exists and belongs to this business
    const customer = await this.getCustomerById(data.customerId, businessId);
    if (!customer) {
      throw new Error('Customer not found or unauthorized');
    }

    const id = 'txn_' + crypto.randomBytes(8).toString('hex');
    const now = new Date().toISOString();
    const date = data.transactionDate ? new Date(data.transactionDate).toISOString() : now;

    const record: TransactionRecord = {
      id,
      business_id: businessId,
      customer_id: data.customerId,
      type: data.type,
      amount: Math.round(data.amount * 100) / 100,
      transaction_date: date,
      description: data.description?.trim() || '',
      payment_method: data.type === 'PAYMENT' ? (data.paymentMethod || 'Cash') : undefined,
      items: data.items && Array.isArray(data.items) ? data.items : undefined,
      created_by: data.createdBy,
      created_at: now,
      updated_at: now,
    };

    if (this.isPostgres && this.pgPool) {
      await this.pgPool.query(
        `INSERT INTO transactions (id, business_id, customer_id, type, amount, transaction_date, description, payment_method, items, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [record.id, record.business_id, record.customer_id, record.type, record.amount, record.transaction_date, record.description, record.payment_method, JSON.stringify(record.items || []), record.created_by, now, now]
      );
    } else {
      this.memoryDb.transactions.push(record);
      this.saveEmbeddedDb();
    }

    return record;
  }

  async deleteTransaction(transactionId: string, businessId: string): Promise<boolean> {
    if (this.isPostgres && this.pgPool) {
      const res = await this.pgPool.query('DELETE FROM transactions WHERE id = $1 AND business_id = $2', [transactionId, businessId]);
      return (res.rowCount ?? 0) > 0;
    }

    const idx = this.memoryDb.transactions.findIndex(t => t.id === transactionId && t.business_id === businessId);
    if (idx === -1) return false;
    this.memoryDb.transactions.splice(idx, 1);
    this.saveEmbeddedDb();
    return true;
  }

  // --- DASHBOARD AGGREGATIONS ---

  async getDashboardStats(businessId: string): Promise<DashboardStats> {
    const customers = await this.getCustomersWithBalances(businessId);
    const { transactions: recentTransactions } = await this.getTransactions(businessId, { limit: 10 });
    const { transactions: allTransactions } = await this.getTransactions(businessId, { limit: 10000 });

    let totalCreditGiven = 0;
    let totalPaymentsReceived = 0;
    let activeAccounts = 0;
    let settledAccounts = 0;

    for (const c of customers) {
      totalCreditGiven += c.totalCredit;
      totalPaymentsReceived += c.totalPaid;
      if (c.outstandingBalance > 0) {
        activeAccounts++;
      } else {
        settledAccounts++;
      }
    }

    totalCreditGiven = Math.round(totalCreditGiven * 100) / 100;
    totalPaymentsReceived = Math.round(totalPaymentsReceived * 100) / 100;
    const totalOutstanding = Math.round((totalCreditGiven - totalPaymentsReceived) * 100) / 100;

    // Generate monthly trends for the last 6 calendar months
    const monthlyTrends: MonthlyTrendData[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthIndex = d.getMonth();
      const monthLabel = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      let credit = 0;
      let payment = 0;

      for (const tx of allTransactions) {
        const txDate = new Date(tx.transaction_date);
        if (txDate.getFullYear() === year && txDate.getMonth() === monthIndex) {
          const amt = Number(tx.amount);
          if (tx.type === 'CREDIT') {
            credit += amt;
          } else if (tx.type === 'PAYMENT') {
            payment += amt;
          }
        }
      }

      credit = Math.round(credit * 100) / 100;
      payment = Math.round(payment * 100) / 100;
      const netGrowth = Math.round((credit - payment) * 100) / 100;

      monthlyTrends.push({
        month: monthLabel,
        credit,
        payment,
        netGrowth,
      });
    }

    // Payment methods breakdown
    const methodTotals = new Map<string, { totalAmount: number; count: number }>();
    for (const tx of allTransactions) {
      if (tx.type === 'PAYMENT') {
        const method = tx.payment_method?.trim() || 'Cash';
        const curr = methodTotals.get(method) || { totalAmount: 0, count: 0 };
        curr.totalAmount += Number(tx.amount);
        curr.count += 1;
        methodTotals.set(method, curr);
      }
    }

    const paymentMethodsBreakdown: PaymentMethodBreakdown[] = Array.from(methodTotals.entries()).map(([method, data]) => ({
      method,
      totalAmount: Math.round(data.totalAmount * 100) / 100,
      count: data.count,
    }));

    // High risk customers (outstanding dues > 0 and overdue >= 30 days)
    const highRiskCustomers: HighRiskCustomerSummary[] = customers
      .filter(c => c.isHighRisk)
      .sort((a, b) => b.daysOverdue - a.daysOverdue || b.outstandingBalance - a.outstandingBalance)
      .map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        outstandingBalance: c.outstandingBalance,
        daysOverdue: c.daysOverdue,
        lastTransactionDate: c.lastTransactionDate,
        trustScore: c.trustScore,
        trustRating: c.trustRating,
      }));

    // Top debtors (highest outstanding balance)
    const topDebtors = customers
      .filter(c => c.outstandingBalance > 0)
      .sort((a, b) => b.outstandingBalance - a.outstandingBalance)
      .slice(0, 5)
      .map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        outstandingBalance: c.outstandingBalance,
        lastTransactionDate: c.lastTransactionDate,
        trustScore: c.trustScore,
      }));

    // Recently added customers
    const recentCustomers = [...customers]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    // Overdue accounts calculation based on configured threshold (default 15 days)
    const reminderSettings = await this.getReminderSettings(businessId);
    const thresholdDays = reminderSettings.threshold_days || 15;
    const overdueReport = await this.getOverdueReport(businessId, thresholdDays);

    return {
      totalCustomers: customers.length,
      activeAccounts,
      settledAccounts,
      totalCreditGiven,
      totalPaymentsReceived,
      totalOutstanding,
      monthlyTrends,
      paymentMethodsBreakdown,
      highRiskCustomers,
      recentTransactions,
      topDebtors,
      recentCustomers,
      overdueCount: overdueReport.overdueCount,
      overdueAmount: overdueReport.totalOverdueAmount,
    };
  }

  // --- AUTOMATED PAYMENT REMINDERS (THRESHOLDS, SMS & WHATSAPP) ---

  async getReminderSettings(businessId: string): Promise<ReminderSettingsRecord> {
    if (this.isPostgres && this.pgPool) {
      const res = await this.pgPool.query('SELECT * FROM reminder_settings WHERE business_id = $1 LIMIT 1', [businessId]);
      if (res.rows.length > 0) {
        return res.rows[0];
      }
    } else {
      const existing = (this.memoryDb.reminder_settings || []).find(s => s.business_id === businessId);
      if (existing) return existing;
    }

    // Default settings
    const defaultSettings: ReminderSettingsRecord = {
      business_id: businessId,
      enabled: true,
      threshold_days: 15,
      preferred_channel: 'WHATSAPP',
      cooldown_days: 3,
      include_upi: true,
      min_balance: 1,
      message_template_en: `Dear {customerName},\n\nThis is a friendly payment reminder from *{storeName}*. Your account has a pending balance of {amount} which has been unpaid for {daysOverdue} days.\n\nKindly clear this payment at your convenience{upiInfo}.\n\nThank you for shopping with us! 🙏`,
      message_template_hi: `नमस्ते {customerName} जी,\n\nयह *{storeName}* की ओर से आपके खाते की बकाया राशि {amount} के संबंध में एक विनम्र अनुस्मारक (Reminder) है, जो {daysOverdue} दिनों से बकाया है।\n\nकृपया सुविधानुसार इसका भुगतान करें{upiInfo}।\n\nधन्यवाद! 🙏`,
      updated_at: new Date().toISOString(),
    };

    if (this.isPostgres && this.pgPool) {
      await this.pgPool.query(
        `INSERT INTO reminder_settings (business_id, enabled, threshold_days, preferred_channel, cooldown_days, include_upi, min_balance, message_template_en, message_template_hi, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (business_id) DO NOTHING`,
        [
          defaultSettings.business_id,
          defaultSettings.enabled,
          defaultSettings.threshold_days,
          defaultSettings.preferred_channel,
          defaultSettings.cooldown_days,
          defaultSettings.include_upi,
          defaultSettings.min_balance,
          defaultSettings.message_template_en,
          defaultSettings.message_template_hi,
          defaultSettings.updated_at,
        ]
      );
    } else {
      if (!this.memoryDb.reminder_settings) this.memoryDb.reminder_settings = [];
      this.memoryDb.reminder_settings.push(defaultSettings);
      this.saveEmbeddedDb();
    }

    return defaultSettings;
  }

  async updateReminderSettings(businessId: string, data: Partial<ReminderSettingsRecord>): Promise<ReminderSettingsRecord> {
    const current = await this.getReminderSettings(businessId);
    const now = new Date().toISOString();

    const updated: ReminderSettingsRecord = {
      ...current,
      enabled: data.enabled !== undefined ? Boolean(data.enabled) : current.enabled,
      threshold_days: data.threshold_days !== undefined ? Math.max(1, Number(data.threshold_days)) : current.threshold_days,
      preferred_channel: (data.preferred_channel || current.preferred_channel) as ReminderChannel,
      cooldown_days: data.cooldown_days !== undefined ? Math.max(0, Number(data.cooldown_days)) : current.cooldown_days,
      include_upi: data.include_upi !== undefined ? Boolean(data.include_upi) : current.include_upi,
      min_balance: data.min_balance !== undefined ? Math.max(0, Number(data.min_balance)) : current.min_balance,
      message_template_en: data.message_template_en !== undefined ? data.message_template_en : current.message_template_en,
      message_template_hi: data.message_template_hi !== undefined ? data.message_template_hi : current.message_template_hi,
      updated_at: now,
    };

    if (this.isPostgres && this.pgPool) {
      await this.pgPool.query(
        `INSERT INTO reminder_settings (business_id, enabled, threshold_days, preferred_channel, cooldown_days, include_upi, min_balance, message_template_en, message_template_hi, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (business_id) DO UPDATE SET
          enabled = EXCLUDED.enabled,
          threshold_days = EXCLUDED.threshold_days,
          preferred_channel = EXCLUDED.preferred_channel,
          cooldown_days = EXCLUDED.cooldown_days,
          include_upi = EXCLUDED.include_upi,
          min_balance = EXCLUDED.min_balance,
          message_template_en = EXCLUDED.message_template_en,
          message_template_hi = EXCLUDED.message_template_hi,
          updated_at = EXCLUDED.updated_at`,
        [
          updated.business_id,
          updated.enabled,
          updated.threshold_days,
          updated.preferred_channel,
          updated.cooldown_days,
          updated.include_upi,
          updated.min_balance,
          updated.message_template_en,
          updated.message_template_hi,
          updated.updated_at,
        ]
      );
    } else {
      if (!this.memoryDb.reminder_settings) this.memoryDb.reminder_settings = [];
      const idx = this.memoryDb.reminder_settings.findIndex(s => s.business_id === businessId);
      if (idx !== -1) {
        this.memoryDb.reminder_settings[idx] = updated;
      } else {
        this.memoryDb.reminder_settings.push(updated);
      }
      this.saveEmbeddedDb();
    }

    return updated;
  }

  async createReminderLog(businessId: string, logData: Omit<ReminderLogRecord, 'id' | 'sent_at'>): Promise<ReminderLogRecord> {
    const id = 'rem_' + crypto.randomBytes(8).toString('hex');
    const sent_at = new Date().toISOString();

    const record: ReminderLogRecord = {
      id,
      business_id: businessId,
      customer_id: logData.customer_id,
      customer_name: logData.customer_name,
      customer_phone: logData.customer_phone,
      amount: Number(logData.amount),
      days_overdue: Number(logData.days_overdue),
      channel: logData.channel,
      status: logData.status || 'SENT',
      message_preview: logData.message_preview,
      sent_at,
    };

    if (this.isPostgres && this.pgPool) {
      await this.pgPool.query(
        `INSERT INTO reminder_logs (id, business_id, customer_id, customer_name, customer_phone, amount, days_overdue, channel, status, message_preview, sent_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [record.id, record.business_id, record.customer_id, record.customer_name, record.customer_phone, record.amount, record.days_overdue, record.channel, record.status, record.message_preview, record.sent_at]
      );
    } else {
      if (!this.memoryDb.reminder_logs) this.memoryDb.reminder_logs = [];
      this.memoryDb.reminder_logs.unshift(record);
      // Keep up to 200 logs
      if (this.memoryDb.reminder_logs.length > 200) {
        this.memoryDb.reminder_logs = this.memoryDb.reminder_logs.slice(0, 200);
      }
      this.saveEmbeddedDb();
    }

    return record;
  }

  async getReminderLogs(businessId: string, limit: number = 50): Promise<ReminderLogRecord[]> {
    if (this.isPostgres && this.pgPool) {
      const res = await this.pgPool.query(
        `SELECT * FROM reminder_logs WHERE business_id = $1 ORDER BY sent_at DESC LIMIT $2`,
        [businessId, limit]
      );
      return res.rows;
    }

    return (this.memoryDb.reminder_logs || [])
      .filter(l => l.business_id === businessId)
      .slice(0, limit);
  }

  async getOverdueReport(businessId: string, customThreshold?: number): Promise<OverdueOverviewResponse> {
    const settings = await this.getReminderSettings(businessId);
    const thresholdDays = customThreshold !== undefined ? Math.max(1, Number(customThreshold)) : settings.threshold_days;
    const business = await this.getBusinessById(businessId);
    const storeName = business?.business_name || 'My Store';
    const upiId = business?.upi_id || '';

    const customers = await this.getCustomersWithBalances(businessId);
    const { transactions: allTransactions } = await this.getTransactions(businessId, { limit: 10000 });
    const allLogs = await this.getReminderLogs(businessId, 100);

    // Group transactions by customer
    const txByCustomer = new Map<string, TransactionRecord[]>();
    for (const t of allTransactions) {
      const list = txByCustomer.get(t.customer_id) || [];
      list.push(t);
      txByCustomer.set(t.customer_id, list);
    }

    // Group logs by customer
    const logsByCustomer = new Map<string, ReminderLogRecord[]>();
    for (const log of allLogs) {
      const list = logsByCustomer.get(log.customer_id) || [];
      list.push(log);
      logsByCustomer.set(log.customer_id, list);
    }

    const reportCustomers: OverdueCustomerReport[] = [];

    for (const customer of customers) {
      if (customer.outstandingBalance < settings.min_balance) {
        continue;
      }

      const txs = txByCustomer.get(customer.id) || [];
      // Sort transactions chronologically ascending
      const sortedTxs = [...txs].sort((a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime());

      // Calculate FIFO oldest unpaid credit
      let totalPayments = 0;
      let lastPaymentDate: string | undefined = undefined;

      for (const t of sortedTxs) {
        if (t.type === 'PAYMENT') {
          totalPayments += Number(t.amount);
          lastPaymentDate = t.transaction_date;
        }
      }

      let remainingPayments = totalPayments;
      let oldestUnpaidDate: string | undefined = undefined;

      for (const t of sortedTxs) {
        if (t.type === 'CREDIT') {
          const creditAmt = Number(t.amount);
          if (remainingPayments >= creditAmt) {
            remainingPayments -= creditAmt;
          } else {
            oldestUnpaidDate = t.transaction_date;
            break;
          }
        }
      }

      // Fallback if no specific credit matched
      if (!oldestUnpaidDate) {
        oldestUnpaidDate = customer.lastTransactionDate || customer.created_at;
      }

      const daysUnpaid = Math.max(0, Math.floor((Date.now() - new Date(oldestUnpaidDate).getTime()) / (1000 * 60 * 60 * 24)));
      const isOverdue = daysUnpaid >= thresholdDays;

      // Check last reminder sent
      const custLogs = logsByCustomer.get(customer.id) || [];
      const lastLog = custLogs[0]; // Already sorted DESC
      const lastReminderSent = lastLog?.sent_at;
      const daysSinceLastReminder = lastReminderSent
        ? Math.floor((Date.now() - new Date(lastReminderSent).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      const isEligible = isOverdue && (daysSinceLastReminder === null || daysSinceLastReminder >= (settings.cooldown_days || 3));

      // Construct messages
      const formattedAmt = `₹${customer.outstandingBalance.toLocaleString('en-IN')}`;
      const upiTextEn = settings.include_upi && upiId ? `\n\nUPI Payment ID: *${upiId}*` : '';
      const upiTextHi = settings.include_upi && upiId ? `\n\nUPI पेमेंट ID: *${upiId}*` : '';
      const upiSmsText = settings.include_upi && upiId ? ` UPI: ${upiId}.` : '';

      const reminderMessageEn = (settings.message_template_en || '')
        .replace(/{customerName}/g, customer.name)
        .replace(/{storeName}/g, storeName)
        .replace(/{amount}/g, formattedAmt)
        .replace(/{daysOverdue}/g, String(daysUnpaid))
        .replace(/{upiInfo}/g, upiTextEn);

      const reminderMessageHi = (settings.message_template_hi || '')
        .replace(/{customerName}/g, customer.name)
        .replace(/{storeName}/g, storeName)
        .replace(/{amount}/g, formattedAmt)
        .replace(/{daysOverdue}/g, String(daysUnpaid))
        .replace(/{upiInfo}/g, upiTextHi);

      // Clean phone numbers
      let cleanPhoneWa = customer.phone.replace(/[^\d]/g, '');
      if (cleanPhoneWa.length === 10) cleanPhoneWa = '91' + cleanPhoneWa;

      let cleanPhoneSms = customer.phone.replace(/[^\d+]/g, '');
      if (cleanPhoneSms.length === 10 && !cleanPhoneSms.startsWith('+')) cleanPhoneSms = '+91' + cleanPhoneSms;

      const whatsappUrl = `https://wa.me/${cleanPhoneWa}?text=${encodeURIComponent(reminderMessageEn)}`;
      const smsMessage = `Dear ${customer.name}, Reminder from ${storeName}: Your balance of ${formattedAmt} has been unpaid for ${daysUnpaid} days.${upiSmsText} Please arrange payment. Thank you!`;
      const smsUrl = `sms:${cleanPhoneSms}?body=${encodeURIComponent(smsMessage)}`;

      const suggestedChannel: 'WHATSAPP' | 'SMS' =
        settings.preferred_channel === 'SMS' ? 'SMS' : 'WHATSAPP';

      reportCustomers.push({
        customer,
        daysUnpaid,
        isOverdue,
        oldestUnpaidDate,
        lastPaymentDate,
        lastReminderSent,
        daysSinceLastReminder,
        isEligible,
        suggestedChannel,
        whatsappUrl,
        smsUrl,
        reminderMessageEn,
        reminderMessageHi,
      });
    }

    // Filter to overdue customers and sort by days unpaid descending
    const overdueList = reportCustomers
      .filter(r => r.isOverdue)
      .sort((a, b) => b.daysUnpaid - a.daysUnpaid || b.customer.outstandingBalance - a.customer.outstandingBalance);

    const totalOverdueAmount = Math.round(overdueList.reduce((sum, item) => sum + item.customer.outstandingBalance, 0) * 100) / 100;
    const eligibleCount = overdueList.filter(item => item.isEligible).length;

    return {
      thresholdDays,
      settings,
      overdueCount: overdueList.length,
      totalOverdueAmount,
      eligibleCount,
      customers: overdueList,
      recentLogs: allLogs.slice(0, 15),
    };
  }

  async sendBatchReminders(
    businessId: string,
    options: {
      customerIds?: string[];
      thresholdDays?: number;
      channel?: ReminderChannel;
      lang?: 'en' | 'hi';
    }
  ): Promise<{
    dispatched: number;
    totalAmount: number;
    logs: ReminderLogRecord[];
    results: Array<{ customerId: string; name: string; phone: string; whatsappUrl: string; smsUrl: string }>;
  }> {
    const report = await this.getOverdueReport(businessId, options.thresholdDays);
    const chosenChannel = options.channel || report.settings.preferred_channel;
    const targetChannel: 'WHATSAPP' | 'SMS' = chosenChannel === 'SMS' ? 'SMS' : 'WHATSAPP';

    // Target customers: either specific IDs or all eligible
    let targets = report.customers;
    if (options.customerIds && options.customerIds.length > 0) {
      targets = targets.filter(t => options.customerIds!.includes(t.customer.id));
    } else {
      targets = targets.filter(t => t.isEligible);
    }

    const createdLogs: ReminderLogRecord[] = [];
    const results: Array<{ customerId: string; name: string; phone: string; whatsappUrl: string; smsUrl: string }> = [];
    let totalAmount = 0;

    for (const item of targets) {
      const msg = options.lang === 'hi' ? item.reminderMessageHi : item.reminderMessageEn;
      const preview = msg.replace(/\n+/g, ' ').slice(0, 100);

      const log = await this.createReminderLog(businessId, {
        customer_id: item.customer.id,
        customer_name: item.customer.name,
        customer_phone: item.customer.phone,
        amount: item.customer.outstandingBalance,
        days_overdue: item.daysUnpaid,
        channel: targetChannel,
        status: 'SENT',
        message_preview: preview,
      });

      createdLogs.push(log);
      totalAmount += item.customer.outstandingBalance;

      results.push({
        customerId: item.customer.id,
        name: item.customer.name,
        phone: item.customer.phone,
        whatsappUrl: item.whatsappUrl,
        smsUrl: item.smsUrl,
      });
    }

    return {
      dispatched: createdLogs.length,
      totalAmount: Math.round(totalAmount * 100) / 100,
      logs: createdLogs,
      results,
    };
  }

  // --- SEED REALISTIC DEMO DATA ---

  async seedSampleData(businessId: string): Promise<{ customerCount: number; transactionCount: number }> {
    // Check if customers already exist
    const existing = await this.getCustomersWithBalances(businessId);
    if (existing.length > 0) {
      // Already has data
      return { customerCount: existing.length, transactionCount: 0 };
    }

    const sampleCustomers = [
      {
        name: 'Rahul Sharma',
        phone: '+91 98234 11200',
        email: 'rahul.sharma@gmail.com',
        address: 'B-14, Sector 18, Main Market',
        notes: 'Regular customer, buys monthly groceries on udhaar',
      },
      {
        name: 'Amit Kumar',
        phone: '+91 97112 45890',
        email: 'amit.kumar@outlook.com',
        address: 'Shop 4, Ground Floor, Gandhi Nagar',
        notes: 'Settles udhaar every Friday',
      },
      {
        name: 'Priya Verma',
        phone: '+91 98450 78213',
        email: 'priya.verma@yahoo.com',
        address: 'House 82, Green Park Colony',
        notes: 'Buys household supplies and dairy',
      },
      {
        name: 'Suresh Patel',
        phone: '+91 99001 23456',
        email: '',
        address: 'Patel Dairy Lane, Near Water Tank',
        notes: 'Reliable customer, prompt payer',
      },
      {
        name: 'Pooja Gupta',
        phone: '+91 91234 56780',
        email: 'pooja.gupta@gmail.com',
        address: 'Flat 302, Sunrise Apartments',
        notes: 'Monthly kirana account',
      },
    ];

    let createdCustomers = 0;
    let createdTx = 0;

    for (const sc of sampleCustomers) {
      const cust = await this.createCustomer(businessId, sc);
      createdCustomers++;

      if (sc.name === 'Rahul Sharma') {
        // ₹5,000 credit, ₹2,000 payment, ₹1,500 credit => ₹4,500 outstanding
        await this.createTransaction(businessId, {
          customerId: cust.id,
          type: 'CREDIT',
          amount: 5000,
          transactionDate: new Date(Date.now() - 10 * 86400000).toISOString(),
          description: 'Monthly grocery ration (Atta, Dal, Oil, Spices)',
        });
        await this.createTransaction(businessId, {
          customerId: cust.id,
          type: 'PAYMENT',
          amount: 2000,
          transactionDate: new Date(Date.now() - 6 * 86400000).toISOString(),
          description: 'Partial payment received',
          paymentMethod: 'UPI',
        });
        await this.createTransaction(businessId, {
          customerId: cust.id,
          type: 'CREDIT',
          amount: 1500,
          transactionDate: new Date(Date.now() - 2 * 86400000).toISOString(),
          description: 'Dry fruits and ghee package',
        });
        createdTx += 3;
      } else if (sc.name === 'Amit Kumar') {
        // ₹3,200 credit, ₹1,200 payment => ₹2,000 outstanding
        await this.createTransaction(businessId, {
          customerId: cust.id,
          type: 'CREDIT',
          amount: 3200,
          transactionDate: new Date(Date.now() - 8 * 86400000).toISOString(),
          description: 'Snacks & confectionery carton',
        });
        await this.createTransaction(businessId, {
          customerId: cust.id,
          type: 'PAYMENT',
          amount: 1200,
          transactionDate: new Date(Date.now() - 3 * 86400000).toISOString(),
          description: 'Cash payment on shop visit',
          paymentMethod: 'Cash',
        });
        createdTx += 2;
      } else if (sc.name === 'Priya Verma') {
        // ₹1,850 credit, ₹1,850 payment => Fully settled (₹0)
        await this.createTransaction(businessId, {
          customerId: cust.id,
          type: 'CREDIT',
          amount: 1850,
          transactionDate: new Date(Date.now() - 12 * 86400000).toISOString(),
          description: 'Cleaning items and detergents',
        });
        await this.createTransaction(businessId, {
          customerId: cust.id,
          type: 'PAYMENT',
          amount: 1850,
          transactionDate: new Date(Date.now() - 4 * 86400000).toISOString(),
          description: 'Full bill cleared via Google Pay',
          paymentMethod: 'UPI',
        });
        createdTx += 2;
      } else if (sc.name === 'Suresh Patel') {
        // ₹6,400 credit => ₹6,400 outstanding
        await this.createTransaction(businessId, {
          customerId: cust.id,
          type: 'CREDIT',
          amount: 6400,
          transactionDate: new Date(Date.now() - 5 * 86400000).toISOString(),
          description: 'Bulk tea bags, sugar sacks, and dairy supplies',
        });
        createdTx += 1;
      } else if (sc.name === 'Pooja Gupta') {
        // ₹2,800 credit, ₹800 payment => ₹2,000 outstanding
        await this.createTransaction(businessId, {
          customerId: cust.id,
          type: 'CREDIT',
          amount: 2800,
          transactionDate: new Date(Date.now() - 7 * 86400000).toISOString(),
          description: 'Organic grains & honey',
        });
        await this.createTransaction(businessId, {
          customerId: cust.id,
          type: 'PAYMENT',
          amount: 800,
          transactionDate: new Date(Date.now() - 1 * 86400000).toISOString(),
          description: 'Paytm UPI transfer',
          paymentMethod: 'UPI',
        });
        createdTx += 2;
      }
    }

    return { customerCount: createdCustomers, transactionCount: createdTx };
  }

  async resetBusinessData(businessId: string): Promise<void> {
    if (this.isPostgres && this.pgPool) {
      const client = await this.pgPool.connect();
      try {
        await client.query('BEGIN');
        await client.query('DELETE FROM reminder_logs WHERE business_id = $1', [businessId]);
        await client.query('DELETE FROM transactions WHERE business_id = $1', [businessId]);
        await client.query('DELETE FROM customers WHERE business_id = $1', [businessId]);
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
      return;
    }

    if (this.memoryDb.reminder_logs) {
      this.memoryDb.reminder_logs = this.memoryDb.reminder_logs.filter(l => l.business_id !== businessId);
    }
    this.memoryDb.transactions = this.memoryDb.transactions.filter(t => t.business_id !== businessId);
    this.memoryDb.customers = this.memoryDb.customers.filter(c => c.business_id !== businessId);
    this.saveEmbeddedDb();
  }

  async deleteAccount(userId: string, businessId: string): Promise<void> {
    if (this.isPostgres && this.pgPool) {
      const client = await this.pgPool.connect();
      try {
        await client.query('BEGIN');
        await client.query('DELETE FROM reminder_logs WHERE business_id = $1', [businessId]);
        await client.query('DELETE FROM reminder_settings WHERE business_id = $1', [businessId]);
        await client.query('DELETE FROM transactions WHERE business_id = $1', [businessId]);
        await client.query('DELETE FROM customers WHERE business_id = $1', [businessId]);
        await client.query('DELETE FROM businesses WHERE id = $1', [businessId]);
        await client.query('DELETE FROM users WHERE id = $1', [userId]);
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
      return;
    }

    if (this.memoryDb.reminder_logs) {
      this.memoryDb.reminder_logs = this.memoryDb.reminder_logs.filter(l => l.business_id !== businessId);
    }
    if (this.memoryDb.reminder_settings) {
      this.memoryDb.reminder_settings = this.memoryDb.reminder_settings.filter(s => s.business_id !== businessId);
    }
    this.memoryDb.transactions = this.memoryDb.transactions.filter(t => t.business_id !== businessId);
    this.memoryDb.customers = this.memoryDb.customers.filter(c => c.business_id !== businessId);
    this.memoryDb.businesses = this.memoryDb.businesses.filter(b => b.id !== businessId);
    this.memoryDb.users = this.memoryDb.users.filter(u => u.id !== userId);
    this.saveEmbeddedDb();
  }
}

export const db = new DatabaseManager();
