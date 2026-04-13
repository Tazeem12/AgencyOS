'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabaseBrowser, resetSupabaseBrowser } from '@/lib/supabase';

interface AuthUser {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  loginWithOtp: (email: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (email: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function extractUserFromSession(session: Session | null): AuthUser | null {
  if (!session?.user) return null;
  return {
    id: session.user.id,
    email: session.user.email || '',
    name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || '',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowser();

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(extractUserFromSession(s));
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      setUser(extractUserFromSession(s));
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const supabase = getSupabaseBrowser();
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      setSession(data.session);
      setUser(extractUserFromSession(data.session));
    } catch (error) {
      console.error('Failed to refresh session:', error);
    }
  }, []);

  const loginWithOtp = useCallback(async (email: string) => {
    try {
      const supabase = getSupabaseBrowser();
      const normalizedEmail = email.trim().toLowerCase();
      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        return {
          success: false,
          error: error.message || 'Failed to send verification code',
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Login with OTP error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred',
      };
    }
  }, []);

  const verifyOtp = useCallback(async (email: string, otp: string) => {
    try {
      const supabase = getSupabaseBrowser();
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: otp.trim(),
        type: 'email',
      });

      if (error) {
        return {
          success: false,
          error: error.message || 'Invalid verification code',
        };
      }

      if (data.session) {
        setSession(data.session);
        setUser(extractUserFromSession(data.session));

        try {
          await fetch('/api/auth/metadata', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${data.session.access_token}`,
            },
            body: JSON.stringify({
              event: 'login',
              metadata: {
                method: 'otp',
                email: email.trim().toLowerCase(),
              },
            }),
          });
        } catch {
          // Silent fail for activity logging.
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Verify OTP error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred',
      };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const supabase = getSupabaseBrowser();

      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch {
        // Silent fail
      }

      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      resetSupabaseBrowser();
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
      setSession(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, session, loading, loginWithOtp, verifyOtp, logout, refreshSession }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
