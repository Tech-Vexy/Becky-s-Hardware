'use client';

import React, { useState, useEffect } from 'react';
import { localDb } from '@/lib/dexie/db';
import { syncEngine } from '@/lib/sync/syncEngine';
import { useAuth } from '@/lib/auth/AuthContext';
import { useNotifications } from '@/lib/notifications/NotificationContext';
import { formatPhoneKE } from '@/lib/utils/formatters';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  Building2,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  FileText,
  Edit2,
  Download,
  Lock,
} from 'lucide-react';
import type { Supplier } from '@/lib/types/database';

export default function SuppliersPage() {
  const { user, canManageInventory } = useAuth();
  const { showToast } = useNotifications();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Add / Edit Supplier Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    supplier_code: '',
    name: '',
    phone: '',
    email: '',
    address: '',
    tax_pin: '',
  });

  const loadSuppliers = async () => {
    const allSuppliers = await localDb.suppliers.toArray();
    setSuppliers(allSuppliers);
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const filteredSuppliers = suppliers.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      (s.supplier_code && s.supplier_code.toLowerCase().includes(q)) ||
      (s.phone && s.phone.includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q))
    );
  });

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setFormData({
      supplier_code: `SUP-00${suppliers.length + 1}`,
      name: '',
      phone: '+254 ',
      email: '',
      address: '',
      tax_pin: 'P',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setFormData({
      supplier_code: s.supplier_code ?? '',
      name: s.name,
      phone: s.phone || '',
      email: s.email || '',
      address: s.address || '',
      tax_pin: s.tax_pin || '',
    });
    setIsModalOpen(true);
  };

  const handleSaveSupplier = async () => {
    if (!formData.name.trim()) {
      showToast('system', 'Validation Error', 'Supplier name is required.', '/suppliers');
      return;
    }

    try {
      if (editingSupplier) {
        await localDb.suppliers.update(editingSupplier.id, {
          ...formData,
          name: formData.name.trim(),
          supplier_code: formData.supplier_code.trim().toUpperCase(),
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          address: formData.address.trim() || null,
          tax_pin: formData.tax_pin.trim() || null,
          updated_at: new Date().toISOString(),
        });

        // Queue sync to Supabase
        syncEngine.queueOperation('supplier_upsert', {
          id: editingSupplier.id,
          ...formData,
        }).catch(console.error);

        showToast('inventory', 'Supplier Updated', `${formData.name} updated successfully.`, '/suppliers');
      } else {
        const newId = `00000000-0000-0000-0002-${Date.now().toString().slice(-12)}`;
        const newSupplier: Supplier = {
          id: newId,
          supplier_code: formData.supplier_code.trim().toUpperCase(),
          name: formData.name.trim(),
          phone: formData.phone.trim() || null,
          email: formData.email.trim() || null,
          address: formData.address.trim() || null,
          tax_pin: formData.tax_pin.trim() || null,
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        await localDb.suppliers.put(newSupplier);

        // Queue sync to Supabase
        syncEngine.queueOperation('supplier_upsert', newSupplier).catch(console.error);

        showToast('inventory', 'Supplier Added', `${newSupplier.name} added successfully.`, '/suppliers');
      }

      await loadSuppliers();
      setIsModalOpen(false);
    } catch (e: any) {
      showToast('system', 'Error', e.message || 'Failed to save supplier', '/suppliers');
    }
  };

  const handleToggleActive = async (s: Supplier) => {
    const newStatus = !s.active;
    await localDb.suppliers.update(s.id, {
      active: newStatus,
      updated_at: new Date().toISOString(),
    });
    syncEngine.queueOperation('supplier_upsert', {
      id: s.id,
      active: newStatus,
    }).catch(console.error);
    await loadSuppliers();
  };

  const handleExportCSV = () => {
    const headers = ['Supplier Code', 'Name', 'Phone', 'Email', 'Address', 'Tax PIN', 'Status'];
    const rows = suppliers.map((s) => [
      s.supplier_code,
      `"${s.name.replace(/"/g, '""')}"`,
      s.phone || '',
      s.email || '',
      `"${(s.address || '').replace(/"/g, '""')}"`,
      s.tax_pin || '',
      s.active ? 'Active' : 'Inactive',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `suppliers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Supplier Directory</h1>
            <Badge variant="default">{suppliers.length} Suppliers</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Contact directory, tax PINs, and delivery notes for hardware suppliers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="flex items-center gap-1.5">
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </Button>

          {canManageInventory ? (
            <Button variant="primary" size="sm" onClick={handleOpenAdd} className="flex items-center gap-1.5 font-bold">
              <Plus className="h-4 w-4" />
              <span>Add Supplier</span>
            </Button>
          ) : (
            <div className="flex items-center gap-1 text-[11px] text-slate-400 bg-slate-100 px-3 py-1.5 rounded-xl">
              <Lock className="h-3.5 w-3.5" />
              <span>Supplier edits reserved for Store Owner</span>
            </div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search supplier name, code, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-xs focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.map((s) => (
          <div
            key={s.id}
            className={`bg-white rounded-2xl border shadow-sm transition-all ${
              s.active ? 'border-slate-200 hover:border-amber-500' : 'border-slate-200 opacity-60'
            }`}
          >
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-mono text-[10px] text-slate-400 font-bold">{s.supplier_code}</div>
                    <div className="font-bold text-slate-900 text-sm">{s.name}</div>
                  </div>
                </div>
                {canManageInventory && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEdit(s)}
                    className="h-8 w-8 p-0 text-slate-400 hover:text-amber-600"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="space-y-2 text-xs">
                {s.phone && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>{formatPhoneKE(s.phone)}</span>
                  </div>
                )}
                {s.email && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span className="truncate">{s.email}</span>
                  </div>
                )}
                {s.address && (
                  <div className="flex items-start gap-2 text-slate-600">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5" />
                    <span className="line-clamp-2">{s.address}</span>
                  </div>
                )}
                {s.tax_pin && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-mono">KRA PIN: {s.tax_pin}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <Badge variant={s.active ? 'default' : 'secondary'}>
                  {s.active ? 'Active' : 'Inactive'}
                </Badge>
                {canManageInventory && (
                  <button
                    onClick={() => handleToggleActive(s)}
                    className="text-[10px] font-semibold text-slate-500 hover:text-amber-600 transition-colors"
                  >
                    {s.active ? 'Deactivate' : 'Activate'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredSuppliers.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <div className="text-sm text-slate-500">No suppliers found matching your search.</div>
        </div>
      )}

      {/* Add / Edit Supplier Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
        description="Manage supplier contact details and tax information."
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700">Supplier Code</label>
              <input
                type="text"
                value={formData.supplier_code}
                onChange={(e) => setFormData({ ...formData, supplier_code: e.target.value })}
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 font-mono font-bold focus:outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700">KRA Tax PIN</label>
              <input
                type="text"
                value={formData.tax_pin}
                onChange={(e) => setFormData({ ...formData, tax_pin: e.target.value.toUpperCase() })}
                placeholder="P051XXXXXXXXX"
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 font-mono font-bold uppercase focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700">Supplier Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Bamburi Cement Ltd"
              className="w-full mt-1 p-2 rounded-xl border border-slate-300 font-bold focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+254 7XX XXX XXX"
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 font-mono focus:outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="orders@supplier.co.ke"
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700">Physical Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g. Industrial Area, Nairobi"
              className="w-full mt-1 p-2 rounded-xl border border-slate-300 focus:outline-none"
            />
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveSupplier} className="font-bold">
              {editingSupplier ? 'Update Supplier' : 'Add Supplier'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
