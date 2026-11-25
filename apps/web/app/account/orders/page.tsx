'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ShoppingBag,
  Store,
  Phone,
  ChevronRight,
  CheckCircle2,
  Truck,
  ExternalLink,
  RefreshCw,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { formatPrice, formatDate } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import { ORDER_PROGRESS_STEPS, getOrderStatusMeta } from '@/lib/order-status';

function OrdersContent() {
  const { t, lang } = useTranslation();
  const searchParams = useSearchParams();
  const showSuccessBanner = searchParams?.get('success') === 'true';

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tgStatus, setTgStatus] = useState<{ connected: boolean; botUrl?: string } | null>(null);

  const fetchOrders = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await apiClient<any[]>('/orders/my');
      setOrders(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const fetchTelegramStatus = useCallback(async () => {
    try {
      const res = await apiClient<{ connected: boolean; botUrl: string }>('/telegram/customer-status');
      setTgStatus(res);
    } catch {
      // Ignore if unauthenticated
    }
  }, []);

  useEffect(() => {
    fetchOrders(false);
    fetchTelegramStatus();
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchOrders(true);
      }
    }, 12000);
    return () => clearInterval(timer);
  }, [fetchOrders, fetchTelegramStatus]);

  const copy = {
    uz: {
      refresh: 'Yangilash',
      placedTitle: 'Buyurtmangiz muvaffaqiyatli yuborildi!',
      placedDesc: 'Qandolatchi buyurtmangizni darhol qabul qildi. Qabul qilinishi, tayyorlanishi va tayyor bo‘lishi shu yerda ko‘rinadi.',
      tgTitle: 'Buyurtma holati va Yandex linkni Telegram botda oling',
      tgDesc: 'Botni ulasangiz sotuvchi buyurtmangizni qabul qilganda, tayyor bo‘lganda va dastafka Yandex linkini yuborganda darhol Telegramga xabar keladi.',
      tgConnectBtn: 'Telegram botni ulash',
      tgConnected: '✅ Telegram bot xabarlari yoqilgan',
      courierBanner: 'Buyurtmangiz yo‘lga chiqdi! Tez orada yetib keladi',
      yandexBtn: 'Yandex xaritadan kuzatish',
    },
    ru: {
      refresh: 'Обновить',
      placedTitle: 'Заказ успешно оформлен!',
      placedDesc: 'Кондитер получил ваш заказ. Этапы подтверждения, приготовления и готовности будут видны здесь.',
      tgTitle: 'Получайте статусы заказа и ссылку Yandex в Telegram боте',
      tgDesc: 'Подключите бота, чтобы сразу получать уведомления в Telegram и ссылку отслеживания Yandex доставки.',
      tgConnectBtn: 'Подключить Telegram бота',
      tgConnected: '✅ Уведомления в Telegram подключены',
      courierBanner: 'Заказ уже в пути! Скоро будет доставлен',
      yandexBtn: 'Отследить в Yandex',
    },
    en: {
      refresh: 'Refresh',
      placedTitle: 'Order Placed Successfully!',
      placedDesc: 'The baker has received your order. Live confirmations and preparation stages will appear right here.',
      tgTitle: 'Get live status updates & Yandex delivery link in Telegram',
      tgDesc: 'Link the bot once to receive order progress alerts and your Yandex delivery link straight in Telegram.',
      tgConnectBtn: 'Connect Telegram Bot',
      tgConnected: '✅ Telegram notifications enabled',
      courierBanner: 'Your order is on the way! Arriving soon',
      yandexBtn: 'Track on Yandex',
    },
  }[lang];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#29252A]">{t.account.ordersTitle}</h1>
          <p className="text-sm text-[#817781] mt-1">{t.account.ordersSubtitle}</p>
        </div>

        <Button variant="outline" size="sm" onClick={() => { fetchOrders(false); fetchTelegramStatus(); }} className="rounded-xl text-xs w-fit">
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> {copy.refresh}
        </Button>
      </div>

      {showSuccessBanner && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="font-bold text-sm">{copy.placedTitle}</p>
            <p className="font-normal text-emerald-700">{copy.placedDesc}</p>
          </div>
        </div>
      )}

      {/* Telegram Notification Connect Banner */}
      {tgStatus && !tgStatus.connected && tgStatus.botUrl && (
        <div className="p-4 sm:p-5 rounded-3xl bg-[#FFF8EF] border border-[#F5D6DF] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFF0F5] text-[#E85D8E] flex items-center justify-center flex-shrink-0">
              <Send className="w-5 h-5" />
            </div>
            <div className="space-y-0.5 text-xs">
              <p className="font-bold text-sm text-[#29252A]">{copy.tgTitle}</p>
              <p className="text-[#817781]">{copy.tgDesc}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <a href={tgStatus.botUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="primary" size="sm" className="rounded-xl">
                <Send className="w-3.5 h-3.5 mr-1.5" /> {copy.tgConnectBtn}
              </Button>
            </a>
            <Button variant="ghost" size="sm" onClick={fetchTelegramStatus} className="rounded-xl" title={copy.refresh}>
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {tgStatus?.connected && (
        <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
          <span>{copy.tgConnected}</span>
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
            const statusMeta = getOrderStatusMeta(order.status, lang);
            const activeStepIndex = ORDER_PROGRESS_STEPS.indexOf(order.status);

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-[#EEE6E9] p-6 shadow-soft hover:shadow-card transition-all space-y-4"
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
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
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-sm text-[#29252A]">#{order.orderNumber}</span>
                        <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
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
                        {order.items?.length > 1 && ` (+${order.items.length - 1})`}
                      </p>

                      <div className="flex items-center gap-3 text-xs text-[#817781] pt-1">
                        <span>
                          {formatDate(order.requestedDate)} ({order.requestedTime})
                        </span>
                        <span>•</span>
                        <span>{order.deliveryType}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-[#EEE6E9] gap-3">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] text-[#817781] uppercase font-bold tracking-wider block">
                        Total ({itemCount})
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

                {/* Live Progress Tracker (Accepted -> Preparing -> Ready -> Out for Delivery -> Completed) */}
                {activeStepIndex >= 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-2 border-t border-[#EEE6E9]/70">
                    {ORDER_PROGRESS_STEPS.map((step, idx) => {
                      const done = idx <= activeStepIndex;
                      const current = idx === activeStepIndex;
                      const stepMeta = getOrderStatusMeta(step, lang);
                      return (
                        <div
                          key={step}
                          className={`px-2 py-1.5 rounded-xl text-[10px] font-bold text-center border transition-colors ${
                            current
                              ? 'bg-[#E85D8E] text-white border-[#E85D8E]'
                              : done
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-[#FAF8F6] text-[#817781] border-[#EEE6E9]'
                          }`}
                        >
                          {stepMeta.shortLabel}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Yandex Delivery Live Banner when dispatched */}
                {order.trackingUrl && (
                  <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 text-xs text-sky-900">
                      <Truck className="w-5 h-5 text-sky-600 flex-shrink-0" />
                      <div>
                        <p className="font-bold">{copy.courierBanner}</p>
                        <p className="text-[11px] text-sky-700 truncate max-w-md">{order.trackingUrl}</p>
                      </div>
                    </div>

                    <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                      <Button variant="primary" size="sm" className="bg-sky-600 hover:bg-sky-700 text-white rounded-xl">
                        {copy.yandexBtn} <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                      </Button>
                    </a>
                  </div>
                )}
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
