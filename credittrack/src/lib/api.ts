import {
  User,
  Business,
  Customer,
  Transaction,
  DashboardStats,
  TransactionType,
  PaymentMethod,
  StaffUser,
  CustomerAttachment,
  TransactionItem,
  ReminderSettings,
  ReminderLog,
  OverdueOverviewResponse,
} from '../types';

const TOKEN_KEY = 'credittrack_jwt';

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = authStorage.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = 'An error occurred while processing your request.';
    try {
      const data = await response.json();
      if (data.error) {
        errorMessage = data.error;
      } else if (data.message) {
        errorMessage = data.message;
      }
      // Check for overpayment warning payload
      if (response.status === 422 && data.warning === 'OVERPAYMENT') {
        const err = new Error(data.message) as any;
        err.isOverpayment = true;
        err.difference = data.difference;
        throw err;
      }
    } catch (e: any) {
      if (e.isOverpayment) throw e;
    }

    if (response.status === 401) {
      authStorage.clearToken();
    }

    throw new Error(errorMessage);
  }

  return response.json();
}

export const api = {
  // Auth
  auth: {
    register: (data: {
      name: string;
      email: string;
      password: string;
      businessName: string;
      phone: string;
      businessType?: string;
      address?: string;
    }) => request<{ token: string; user: User; business: Business }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

    login: (credentials: { email: string; password: string }) =>
      request<{ token: string; user: User; business: Business }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),

    google: (data: { credential?: string; email?: string; name?: string; businessName?: string }) =>
      request<{ token: string; user: User; business: Business }>('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getGoogleConfig: () =>
      request<{ clientId: string }>('/api/auth/google/config'),

    me: () => request<{ user: User; business: Business }>('/api/auth/me'),

    updateProfile: (data: {
      name?: string;
      businessName?: string;
      phone?: string;
      email?: string;
      address?: string;
      businessType?: string;
      upiId?: string;
      upiName?: string;
    }) => request<{ user: User; business: Business }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

    changePassword: (data: { currentPassword: string; newPassword: string }) =>
      request<{ message: string }>('/api/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    deleteAccount: () => request<{ message: string }>('/api/auth/delete-account', {
      method: 'POST',
    }),
  },

  // Staff (RBAC - Owner Only)
  staff: {
    getAll: () => request<StaffUser[]>('/api/staff'),
    list: () => request<StaffUser[]>('/api/staff'),
    create: (data: { name: string; email: string; password: string }) =>
      request<StaffUser>('/api/staff', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ message: string }>(`/api/staff/${id}`, {
        method: 'DELETE',
      }),
  },

  // Business
  business: {
    update: (data: { business_name?: string; business_type?: string; phone?: string; address?: string; upi_id?: string; upi_name?: string }) =>
      request<{ user: User; business: Business }>('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          businessName: data.business_name,
          businessType: data.business_type,
          phone: data.phone,
          address: data.address,
          upiId: data.upi_id,
          upiName: data.upi_name,
        }),
      }),
  },

  // Dashboard
  dashboard: {
    getStats: () => request<DashboardStats>('/api/dashboard'),
  },

  // Customers
  customers: {
    getAll: (params?: { search?: string; filter?: 'all' | 'outstanding' | 'settled' | 'recent'; sortBy?: string }) => {
      const query = new URLSearchParams();
      if (params?.search) query.append('search', params.search);
      if (params?.filter) query.append('filter', params.filter);
      if (params?.sortBy) query.append('sortBy', params.sortBy);
      const q = query.toString();
      return request<Customer[]>(`/api/customers${q ? `?${q}` : ''}`);
    },

    getById: (id: string) =>
      request<{ customer: Customer; transactions: Transaction[] }>(`/api/customers/${id}`),

    create: (data: {
      name: string;
      phone: string;
      email?: string;
      address?: string;
      notes?: string;
      initialCredit?: number;
    }) => request<Customer>('/api/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

    update: (id: string, data: Partial<Pick<Customer, 'name' | 'phone' | 'email' | 'address' | 'notes'>>) =>
      request<Customer>(`/api/customers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      request<{ message: string }>(`/api/customers/${id}`, {
        method: 'DELETE',
      }),

    addAttachment: (customerId: string, data: { name: string; dataUrl: string; fileType: string; size: number }) =>
      request<CustomerAttachment>(`/api/customers/${customerId}/attachments`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    deleteAttachment: (customerId: string, attachmentId: string) =>
      request<{ message: string }>(`/api/customers/${customerId}/attachments/${attachmentId}`, {
        method: 'DELETE',
      }),
  },

  // Transactions
  transactions: {
    getAll: (params?: {
      customerId?: string;
      type?: TransactionType;
      startDate?: string;
      endDate?: string;
      search?: string;
      limit?: number;
      offset?: number;
    }) => {
      const query = new URLSearchParams();
      if (params?.customerId) query.append('customerId', params.customerId);
      if (params?.type) query.append('type', params.type);
      if (params?.startDate) query.append('startDate', params.startDate);
      if (params?.endDate) query.append('endDate', params.endDate);
      if (params?.search) query.append('search', params.search);
      if (params?.limit) query.append('limit', params.limit.toString());
      if (params?.offset) query.append('offset', params.offset.toString());
      const q = query.toString();
      return request<{ transactions: Transaction[]; total: number }>(`/api/transactions${q ? `?${q}` : ''}`);
    },

    create: (data: {
      customerId: string;
      type: TransactionType;
      amount: number;
      transactionDate?: string;
      description?: string;
      paymentMethod?: PaymentMethod | string;
      items?: TransactionItem[];
      allowOverpayment?: boolean;
    }) => request<{ transaction: Transaction; customer: Customer }>('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

    delete: (id: string) =>
      request<{ message: string }>(`/api/transactions/${id}`, {
        method: 'DELETE',
      }),
  },

  // Export CSV
  export: {
    downloadCustomersCSV: async () => {
      const token = authStorage.getToken();
      const res = await fetch('/api/export/customers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to download customer export');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CreditTrack_Customers_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    },

    downloadTransactionsCSV: async () => {
      const token = authStorage.getToken();
      const res = await fetch('/api/export/transactions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to download transactions export');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CreditTrack_Transactions_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    },

    downloadStatementCSV: async (customerId: string, customerName: string) => {
      const token = authStorage.getToken();
      const res = await fetch(`/api/export/statement/${customerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to download statement export');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Statement_${customerName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    },
  },

  // Automated Reminders
  reminders: {
    getSettings: () => request<ReminderSettings>('/api/reminders/settings'),
    updateSettings: (data: Partial<ReminderSettings>) =>
      request<ReminderSettings>('/api/reminders/settings', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    getOverdue: (threshold?: number) => {
      const q = threshold !== undefined ? `?threshold=${threshold}` : '';
      return request<OverdueOverviewResponse>(`/api/reminders/overdue${q}`);
    },
    sendReminder: (data: {
      customerId: string;
      channel: 'WHATSAPP' | 'SMS';
      lang?: 'en' | 'hi';
      customMessage?: string;
    }) =>
      request<{
        success: boolean;
        log: ReminderLog;
        whatsappUrl: string;
        smsUrl: string;
        message: string;
      }>('/api/reminders/send', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    sendBatch: (data: {
      customerIds?: string[];
      thresholdDays?: number;
      channel?: 'WHATSAPP' | 'SMS' | 'BOTH';
      lang?: 'en' | 'hi';
    }) =>
      request<{
        success: boolean;
        dispatched: number;
        totalAmount: number;
        logs: ReminderLog[];
        results: Array<{ customerId: string; name: string; phone: string; whatsappUrl: string; smsUrl: string }>;
      }>('/api/reminders/send-batch', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getLogs: (limit: number = 50) => request<ReminderLog[]>(`/api/reminders/logs?limit=${limit}`),
  },

  // Demo management
  demo: {
    seed: () => request<{ message: string; customersCreated: number; transactionsCreated: number }>('/api/demo/seed', {
      method: 'POST',
    }),
    reset: () => request<{ message: string }>('/api/demo/reset', {
      method: 'POST',
    }),
  },

  // Database alias
  database: {
    reset: () => request<{ message: string }>('/api/demo/reset', {
      method: 'POST',
    }),
  },
};
