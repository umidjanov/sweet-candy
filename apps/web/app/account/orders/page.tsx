'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ShoppingBag, Store, Clock, Phone, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { formatPrice, formatDate } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

function OrdersContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const showSuccessBanner = searchParams?.get('success') === 'true';

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient<any[]>('/orders/my')
      .then((data) => setOrders(data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="warning">Pending Confirmation</Badge>;
      case 'ACCEPTED':
        return <Badge variant="info">Accepted by Baker</Badge>;
      case 'PREPARING':
        return <Badge variant="pink">Baking in Progress</Badge>;
      case 'READY':
        return <Badge variant="success">Ready for Pickup/Delivery</Badge>;
      case 'OUT_FOR_DELIVERY':
        return <Badge variant="info">Out for Delivery</Badge>;
      case 'COMPLETED':
        return <Badge variant="success">Completed</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">Declined</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-[#29252A]">{t.account.ordersTitle}</h1>
        <p className="text-sm text-[#817781] mt-1">{t.account.ordersSubtitle}</p>
      </div>

      {showSuccessBanner && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="font-bold text-sm">Order Placed Successfully!</p>
            <p className="font-normal text-emerald-700">The baker has received your order via Telegram and will review it shortly.</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-3xl p-6 border border-[#EEE6E9] animate-pulse h-32" />
          ))}
        </div>
      ) : orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => {
            const firstItem = order.items?.[0];
            const itemCount = order.items?.reduce((sum: number, i: any) => sum + i.quantity, 0) || 0;

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-[#EEE6E9] p-6 shadow-soft hover:shadow-card transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                <div className="flex items-start sm:items-center gap-4">
                  {firstItem?.productImageSnapshot ? (
                    <img
                      src={firstItem.productImageSnapshot}
                      alt={firstItem.productNameSnapshot}
                      className="w-20 h-20 rounded-2xl object-cover bg-[#FFF8EF] border border-[#EEE6E9] flex-shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-[#FFF0F5] text-[#E85D8E] flex items-center justify-center flex-shrink-0">
                      <ShoppingBag className="w-8 h-8" />
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-[#29252A]">
                        #{order.orderNumber}
                      </span>
                      {getStatusBadge(order.status)}
                    </div>

                    <Link
                      href={`/sellers/${order.seller.slug || order.seller.id}`}
                      className="flex items-center gap-1 text-xs text-[#817781] hover:text-[#E85D8E]"
                    >
                      <Store className="w-3.5 h-3.5" />
                      <span>{order.seller.storeName}</span>
                    </Link>

                    <p className="text-xs font-semibold text-[#29252A]">
                      {firstItem?.productNameSnapshot}
                      {order.items?.length > 1 && ` and ${order.items.length - 1} more dessert(s)`}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-[#817781] pt-1">
                      <span>Scheduled: {formatDate(order.requestedDate)} ({order.requestedTime})</span>
                      <span>•</span>
                      <span>{order.deliveryType}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-[#EEE6E9] gap-3">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] text-[#817781] uppercase font-bold tracking-wider block">
                      Total ({itemCount} items)
                    </span>
                    <span className="text-lg font-black text-[#E85D8E]">
                      {formatPrice(order.total, order.currency)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {order.seller.publicPhone && (
                      <a href={`tel:${order.seller.publicPhone}`}>
                        <Button variant="outline" size="sm" className="rounded-xl">
                          <Phone className="w-3.5 h-3.5 mr-1 text-[#E85D8E]" /> Call
                        </Button>
                      </a>
                    )}

                    <Link href={`/account/orders/${order.id}`}>
                      <Button variant="primary" size="sm" className="rounded-xl">
                        Details <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No orders placed yet"
          description="Explore our confectionery catalog and order your first batch of homemade sweets!"
          actionText="Explore Sweets"
          actionHref="/explore"
        />
      )}
    </div>
  );
}

export default function CustomerOrdersPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Suspense fallback={<div className="text-sm text-[#817781]">Loading orders...</div>}>
        <OrdersContent />
      </Suspense>
    </div>
  );
}
