import { Router, Response } from 'express';
import {
  db,
  TransactionType,
  TransactionItem,
} from './db.js';
import {
  AuthenticatedRequest,
  generateToken,
  hashPassword,
  comparePassword,
  requireAuth,
  requireOwner,
} from './auth.js';

export const apiRouter = Router();

// --- HEALTH CHECK ---
apiRouter.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), app: 'CreditTrack' });
});

// --- AUTHENTICATION ROUTES ---

apiRouter.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password, businessName, phone, businessType, address } = req.body;

    if (!name || !email || !password || !businessName || !phone) {
      res.status(400).json({ error: 'Please provide all required fields: name, email, password, business name, and phone number.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    const existingUser = await db.findUserByEmail(email);
    if (existingUser) {
      res.status(409).json({ error: 'An account with this email address already exists. Please log in instead.' });
      return;
    }

    const passwordHash = await hashPassword(password);
    const { user, business } = await db.createUser({
      name,
      email,
      passwordHash,
      businessName,
      phone,
      businessType: businessType || 'General Store',
      address: address || '',
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      businessId: business.id,
    });

    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
      business,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'An unexpected error occurred during registration. Please try again.' });
  }
});

apiRouter.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Please enter both email and password.' });
      return;
    }

    const user = await db.findUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password. Please check your credentials.' });
      return;
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password. Please check your credentials.' });
      return;
    }

    const userRole = user.role || 'OWNER';
    let business = null;
    if (userRole === 'STAFF' && user.business_id) {
      business = await db.getBusinessById(user.business_id);
    } else {
      business = await db.getBusinessByOwnerId(user.id);
    }
    if (!business) {
      res.status(500).json({ error: 'No associated business profile found for this user account.' });
      return;
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      businessId: business.id,
      role: userRole,
    });

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: userRole },
      business,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'An error occurred while logging in. Please try again.' });
  }
});

// --- GOOGLE SIGN-IN / GMAIL AUTHENTICATION ---

apiRouter.get('/auth/google/config', (req, res) => {
  res.json({
    clientId: process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '',
  });
});

apiRouter.post('/auth/google', async (req, res) => {
  try {
    const { credential, email, name, businessName } = req.body;

    let targetEmail = '';
    let targetName = '';

    // If Google ID token credential passed from Google Identity Services
    if (credential && typeof credential === 'string') {
      try {
        const parts = credential.split('.');
        if (parts.length === 3) {
          const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf-8');
          const payload = JSON.parse(payloadJson);
          targetEmail = payload.email || '';
          targetName = payload.name || payload.given_name || (targetEmail ? targetEmail.split('@')[0] : '');
        }
      } catch (err) {
        console.warn('Failed to parse Google JWT credential payload:', err);
      }
    }

    // Direct fallback from payload
    if (!targetEmail && email && typeof email === 'string') {
      targetEmail = email.trim();
    }
    if (!targetName && name && typeof name === 'string') {
      targetName = name.trim();
    }

    if (!targetEmail) {
      res.status(400).json({ error: 'Valid Google email is required to sign in.' });
      return;
    }

    const cleanEmail = targetEmail.toLowerCase().trim();
    const cleanName = targetName.trim() || cleanEmail.split('@')[0];

    // Check if user already exists
    let user = await db.findUserByEmail(cleanEmail);
    let business;

    if (user) {
      business = await db.getBusinessByOwnerId(user.id);
      if (!business) {
        res.status(500).json({ error: 'No associated store profile found for this user account.' });
        return;
      }
    } else {
      // Create new clean account for this Google / Gmail user with NO dummy data
      const randomPassword = 'g_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      const passwordHash = await hashPassword(randomPassword);
      
      const created = await db.createUser({
        name: cleanName,
        email: cleanEmail,
        passwordHash,
        businessName: businessName?.trim() || `${cleanName}'s Store`,
        phone: '',
        businessType: 'General Store',
        address: '',
      });

      user = created.user;
      business = created.business;
    }

    const userRole = user.role || 'OWNER';
    const token = generateToken({
      userId: user.id,
      email: user.email,
      businessId: business.id,
      role: userRole,
    });

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: userRole },
      business,
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Failed to authenticate with Google. Please try again.' });
  }
});

