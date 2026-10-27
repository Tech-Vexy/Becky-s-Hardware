'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Button } from '@/components/ui/Button';
import {
  Wrench,
  Lock,
  Mail,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { user, isAuthenticated, signInWithPassword } = useAuth();

  const [email, setEmail] = useState('sales@beckyshardware.co.ke');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // If already authenticated and has a valid user, redirect to dashboard
    if (isAuthenticated && user) {
      router.push('/');
    }
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
        setSuccessMessage('Authentication successful. Redirecting to store...');
        setTimeout(() => router.push('/'), 500);
      } else {
        setErrorMessage(res.error || 'Failed to authenticate. Check credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Branding Icon */}
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-600 text-white shadow-lg mb-4">
          <Wrench className="h-7 w-7" />
        </div>

        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          BECKY&apos;S HARDWARE
        </h1>
        <p className="text-xs font-semibold text-amber-800 uppercase tracking-widest mt-0.5">
          Building Supplies & Management Portal
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl border border-slate-200 sm:px-10">
          <div className="mb-6 text-center">
            <h2 className="text-base font-extrabold text-slate-900">Store Owner Sign In</h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter your credentials to access checkout, inventory, and financial ledgers.
            </p>
          </div>

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleSignIn} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Store Owner Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sales@beckyshardware.co.ke"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 font-medium focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 font-medium focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              className="w-full font-bold justify-center mt-2 shadow-sm"
            >
              Sign In as Store Owner
            </Button>
          </form>
        </div>

        {/* Clean Footer */}
        <p className="mt-4 text-center text-[11px] text-slate-500">
          Becky&apos;s Hardware Store • Retail Point of Sale & Inventory Management
        </p>
      </div>
    </div>
  );
}
