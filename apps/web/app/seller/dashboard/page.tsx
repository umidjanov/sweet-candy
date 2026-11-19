'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  TrendingUp,
  Cake,
  Eye,
  Clock,
  PlusCircle,
  Send,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Phone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice, formatDate } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from '@/lib/i18n';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export default function SellerDashboardPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [analytics, setAnalytics] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiClient('/sellers/me/analytics').catch(() => null),
      apiClient('/orders/seller?limit=5').catch(() => null),
    ])
      .then(([analyticsData, ordersData]) => {
        setAnalytics(analyticsData);
        setRecentOrders(ordersData || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-sm text-[#817781] animate-pulse">{t.common.loading}</div>;
  }

  const metrics = analytics?.metrics || {
    totalOrders: 0,
    pendingOrders: 0,
    acceptedOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    totalSales: 0,
    activeProducts: 0,
    totalViews: 0,
  };

  const chartData = analytics?.chartData || [
    { month: 'Nov', orders: metrics.totalOrders, revenue: metrics.totalSales },
  ];

  const telegramConnected = user?.sellerProfile?.telegramConnected;

  return (
    <div className="space-y-8">
      {/* Welcome Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#E85D8E]">
            {user?.sellerProfile?.storeName || 'Bakery'}
          </span>
          <h1 className="text-3xl font-black text-[#29252A] mt-1">{t.dashboard.seller.title}</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link href="/seller/products/new">
            <Button variant="primary" size="sm" className="rounded-xl">
              <PlusCircle className="w-4 h-4 mr-1.5" /> {t.dashboard.seller.addNewProduct}
            </Button>
          </Link>
          <Link href="/seller/telegram">
            <Button
              variant={telegramConnected ? 'outline' : 'secondary'}
              size="sm"
              className="rounded-xl"
            >
              <Send className="w-4 h-4 mr-1.5 text-[#E85D8E]" />
              {telegramConnected ? 'Telegram Connected' : t.dashboard.seller.telegramIntegration}
            </Button>
          </Link>
        </div>
      </div>

      {/* Telegram Connection Alert if not connected */}
      {!telegramConnected && (
        <div className="p-4 rounded-2xl bg-[#FFF0F5] border border-[#fce4ec] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-[#E85D8E] flex items-center justify-center flex-shrink-0 shadow-sm">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#29252A]">
                {t.dashboard.seller.telegramIntegration}
              </p>
              <p className="text-[11px] text-[#817781]">
                Telegram orqali yangi buyurtmalar haqida tezkor bildirishnomalar oling.
              </p>
            </div>
          </div>
          <Link href="/seller/telegram">
            <Button variant="primary" size="sm" className="rounded-xl whitespace-nowrap">
              Bot
            </Button>
          </Link>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 xs:gap-4 sm:gap-6">
        <div className="bg-white rounded-3xl p-6 border border-[#EEE6E9] shadow-soft space-y-2">
          <div className="flex items-center justify-between text-xs text-[#817781]">
            <span className="font-semibold uppercase tracking-wider">{t.dashboard.seller.totalRevenue}</span>
            <TrendingUp className="w-4 h-4 text-[#269B69]" />
          </div>
          <p className="text-2xl font-black text-[#29252A]">{formatPrice(metrics.totalSales)}</p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#EEE6E9] shadow-soft space-y-2">
          <div className="flex items-center justify-between text-xs text-[#817781]">
            <span className="font-semibold uppercase tracking-wider">{t.dashboard.seller.pendingOrders}</span>
            <Clock className="w-4 h-4 text-[#E7A23B]" />
          </div>
          <p className="text-2xl font-black text-[#E7A23B]">{metrics.pendingOrders}</p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#EEE6E9] shadow-soft space-y-2">
          <div className="flex items-center justify-between text-xs text-[#817781]">
            <span className="font-semibold uppercase tracking-wider">{t.nav.myDesserts}</span>
            <Cake className="w-4 h-4 text-[#E85D8E]" />
          </div>
          <p className="text-2xl font-black text-[#29252A]">{metrics.activeProducts}</p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#EEE6E9] shadow-soft space-y-2">
          <div className="flex items-center justify-between text-xs text-[#817781]">
            <span className="font-semibold uppercase tracking-wider">{t.dashboard.seller.completedOrders}</span>
            <Eye className="w-4 h-4 text-[#817781]" />
          </div>
          <p className="text-2xl font-black text-[#29252A]">{metrics.completedOrders}</p>
        </div>
      </div>

      {/* Secondary Status Breakdown */}
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-[#EEE6E9] text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#817781] block">{t.dashboard.seller.totalOrders}</span>
          <span className="text-xl font-bold text-[#29252A]">{metrics.totalOrders}</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-[#EEE6E9] text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#817781] block">{t.dashboard.seller.pendingOrders}</span>
          <span className="text-xl font-bold text-[#269B69]">{metrics.acceptedOrders}</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-[#EEE6E9] text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#817781] block">{t.dashboard.seller.completedOrders}</span>
          <span className="text-xl font-bold text-[#269B69]">{metrics.completedOrders}</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-[#EEE6E9] text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#817781] block">{t.common.cancel}</span>
          <span className="text-xl font-bold text-[#DC5151]">{metrics.cancelledOrders}</span>
        </div>
      </div>

      {/* Sales Analytics Chart (Recharts) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EEE6E9] shadow-soft space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg text-[#29252A]">{t.dashboard.seller.analytics}</h3>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEE6E9" />
              <XAxis dataKey="month" stroke="#817781" fontSize={12} tickLine={false} />
              <YAxis stroke="#817781" fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #EEE6E9',
                  boxShadow: '0 4px 20px -2px rgba(232, 93, 142, 0.1)',
                }}
              />
              <Bar dataKey="revenue" fill="#E85D8E" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Incoming Orders */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EEE6E9] shadow-soft space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#EEE6E9]">
          <div>
            <h3 className="font-bold text-lg text-[#29252A]">{t.dashboard.seller.totalOrders}</h3>
          </div>
          <Link href="/seller/orders" className="text-xs font-bold text-[#E85D8E] hover:underline">
            {t.common.viewAll} →
          </Link>
        </div>

        {recentOrders.length > 0 ? (
          <div className="divide-y divide-[#EEE6E9]">
            {recentOrders.map((ord: any) => (
              <div key={ord.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-[#29252A]">#{ord.orderNumber}</span>
                    <Badge variant="pink">{ord.status}</Badge>
                  </div>
                  <p className="text-xs font-semibold text-[#29252A]">
                    {ord.customerName} ({ord.customerPhone})
                  </p>
                  <p className="text-[11px] text-[#817781]">
                    {formatDate(ord.requestedDate)} ({ord.requestedTime}) • {ord.deliveryType}
                  </p>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  <span className="font-black text-base text-[#29252A]">{formatPrice(ord.total)}</span>
                  <Link href={`/seller/orders/${ord.id}`}>
                    <Button variant="outline" size="sm" className="rounded-xl">
                      {t.common.actions}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#817781] text-center py-6">
            {t.common.notFound}
          </p>
        )}
      </div>
    </div>
  );
}
