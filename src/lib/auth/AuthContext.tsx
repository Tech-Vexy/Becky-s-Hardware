'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AppRole, Profile } from '@/lib/types/database';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { syncEngine } from '@/lib/sync/syncEngine';

/** Deprecated legacy stub retained only for backwards compatibility with symbol imports */
export const INITIAL_ADMIN_PROFILE: Profile = {
  user_id: '00000000-0000-0000-0000-000000000001',
  full_name: 'Store Owner',
  phone: '+254 712 345 678',
  email: 'kamenengewa@gmail.com',
  role: 'admin',
  active: true,
  created_at: '2026-10-22T00:00:00.000Z',
  updated_at: '2026-10-22T00:00:00.000Z',
};

export const INITIAL_OWNER_PROFILE = INITIAL_ADMIN_PROFILE;

const STAFF_STORAGE_KEY = 'beckys_hardware_staff_profiles';
const ACTIVE_USER_ID_KEY = 'beckys_hardware_active_user_id';
const CACHED_PROFILE_KEY = 'becky_cached_profile';

export interface AuthContextType {
  user: Profile | null;
  session: any | null;
  role: AppRole;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSupabase: boolean;
  staffProfiles: Profile[];
  signInWithPassword: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, fullName: string, phone: string, role?: AppRole) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  setRoleOverride: (role: AppRole) => void;
  setActiveEmployee: (userId: string) => void;
  addEmployee: (emp: { full_name: string; phone?: string; role: AppRole; email?: string; password?: string }) => Promise<Profile>;
  updateEmployee: (userId: string, updates: Partial<Profile>) => Promise<void>;
  toggleEmployeeActive: (userId: string) => Promise<void>;
  hasRole: (allowed: AppRole | AppRole[]) => boolean;
  canAccessModule: (moduleName: string) => boolean;
  canManageStaff: boolean;
  canManageInventory: boolean;
  canMakeSales: boolean;
  canViewFinancials: boolean;
  canVerifyPayments: boolean;
  canAlterPrices: boolean;
  canDeleteRecords: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [staffProfiles, setStaffProfiles] = useState<Profile[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [currentRole, setCurrentRole] = useState<AppRole>('admin');
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const isSupabase = isSupabaseConfigured();

  // Helper to load verified profile from Supabase
  const loadSupabaseProfile = useCallback(async (userId: string, authUser?: any): Promise<Profile | null> => {
    try {
      const { data: prof, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (prof && !error) {
        const activeProf = prof as Profile;
        setProfile(activeProf);
        setCurrentRole((activeProf.role || 'admin') as AppRole);
        setStaffProfiles([activeProf]);
        setIsAuthenticated(true);
        try {
          localStorage.setItem(CACHED_PROFILE_KEY, JSON.stringify(activeProf));
        } catch {}
        return activeProf;
      }

      // If user exists in Supabase Auth but profile row not yet inserted, auto-provision
      const meta = authUser?.user_metadata || {};
      const newRow: Profile = {
        user_id: userId,
        full_name: meta.full_name || authUser?.email?.split('@')[0] || 'Becky (Store Owner)',
        phone: meta.phone || '+254 712 345 678',
        email: authUser?.email || null,
        role: (meta.role as AppRole) || 'admin',
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: inserted, error: insertErr } = await supabase
        .from('profiles')
        .upsert(newRow)
        .select()
        .maybeSingle();

      const savedProf = (inserted || newRow) as Profile;
      setProfile(savedProf);
      setCurrentRole((savedProf.role || 'admin') as AppRole);
      setStaffProfiles([savedProf]);
      setIsAuthenticated(true);
      try {
        localStorage.setItem(CACHED_PROFILE_KEY, JSON.stringify(savedProf));
      } catch {}
      return savedProf;
    } catch (err) {
      console.warn('Network issue loading Supabase profile:', err);
      // If user has verified Supabase session and cached profile matches current user
      const cached = typeof window !== 'undefined' ? localStorage.getItem(CACHED_PROFILE_KEY) : null;
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.user_id === userId) {
            setProfile(parsed);
            setCurrentRole((parsed.role || 'admin') as AppRole);
            setStaffProfiles([parsed]);
            setIsAuthenticated(true);
            return parsed;
          }
        } catch {}
      }
      return null;
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!isSupabase) {
      console.error('[Security] Supabase is not configured. Local accounts are strictly disabled.');
      setIsLoading(false);
      setIsAuthenticated(false);
      setProfile(null);
      setSession(null);
      return;
    }

    // 1. Verify active Supabase session
    supabase.auth.getSession().then(async ({ data: { session: currentSession }, error }) => {
      if (error || !currentSession?.user) {
        try {
          localStorage.removeItem(CACHED_PROFILE_KEY);
          localStorage.removeItem(STAFF_STORAGE_KEY);
        } catch {}
        setSession(null);
        setProfile(null);
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      setSession(currentSession);
      await loadSupabaseProfile(currentSession.user.id, currentSession.user);
      setIsLoading(false);
      // Trigger full bi-directional sync on session restoration
      syncEngine.syncAll().catch((err) => console.warn('Initial session syncAll deferred:', err));
    }).catch((err) => {
      console.warn('Failed to verify Supabase session:', err);
      setSession(null);
      setProfile(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    });

    // 2. Subscribe to Supabase auth events (Sign in, Sign out, Token Refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        await loadSupabaseProfile(newSession.user.id, newSession.user);
        setIsAuthenticated(true);
        setIsLoading(false);
        syncEngine.syncAll().catch((err) => console.warn('Auth event syncAll deferred:', err));
      } else {
        try {
          localStorage.removeItem(CACHED_PROFILE_KEY);
          localStorage.removeItem(STAFF_STORAGE_KEY);
          localStorage.removeItem(ACTIVE_USER_ID_KEY);
        } catch {}
        setProfile(null);
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isSupabase, loadSupabaseProfile]);

  // Sign In strictly with Supabase email and password
  const signInWithPassword = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    if (!isSupabase) {
      setIsLoading(false);
      return {
        success: false,
        error: 'Supabase cloud is not configured. Local logins are disabled.',
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setIsLoading(false);
        return { success: false, error: error.message };
      }

      if (!data.user) {
        setIsLoading(false);
        return { success: false, error: 'User account not found in Supabase.' };
      }

      setSession(data.session);
      await loadSupabaseProfile(data.user.id, data.user);
      setIsAuthenticated(true);
      setIsLoading(false);
      syncEngine.syncAll().catch((err) => console.warn('Login syncAll deferred:', err));
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return {
        success: false,
        error: err.message || 'Authentication error. Please check your credentials and internet connection.',
      };
    }
  };

  // Sign Up / Register Store Owner or Staff in Supabase
  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    phone: string,
    role: AppRole = 'admin'
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    if (!isSupabase) {
      setIsLoading(false);
      return { success: false, error: 'Supabase cloud authentication is required.' };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
            role,
          },
        },
      });

      if (error) {
        setIsLoading(false);
        return { success: false, error: error.message };
      }

      if (data.user) {
        setSession(data.session);
        await loadSupabaseProfile(data.user.id, {
          email: email.trim(),
          user_metadata: {
            full_name: fullName.trim(),
            phone: phone.trim(),
            role,
          },
        });
      }
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Sign up failed' };
    }
  };

  // Sign Out
  const signOut = async () => {
    setIsLoading(true);
    try {
      if (isSupabase) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn('Sign out error:', err);
    } finally {
      try {
        localStorage.removeItem(CACHED_PROFILE_KEY);
        localStorage.removeItem(STAFF_STORAGE_KEY);
        localStorage.removeItem(ACTIVE_USER_ID_KEY);
      } catch {}
      setProfile(null);
      setSession(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  };

  const setActiveEmployee = (userId: string) => {
    const target = staffProfiles.find((p) => p.user_id === userId);
    if (!target) return;
    setProfile(target);
    setCurrentRole(target.role);
    if (typeof window !== 'undefined') {
      localStorage.setItem(ACTIVE_USER_ID_KEY, target.user_id);
    }
  };

  const setRoleOverride = (role: AppRole) => {
    setCurrentRole(role);
    if (profile) {
      setProfile({ ...profile, role });
    }
  };

  const addEmployee = async (emp: {
    full_name: string;
    phone?: string;
    role: AppRole;
    email?: string;
    password?: string;
  }): Promise<Profile> => {
    if (!isSupabase) {
      throw new Error('Supabase is required to register new staff accounts.');
    }

    let authUserId: string | null = null;
    if (emp.email && emp.password) {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: emp.email.trim(),
        password: emp.password,
        options: {
          data: {
            full_name: emp.full_name.trim(),
            phone: emp.phone?.trim() || '+254 ',
            role: emp.role,
          },
        },
      });
      if (signUpError) {
        throw new Error(signUpError.message);
      }
      authUserId = signUpData.user?.id || null;
    }

    const newProfile: Profile = {
      user_id: authUserId || `00000000-0000-0000-0000-${Date.now().toString().slice(-12)}`,
      full_name: emp.full_name.trim(),
      phone: emp.phone?.trim() || '+254 ',
      email: emp.email?.trim() || null,
      role: emp.role,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: upsertErr } = await supabase.from('profiles').upsert(newProfile);
    if (upsertErr) {
      console.warn('Supabase profile upsert error:', upsertErr);
    }

    setStaffProfiles((prev) => [...prev, newProfile]);
    syncEngine.queueOperation('profile_upsert', newProfile).catch(console.error);

    return newProfile;
  };

  const updateEmployee = async (userId: string, updates: Partial<Profile>) => {
    const updatedList = staffProfiles.map((p) => {
      if (p.user_id === userId) {
        const updated = {
          ...p,
          ...updates,
          updated_at: new Date().toISOString(),
        };
        if (profile?.user_id === userId) {
          setProfile(updated);
          if (updates.role) {
            setCurrentRole(updates.role);
          }
        }
        return updated;
      }
      return p;
    });

    setStaffProfiles(updatedList);

    if (isSupabase) {
      try {
        await supabase
          .from('profiles')
          .update(updates)
          .eq('user_id', userId);
      } catch (err) {
        console.warn('Supabase profile update error:', err);
      }
    }

    const target = updatedList.find((p) => p.user_id === userId);
    if (target) {
      syncEngine.queueOperation('profile_upsert', target).catch(console.error);
    }
  };

  const toggleEmployeeActive = async (userId: string) => {
    const target = staffProfiles.find((p) => p.user_id === userId);
    if (!target) return;
    if (target.role === 'admin' && profile?.user_id === userId) {
      alert('The primary Store Owner account cannot be deactivated.');
      return;
    }
    await updateEmployee(userId, { active: !target.active });
  };

  const hasRole = (allowed: AppRole | AppRole[]): boolean => {
    if (!profile) return false;
    const allowedArr = Array.isArray(allowed) ? allowed : [allowed];
    if (profile.role === 'admin' || profile.role === 'owner') return true;
    return allowedArr.includes(profile.role);
  };

  const canAccessModule = (moduleName: string): boolean => {
    if (!profile) return false;
    if (profile.role === 'admin' || profile.role === 'owner') return true;
    if (profile.role === 'cashier') {
      return ['pos', 'catalogue', 'receipts', 'customers'].includes(moduleName);
    }
    if (profile.role === 'inventory_clerk') {
      return ['inventory', 'catalogue', 'purchases'].includes(moduleName);
    }
    if (profile.role === 'accountant') {
      return ['reports', 'invoices', 'expenses', 'payments', 'customers'].includes(moduleName);
    }
    return true;
  };

  const isOwnerOrAdmin = profile?.role === 'admin' || profile?.role === 'owner';
  const isManager = profile?.role === 'store_manager';

  const value: AuthContextType = {
    user: profile,
    session,
    role: currentRole,
    isLoading,
    isAuthenticated,
    isSupabase,
    staffProfiles,
    signInWithPassword,
    signUp,
    signOut,
    setRoleOverride,
    setActiveEmployee,
    addEmployee,
    updateEmployee,
    toggleEmployeeActive,
    hasRole,
    canAccessModule,
    canManageStaff: isOwnerOrAdmin,
    canManageInventory: isOwnerOrAdmin || isManager || profile?.role === 'inventory_clerk',
    canMakeSales: Boolean(profile),
    canViewFinancials: isOwnerOrAdmin || isManager || profile?.role === 'accountant',
    canVerifyPayments: isOwnerOrAdmin || isManager || profile?.role === 'accountant',
    canAlterPrices: isOwnerOrAdmin || isManager,
    canDeleteRecords: isOwnerOrAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
