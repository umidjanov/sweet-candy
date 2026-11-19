'use client';

import React, { useState, useEffect } from 'react';
import { Users, Search, Ban, CheckCircle2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

export default function AdminUsersPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      if (statusFilter) params.set('status', statusFilter);

      const res = await apiClient<any>(`/admin/users?${params.toString()}`);
      setUsers(Array.isArray(res) ? res : res.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    if (!confirm(`Are you sure you want to mark this user as ${nextStatus}?`)) return;

    try {
      await apiClient(`/admin/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      await fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update user status');
    }
  };

  const p = t.adminPages.users;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#29252A]">{p.title}</h1>
          <p className="text-sm text-[#817781] mt-1">{p.subtitle}</p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder={p.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
            className="px-4 py-2 bg-white border border-[#EEE6E9] rounded-xl text-xs text-[#29252A] focus:outline-none focus:border-[#E85D8E]"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-[#EEE6E9] rounded-xl text-xs text-[#29252A] focus:outline-none focus:border-[#E85D8E]"
          >
            <option value="">{p.allRoles}</option>
            <option value="CUSTOMER">Customer</option>
            <option value="SELLER">Seller</option>
            <option value="ADMIN">Admin</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-[#EEE6E9] rounded-xl text-xs text-[#29252A] focus:outline-none focus:border-[#E85D8E]"
          >
            <option value="">{t.common.status}</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-3xl p-6 border border-[#EEE6E9] animate-pulse h-20" />
          ))}
        </div>
      ) : users.length > 0 ? (
        <div className="bg-white rounded-3xl border border-[#EEE6E9] shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#29252A]">
              <thead className="bg-[#FAF8F6] text-[#817781] uppercase font-bold border-b border-[#EEE6E9]">
                <tr>
                  <th className="px-6 py-4">{t.dashboard.admin.usersCount}</th>
                  <th className="px-6 py-4">{t.common.phone}</th>
                  <th className="px-6 py-4">{t.common.role}</th>
                  <th className="px-6 py-4">{t.common.status}</th>
                  <th className="px-6 py-4">Created</th>
                  <th className="px-6 py-4 text-right">{t.common.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEE6E9]">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#FAF8F6]/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-sm block">
                        {u.firstName} {u.lastName}
                      </span>
                      {u.sellerProfile && (
                        <span className="text-[11px] text-[#D99A52] font-semibold">
                          Store: {u.sellerProfile.storeName}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono">
                      <div>{u.phone}</div>
                      {u.email && <div className="text-[#817781] text-[11px]">{u.email}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={u.role === 'ADMIN' ? 'danger' : u.role === 'SELLER' ? 'warning' : 'outline'}>
                        {u.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {u.status === 'ACTIVE' ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="danger">Suspended</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-[#817781]">{formatDate(u.createdAt)}</td>
                    <td className="px-6 py-4 text-right">
                      {u.role !== 'ADMIN' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(u.id, u.status)}
                          className={`rounded-xl text-xs ${
                            u.status === 'ACTIVE'
                              ? 'text-rose-600 hover:bg-rose-50 border-rose-200'
                              : 'text-emerald-600 hover:bg-emerald-50 border-emerald-200'
                          }`}
                        >
                          {u.status === 'ACTIVE' ? (
                            <>
                              <Ban className="w-3.5 h-3.5 mr-1" /> {t.dashboard.admin.suspend}
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> {t.dashboard.admin.approve}
                            </>
                          )}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#EEE6E9] shadow-soft">
          <p className="text-sm text-[#817781]">{t.common.notFound}</p>
        </div>
      )}
    </div>
  );
}
