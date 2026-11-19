'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, ShoppingBag, Eye, Cake } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { apiClient } from '@/lib/api';
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

export default function SellerAnalyticsPage() {
  const { t } = useTranslation();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient('/sellers/me/analytics')
      .then((data) => setAnalytics(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-sm text-[#817781] animate-pulse">{t.common.loading}</div>;

  const metrics = analytics?.metrics || {
    totalOrders: 0,
    completedOrders: 0,
    totalSales: 0,
    activeProducts: 0,
    totalViews: 0,
  };

  const chartData = analytics?.chartData || [];
  const topProducts = analytics?.topProducts || [];
  const p = t.sellerPages.analytics;

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="text-3xl font-black text-[#29252A]">{p.title}</h1>
        <p className="text-sm text-[#817781] mt-1">{p.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-[#EEE6E9] shadow-soft">
          <span className="text-xs font-bold uppercase tracking-wider text-[#817781]">{p.revenueTotal}</span>
          <p className="text-2xl font-black text-[#E85D8E] mt-2">{formatPrice(metrics.totalSales)}</p>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-[#EEE6E9] shadow-soft">
          <span className="text-xs font-bold uppercase tracking-wider text-[#817781]">{t.dashboard.seller.totalOrders}</span>
          <p className="text-2xl font-black text-[#29252A] mt-2">{metrics.totalOrders}</p>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-[#EEE6E9] shadow-soft">
          <span className="text-xs font-bold uppercase tracking-wider text-[#817781]">{t.dashboard.seller.completedOrders}</span>
          <p className="text-2xl font-black text-[#269B69] mt-2">{metrics.completedOrders}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-3xl p-8 border border-[#EEE6E9] shadow-soft space-y-4">
        <h3 className="font-bold text-base text-[#29252A]">{p.completedVolume}</h3>
        <div className="h-72 w-full">
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
                }}
              />
              <Bar dataKey="orders" fill="#D99A52" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Selling Products */}
      <div className="bg-white rounded-3xl p-8 border border-[#EEE6E9] shadow-soft space-y-4">
        <h3 className="font-bold text-base text-[#29252A]">{t.nav.myDesserts}</h3>
        {topProducts.length > 0 ? (
          <div className="divide-y divide-[#EEE6E9]">
            {topProducts.map((prod: any, idx: number) => (
              <div key={prod.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm text-[#817781]">#{idx + 1}</span>
                  <span className="font-bold text-sm text-[#29252A]">{prod.name}</span>
                </div>
                <div className="flex items-center gap-4 text-[#817781]">
                  <span>{prod.ordersCount} {t.dashboard.seller.totalOrders}</span>
                  <span>{prod.views} views</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#817781] text-center py-6">{t.common.notFound}</p>
        )}
      </div>
    </div>
  );
}
