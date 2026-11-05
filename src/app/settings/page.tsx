'use client';

import React, { useState, useEffect } from 'react';
import { localDb } from '@/lib/dexie/db';
import { syncEngine } from '@/lib/sync/syncEngine';
import { useAuth } from '@/lib/auth/AuthContext';
import { useNotifications } from '@/lib/notifications/NotificationContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Settings,
  Store,
  FileText,
  Smartphone,
  Wifi,
  Shield,
  Printer,
  User,
  CheckCircle2,
  AlertTriangle,
  Bell,
  Mail,
  Volume2,
  VolumeX,
  Clock,
  Radio,
} from 'lucide-react';
import type { StoreSettings } from '@/lib/types/database';
import { isPusherConfigured } from '@/lib/pusher/client';
import { dispatchEmailAlert } from '@/lib/notifications/emailAlerts';
import {
  DEFAULT_DAILY_SUMMARY_CONFIG,
  buildDailySummary,
  dailySummaryMessage,
  dailySummaryTitle,
  loadDailySummaryConfig,
  saveDailySummaryConfig,
  sendDailySummaryEmail,
  type DailySummaryConfig,
} from '@/lib/notifications/dailySummary';

export default function SettingsPage() {
  const { user, canManageInventory } = useAuth();
  const {
    showToast,
    addNotification,
    isRealtimeConnected,
    browserNotificationPermission,
    requestWebNotificationPermission,
    localNotificationsEnabled,
    setLocalNotificationsEnabled,
    triggerLocalNotification,
    soundEnabled,
    setSoundEnabled,
  } = useNotifications();
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [isSendingDailyPreview, setIsSendingDailyPreview] = useState(false);
  const [dailySummaryConfig, setDailySummaryConfig] = useState<DailySummaryConfig>({
    ...DEFAULT_DAILY_SUMMARY_CONFIG,
  });

  // Form state
  const [formData, setFormData] = useState({
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
    receipt_footer: 'Goods once sold are returnable within 7 days with original receipt. Asante kwa biashara yako!',
    allow_offline_credit: false,
    max_offline_sale_kes: 100000.0,
    allow_negative_stock: false,
  });

  const loadSettings = async () => {
    try {
      const stored = await localDb.storeSettings.get('00000000-0000-0000-0000-000000000001');
      if (stored) {
        setSettings(stored);
        setFormData({
          store_name: stored.store_name || "Becky's Hardware Store",
          tagline: stored.tagline || '',
          physical_address: stored.physical_address || '',
          phone: stored.phone || '+254 712 345 678',
          email: stored.email || '',
          kra_pin: stored.kra_pin || 'P051234567X',
          currency: stored.currency || 'KES',
          vat_rate_percent: stored.vat_rate_percent || 16.0,
          mpesa_paybill: stored.mpesa_paybill || '',
          mpesa_till: stored.mpesa_till || '',
          mpesa_account: stored.mpesa_account || '',
          receipt_header: stored.receipt_header || "BECKY'S HARDWARE STORE",
          receipt_footer: stored.receipt_footer || '',
          allow_offline_credit: stored.allow_offline_credit || false,
          max_offline_sale_kes: stored.max_offline_sale_kes || 100000.0,
          allow_negative_stock: stored.allow_negative_stock || false,
        });
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  useEffect(() => {
    loadSettings();
    setDailySummaryConfig(loadDailySummaryConfig());
  }, []);

  const handleSaveSettings = async () => {
    if (!canManageInventory) {
      showToast('system', 'Permission Denied', 'Only Store Owner can modify settings.', '/settings');
      return;
    }

    setIsSaving(true);
    try {
      const updatedSettings: StoreSettings = {
        id: '00000000-0000-0000-0000-000000000001',
        ...formData,
        updated_at: new Date().toISOString(),
        created_at: settings?.created_at || new Date().toISOString(),
      };

      await localDb.storeSettings.put(updatedSettings);
      setSettings(updatedSettings);

      // Queue sync to Supabase
      syncEngine.queueOperation('settings_upsert', updatedSettings).catch(console.error);

      showToast('system', 'Settings Saved', 'Store configuration updated successfully.', '/settings');
    } catch (e: any) {
      showToast('system', 'Error', e.message || 'Failed to save settings', '/settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestPwaNotification = async () => {
    let perm = browserNotificationPermission;
    if (perm !== 'granted') {
      const granted = await requestWebNotificationPermission();
      if (!granted) {
        showToast('system', 'Permission Required', 'Please enable local notifications in the browser prompt.');
        return;
      }
    }
    const triggered = await triggerLocalNotification({
      title: "Becky's Hardware: Stock Alert",
      body: 'Simba Cement 50kg is down to 4 bags. (Local device notification verified!)',
      link: '/catalogue',
    });
    addNotification({
      type: 'inventory',
      title: 'Local Notification Test',
      message: 'Simba Cement 50kg low stock test alert triggered.',
      link: '/catalogue',
    });
    if (triggered) {
      showToast('system', 'Local Alert Sent', 'Device banner dispatched successfully.');
    } else {
      showToast('system', 'In-App Alert Sent', 'Alert surfaced in bell drawer.');
    }
  };

  const handleTestEmailAlert = async () => {
    setIsSendingTestEmail(true);
    const targetEmail = dailySummaryConfig.recipientEmail || user?.email || 'eveliaveldrine@gmail.com';
    const success = await dispatchEmailAlert({
      type: 'system',
      title: 'Test Email Alert: Store Notification',
      message: 'This is a test alert confirming your Resend email delivery pipeline is operational for Becky\'s Hardware Store.',
      recipientEmail: targetEmail,
      actionUrl: typeof window !== 'undefined' ? window.location.origin + '/reports' : 'https://beckyshardware.co.ke/reports',
      subject: "Test Alert — Becky's Hardware Store",
      headerLabel: "RESEND PIPELINE VERIFICATION",
      fields: [
        { label: 'Store Name', value: "Becky's Hardware Store" },
        { label: 'Recipient', value: targetEmail },
        { label: 'KRA PIN', value: 'P051234567X' },
        { label: 'Email Provider', value: 'Resend API' },
      ],
    });
    setIsSendingTestEmail(false);
    if (success) {
      showToast('system', 'Email Alert Dispatched', `Alert sent to ${targetEmail} via Resend.`);
    } else {
      showToast('system', 'Email Failed', 'Could not dispatch email. Check server logs.');
    }
  };

  const handleUpdateDailySummaryConfig = (patch: Partial<DailySummaryConfig>) => {
    if (!canManageInventory) return;
    const next = saveDailySummaryConfig({ ...dailySummaryConfig, ...patch });
    setDailySummaryConfig(next);
  };

  const handlePreviewDailySummary = async () => {
    setIsSendingDailyPreview(true);
    try {
      const summary = await buildDailySummary();
      const targetEmail = dailySummaryConfig.recipientEmail || user?.email || 'eveliaveldrine@gmail.com';

      // 1. Local Notification
      if (dailySummaryConfig.localNotifications !== false) {
        addNotification({
          type: 'system',
          title: dailySummaryTitle(summary),
          message: dailySummaryMessage(summary),
          link: '/reports',
          data: summary,
        });
      }

      // 2. Email via Resend
      if (dailySummaryConfig.email) {
        const sent = await sendDailySummaryEmail(summary, targetEmail);
        if (sent) {
          showToast('system', 'Daily Report Dispatched', `Summary emailed to ${targetEmail} via Resend.`);
        } else {
          showToast('system', 'Email Logged', 'Summary generated and logged. Check Resend API key.');
        }
      } else {
        showToast('system', 'Daily Summary Ready', 'Summary generated and displayed locally.');
      }
    } catch (err: any) {
      showToast('system', 'Summary Error', err?.message || "Could not build today's summary.");
    } finally {
      setIsSendingDailyPreview(false);
    }
  };

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400 text-sm">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Store Settings</h1>
            <Badge variant="default">Configuration</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Store branding, tax information, payment methods, and operational policies.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleSaveSettings}
          isLoading={isSaving}
          disabled={!canManageInventory}
          className="flex items-center gap-1.5 font-bold"
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>Save Changes</span>
        </Button>
      </div>

      {!canManageInventory && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div className="text-xs text-amber-800">
            <span className="font-bold">Read-Only Mode:</span> You are viewing store settings. Only the Store Owner can modify configuration.
          </div>
        </div>
      )}

      {/* Store Identity */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Store className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Store Identity & Branding</h3>
        </div>

        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700">Store Name</label>
              <input
                type="text"
                value={formData.store_name}
                onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                disabled={!canManageInventory}
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 font-bold focus:outline-none disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700">Tagline</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                disabled={!canManageInventory}
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 focus:outline-none disabled:bg-slate-50"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700">Physical Address</label>
            <input
              type="text"
              value={formData.physical_address}
              onChange={(e) => setFormData({ ...formData, physical_address: e.target.value })}
              disabled={!canManageInventory}
              placeholder="e.g. Shop 12, Main Street, Nairobi"
              className="w-full mt-1 p-2 rounded-xl border border-slate-300 focus:outline-none disabled:bg-slate-50"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!canManageInventory}
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 font-mono focus:outline-none disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!canManageInventory}
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 focus:outline-none disabled:bg-slate-50"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Tax & Compliance */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <FileText className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Tax & Compliance</h3>
        </div>

        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700">KRA Tax PIN</label>
              <input
                type="text"
                value={formData.kra_pin}
                onChange={(e) => setFormData({ ...formData, kra_pin: e.target.value.toUpperCase() })}
                disabled={!canManageInventory}
                placeholder="P051XXXXXXXXX"
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 font-mono font-bold uppercase focus:outline-none disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700">Currency</label>
              <input
                type="text"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                disabled={!canManageInventory}
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 font-bold uppercase focus:outline-none disabled:bg-slate-50"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700">VAT Rate (%)</label>
            <input
              type="number"
              step="0.1"
              value={formData.vat_rate_percent}
              onChange={(e) => setFormData({ ...formData, vat_rate_percent: parseFloat(e.target.value) || 0 })}
              disabled={!canManageInventory}
              className="w-full mt-1 p-2 rounded-xl border border-slate-300 font-bold focus:outline-none disabled:bg-slate-50"
            />
            <div className="text-[10px] text-slate-400 mt-1">Standard Kenya VAT is 16%</div>
          </div>
        </div>
      </Card>

      {/* M-Pesa Configuration */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
            <Smartphone className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">M-Pesa Configuration</h3>
        </div>

        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="font-bold text-slate-700">Paybill Number</label>
              <input
                type="text"
                value={formData.mpesa_paybill}
                onChange={(e) => setFormData({ ...formData, mpesa_paybill: e.target.value })}
                disabled={!canManageInventory}
                placeholder="247247"
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 font-mono font-bold focus:outline-none disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700">Till Number</label>
              <input
                type="text"
                value={formData.mpesa_till}
                onChange={(e) => setFormData({ ...formData, mpesa_till: e.target.value })}
                disabled={!canManageInventory}
                placeholder="5432101"
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 font-mono font-bold focus:outline-none disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700">Account Name</label>
              <input
                type="text"
                value={formData.mpesa_account}
                onChange={(e) => setFormData({ ...formData, mpesa_account: e.target.value })}
                disabled={!canManageInventory}
                placeholder="BECKY"
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 font-bold uppercase focus:outline-none disabled:bg-slate-50"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Receipt Configuration */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <Printer className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Receipt Configuration</h3>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700">Receipt Header</label>
            <input
              type="text"
              value={formData.receipt_header}
              onChange={(e) => setFormData({ ...formData, receipt_header: e.target.value })}
              disabled={!canManageInventory}
              className="w-full mt-1 p-2 rounded-xl border border-slate-300 font-bold uppercase focus:outline-none disabled:bg-slate-50"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700">Receipt Footer</label>
            <textarea
              value={formData.receipt_footer}
              onChange={(e) => setFormData({ ...formData, receipt_footer: e.target.value })}
              disabled={!canManageInventory}
              rows={2}
              className="w-full mt-1 p-2 rounded-xl border border-slate-300 focus:outline-none disabled:bg-slate-50 resize-none"
            />
          </div>
        </div>
      </Card>

      {/* Offline & Operational Policies */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Wifi className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Offline & Operational Policies</h3>
        </div>

        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
            <div>
              <div className="font-bold text-slate-900">Allow Customer Credit Offline</div>
              <div className="text-[10px] text-slate-500">Permit credit sales when network is unavailable</div>
            </div>
            <button
              onClick={() => setFormData({ ...formData, allow_offline_credit: !formData.allow_offline_credit })}
              disabled={!canManageInventory}
              className={`w-12 h-6 rounded-full transition-colors ${
                formData.allow_offline_credit ? 'bg-amber-600' : 'bg-slate-300'
              } disabled:opacity-50`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  formData.allow_offline_credit ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <div>
            <label className="font-bold text-slate-700">Maximum Offline Sale Amount (KES)</label>
            <input
              type="number"
              value={formData.max_offline_sale_kes}
              onChange={(e) => setFormData({ ...formData, max_offline_sale_kes: parseFloat(e.target.value) || 0 })}
              disabled={!canManageInventory}
              className="w-full mt-1 p-2 rounded-xl border border-slate-300 font-bold focus:outline-none disabled:bg-slate-50"
            />
            <div className="text-[10px] text-slate-400 mt-1">Cashiers cannot exceed this amount without internet</div>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
            <div>
              <div className="font-bold text-slate-900">Allow Negative Stock</div>
              <div className="text-[10px] text-slate-500">Permit sales even when stock is depleted</div>
            </div>
            <button
              onClick={() => setFormData({ ...formData, allow_negative_stock: !formData.allow_negative_stock })}
              disabled={!canManageInventory}
              className={`w-12 h-6 rounded-full transition-colors ${
                formData.allow_negative_stock ? 'bg-amber-600' : 'bg-slate-300'
              } disabled:opacity-50`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  formData.allow_negative_stock ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      </Card>

      {/* Realtime Alerts, Email & PWA Notifications */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Local Notifications &amp; Resend Email Alerts</h3>
              <p className="text-[11px] text-slate-500">Device push banners, procedural audio chimes, and Resend email pipelines</p>
            </div>
          </div>
          <Badge variant={isRealtimeConnected ? 'success' : 'warning'}>
            {isRealtimeConnected ? 'Realtime Connected' : 'Connecting Feed'}
          </Badge>
        </div>

        <div className="space-y-4 text-xs">
          {/* Local Device Notifications */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <span>Local Device &amp; System Notifications</span>
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    browserNotificationPermission === 'granted' && localNotificationsEnabled
                      ? 'bg-emerald-100 text-emerald-800'
                      : !localNotificationsEnabled
                      ? 'bg-slate-200 text-slate-700'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {browserNotificationPermission === 'granted'
                    ? localNotificationsEnabled
                      ? 'Active'
                      : 'Muted'
                    : 'Permission Required'}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Receive instant local pop-up banners on Android, iOS PWA, and desktop for low stock, sales, and daily closing digests.
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {browserNotificationPermission !== 'granted' ? (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleTestPwaNotification}
                  className="font-bold whitespace-nowrap"
                >
                  Enable Notifications
                </Button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setLocalNotificationsEnabled(!localNotificationsEnabled)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      localNotificationsEnabled ? 'bg-amber-600' : 'bg-slate-300'
                    }`}
                    title={localNotificationsEnabled ? 'Disable local notifications' : 'Enable local notifications'}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        localNotificationsEnabled ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleTestPwaNotification}
                    className="font-bold whitespace-nowrap"
                  >
                    Test Local Alert
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Email Alerts via Resend */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-slate-500" />
                <span>Automated Email Alerts (Resend)</span>
                <span className="font-mono text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  {dailySummaryConfig.recipientEmail || user?.email || 'eveliaveldrine@gmail.com'}
                </span>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded text-[9px] font-bold">
                  Resend Active
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Delivers realtime stock alerts and daily store performance digests directly to the store owner's inbox.
              </div>
            </div>
            <Button
              type="button"
              variant="primary"
              size="sm"
              isLoading={isSendingTestEmail}
              onClick={handleTestEmailAlert}
              className="font-bold whitespace-nowrap self-start sm:self-auto shadow-sm"
            >
              Send Test Email
            </Button>
          </div>

          {/* Pusher Realtime WebSockets */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Radio className="h-3.5 w-3.5 text-slate-500" />
                <span>Pusher WebSockets (pusher-js)</span>
                <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full border ${isPusherConfigured() ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                  {isPusherConfigured() ? 'Pusher Connected' : 'Ready (Client SDK Active)'}
                </span>
                <span className="font-mono text-[9px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                  channel: beckys-hardware-channel
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Broadcasts real-time counter sales, daily reports, and low-stock alarms to all active store devices via Pusher channels.
              </div>
            </div>
            <span className="text-[10px] font-bold text-slate-400 font-mono">
              pusher-js v8.6.0
            </span>
          </div>

          {/* Procedural Audio Chimes */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2.5">
              {soundEnabled ? (
                <Volume2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <VolumeX className="h-4 w-4 text-slate-400" />
              )}
              <div>
                <div className="font-bold text-slate-900">Audio Alerts (Sound Chime)</div>
                <div className="text-[11px] text-slate-500">Play distinctive harmonic chimes on POS sales, stock warnings, and M-Pesa receipts</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`w-12 h-6 rounded-full transition-colors ${
                soundEnabled ? 'bg-amber-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  soundEnabled ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      </Card>

      {/* Daily End-of-Day Summary */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Daily End-of-Day Summary</h3>
              <p className="text-[11px] text-slate-500">
                Automatic digest of the day&apos;s sales, profits, expenses, and payment mix dispatched via Resend and local device notifications
              </p>
            </div>
          </div>
          <Badge variant={dailySummaryConfig.enabled ? 'success' : 'default'}>
            {dailySummaryConfig.enabled ? `Daily at ${dailySummaryConfig.time}` : 'Disabled'}
          </Badge>
        </div>

        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <div className="font-bold text-slate-900">Automatic Daily Digest</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Automatically computes today&apos;s sales, gross profit, and collections at closing time.
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleUpdateDailySummaryConfig({ enabled: !dailySummaryConfig.enabled })}
              disabled={!canManageInventory}
              className={`w-12 h-6 rounded-full transition-colors ${
                dailySummaryConfig.enabled ? 'bg-amber-600' : 'bg-slate-300'
              } disabled:opacity-50`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  dailySummaryConfig.enabled ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700">End-of-Day Closing Time (EAT)</label>
              <input
                type="time"
                value={dailySummaryConfig.time}
                onChange={(e) => handleUpdateDailySummaryConfig({ time: e.target.value })}
                disabled={!canManageInventory || !dailySummaryConfig.enabled}
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 font-bold focus:outline-none disabled:bg-slate-50"
              />
              <div className="text-[10px] text-slate-400 mt-1">
                The digest triggers when the Nairobi clock reaches this closing hour
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700">Owner Report Email (Resend)</label>
              <input
                type="email"
                value={dailySummaryConfig.recipientEmail || 'eveliaveldrine@gmail.com'}
                onChange={(e) => handleUpdateDailySummaryConfig({ recipientEmail: e.target.value })}
                disabled={!canManageInventory}
                placeholder="eveliaveldrine@gmail.com"
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 font-mono text-xs focus:outline-none disabled:bg-slate-50"
              />
              <div className="text-[10px] text-slate-400 mt-1">
                Where Resend sends the daily sales and profit breakdown
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-slate-500" />
                <div>
                  <div className="font-bold text-slate-900">Email Daily Digest (Resend)</div>
                  <div className="text-[11px] text-slate-500">
                    Sends full financial summary to {dailySummaryConfig.recipientEmail || 'store owner'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleUpdateDailySummaryConfig({ email: !dailySummaryConfig.email })}
                disabled={!canManageInventory}
                className={`w-12 h-6 rounded-full transition-colors ${
                  dailySummaryConfig.email ? 'bg-amber-600' : 'bg-slate-300'
                } disabled:opacity-50`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    dailySummaryConfig.email ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-2.5">
                <Bell className="h-4 w-4 text-slate-500" />
                <div>
                  <div className="font-bold text-slate-900">Local Notification Banner</div>
                  <div className="text-[11px] text-slate-500">
                    Fires native device alert banner on closing
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleUpdateDailySummaryConfig({
                    localNotifications: !(dailySummaryConfig.localNotifications !== false),
                  })
                }
                disabled={!canManageInventory}
                className={`w-12 h-6 rounded-full transition-colors ${
                  dailySummaryConfig.localNotifications !== false ? 'bg-amber-600' : 'bg-slate-300'
                } disabled:opacity-50`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    dailySummaryConfig.localNotifications !== false ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <div className="font-bold text-slate-900">Send Today&apos;s Summary Now</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Immediately compiles today&apos;s sales, profits, and M-Pesa totals and dispatches via Resend email and local notification.
              </div>
            </div>
            <Button
              type="button"
              variant="primary"
              size="sm"
              isLoading={isSendingDailyPreview}
              onClick={handlePreviewDailySummary}
              className="font-bold whitespace-nowrap self-start sm:self-auto shadow-sm"
            >
              Send Daily Report Now
            </Button>
          </div>
        </div>
      </Card>

      {/* Store Owner Profile */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
            <User className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Store Owner Profile</h3>
        </div>

        <div className="text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-500">Name:</span>
            <span className="font-bold text-slate-900">{user?.full_name || 'Becky'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Role:</span>
            <span className="font-bold text-amber-700">{user?.role || 'Admin'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Email:</span>
            <span className="font-mono text-slate-700">{user?.email || 'eveliaveldrine@gmail.com'}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