apiRouter.get('/auth/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const user = await db.findUserById(userId);
    if (!user) {
      res.status(404).json({ error: 'User account not found.' });
      return;
    }

    const business = await db.getBusinessById(req.user!.businessId);
    if (!business) {
      res.status(404).json({ error: 'Business profile not found.' });
      return;
    }

    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role || 'OWNER', createdAt: user.created_at },
      business,
    });
  } catch (error) {
    console.error('Auth /me error:', error);
    res.status(500).json({ error: 'Failed to retrieve user profile.' });
  }
});

apiRouter.put('/auth/profile', requireAuth, requireOwner, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, businessName, phone, email, address, businessType, upiId, upiName } = req.body;
    const userId = req.user!.userId;
    const businessId = req.user!.businessId;

    if (name) {
      await db.updateUser(userId, { name });
    }

    const updatedBusiness = await db.updateBusiness(businessId, {
      business_name: businessName,
      phone,
      email,
      address,
      business_type: businessType,
      upi_id: upiId,
      upi_name: upiName,
    });

    const updatedUser = await db.findUserById(userId);

    res.json({
      user: { id: updatedUser!.id, name: updatedUser!.name, email: updatedUser!.email, role: updatedUser!.role || 'OWNER' },
      business: updatedBusiness,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile. Please try again.' });
  }
});

// --- STAFF MANAGEMENT ROUTES (OWNER ONLY) ---

apiRouter.get('/staff', requireAuth, requireOwner, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const staff = await db.getStaffUsers(businessId);
    res.json(staff);
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({ error: 'Failed to fetch staff members.' });
  }
});

apiRouter.post('/staff', requireAuth, requireOwner, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const ownerId = req.user!.userId;
    const { name, email, password } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Staff member name is required.' });
      return;
    }
    if (!email || !email.trim()) {
      res.status(400).json({ error: 'Staff email is required.' });
      return;
    }
    if (!password || password.length < 6) {
      res.status(400).json({ error: 'Staff password must be at least 6 characters.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await db.findUserByEmail(cleanEmail);
    if (existing) {
      res.status(409).json({ error: 'A user with this email address already exists.' });
      return;
    }

    const passwordHash = await hashPassword(password);
    const staff = await db.createStaffUser(businessId, ownerId, {
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
    });

    res.status(201).json({
      id: staff.id,
      name: staff.name,
      email: staff.email,
      role: staff.role,
      createdAt: staff.created_at,
    });
  } catch (error) {
    console.error('Create staff error:', error);
    res.status(500).json({ error: 'Failed to create staff account.' });
  }
});

apiRouter.delete('/staff/:id', requireAuth, requireOwner, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const staffId = req.params.id;

    const deleted = await db.deleteStaffUser(staffId, businessId);
    if (!deleted) {
      res.status(404).json({ error: 'Staff member not found.' });
      return;
    }

    res.json({ message: 'Staff account deleted successfully.' });
  } catch (error) {
    console.error('Delete staff error:', error);
    res.status(500).json({ error: 'Failed to delete staff account.' });
  }
});

apiRouter.put('/auth/change-password', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user!.userId;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Please provide both current and new password.' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters long.' });
      return;
    }

    const user = await db.findUserById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const isMatch = await comparePassword(currentPassword, user.password_hash);
    if (!isMatch) {
      res.status(400).json({ error: 'Current password does not match our records.' });
      return;
    }

    const newHash = await hashPassword(newPassword);
    await db.updateUser(userId, { passwordHash: newHash });

    res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password.' });
  }
});

apiRouter.post('/auth/delete-account', requireAuth, requireOwner, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const businessId = req.user!.businessId;

    await db.deleteAccount(userId, businessId);
    res.json({ message: 'Account and associated business data have been permanently deleted.' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account.' });
  }
});

// --- DASHBOARD ROUTE (OWNER ONLY RBAC) ---

apiRouter.get('/dashboard', requireAuth, requireOwner, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const stats = await db.getDashboardStats(businessId);
    res.json(stats);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard statistics.' });
  }
});

// --- CUSTOMERS ROUTES ---

apiRouter.get('/customers', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const { search, filter, sortBy } = req.query as {
      search?: string;
      filter?: 'all' | 'outstanding' | 'settled' | 'recent';
      sortBy?: 'balance_desc' | 'balance_asc' | 'name_asc' | 'recent';
    };

    const customers = await db.getCustomersWithBalances(businessId, { search, filter, sortBy });
    res.json(customers);
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Failed to retrieve customers.' });
  }
});

