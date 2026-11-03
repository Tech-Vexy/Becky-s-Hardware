'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Button } from '@/components/ui/Button';
import { useInstallPrompt } from '@/lib/pwa/useInstallPrompt';
import {
  Wrench,
  Lock,
  Mail,
  AlertCircle,
  CheckCircle2,
  CloudOff,
  Download,
  Wifi,
  ShieldCheck,
  Smartphone,
  BarChart3,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { user, isAuthenticated, signInWithPassword } = useAuth();
  const { canInstall, promptInstall, isBannerDismissed } = useInstallPrompt();

  const [email, setEmail]               = useState('kamenengewa@gmail.com');
  const [password, setPassword]         = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOffline, setIsOffline]       = useState(false);

  // Detect offline state
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsOffline(!navigator.onLine);
    const goOnline  = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);
    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online',  goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) router.push('/');
  }, [isAuthenticated, user, router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await signInWithPassword(email.trim(), password);
      if (res.success) {
        setSuccessMessage('Authenticated. Redirecting…');
        router.refresh();
        router.push('/');
      } else {
        setErrorMessage(res.error || 'Failed to authenticate. Please check your Supabase credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel — decorative (desktop only) ──────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-12 relative overflow-hidden">
        {/* Background pattern */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, #f59e0b 0, #f59e0b 1px, transparent 0, transparent 50%)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Branding */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg">
              <Wrench className="h-5.5 w-5.5 text-white" strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-base font-extrabold tracking-tight text-white leading-none">
                BECKY'S HARDWARE
              </p>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-500 mt-0.5">
                Hardware &amp; Building Supplies
              </p>
            </div>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="relative z-10 space-y-5">
          <h2 className="text-2xl font-black text-white leading-tight tracking-tight">
            Your complete store<br />in one app.
          </h2>

          {[
            { icon: ShieldCheck, text: 'Offline-first POS — ring up sales without internet' },
            { icon: Smartphone,  text: 'M-Pesa reconciliation with unverified-payment tracking' },
            { icon: BarChart3,   text: 'Daily Z-reports, stock ledger & KRA-compliant invoices' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-amber-500/20 border border-amber-500/30">
                <Icon className="h-4 w-4 text-amber-400" />
              </div>
              <p className="text-sm text-slate-300 font-medium pt-1 leading-snug">{text}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="relative z-10 text-[11px] text-slate-600">
          Becky's Hardware Store — Retail Management System
        </p>
      </div>

      {/* ── Right panel — login form ─────────────────────────────────── */}
      <div className="flex flex-1 flex-col justify-center items-center bg-slate-50 px-5 py-12">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-700 shadow-xl mb-3">
              <Wrench className="h-7 w-7 text-white" strokeWidth={2.2} />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
              BECKY'S HARDWARE
            </h1>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-700 mt-1">
              Hardware &amp; Building Supplies
            </p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl px-7 py-8">
            <div className="mb-6">
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight leading-none">
                Store Owner Sign In
              </h2>
              <p className="text-xs text-slate-500 mt-1.5 leading-snug">
                Access POS, inventory &amp; financial ledgers for your store.
              </p>
            </div>

            {/* Offline notice */}
            {isOffline && (
              <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-slate-800 border border-slate-700 p-3 text-xs">
                <CloudOff className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Network Connection Required</p>
                  <p className="text-slate-400 mt-0.5">
                    Sign in requires an active internet connection to authenticate with Supabase. Local account logins are disabled for store inventory security.
                  </p>
                </div>
              </div>
            )}

            {/* Error / success feedback */}
            {errorMessage && (
              <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-red-500" />
                <span>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5 text-emerald-500" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="block text-xs font-semibold text-slate-700 mb-1">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sales@beckyshardware.co.ke"
                    className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2.5 text-sm font-medium focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all bg-slate-50 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    id="login-password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2.5 text-sm font-medium focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all bg-slate-50 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isOffline || isSubmitting}
                isLoading={isSubmitting}
                className="w-full font-bold shadow-md mt-2"
              >
                Sign In with Supabase
              </Button>
            </form>
          </div>

          {/* Install CTA — mobile only, when installable */}
          {canInstall && !isBannerDismissed && (
            <button
              onClick={() => promptInstall()}
              className="mt-4 w-full flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-700 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-800 transition-all shadow-sm"
            >
              <Download className="h-4 w-4 text-amber-600" />
              <span>Add to Home Screen for fast access</span>
            </button>
          )}

          {/* Cloud Auth verification status */}
          <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Protected by Supabase Cloud Authentication</span>
          </div>

          <p className="mt-6 text-center text-[11px] text-slate-400">
            Becky's Hardware Store &mdash; Retail Management System
          </p>
        </div>
      </div>
    </div>
  );
}
