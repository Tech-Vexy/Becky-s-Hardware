'use client';

import React, { useState, useEffect } from 'react';
import { localDb } from '@/lib/dexie/db';
import { useAuth } from '@/lib/auth/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Settings, Save, CheckCircle2, ShieldCheck, Smartphone, Printer, Store } from 'lucide-react';
import type { StoreSettings } from '@/lib/types/database';

export default function SettingsPage() {
  const { role, canManageStaff } = useAuth();
  const [settings, setSettings] = useState<StoreSettings>({
    id: '00000000-0000-0000-0000-000000000001',
    store_name: "Becky's Hardware Store",
    tagline: 'Ubora na Bei Nafuu - Quality Building Materials',
    physical_address: '',
    phone: '+254 712 345 678',
    email: 'sales@beckyshardware.co.ke',
    kra_pin: 'P051234567X',
    currency: 'KES',
    vat_rate_percent: 16.0,
    mpesa_paybill: '247247',
    mpesa_till: '5432101',
    mpesa_account: 'BECKY',
    receipt_header: "BECKY'S HARDWARE STORE",
    receipt_footer:
      'Goods once sold are returnable within 7 days in good condition with original receipt. Asante kwa biashara yako!',
    allow_offline_credit: false,
    max_offline_sale_kes: 100000.0,
    allow_negative_stock: false,
  });

  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const s = await localDb.storeSettings.get('00000000-0000-0000-0000-000000000001');
      if (s) setSettings(s);
    };
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageStaff) {
      alert('Only store managers or administrators can update store configuration.');
      return;
    }

    await localDb.storeSettings.put({
      ...settings,
      updated_at: new Date().toISOString(),
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Store Configuration</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Single store hardware retailer parameters: tax compliance PIN, M-Pesa details, receipt disclaimers, and offline rules.
          </p>
        </div>

        {isSaved && (
          <Badge variant="success" className="flex items-center gap-1.5 py-1 px-3">
            <CheckCircle2 className="h-4 w-4" />
            <span>Settings Saved Successfully</span>
          </Badge>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Business Details */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Store className="h-5 w-5 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900">Physical Store Information</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700">Hardware Store Name</label>
              <input
                type="text"
                value={settings.store_name}
                onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 font-bold focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700">Tagline / Motto</label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700">Physical Address / Yard Depot</label>
              <input
                type="text"
                value={settings.physical_address}
                onChange={(e) => setSettings({ ...settings, physical_address: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700">Primary Telephone</label>
              <input
                type="text"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700">KRA Tax PIN</label>
              <input
                type="text"
                value={settings.kra_pin}
                onChange={(e) => setSettings({ ...settings, kra_pin: e.target.value.toUpperCase() })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 font-mono font-bold uppercase focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700">Sales Email</label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 focus:outline-none"
              />
            </div>
          </div>
        </Card>

        {/* Financial & M-Pesa Settings */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Smartphone className="h-5 w-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">M-Pesa & Financial Configuration</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700">M-Pesa Buy Goods Till #</label>
              <input
                type="text"
                value={settings.mpesa_till}
                onChange={(e) => setSettings({ ...settings, mpesa_till: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 font-mono font-bold focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700">M-Pesa Paybill #</label>
              <input
                type="text"
                value={settings.mpesa_paybill}
                onChange={(e) => setSettings({ ...settings, mpesa_paybill: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700">Paybill Account Name</label>
              <input
                type="text"
                value={settings.mpesa_account}
                onChange={(e) => setSettings({ ...settings, mpesa_account: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700">Currency</label>
              <input
                type="text"
                disabled
                value={settings.currency}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 bg-slate-100 font-bold text-slate-600"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700">Standard VAT Rate (%)</label>
              <input
                type="number"
                value={settings.vat_rate_percent}
                onChange={(e) =>
                  setSettings({ ...settings, vat_rate_percent: parseFloat(e.target.value) || 0 })
                }
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 font-bold focus:outline-none"
              />
            </div>
          </div>
        </Card>

        {/* Offline Policies & Receipt Format */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Printer className="h-5 w-5 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900">Receipt Disclaimers & Offline Policy</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700">Receipt Header Display Text</label>
              <input
                type="text"
                value={settings.receipt_header}
                onChange={(e) => setSettings({ ...settings, receipt_header: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 font-bold focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700">Receipt Return Policy Footer</label>
              <textarea
                rows={2}
                value={settings.receipt_footer}
                onChange={(e) => setSettings({ ...settings, receipt_footer: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 focus:outline-none"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.allow_offline_credit}
                  onChange={(e) => setSettings({ ...settings, allow_offline_credit: e.target.checked })}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span className="font-bold text-slate-800">
                  Permit Offline Credit Sales (Caution: increases risk of exceeding limits during internet outage)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.allow_negative_stock}
                  onChange={(e) => setSettings({ ...settings, allow_negative_stock: e.target.checked })}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span className="font-bold text-slate-800">
                  Allow Negative Inventory Balance (Sell even if book stock is 0; backorder logged)
                </span>
              </label>
            </div>
          </div>
        </Card>

        {canManageStaff && (
          <div className="flex justify-end">
            <Button variant="primary" size="lg" type="submit" className="flex items-center gap-2 font-bold">
              <Save className="h-5 w-5" />
              <span>Save Configuration</span>
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