apiRouter.post('/customers', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const { name, phone, email, address, notes, initialCredit } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Customer name is required.' });
      return;
    }

    if (!phone || !phone.trim()) {
      res.status(400).json({ error: 'Customer phone number is required.' });
      return;
    }

    const customer = await db.createCustomer(businessId, {
      name: name.trim(),
      phone: phone.trim(),
      email: email?.trim(),
      address: address?.trim(),
      notes: notes?.trim(),
    });

    // If an initial credit amount was entered, record it as first transaction
    if (initialCredit && Number(initialCredit) > 0) {
      await db.createTransaction(businessId, {
        customerId: customer.id,
        type: 'CREDIT',
        amount: Number(initialCredit),
        description: 'Initial opening balance',
        createdBy: req.user?.email || 'Store User',
      });
    }

    const fullCustomer = await db.getCustomerById(customer.id, businessId);
    res.status(201).json(fullCustomer);
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ error: 'Failed to create customer.' });
  }
});

apiRouter.get('/customers/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const customerId = req.params.id;

    const customer = await db.getCustomerById(customerId, businessId);
    if (!customer) {
      res.status(404).json({ error: 'Customer not found.' });
      return;
    }

    const { transactions } = await db.getTransactions(businessId, { customerId });

    res.json({
      customer,
      transactions,
    });
  } catch (error) {
    console.error('Get customer details error:', error);
    res.status(500).json({ error: 'Failed to retrieve customer details.' });
  }
});

apiRouter.put('/customers/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const customerId = req.params.id;
    const { name, phone, email, address, notes } = req.body;

    const updated = await db.updateCustomer(customerId, businessId, { name, phone, email, address, notes });
    if (!updated) {
      res.status(404).json({ error: 'Customer not found or unauthorized.' });
      return;
    }

    const fullCustomer = await db.getCustomerById(customerId, businessId);
    res.json(fullCustomer);
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: 'Failed to update customer.' });
  }
});

apiRouter.delete('/customers/:id', requireAuth, requireOwner, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const customerId = req.params.id;

    const deleted = await db.deleteCustomer(customerId, businessId);
    if (!deleted) {
      res.status(404).json({ error: 'Customer not found or already deleted.' });
      return;
    }

    res.json({ message: 'Customer and their transaction history deleted successfully.' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ error: 'Failed to delete customer.' });
  }
});

// --- CUSTOMER ATTACHMENTS (PROFILES & BILLS) ---

apiRouter.post('/customers/:id/attachments', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const customerId = req.params.id;
    const { name, dataUrl, fileType, size } = req.body;

    if (!dataUrl || !name) {
      res.status(400).json({ error: 'Attachment file name and valid data are required.' });
      return;
    }

    const attachment = await db.addCustomerAttachment(customerId, businessId, {
      name,
      dataUrl,
      fileType: fileType || 'image/jpeg',
      size: Number(size) || 0,
      uploadedBy: req.user?.email || 'Store User',
    });

    res.status(201).json(attachment);
  } catch (error) {
    console.error('Upload attachment error:', error);
    res.status(500).json({ error: 'Failed to save customer document/attachment.' });
  }
});

apiRouter.delete('/customers/:id/attachments/:attachmentId', requireAuth, requireOwner, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const customerId = req.params.id;
    const attachmentId = req.params.attachmentId;

    const deleted = await db.deleteCustomerAttachment(customerId, businessId, attachmentId);
    if (!deleted) {
      res.status(404).json({ error: 'Attachment not found.' });
      return;
    }

    res.json({ message: 'Attachment deleted successfully.' });
  } catch (error) {
    console.error('Delete attachment error:', error);
    res.status(500).json({ error: 'Failed to delete attachment.' });
  }
});

// --- TRANSACTIONS ROUTES ---

apiRouter.get('/transactions', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const { customerId, type, startDate, endDate, search, limit, offset } = req.query as {
      customerId?: string;
      type?: TransactionType;
      startDate?: string;
      endDate?: string;
      search?: string;
      limit?: string;
      offset?: string;
    };

    const result = await db.getTransactions(businessId, {
      customerId,
      type,
      startDate,
      endDate,
      search,
      limit: limit ? parseInt(limit, 10) : 100,
      offset: offset ? parseInt(offset, 10) : 0,
    });

    res.json(result);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to retrieve transactions.' });
  }
});

