import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Business } from '../types';
import { api, authStorage } from '../lib/api';

interface AuthContextType {
  user: User | null;
  business: Business | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOwner: boolean;
  isStaff: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  loginWithGoogle: (data: { credential?: string; email?: string; name?: string; businessName?: string }) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    businessName: string;
    phone: string;
    businessType?: string;
    address?: string;
  }) => Promise<void>;
  logout: () => void;
  updateProfile: (data: {
    name?: string;
    businessName?: string;
    phone?: string;
    email?: string;
    address?: string;
    businessType?: string;
    upiId?: string;
    upiName?: string;
  }) => Promise<void>;
  refreshUser: () => Promise<void>;
  loadDemoData: () => Promise<{ customersCreated: number; transactionsCreated: number }>;
  resetDemoData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = async () => {
    const token = authStorage.getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.auth.me();
      setUser(data.user);
      setBusiness(data.business);
    } catch (err) {
      console.warn('Session verification failed:', err);
      authStorage.clearToken();
      setUser(null);
      setBusiness(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      const res = await api.auth.login(credentials);
      authStorage.setToken(res.token);
      setUser(res.user);
      setBusiness(res.business);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (data: { credential?: string; email?: string; name?: string; businessName?: string }) => {
    setIsLoading(true);
    try {
      const res = await api.auth.google(data);
      authStorage.setToken(res.token);
      setUser(res.user);
      setBusiness(res.business);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    businessName: string;
    phone: string;
    businessType?: string;
    address?: string;
  }) => {
    setIsLoading(true);
    try {
      const res = await api.auth.register(data);
      authStorage.setToken(res.token);
      setUser(res.user);
      setBusiness(res.business);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authStorage.clearToken();
    setUser(null);
    setBusiness(null);
  };

  const updateProfile = async (data: {
    name?: string;
    businessName?: string;
    phone?: string;
    email?: string;
    address?: string;
    businessType?: string;
    upiId?: string;
    upiName?: string;
  }) => {
    const res = await api.auth.updateProfile(data);
    setUser(res.user);
    setBusiness(res.business);
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  const loadDemoData = async () => {
    const res = await api.demo.seed();
    await refreshUser();
    return res;
  };

  const resetDemoData = async () => {
    await api.demo.reset();
    await refreshUser();
  };

  const isOwner = user?.role !== 'STAFF';
  const isStaff = user?.role === 'STAFF';

  return (
    <AuthContext.Provider
      value={{
        user,
        business,
        isAuthenticated: !!user && !!business,
        isLoading,
        isOwner,
        isStaff,
        login,
        loginWithGoogle,
        register,
        logout,
        updateProfile,
        refreshUser,
        loadDemoData,
        resetDemoData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
