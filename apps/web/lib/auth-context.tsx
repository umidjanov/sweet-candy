'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from './api';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  role: 'CUSTOMER' | 'SELLER' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED';
  mustChangePassword?: boolean;
  sellerProfile?: {
    id: string;
    storeName: string;
    slug: string;
    description: string;
    address: string;
    city: string;
    serviceArea: string;
    publicPhone?: string;
    approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
    telegramConnected: boolean;
    ratingAverage: number;
    ratingCount: number;
    logoUrl?: string;
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isCustomer: boolean;
  isSeller: boolean;
  isAdmin: boolean;
  login: (phone: string, pass: string) => Promise<User>;
  registerCustomer: (data: any) => Promise<User>;
  registerSeller: (data: any) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000; // 4 hours auto logout

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkSessionExpiry = (): boolean => {
    if (typeof window === 'undefined') return false;
    const loginTimeStr = localStorage.getItem('sweetmarket_login_time');
    const token = localStorage.getItem('sweetmarket_access_token');

    if (token && loginTimeStr) {
      const elapsed = Date.now() - parseInt(loginTimeStr, 10);
      if (elapsed >= FOUR_HOURS_MS) {
        localStorage.removeItem('sweetmarket_access_token');
        localStorage.removeItem('sweetmarket_login_time');
        setUser(null);
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login?expired=1';
        }
        return true;
      }
    }
    return false;
  };

  const refreshUser = async () => {
    try {
      if (checkSessionExpiry()) {
        setIsLoading(false);
        return;
      }

      const token = localStorage.getItem('sweetmarket_access_token');
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      const userData = await apiClient<User>('/auth/me');
      setUser(userData);
    } catch {
      localStorage.removeItem('sweetmarket_access_token');
      localStorage.removeItem('sweetmarket_login_time');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();

    // Check 4-hour session expiration every 15 seconds
    const interval = setInterval(() => {
      checkSessionExpiry();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const login = async (phone: string, pass: string) => {
    const res = await apiClient<{ user: User; accessToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password: pass }),
    });

    localStorage.setItem('sweetmarket_access_token', res.accessToken);
    localStorage.setItem('sweetmarket_login_time', Date.now().toString());
    setUser(res.user);
    return res.user;
  };

  const registerCustomer = async (data: any) => {
    const res = await apiClient<{ user: User; accessToken: string }>('/auth/register/customer', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    localStorage.setItem('sweetmarket_access_token', res.accessToken);
    localStorage.setItem('sweetmarket_login_time', Date.now().toString());
    setUser(res.user);
    return res.user;
  };

  const registerSeller = async (data: any) => {
    const res = await apiClient<{ user: User; accessToken: string }>('/auth/register/seller', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    localStorage.setItem('sweetmarket_access_token', res.accessToken);
    localStorage.setItem('sweetmarket_login_time', Date.now().toString());
    setUser(res.user);
    return res.user;
  };

  const logout = async () => {
    try {
      await apiClient('/auth/logout', { method: 'POST' });
    } catch {
      // Ignore
    } finally {
      localStorage.removeItem('sweetmarket_access_token');
      localStorage.removeItem('sweetmarket_login_time');
      setUser(null);
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isCustomer: user?.role === 'CUSTOMER',
        isSeller: user?.role === 'SELLER',
        isAdmin: user?.role === 'ADMIN',
        login,
        registerCustomer,
        registerSeller,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