apiRouter.post('/transactions', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const { customerId, type, amount, transactionDate, description, paymentMethod, items, allowOverpayment } = req.body;

    if (!customerId) {
      res.status(400).json({ error: 'Please select a customer.' });
      return;
    }

    if (!type || (type !== 'CREDIT' && type !== 'PAYMENT')) {
      res.status(400).json({ error: 'Transaction type must be either CREDIT or PAYMENT.' });
      return;
    }

    // If itemized entries exist, compute or validate amount
    let computedAmount = Number(amount);
    let validItems: TransactionItem[] | undefined = undefined;

    if (Array.isArray(items) && items.length > 0) {
      const mappedItems: TransactionItem[] = items.map((item: any) => {
        const q = Math.max(1, Number(item.quantity) || 1);
        const p = Math.max(0, Number(item.unitPrice ?? item.price) || 0);
        const tot = Math.round(q * p * 100) / 100;
        return {
          id: item.id || 'itm_' + Math.random().toString(36).slice(2, 8),
          name: String(item.name || 'Item').trim(),
          quantity: q,
          unitPrice: p,
          price: p,
          total: tot,
        };
      });

      validItems = mappedItems;
      const itemsTotal = mappedItems.reduce((acc, curr) => acc + (curr.total || 0), 0);
      if (!computedAmount || computedAmount <= 0) {
        computedAmount = Math.round(itemsTotal * 100) / 100;
      }
    }

    if (isNaN(computedAmount) || computedAmount <= 0) {
      res.status(400).json({ error: 'Please enter a valid positive amount.' });
      return;
    }

    // Verify customer exists and belongs to this business
    const customer = await db.getCustomerById(customerId, businessId);
    if (!customer) {
      res.status(404).json({ error: 'Customer not found or unauthorized.' });
      return;
    }

    // Check for overpayment safety
    if (type === 'PAYMENT' && computedAmount > customer.outstandingBalance && !allowOverpayment) {
      res.status(422).json({
        warning: 'OVERPAYMENT',
        currentBalance: customer.outstandingBalance,
        paymentAmount: computedAmount,
        difference: computedAmount - customer.outstandingBalance,
        message: `Payment of ₹${computedAmount.toLocaleString('en-IN')} exceeds current outstanding balance of ₹${customer.outstandingBalance.toLocaleString('en-IN')}. Are you sure you want to proceed with this advance payment?`,
      });
      return;
    }

    const transaction = await db.createTransaction(businessId, {
      customerId,
      type,
      amount: computedAmount,
      transactionDate,
      description: description || (type === 'CREDIT' ? 'Credit given' : 'Payment received'),
      paymentMethod: type === 'PAYMENT' ? (paymentMethod || 'Cash') : undefined,
      items: validItems,
      createdBy: req.user?.email || 'Store User',
    });

    // Return transaction and updated customer balance
    const updatedCustomer = await db.getCustomerById(customerId, businessId);

    res.status(201).json({
      transaction,
      customer: updatedCustomer,
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ error: (error as Error).message || 'Failed to record transaction.' });
  }
});

apiRouter.delete('/transactions/:id', requireAuth, requireOwner, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const transactionId = req.params.id;

    const deleted = await db.deleteTransaction(transactionId, businessId);
    if (!deleted) {
      res.status(404).json({ error: 'Transaction not found.' });
      return;
    }

    res.json({ message: 'Transaction deleted successfully.' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ error: 'Failed to delete transaction.' });
  }
});

// --- EXPORT CSV ENDPOINTS ---

