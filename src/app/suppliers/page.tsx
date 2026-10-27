'use client';

import React, { useState, useEffect } from 'react';
import { localDb } from '@/lib/dexie/db';
import { useAuth } from '@/lib/auth/AuthContext';
import { formatPhoneKE } from '@/lib/utils/formatters';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Building2, Plus, Edit2, Phone, Mail, MapPin } from 'lucide-react';
import type { Supplier } from '@/lib/types/database';

export default function SuppliersPage() {
  const { canManageInventory } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
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
    const list = await localDb.suppliers.where('active').equals(1).toArray();
    setSuppliers(list);
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setFormData({
      supplier_code: `SUP-00${suppliers.length + 1}`,
      name: '',
      phone: '+254 ',
      email: '',
      address: '',
      tax_pin: 'P051',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setFormData({
      supplier_code: s.supplier_code || '',
      name: s.name,
      phone: s.phone || '',
      email: s.email || '',
      address: s.address || '',
      tax_pin: s.tax_pin || '',
    });
    setIsModalOpen(true);
  };

  const handleSaveSupplier = async () => {
    if (!formData.name) {
      alert('Supplier Name is required');
      return;
    }

    if (editingSupplier) {
      await localDb.suppliers.update(editingSupplier.id, {
        ...formData,
        updated_at: new Date().toISOString(),
      });
    } else {
      const newSupplier: Supplier = {
        id: `00000000-0000-0000-0002-${Date.now().toString().slice(-12)}`,
        ...formData,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await localDb.suppliers.put(newSupplier);
    }

    await loadSuppliers();
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Suppliers Directory</h1>
            <Badge variant="default">{suppliers.length} Active Vendors</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Hardware distributors, cement factories, steel mills, and paint manufacturers in Kenya.
          </p>
        </div>

        {canManageInventory && (
          <Button variant="primary" size="sm" onClick={handleOpenAdd} className="flex items-center gap-1.5 font-bold">
            <Plus className="h-4 w-4" />
            <span>Add Supplier</span>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map((s) => (
          <div
            key={s.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-amber-500 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                  {s.supplier_code}
                </span>
                {canManageInventory && (
                  <button
                    onClick={() => handleOpenEdit(s)}
                    className="p-1 text-slate-400 hover:text-amber-700 rounded-lg hover:bg-slate-50"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <h3 className="text-base font-bold text-slate-900">{s.name}</h3>

              <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                {s.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>{formatPhoneKE(s.phone)}</span>
                  </div>
                )}
                {s.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span className="truncate">{s.email}</span>
                  </div>
                )}
                {s.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span>{s.address}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-500">
              <span>KRA PIN:</span>
              <span className="font-bold text-slate-800">{s.tax_pin || 'Pending'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSupplier ? 'Edit Supplier' : 'Add Hardware Supplier'}
        description="Supplier contact details, tax compliance PIN, and delivery address."
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
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 font-mono uppercase focus:outline-none"
                placeholder="P051..."
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700">Supplier Company Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full mt-1 p-2 rounded-xl border border-slate-300 font-bold focus:outline-none"
              placeholder="e.g. Mabati Rolling Mills"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700">Telephone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 focus:outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
              className="w-full mt-1 p-2 rounded-xl border border-slate-300 focus:outline-none"
            />
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveSupplier} className="font-bold">
              Save Supplier
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
