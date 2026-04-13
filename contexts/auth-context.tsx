'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { verifyToken } from '@/lib/auth';

type User = {
  id: string;
  email: string;
  full_name?: string;
  role: 'beneficiary' | 'philanthropist' | 'admin';
  status?: string;
  username?: string;
  created_at?: string;
  country?: string;
  phone?: string;
  profile_picture?: string;
  email_verified?: boolean;
  [key: string]: any;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
  isPhilanthropist: boolean;
  isBeneficiary: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserFromStorage = async () => {
    try {
      // Support both HttpOnly cookie (server) and localStorage (fallback)
      const token = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('auth_user');

      if (token && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        // Refresh from DB
        const { data: freshUser } = await supabase
          .from('users')
          .select('*')
          .eq('id', parsedUser.id)
          .single();

        if (freshUser) {
          setUser(freshUser);
          localStorage.setItem('auth_user', JSON.stringify(freshUser));
        }
        return true;
      }
      return false;
    } catch (e) {
      console.error('Auth load error:', e);
      return false;
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadUserFromStorage();
      setLoading(false);
    };
    init();
  }, []);

  const handleSignOut = async () => {
    // Clear localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);

    // Clear HttpOnly cookie via API
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
    } catch { /* silent */ }

    await supabase.auth.signOut().catch(() => {});
    window.location.href = '/login';
  };

  const refreshUser = async () => {
    try {
      const storedUser = localStorage.getItem('auth_user');
      if (!storedUser) return;
      const parsedUser = JSON.parse(storedUser);

      const { data: freshUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', parsedUser.id)
        .single();

      if (freshUser) {
        setUser(freshUser);
        localStorage.setItem('auth_user', JSON.stringify(freshUser));
      }
    } catch (e) {
      console.error('Refresh error:', e);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signOut: handleSignOut,
    refreshUser,
    isAdmin: user?.role === 'admin',
    isPhilanthropist: user?.role === 'philanthropist',
    isBeneficiary: user?.role === 'beneficiary',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}