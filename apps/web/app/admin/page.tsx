'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Store,
  Cake,
  ShoppingBag,
  TrendingUp,
  Clock,
  ShieldCheck,
  AlertCircle,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice, formatDate } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

export default function AdminOverviewPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient('/admin/stats')
      .then((data) => setStats(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-sm text-[#817781] animate-pulse">{t.common.loading}</div>;
  }

  const { users, sellers, products, orders, recent } = stats || {
    users: { total: 0, customers: 0, sellers: 0 },
    sellers: { pending: 0, approved: 0, suspended: 0 },
    products: { total: 0, active: 0 },
    orders: { total: 0, pending: 0, completed: 0, cancelled: 0, totalRevenue: 0 },
    recent: { users: [], orders: [], auditLogs: [] },
  };

  return (
    <div className="space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-[#C83F72]">
          {t.dashboard.admin.controlPanel}
        </span>
        <h1 className="text-3xl font-black text-[#29252A] mt-1">{t.dashboard.admin.title}</h1>
        <p className="text-sm text-[#817781] mt-1">
          Sweet CANDY real-vaqt monitoringi va boshqaruvi.
        </p>
      </div>

      {/* Pending Sellers Notification Banner */}
      {sellers.pending > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-bold">
                {sellers.pending} {t.dashboard.admin.pendingSellers}
              </p>
              <p className="text-amber-800">
                Do‘kon tavsifi va telefon ma’lumotlarini tekshiring.
              </p>
            </div>
          </div>
          <Link href="/admin/sellers">
            <Button variant="caramel" size="sm" className="whitespace-nowrap rounded-xl">
              {t.dashboard.admin.approve}
            </Button>
          </Link>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 xs:gap-4 sm:gap-6">
        <div className="bg-white rounded-3xl p-6 border border-[#EEE6E9] shadow-soft space-y-2">
          <div className="flex items-center justify-between text-xs text-[#817781]">
            <span className="font-bold uppercase tracking-wider">{t.dashboard.seller.totalRevenue}</span>
            <TrendingUp className="w-4 h-4 text-[#269B69]" />
          </div>
          <p className="text-2xl font-black text-[#E85D8E]">{formatPrice(orders.totalRevenue)}</p>
          <span className="text-[11px] text-[#817781] block">{orders.completed} {t.dashboard.seller.completedOrders}</span>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#EEE6E9] shadow-soft space-y-2">
          <div className="flex items-center justify-between text-xs text-[#817781]">
            <span className="font-bold uppercase tracking-wider">{t.dashboard.admin.usersCount}</span>
            <Users className="w-4 h-4 text-[#817781]" />
          </div>
          <p className="text-2xl font-black text-[#29252A]">{users.total}</p>
          <span className="text-[11px] text-[#817781] block">
            {users.customers} • {users.sellers}
          </span>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#EEE6E9] shadow-soft space-y-2">
          <div className="flex items-center justify-between text-xs text-[#817781]">
            <span className="font-bold uppercase tracking-wider">{t.dashboard.admin.sellersCount}</span>
            <Store className="w-4 h-4 text-[#D99A52]" />
          </div>
          <p className="text-2xl font-black text-[#D99A52]">{sellers.approved}</p>
          <span className="text-[11px] text-[#817781] block">
            {sellers.pending} pending • {sellers.suspended} suspended
          </span>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#EEE6E9] shadow-soft space-y-2">
          <div className="flex items-center justify-between text-xs text-[#817781]">
            <span className="font-bold uppercase tracking-wider">{t.dashboard.admin.ordersCount}</span>
            <ShoppingBag className="w-4 h-4 text-[#E85D8E]" />
          </div>
          <p className="text-2xl font-black text-[#29252A]">{orders.total}</p>
          <span className="text-[11px] text-[#817781] block">
            {orders.pending} pending • {orders.cancelled} cancelled
          </span>
        </div>
      </div>

      {/* Two Column Section: Recent Users & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Registrations */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EEE6E9] shadow-soft space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#EEE6E9]">
            <h3 className="font-bold text-base text-[#29252A]">{t.dashboard.admin.usersCount}</h3>
            <Link href="/admin/users" className="text-xs font-bold text-[#E85D8E] hover:underline">
              {t.common.viewAll} →
            </Link>
          </div>

          <div className="divide-y divide-[#EEE6E9]">
            {recent.users?.length > 0 ? (
              recent.users.map((u: any) => (
                <div key={u.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-sm block">
                      {u.firstName} {u.lastName}
                    </span>
                    <span className="text-[#817781]">{u.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={u.role === 'SELLER' ? 'warning' : 'outline'}>{u.role}</Badge>
                    <span className="text-[#817781] text-[11px]">{formatDate(u.createdAt)}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#817781] py-4">{t.common.notFound}</p>
            )}
          </div>
        </div>

        {/* Recent Platform Orders */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EEE6E9] shadow-soft space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#EEE6E9]">
            <h3 className="font-bold text-base text-[#29252A]">{t.dashboard.admin.ordersCount}</h3>
            <Link href="/admin/orders" className="text-xs font-bold text-[#E85D8E] hover:underline">
              {t.common.viewAll} →
            </Link>
          </div>

          <div className="divide-y divide-[#EEE6E9]">
            {recent.orders?.length > 0 ? (
              recent.orders.map((o: any) => (
                <div key={o.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="font-mono font-bold text-[#29252A]">#{o.orderNumber}</span>
                    <p className="text-[11px] text-[#817781]">
                      {o.seller?.storeName} • {formatDate(o.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold">{formatPrice(o.total)}</span>
                    <Badge variant="pink">{o.status}</Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#817781] py-4">{t.common.notFound}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
