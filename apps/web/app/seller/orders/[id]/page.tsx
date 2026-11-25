'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Phone,
  ArrowLeft,
  CheckCircle2,
  ChefHat,
  PackageCheck,
  Truck,
  Lock,
  Send,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatPrice, formatDate } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import { getOrderStatusMeta } from '@/lib/order-status';

function SellerOrderDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { id } = params as { id: string };
  const autoFocusDispatch = searchParams?.get('dispatch') === '1';
  const { t, lang } = useTranslation();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [trackingUrl, setTrackingUrl] = useState('');
  const [dispatchError, setDispatchError] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  const fetchOrder = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data: any = await apiClient(`/orders/${id}`);
      setOrder(data);
      if (data?.trackingUrl) {
        setTrackingUrl((prev) => prev || data.trackingUrl);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchOrder(false);
  }, [id]);

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      setUpdating(true);
      setFeedback(null);
      const res: any = await apiClient(`/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      await fetchOrder(true);
      if (res?.telegramNotification?.delivered) {
        setFeedback({
          type: 'success',
          text: '✅ Holat yangilandi va mijozga Telegram botga xabar yuborildi!',
        });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update order');
    } finally {
      setUpdating(false);
    }
  };

  const handleDispatchYandex = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = trackingUrl.trim();
    if (!cleanUrl || !/^https?:\/\/.+/i.test(cleanUrl)) {
      setDispatchError("To'g'ri Yandex yetkazib berish havolasini kiriting (http:// yoki https://)");
      return;
    }

    try {
      setUpdating(true);
      setDispatchError('');
      setFeedback(null);
      const res: any = await apiClient(`/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'OUT_FOR_DELIVERY',
          trackingUrl: cleanUrl,
        }),
      });
      await fetchOrder(true);
      const delivered = res?.telegramNotification?.delivered;
      setFeedback({
        type: delivered ? 'success' : 'info',
        text: delivered
          ? '✅ Dastafka qilindi! Yandex havolasi mijozning Telegram botiga ("Buyurtmangiz tez orada keladi") muvaffaqiyatli yuborildi.'
          : '✅ Dastafka qilindi va Yandex havolasi mijozning saytdagi Buyurtmalarim bo‘limiga biriktirildi. (Mijoz botga /start bosmagani uchun Telegram xabari yuborilmadi.)',
      });
    } catch (err: any) {
      setDispatchError(err.message || 'Yandex link yuborishda xatolik');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="p-8 text-sm text-[#817781] animate-pulse">{t.common.loading}</div>;
  if (!order) return <div className="p-8 text-sm text-[#817781]">{t.common.notFound}</div>;

  const p = t.sellerPages.orders;
  const statusMeta = getOrderStatusMeta(order.status, lang);
  const canDispatchYandex = order.status === 'READY' || order.status === 'OUT_FOR_DELIVERY';
  const isTerminal = ['COMPLETED', 'REJECTED', 'CANCELLED'].includes(order.status);

  const copy = {
    uz: {
      accept: 'Qabul qilish',
      preparing: 'Tayyorlanmoqda',
      ready: 'Tayyor',
      complete: 'Topshirildi (Yakunlash)',
      dispatchTitle: '🚚 Dastafka qilindi — Yandex link yuborish',
      dispatchLockedDesc:
        "🔒 Ushbu bo'lim faqat buyurtma 'Tayyor' holatiga o'tganidan keyin ochiladi. Avval buyurtmani 'Tayyor' deb tasdiqlang.",
      dispatchUnlockedDesc:
        'Buyurtma tayyor! Yandex kuryer havolasini joylab yuborsangiz, bot mijozga Telegram orqali "Buyurtmangiz tez orada keladi" xabari bilan linkni jo‘natadi.',
      urlLabel: 'Yandex yetkazib berish havolasi (Link)',
      sendBtn: "Klientga jo'natish (Dastafka qilindi)",
      updateBtn: 'Yandex linkni yangilash',
    },
    ru: {
      accept: 'Принять',
      preparing: 'Готовится',
      ready: 'Готов',
      complete: 'Завершить',
      dispatchTitle: '🚚 Отправлено в доставку — ссылка Yandex',
      dispatchLockedDesc:
        '🔒 Раздел откроется только после перевода заказа в статус «Готов». Сначала подтвердите готовность.',
      dispatchUnlockedDesc:
        'Заказ готов! Вставьте ссылку отслеживания Yandex доставки — бот отправит её клиенту в Telegram.',
      urlLabel: 'Ссылка Yandex доставки',
      sendBtn: 'Отправить клиенту',
      updateBtn: 'Обновить ссылку Yandex',
    },
    en: {
      accept: 'Accept',
      preparing: 'Preparing',
      ready: 'Ready',
      complete: 'Mark Completed',
      dispatchTitle: '🚚 Dispatched — Send Yandex Delivery Link',
      dispatchLockedDesc:
        '🔒 This action unlocks only after the order status is marked as Ready.',
      dispatchUnlockedDesc:
        'Order is Ready! Paste the Yandex delivery tracking URL to notify the customer on Telegram.',
      urlLabel: 'Yandex Delivery Tracking URL',
      sendBtn: 'Send to Customer',
      updateBtn: 'Update Yandex Link',
    },
  }[lang];

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/seller/orders">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-black text-[#29252A]">#{order.orderNumber}</h1>
              <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
            </div>
            <p className="text-xs text-[#817781] mt-0.5">{formatDate(order.createdAt)}</p>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={() => fetchOrder(false)} className="rounded-xl text-xs">
          <RefreshCw className="w-3.5 h-3.5 mr-1" /> Yangilash
        </Button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-start gap-2.5 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Customer Contact Card */}
      <div className="bg-white rounded-3xl p-6 border border-[#EEE6E9] shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#817781]">{p.customer}</span>
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
              <CheckCircle2 className="w-4 h-4 mr-1.5" /> {copy.accept}
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
              <ChefHat className="w-4 h-4 mr-1.5" /> {copy.preparing}
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
              <PackageCheck className="w-4 h-4 mr-1.5" /> {copy.ready}
            </Button>
          )}

          {(order.status === 'READY' || order.status === 'OUT_FOR_DELIVERY') && (
            <Button
              variant="primary"
              size="md"
              isLoading={updating}
              onClick={() => handleUpdateStatus('COMPLETED')}
              className="rounded-xl bg-[#269B69] hover:bg-emerald-700"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" /> {copy.complete}
            </Button>
          )}
        </div>
      </div>

      {/* Yandex Delivery Link Dispatch Section (Strictly gated by READY permission) */}
      {!isTerminal && (
        <div
          className={`rounded-3xl p-6 border shadow-soft space-y-4 transition-all ${
            canDispatchYandex
              ? autoFocusDispatch
                ? 'bg-sky-50/70 border-sky-400 ring-2 ring-sky-300'
                : 'bg-sky-50/50 border-sky-200'
              : 'bg-[#FAF8F6] border-[#EEE6E9]'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold text-base text-[#29252A] flex items-center gap-2">
              {canDispatchYandex ? (
                <Truck className="w-5 h-5 text-sky-600" />
              ) : (
                <Lock className="w-4 h-4 text-[#817781]" />
              )}
              {copy.dispatchTitle}
            </h3>
            {canDispatchYandex && (
              <Badge variant="info">Ruxsat ochiq</Badge>
            )}
          </div>

          {!canDispatchYandex ? (
            <p className="text-xs text-[#817781] leading-relaxed">{copy.dispatchLockedDesc}</p>
          ) : (
            <form onSubmit={handleDispatchYandex} className="space-y-3">
              <p className="text-xs text-sky-900 leading-relaxed">{copy.dispatchUnlockedDesc}</p>

              <Input
                label={copy.urlLabel}
                type="url"
                placeholder="https://go.yandex/..."
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
                error={dispatchError || undefined}
                autoFocus={autoFocusDispatch}
                required
              />

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={updating}
                  className="bg-sky-600 hover:bg-sky-700 text-white rounded-xl"
                >
                  <Send className="w-4 h-4 mr-1.5" />
                  {order.status === 'OUT_FOR_DELIVERY' ? copy.updateBtn : copy.sendBtn}
                </Button>

                {order.trackingUrl && (
                  <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-sky-700 hover:underline inline-flex items-center gap-1"
                  >
                    Yandex havolani ochish <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </form>
          )}
        </div>
      )}

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
        <h3 className="font-bold text-sm text-[#29252A] uppercase tracking-wider mb-2">{p.fulfillment}</h3>
        <p>
          <span className="text-[#817781]">{t.checkout.preferredDate}: </span>
          <strong>{formatDate(order.requestedDate)}</strong>
        </p>
        <p>
          <span className="text-[#817781]">{t.checkout.preferredTime}: </span>
          <strong>{order.requestedTime}</strong>
        </p>
        <p>
          <span className="text-[#817781]">{p.fulfillment}: </span>
          <strong>{order.deliveryType}</strong>
        </p>
        {order.deliveryAddress && (
          <p>
            <span className="text-[#817781]">{t.cart.deliveryAddress}: </span>
            <strong>{order.deliveryAddress}</strong>
          </p>
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

export default function SellerOrderDetailPage() {
  const { t } = useTranslation();
  return (
    <Suspense fallback={<div className="p-8 text-sm text-[#817781]">{t.common.loading}</div>}>
      <SellerOrderDetailContent />
    </Suspense>
  );
}
