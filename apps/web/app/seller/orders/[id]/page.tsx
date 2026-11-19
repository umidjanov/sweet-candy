'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Clock,
  Phone,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ChefHat,
  ShoppingBag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice, formatDate } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

export default function SellerOrderDetailPage() {
  const params = useParams();
  const { id } = params as { id: string };
  const { t } = useTranslation();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const data = await apiClient(`/orders/${id}`);
      setOrder(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchOrder();
  }, [id]);

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      setUpdating(true);
      await apiClient(`/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      await fetchOrder();
    } catch (err: any) {
      alert(err.message || 'Failed to update order');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="p-8 text-sm text-[#817781] animate-pulse">{t.common.loading}</div>;
  if (!order) return <div className="p-8 text-sm text-[#817781]">{t.common.notFound}</div>;

  const p = t.sellerPages.orders;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/seller/orders">
          <Button variant="ghost" size="sm" className="p-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-[#29252A]">#{order.orderNumber}</h1>
            <Badge variant="pink">{order.status}</Badge>
          </div>
          <p className="text-xs text-[#817781] mt-0.5">{formatDate(order.createdAt)}</p>
        </div>
      </div>

      {/* Customer Contact Card */}
      <div className="bg-white rounded-3xl p-6 border border-[#EEE6E9] shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#817781]">
            {p.customer}
          </span>
          <h3 className="text-xl font-bold text-[#29252A]">{order.customerName}</h3>
          <p className="text-sm font-semibold text-[#E85D8E]">📞 {order.customerPhone}</p>
        </div>

        <a href={`tel:${order.customerPhone}`}>
          <Button variant="caramel" size="md" className="rounded-xl">
            <Phone className="w-4 h-4 mr-2" /> 📞 {order.customerPhone}
          </Button>
        </a>
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-3xl p-6 border border-[#EEE6E9] shadow-soft space-y-4">
        <h3 className="font-bold text-base text-[#29252A]">{t.common.status}</h3>

        <div className="flex flex-wrap gap-3">
          {order.status === 'PENDING' && (
            <Button
              variant="primary"
              size="md"
              isLoading={updating}
              onClick={() => handleUpdateStatus('ACCEPTED')}
              className="rounded-xl shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" /> {t.dashboard.admin.approve}
            </Button>
          )}

          {order.status === 'ACCEPTED' && (
            <Button
              variant="caramel"
              size="md"
              isLoading={updating}
              onClick={() => handleUpdateStatus('PREPARING')}
              className="rounded-xl"
            >
              <ChefHat className="w-4 h-4 mr-1.5" /> Baking
            </Button>
          )}

          {order.status === 'PREPARING' && (
            <Button
              variant="primary"
              size="md"
              isLoading={updating}
              onClick={() => handleUpdateStatus('READY')}
              className="rounded-xl"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" /> Ready
            </Button>
          )}

          {order.status === 'READY' && (
            <Button
              variant="primary"
              size="md"
              isLoading={updating}
              onClick={() => handleUpdateStatus('COMPLETED')}
              className="rounded-xl bg-[#269B69] hover:bg-emerald-700"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" /> {t.dashboard.seller.completedOrders}
            </Button>
          )}
        </div>
      </div>

      {/* Items Snapshot */}
      <div className="bg-white rounded-3xl p-6 border border-[#EEE6E9] shadow-soft space-y-4">
        <h3 className="font-bold text-base text-[#29252A]">{t.cart.title}</h3>

        <div className="divide-y divide-[#EEE6E9]">
          {order.items?.map((item: any) => (
            <div key={item.id} className="py-3 flex items-center justify-between">
              <div>
                <span className="font-bold text-sm text-[#29252A]">{item.productNameSnapshot}</span>
                <span className="text-xs text-[#817781] block">
                  {formatPrice(item.unitPriceSnapshot)} x {item.quantity}
                </span>
              </div>
              <span className="font-bold text-sm text-[#29252A]">{formatPrice(item.lineTotal)}</span>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-[#EEE6E9] flex justify-between font-black text-base text-[#E85D8E]">
          <span>{p.total}:</span>
          <span>{formatPrice(order.total, order.currency)}</span>
        </div>
      </div>

      {/* Fulfillment Specs */}
      <div className="bg-white rounded-3xl p-6 border border-[#EEE6E9] shadow-soft space-y-2 text-xs">
        <h3 className="font-bold text-sm text-[#29252A] uppercase tracking-wider mb-2">
          {p.fulfillment}
        </h3>
        <p><span className="text-[#817781]">{t.checkout.preferredDate}: </span><strong>{formatDate(order.requestedDate)}</strong></p>
        <p><span className="text-[#817781]">{t.checkout.preferredTime}: </span><strong>{order.requestedTime}</strong></p>
        <p><span className="text-[#817781]">{p.fulfillment}: </span><strong>{order.deliveryType}</strong></p>
        {order.deliveryAddress && (
          <p><span className="text-[#817781]">{t.cart.deliveryAddress}: </span><strong>{order.deliveryAddress}</strong></p>
        )}
        {order.customerMessage && (
          <div className="mt-3 p-3 bg-[#FAF8F6] rounded-xl border border-[#EEE6E9]">
            <span className="font-bold text-[#29252A] block mb-1">{t.cart.customerNotes}:</span>
            <p className="italic text-[#E85D8E]">{order.customerMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}
