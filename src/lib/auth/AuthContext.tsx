'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AppRole, Profile } from '@/lib/types/database';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { syncEngine } from '@/lib/sync/syncEngine';

export const INITIAL_ADMIN_PROFILE: Profile = {
  user_id: '00000000-0000-0000-0000-000000000001',
  full_name: 'Becky (Store Owner)',
  phone: '+254 712 345 678',
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
  hasRole: (allowed: AppRole[]) => boolean;
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
  const [staffProfiles, setStaffProfiles] = useState<Profile[]>([INITIAL_ADMIN_PROFILE]);
  const [profile, setProfile] = useState<Profile | null>(INITIAL_ADMIN_PROFILE);
  const [session, setSession] = useState<any | null>(null);
  const [currentRole, setCurrentRole] = useState<AppRole>('admin');
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const isSupabase = isSupabaseConfigured();

  // Helper to load profile from Supabase with offline cache fallback
  const loadSupabaseProfile = async (userId: string, userMeta?: any) => {
    try {
      const { data: prof, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (prof && !error) {
        setProfile(prof as Profile);
        setCurrentRole((prof.role || 'admin') as AppRole);
        setStaffProfiles([prof as Profile]);
        setIsAuthenticated(true);
        try {
          localStorage.setItem(CACHED_PROFILE_KEY, JSON.stringify(prof));
        } catch {}
      } else {
        // Fallback to cached profile if available
        const cached = typeof window !== 'undefined' ? localStorage.getItem(CACHED_PROFILE_KEY) : null;
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            setProfile(parsed);
            setCurrentRole((parsed.role || 'admin') as AppRole);
            setStaffProfiles([parsed]);
            setIsAuthenticated(true);
            return;
          } catch {}
        }

        // Single user mode: Store Owner Admin
        const assignedRole: AppRole = 'admin';
        const assignedName: string = userMeta?.full_name || 'Becky (Store Owner)';
        const assignedPhone: string = userMeta?.phone || '+254 712 345 678';

        const newRow: Profile = {
          user_id: userId,
          full_name: assignedName,
          phone: assignedPhone,
          role: assignedRole,
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: inserted, error: insertErr } = await supabase
          .from('profiles')
          .insert(newRow)
          .select()
          .single();

        if (inserted && !insertErr) {
          setProfile(inserted as Profile);
          setCurrentRole('admin');
          setStaffProfiles([inserted as Profile]);
          setIsAuthenticated(true);
          try {
            localStorage.setItem(CACHED_PROFILE_KEY, JSON.stringify(inserted));
          } catch {}
        } else {
          // Keep user logged in offline
          setProfile(newRow);
          setCurrentRole('admin');
          setStaffProfiles([newRow]);
          setIsAuthenticated(true);
          try {
            localStorage.setItem(CACHED_PROFILE_KEY, JSON.stringify(newRow));
          } catch {}
        }
      }
    } catch (err) {
      console.warn('Network offline or error loading Supabase profile:', err);
      // Offline fallback: load cached profile
      try {
        const cached = typeof window !== 'undefined' ? localStorage.getItem(CACHED_PROFILE_KEY) : null;
        if (cached) {
          const parsed = JSON.parse(cached);
          setProfile(parsed);
          setCurrentRole((parsed.role || 'admin') as AppRole);
          setStaffProfiles([parsed]);
          setIsAuthenticated(true);
        } else {
          setProfile(INITIAL_ADMIN_PROFILE);
          setCurrentRole('admin');
          setStaffProfiles([INITIAL_ADMIN_PROFILE]);
          setIsAuthenticated(true);
        }
      } catch {}
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isSupabase) {
      // 1. Check existing Supabase session
      supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
        setSession(currentSession);
        if (currentSession?.user) {
          loadSupabaseProfile(currentSession.user.id, currentSession.user.user_metadata);
        } else {
          // If offline and we have a cached profile, keep user logged in
          const cached = localStorage.getItem(CACHED_PROFILE_KEY);
          if (cached && !navigator.onLine) {
            try {
              const parsed = JSON.parse(cached);
              setProfile(parsed);
              setCurrentRole((parsed.role || 'admin') as AppRole);
              setStaffProfiles([parsed]);
              setIsAuthenticated(true);
              setIsLoading(false);
              return;
            } catch {}
          }
          setIsLoading(false);
          setIsAuthenticated(false);
          setProfile(null);
        }
      }).catch((err) => {
        console.warn('Offline getSession fallback:', err);
        const cached = localStorage.getItem(CACHED_PROFILE_KEY);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            setProfile(parsed);
            setCurrentRole((parsed.role || 'admin') as AppRole);
            setStaffProfiles([parsed]);
            setIsAuthenticated(true);
          } catch {}
        }
        setIsLoading(false);
      });

      // 2. Subscribe to auth changes (Sign In, Sign Out, Token Refresh)
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, newSession) => {
        setSession(newSession);
        if (newSession?.user) {
          await loadSupabaseProfile(newSession.user.id, newSession.user.user_metadata);
        } else if (event === 'SIGNED_OUT') {
          try {
            localStorage.removeItem(CACHED_PROFILE_KEY);
          } catch {}
          setProfile(null);
          setIsAuthenticated(false);
          setIsLoading(false);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // Single User Mode (Store Owner): load from localStorage or default
      try {
        const stored = localStorage.getItem(STAFF_STORAGE_KEY);
        let ownerProfile: Profile = INITIAL_ADMIN_PROFILE;
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            ownerProfile = { ...parsed[0], role: 'admin', active: true };
          }
        }
        localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify([ownerProfile]));
        setStaffProfiles([ownerProfile]);
        setProfile(ownerProfile);
        setCurrentRole('admin');
        setIsAuthenticated(true);
      } catch (e) {
        console.warn('Error reading owner storage:', e);
        setStaffProfiles([INITIAL_ADMIN_PROFILE]);
        setProfile(INITIAL_ADMIN_PROFILE);
        setCurrentRole('admin');
        setIsAuthenticated(true);
      } finally {
        setIsLoading(false);
      }
    }
  }, [isSupabase]);

  const saveProfilesLocally = (newList: Profile[]) => {
    setStaffProfiles(newList);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(newList));
    }
  };

  // Sign In with email and password
  const signInWithPassword = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    if (isSupabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          // If the account does not exist in Supabase yet, automatically provision initial store owner
          if (error.message.toLowerCase().includes('invalid login credentials')) {
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email: email.trim(),
              password,
              options: {
                data: {
                  full_name: 'Becky (Store Owner)',
                  phone: '+254 712 345 678',
                  role: 'admin',
                },
              },
            });
            if (signUpData?.user && !signUpError) {
              await loadSupabaseProfile(signUpData.user.id, {
                full_name: 'Becky (Store Owner)',
                phone: '+254 712 345 678',
                role: 'admin',
              });
              return { success: true };
            }
          }

          // Fallback to local store owner if offline or network error
          if (typeof navigator !== 'undefined' && (!navigator.onLine || error.message.toLowerCase().includes('fetch'))) {
            const fallback = staffProfiles[0] || INITIAL_ADMIN_PROFILE;
            setProfile(fallback);
            setCurrentRole('admin');
            setIsAuthenticated(true);
            setIsLoading(false);
            return { success: true };
          }

          setIsLoading(false);
          return { success: false, error: error.message };
        }

        if (data.user) {
          await loadSupabaseProfile(data.user.id, data.user.user_metadata);
        }
        return { success: true };
      } catch (err: any) {
        // Fallback to local store owner on connection error
        const fallback = staffProfiles[0] || INITIAL_ADMIN_PROFILE;
        setProfile(fallback);
        setCurrentRole('admin');
        setIsAuthenticated(true);
        setIsLoading(false);
        return { success: true };
      }
    } else {
      // Local store mode sign in
      const matched =
        staffProfiles.find(
          (p) =>
            p.full_name.toLowerCase().includes(email.toLowerCase()) ||
            (p.phone && p.phone.includes(email))
        ) || staffProfiles[0] || INITIAL_ADMIN_PROFILE;

      setProfile(matched);
      setCurrentRole(matched.role);
      setIsAuthenticated(true);
      setIsLoading(false);
      return { success: true };
    }
  };

  // Sign Up / Register Store Owner or Staff
  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    phone: string,
    role: AppRole = 'admin'
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    if (isSupabase) {
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
          await loadSupabaseProfile(data.user.id, {
            full_name: fullName.trim(),
            phone: phone.trim(),
            role,
          });
        }
        return { success: true };
      } catch (err: any) {
        setIsLoading(false);
        return { success: false, error: err.message || 'Sign up failed' };
      }
    } else {
      // Offline mode registration
      const newProf: Profile = {
        user_id: `00000000-0000-0000-0000-${Date.now().toString().slice(-12)}`,
        full_name: fullName.trim(),
        phone: phone.trim(),
        role,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const updatedList = [...staffProfiles, newProf];
      saveProfilesLocally(updatedList);
      setProfile(newProf);
      setCurrentRole(role);
      setIsAuthenticated(true);
      setIsLoading(false);
      return { success: true };
    }
  };

  // Sign Out
  const signOut = async () => {
    setIsLoading(true);
    try {
      if (isSupabase) {
        await supabase.auth.signOut();
      }
      setProfile(null);
      setSession(null);
      setIsAuthenticated(false);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(ACTIVE_USER_ID_KEY);
      }
    } catch (err) {
      console.warn('Sign out error:', err);
    } finally {
      setIsLoading(false);
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
    const newId = `00000000-0000-0000-0000-${Date.now().toString().slice(-12)}`;
    const newProfile: Profile = {
      user_id: newId,
      full_name: emp.full_name.trim(),
      phone: emp.phone?.trim() || '+254 ',
      role: emp.role,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabase && emp.email && emp.password) {
      try {
        // Sign up employee in Supabase
        await supabase.auth.signUp({
          email: emp.email.trim(),
          password: emp.password,
          options: {
            data: {
              full_name: newProfile.full_name,
              phone: newProfile.phone,
              role: newProfile.role,
            },
          },
        });
      } catch (err) {
        console.warn('Could not register Supabase user credentials:', err);
      }
    }

    if (isSupabase) {
      try {
        await supabase.from('profiles').upsert(newProfile);
      } catch (err) {
        console.warn('Supabase profile upsert error:', err);
      }
    }

    const updatedList = [...staffProfiles, newProfile];
    saveProfilesLocally(updatedList);

    // Queue sync to cloud
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

    saveProfilesLocally(updatedList);

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
    if (userId === INITIAL_ADMIN_PROFILE.user_id || (staffProfiles[0] && staffProfiles[0].user_id === userId && staffProfiles[0].role === 'admin')) {
      alert('The Store Owner account cannot be deactivated.');
      return;
    }

    const target = staffProfiles.find((p) => p.user_id === userId);
    if (!target) return;

    await updateEmployee(userId, { active: !target.active });
  };

  const hasRole = (allowed: AppRole[]): boolean => {
    // In Single User Mode, the Store Owner holds master authority across all roles
    return true;
  };

  const canAccessModule = (moduleName: string): boolean => {
    // Store Owner has access to all operational store modules
    return true;
  };

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
    canManageStaff: true,
    canManageInventory: true,
    canMakeSales: true,
    canViewFinancials: true,
    canVerifyPayments: true,
    canAlterPrices: true,
    canDeleteRecords: true,
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