apiRouter.get('/export/customers', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const customers = await db.getCustomersWithBalances(businessId);

    let csv = 'Customer Name,Phone Number,Email,Address,Total Credit (INR),Total Paid (INR),Outstanding Balance (INR),Transactions Count,Last Transaction\n';

    for (const c of customers) {
      csv += `"${c.name.replace(/"/g, '""')}","${c.phone}","${c.email || ''}","${(c.address || '').replace(/"/g, '""')}",${c.totalCredit},${c.totalPaid},${c.outstandingBalance},${c.transactionCount},"${c.lastTransactionDate ? new Date(c.lastTransactionDate).toLocaleDateString('en-IN') : 'N/A'}"\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=credittrack-customers-${new Date().toISOString().slice(0, 10)}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Export customers error:', error);
    res.status(500).json({ error: 'Failed to export customer data.' });
  }
});

apiRouter.get('/export/statement/:customerId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const customerId = req.params.customerId;

    const customer = await db.getCustomerById(customerId, businessId);
    if (!customer) {
      res.status(404).json({ error: 'Customer not found.' });
      return;
    }

    const business = await db.getBusinessById(businessId);
    const { transactions } = await db.getTransactions(businessId, { customerId });

    let csv = `CREDITTRACK - CUSTOMER ACCOUNT STATEMENT\n`;
    csv += `Business Name:,"${business?.business_name || 'My Store'}"\n`;
    csv += `Business Phone:,"${business?.phone || ''}"\n`;
    csv += `Customer Name:,"${customer.name}"\n`;
    csv += `Customer Phone:,"${customer.phone}"\n`;
    csv += `Total Credit (INR):,${customer.totalCredit}\n`;
    csv += `Total Paid (INR):,${customer.totalPaid}\n`;
    csv += `Current Outstanding Balance (INR):,${customer.outstandingBalance}\n\n`;

    csv += `Date,Type,Amount (INR),Payment Mode,Description,Running Balance (INR)\n`;

    for (const t of transactions) {
      const dateStr = new Date(t.transaction_date).toLocaleDateString('en-IN');
      csv += `"${dateStr}","${t.type}",${t.amount},"${t.payment_method || '-' }","${(t.description || '').replace(/"/g, '""')}",${t.runningBalance ?? ''}\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=statement-${customer.name.replace(/\s+/g, '_')}-${new Date().toISOString().slice(0, 10)}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Export statement error:', error);
    res.status(500).json({ error: 'Failed to export statement.' });
  }
});

// --- AUTOMATED PAYMENT REMINDERS API ---

apiRouter.get('/reminders/settings', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const settings = await db.getReminderSettings(businessId);
    res.json(settings);
  } catch (error) {
    console.error('Get reminder settings error:', error);
    res.status(500).json({ error: 'Failed to retrieve reminder settings.' });
  }
});

apiRouter.put('/reminders/settings', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const updated = await db.updateReminderSettings(businessId, req.body);
    res.json(updated);
  } catch (error) {
    console.error('Update reminder settings error:', error);
    res.status(500).json({ error: 'Failed to update reminder settings.' });
  }
});

apiRouter.get('/reminders/overdue', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const thresholdParam = req.query.threshold ? parseInt(req.query.threshold as string, 10) : undefined;
    const report = await db.getOverdueReport(businessId, thresholdParam);
    res.json(report);
  } catch (error) {
    console.error('Get overdue report error:', error);
    res.status(500).json({ error: 'Failed to calculate overdue accounts.' });
  }
});

