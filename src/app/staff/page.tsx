'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useNotifications } from '@/lib/notifications/NotificationContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import {
  User,
  Shield,
  Mail,
  Phone,
  Calendar,
  Settings,
  Activity,
  Lock,
  Plus,
} from 'lucide-react';

export default function StaffPage() {
  const { user, role, hasRole } = useAuth();
  const { showToast } = useNotifications();

  // Mock staff data (in a real implementation, this would come from the database)
  const staffMembers = [
    {
      id: user?.user_id || '00000000-0000-0000-0000-000000000001',
      full_name: user?.full_name || 'Becky',
      email: user?.email || 'kamenengewa@gmail.com',
      role: role || 'admin',
      phone: '+254 712 345 678',
      joined_date: '2024-01-15',
      last_active: new Date().toISOString(),
      status: 'active',
    },
  ];

  const getRoleBadgeColor = (r: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-amber-100 text-amber-800',
      manager: 'bg-blue-100 text-blue-800',
      accountant: 'bg-purple-100 text-purple-800',
      cashier: 'bg-emerald-100 text-emerald-800',
      clerk: 'bg-slate-100 text-slate-800',
    };
    return colors[r] || 'bg-slate-100 text-slate-800';
  };

  const getRoleLabel = (r: string) => {
    const labels: Record<string, string> = {
      admin: 'Store Owner',
      manager: 'Store Manager',
      accountant: 'Accountant',
      cashier: 'Cashier',
      clerk: 'Inventory Clerk',
    };
    return labels[r] || r;
  };

  const getPermissions = (r: string) => {
    const perms: Record<string, string[]> = {
      admin: ['Full system access', 'Manage staff', 'Configure settings', 'View all reports'],
      manager: ['Manage inventory', 'Approve returns', 'Verify payments', 'View reports'],
      accountant: ['Reconcile payments', 'Manage expenses', 'View financial reports'],
      cashier: ['Process sales', 'Apply discounts', 'Print receipts'],
      clerk: ['Update stock', 'Manage catalogue', 'Receive purchases'],
    };
    return perms[r] || [];
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Staff Management</h1>
            <Badge variant="default">{staffMembers.length} Members</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Store owner profile, staff roles, and access permissions.
          </p>
        </div>

        {hasRole('admin') && (
          <Button variant="primary" size="sm" className="flex items-center gap-1.5 font-bold" disabled>
            <Plus className="h-4 w-4" />
            <span>Add Staff Member</span>
          </Button>
        )}
      </div>

      {/* Store Owner Profile Card */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center text-2xl font-black">
            {user?.full_name?.charAt(0) || 'B'}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-black text-slate-900">{user?.full_name || 'Becky'}</h2>
              <Badge className={getRoleBadgeColor(role || 'admin')}>
                {getRoleLabel(role || 'admin')}
              </Badge>
            </div>
            <div className="text-xs text-slate-500 mb-3">Store Owner & Administrator</div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-400" />
                <span className="text-slate-700">{user?.email || 'kamenengewa@gmail.com'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-slate-400" />
                <span className="text-slate-700">+254 712 345 678</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span className="text-slate-700">Joined: January 2024</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold text-emerald-600">Active Now</span>
          </div>
        </div>
      </Card>

      {/* Permissions Overview */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-900">Your Permissions</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {getPermissions(role || 'admin').map((perm, idx) => (
            <div key={idx} className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
              <Activity className="h-4 w-4 text-amber-600" />
              <span className="text-xs font-medium text-slate-700">{perm}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Staff List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900">Team Members</h3>
        </div>

        <div className="divide-y divide-slate-100">
          {staffMembers.map((member) => (
            <div key={member.id} className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
                  {member.full_name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">{member.full_name}</div>
                  <div className="text-[10px] text-slate-500">{member.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge className={getRoleBadgeColor(member.role)} variant="outline">
                  {getRoleLabel(member.role)}
                </Badge>
                <Badge variant="default">{member.status}</Badge>
              </div>
            </div>
          ))}
        </div>

        {staffMembers.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-sm">
            No staff members found.
          </div>
        )}
      </div>

      {/* Role Information */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="h-5 w-5 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-900">Role Descriptions</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="font-bold text-amber-700 mb-2">Store Owner (Admin)</div>
            <div className="text-slate-600">Full system access, staff management, store configuration, and all financial reports.</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="font-bold text-blue-700 mb-2">Store Manager</div>
            <div className="text-slate-600">Inventory management, approve returns, verify payments, and access to operational reports.</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="font-bold text-purple-700 mb-2">Accountant</div>
            <div className="text-slate-600">Payment reconciliation, expense management, and financial report access.</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="font-bold text-emerald-700 mb-2">Cashier</div>
            <div className="text-slate-600">Process POS sales, apply discounts, and print receipts. Limited to counter operations.</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="font-bold text-slate-700 mb-2">Inventory Clerk</div>
            <div className="text-slate-600">Update stock levels, manage product catalogue, and receive supplier deliveries.</div>
          </div>

          <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 flex items-center justify-center">
            <div className="flex items-center gap-2 text-slate-500">
              <Lock className="h-4 w-4" />
              <span>Additional roles coming soon</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
