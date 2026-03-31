'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, User, getUserData } from '@/lib/supabase-client';

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

  useEffect(() => {
    // Check initial session
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          const userData = await getUserData(data.session.user.id);
          setUser(userData);
        }
      } catch (error) {
        console.error('Auth error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const userData = await getUserData(session.user.id);
        setUser(userData);
      } else {
        setUser(null);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const refreshUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const userData = await getUserData(data.user.id);
      setUser(userData);
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
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
