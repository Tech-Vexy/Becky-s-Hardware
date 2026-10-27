'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { formatPhoneKE } from '@/lib/utils/formatters';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Card } from '@/components/ui/Card';
import {
  ShieldCheck,
  User,
  Phone,
  Edit2,
  CheckCircle2,
  Settings,
  ShoppingCart,
  Store,
} from 'lucide-react';

export default function StaffPage() {
  const { user, role, updateEmployee } = useAuth();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || 'Becky (Store Owner)',
    phone: user?.phone || '+254 712 345 678',
  });

  const handleOpenEdit = () => {
    if (user) {
      setFormData({
        full_name: user.full_name,
        phone: user.phone || '+254 ',
      });
    }
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!user || !formData.full_name.trim()) {
      alert('Full name is required.');
      return;
    }

    await updateEmployee(user.user_id, {
      full_name: formData.full_name.trim(),
      phone: formData.phone.trim(),
    });

    setIsEditModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Store Owner Profile</h1>
            <Badge variant="success">Single User Mode Active</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            The application is confined to a single user—the Store Owner—with full administrative, inventory, and POS privileges.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleOpenEdit}
          className="flex items-center gap-1.5 font-bold"
        >
          <Edit2 className="h-4 w-4" />
          <span>Edit Owner Details</span>
        </Button>
      </div>

      {/* Info Banner */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-950 space-y-1">
          <p className="font-bold">Single Location & Single User Architecture</p>
          <p className="text-amber-800 leading-relaxed">
            All operations (POS checkouts, supplier receiving, customer credit approvals, and tax reports) are directly managed by you at the main store location without godowns or multi-user access barriers.
          </p>
        </div>
      </div>

      {/* Owner Account Card */}
      <Card className="p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-amber-600 text-white font-extrabold flex items-center justify-center text-lg shadow-md">
              {user?.full_name ? user.full_name[0] : 'B'}
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">{user?.full_name}</h2>
              <div className="text-xs text-amber-700 font-bold uppercase tracking-wider mt-0.5">
                Store Owner / Master Administrator
              </div>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Active Account</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
              Telephone Contact
            </span>
            <div className="font-mono font-bold text-slate-800 text-sm">
              {user?.phone ? formatPhoneKE(user.phone) : '—'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
              Assigned Store Role
            </span>
            <div className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Store className="h-4 w-4 text-amber-600" />
              <span>Store Owner (Full Control)</span>
            </div>
          </div>
        </div>

        {/* Quick Shortcuts */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-3">
          <Link href="/pos">
            <Button variant="primary" size="sm" className="flex items-center gap-1.5 font-bold">
              <ShoppingCart className="h-4 w-4" />
              <span>Launch POS Checkout</span>
            </Button>
          </Link>

          <Link href="/settings">
            <Button variant="outline" size="sm" className="flex items-center gap-1.5 font-bold">
              <Settings className="h-4 w-4" />
              <span>Store & KRA PIN Settings</span>
            </Button>
          </Link>
        </div>
      </Card>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Update Store Owner Details"
        description="Update your contact phone number and display name."
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700">Full Name</label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 font-bold focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700">Telephone (Kenyan Format)</label>
            <div className="relative mt-1">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveEdit} className="font-bold">
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
