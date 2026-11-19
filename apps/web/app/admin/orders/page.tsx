'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingBag, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatPrice, formatDate } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

export default function AdminOrdersPage() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient<any>('/admin/orders')
      .then((res) => setOrders(Array.isArray(res) ? res : res.orders || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const p = t.adminPages.orders;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-[#29252A]">{p.title}</h1>
        <p className="text-sm text-[#817781] mt-1">{p.subtitle}</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-3xl p-6 border border-[#EEE6E9] animate-pulse h-24" />
          ))}
        </div>
      ) : orders.length > 0 ? (
        <div className="bg-white rounded-3xl border border-[#EEE6E9] shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#29252A]">
            <thead className="bg-[#FAF8F6] text-[#817781] uppercase font-bold border-b border-[#EEE6E9]">
              <tr>
                <th className="px-6 py-4">{t.sellerPages.orders.orderNumber}</th>
                <th className="px-6 py-4">{t.sellerPages.orders.customer}</th>
                <th className="px-6 py-4">{t.dashboard.admin.sellersCount}</th>
                <th className="px-6 py-4">{t.sellerPages.orders.total}</th>
                <th className="px-6 py-4">{t.common.status}</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEE6E9]">
              {orders.map((ord) => (
                <tr key={ord.id} className="hover:bg-[#FAF8F6]/50 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-[#29252A]">
                    #{ord.orderNumber}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold block">{ord.customer?.firstName} {ord.customer?.lastName}</span>
                    <span className="text-[#817781] text-[11px]">{ord.customer?.phone}</span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-[#D99A52]">
                    {ord.seller?.storeName}
                  </td>
                  <td className="px-6 py-4 font-black text-[#E85D8E]">
                    {formatPrice(ord.total, ord.currency)}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="pink">{ord.status}</Badge>
                  </td>
                  <td className="px-6 py-4 text-[#817781]">{formatDate(ord.createdAt)}</td>
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