apiRouter.post('/reminders/send', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const { customerId, channel = 'WHATSAPP', lang = 'en', customMessage } = req.body;

    if (!customerId) {
      res.status(400).json({ error: 'Customer ID is required.' });
      return;
    }

    const customer = await db.getCustomerById(customerId, businessId);
    if (!customer) {
      res.status(404).json({ error: 'Customer not found.' });
      return;
    }

    const business = await db.getBusinessById(businessId);
    const storeName = business?.business_name || 'My Store';
    const upiId = business?.upi_id || '';
    const settings = await db.getReminderSettings(businessId);

    // Calculate days unpaid using transactions
    const { transactions } = await db.getTransactions(businessId, { customerId });
    const sortedTxs = [...transactions].sort((a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime());
    let totalPayments = sortedTxs.filter(t => t.type === 'PAYMENT').reduce((sum, t) => sum + Number(t.amount), 0);
    let oldestUnpaidDate: string | undefined = undefined;

    for (const t of sortedTxs) {
      if (t.type === 'CREDIT') {
        const creditAmt = Number(t.amount);
        if (totalPayments >= creditAmt) {
          totalPayments -= creditAmt;
        } else {
          oldestUnpaidDate = t.transaction_date;
          break;
        }
      }
    }
    if (!oldestUnpaidDate) {
      oldestUnpaidDate = customer.lastTransactionDate || customer.created_at;
    }
    const daysUnpaid = Math.max(0, Math.floor((Date.now() - new Date(oldestUnpaidDate).getTime()) / (1000 * 60 * 60 * 24)));

    const formattedAmt = `₹${customer.outstandingBalance.toLocaleString('en-IN')}`;
    const upiText = settings.include_upi && upiId ? `\n\nUPI Payment ID: *${upiId}*` : '';
    const upiSmsText = settings.include_upi && upiId ? ` UPI: ${upiId}.` : '';

    let finalMessage = customMessage;
    if (!finalMessage) {
      const template = lang === 'hi' ? settings.message_template_hi : settings.message_template_en;
      finalMessage = (template || '')
        .replace(/{customerName}/g, customer.name)
        .replace(/{storeName}/g, storeName)
        .replace(/{amount}/g, formattedAmt)
        .replace(/{daysOverdue}/g, String(daysUnpaid))
        .replace(/{upiInfo}/g, upiText);
    }

    // Clean phone numbers
    let cleanPhoneWa = customer.phone.replace(/[^\d]/g, '');
    if (cleanPhoneWa.length === 10) cleanPhoneWa = '91' + cleanPhoneWa;

    let cleanPhoneSms = customer.phone.replace(/[^\d+]/g, '');
    if (cleanPhoneSms.length === 10 && !cleanPhoneSms.startsWith('+')) cleanPhoneSms = '+91' + cleanPhoneSms;

    const whatsappUrl = `https://wa.me/${cleanPhoneWa}?text=${encodeURIComponent(finalMessage)}`;
    const smsMessage = customMessage || `Dear ${customer.name}, Reminder from ${storeName}: Your balance of ${formattedAmt} has been unpaid for ${daysUnpaid} days.${upiSmsText} Please arrange payment. Thank you!`;
    const smsUrl = `sms:${cleanPhoneSms}?body=${encodeURIComponent(smsMessage)}`;

    // Create log record
    const targetChannel: 'WHATSAPP' | 'SMS' = channel === 'SMS' ? 'SMS' : 'WHATSAPP';
    const preview = finalMessage.replace(/\n+/g, ' ').slice(0, 100);

    const log = await db.createReminderLog(businessId, {
      customer_id: customer.id,
      customer_name: customer.name,
      customer_phone: customer.phone,
      amount: customer.outstandingBalance,
      days_overdue: daysUnpaid,
      channel: targetChannel,
      status: 'SENT',
      message_preview: preview,
    });

    res.json({
      success: true,
      log,
      whatsappUrl,
      smsUrl,
      message: finalMessage,
    });
  } catch (error) {
    console.error('Send reminder error:', error);
    res.status(500).json({ error: 'Failed to record payment reminder.' });
  }
});

apiRouter.post('/reminders/send-batch', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const { customerIds, thresholdDays, channel = 'WHATSAPP', lang = 'en' } = req.body;

    const result = await db.sendBatchReminders(businessId, {
      customerIds,
      thresholdDays: thresholdDays ? Number(thresholdDays) : undefined,
      channel,
      lang,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Send batch reminders error:', error);
    res.status(500).json({ error: 'Failed to execute batch reminders.' });
  }
});

apiRouter.get('/reminders/logs', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const logs = await db.getReminderLogs(businessId, limit);
    res.json(logs);
  } catch (error) {
    console.error('Get reminder logs error:', error);
    res.status(500).json({ error: 'Failed to retrieve reminder history.' });
  }
});

// --- DEMO SEED & RESET ROUTES (OWNER ONLY) ---

apiRouter.post('/demo/seed', requireAuth, requireOwner, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const result = await db.seedSampleData(businessId);
    res.json({
      message: 'Demo sample business data loaded successfully.',
      customersCreated: result.customerCount,
      transactionsCreated: result.transactionCount,
    });
  } catch (error) {
    console.error('Seed demo error:', error);
    res.status(500).json({ error: 'Failed to seed sample data.' });
  }
});

apiRouter.post('/demo/reset', requireAuth, requireOwner, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    await db.resetBusinessData(businessId);
    res.json({ message: 'All customer and transaction records for this business have been cleared.' });
  } catch (error) {
    console.error('Reset demo error:', error);
    res.status(500).json({ error: 'Failed to reset data.' });
  }
});
