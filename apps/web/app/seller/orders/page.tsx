'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  XCircle,
  Eye,
  ChefHat,
  Truck,
  PackageCheck,
  Lock,
  ExternalLink,
  RefreshCw,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { formatPrice, formatDate } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import { getOrderStatusMeta } from '@/lib/order-status';

export default function SellerOrdersPage() {
  const { t, lang } = useTranslation();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  // Reject modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [orderToReject, setOrderToReject] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [updating, setUpdating] = useState(false);

  // Yandex Delivery Link dispatch modal (strictly unlocked when status === 'READY')
  const [dispatchOrder, setDispatchOrder] = useState<any | null>(null);
  const [trackingUrl, setTrackingUrl] = useState('');
  const [dispatchError, setDispatchError] = useState('');

  const fetchOrders = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const url = statusFilter ? `/orders/seller?status=${statusFilter}` : '/orders/seller';
      const data = await apiClient<any[]>(url);
      setOrders(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchOrders(false);
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchOrders(true);
      }
    }, 12000);
    return () => clearInterval(timer);
  }, [fetchOrders]);

  const handleUpdateStatus = async (orderId: string, newStatus: string, reason?: string) => {
    try {
      setUpdating(true);
      setFeedbackMsg(null);
      const res: any = await apiClient(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: newStatus,
          rejectionReason: reason,
        }),
      });
      setRejectModalOpen(false);
      await fetchOrders(true);

      const tgDelivered = res?.telegramNotification?.delivered;
      if (tgDelivered) {
        setFeedbackMsg({
          type: 'success',
          text:
            lang === 'ru'
              ? 'Статус обновлён и отправлен клиенту в Telegram бот.'
              : lang === 'en'
                ? 'Status updated and sent to the customer on Telegram.'
                : 'Buyurtma holati yangilandi va mijozga Telegram botga yuborildi!',
        });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const openRejectModal = (order: any) => {
    setOrderToReject(order);
    setRejectionReason(
      lang === 'ru'
        ? 'На выбранное время все слоты заняты'
        : 'Tanlangan vaqtda bandmiz'
    );
    setRejectModalOpen(true);
  };

  const openDispatchModal = (order: any) => {
    setDispatchOrder(order);
    setTrackingUrl(order.trackingUrl || '');
    setDispatchError('');
  };

  const handleSendYandexDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchOrder) return;

    const cleanUrl = trackingUrl.trim();
    if (!cleanUrl || !/^https?:\/\/.+/i.test(cleanUrl)) {
      setDispatchError(
        lang === 'ru'
          ? 'Вставьте корректную ссылку Yandex доставки (http:// или https://)'
          : "To'g'ri Yandex yetkazib berish havolasini kiriting (masalan: https://go.yandex/...)"
      );
      return;
    }

    try {
      setUpdating(true);
      setDispatchError('');
      const res: any = await apiClient(`/orders/${dispatchOrder.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'OUT_FOR_DELIVERY',
          trackingUrl: cleanUrl,
        }),
      });
      setDispatchOrder(null);
      await fetchOrders(true);

      const delivered = res?.telegramNotification?.delivered;
      setFeedbackMsg({
        type: delivered ? 'success' : 'info',
        text: delivered
          ? `✅ Buyurtma #${res.orderNumber} dastafkaga chiqarildi! Yandex havolasi mijozning Telegram botiga ("Buyurtmangiz tez orada keladi") yuborildi.`
          : `✅ Buyurtma #${res.orderNumber} dastafkaga chiqarildi va Yandex havolasi mijozning saytdagi "Buyurtmalarim" bo'limiga biriktirildi. (Mijoz botda /start bosmagani uchun Telegram xabari bormadi.)`,
      });
    } catch (err: any) {
      setDispatchError(err.message || 'Yandex havolasini yuborishda xatolik');
    } finally {
      setUpdating(false);
    }
  };

  const p = t.sellerPages.orders;
  const copy = {
    uz: {
      accept: 'Qabul qilish',
      preparing: 'Tayyorlanmoqda',
      ready: 'Tayyor',
      dispatchBtn: 'Dastafka qilindi (Yandex link)',
      dispatchLocked: "Dastafka (Tayyor bo'lganda ochiladi)",
      updateLinkBtn: 'Yandex linkni yangilash',
      completeBtn: 'Topshirildi',
      modalTitle: 'Klientga Yandex link yuborish (Dastafka qilindi)',
      modalDesc: 'Buyurtma tayyor! Yandex kuryer kuzatuv linkini joylang — bot avtomatik ravishda klientga "Buyurtmangiz tez orada keladi" xabari bilan yuboradi.',
      urlLabel: 'Yandex yetkazib berish havolasi (Link)',
      sendBtn: "Klientga jo'natish",
      refresh: 'Yangilash',
    },
    ru: {
      accept: 'Принять',
      preparing: 'Готовится',
      ready: 'Готов',
      dispatchBtn: 'Отправлено (Ссылка Yandex)',
      dispatchLocked: 'Доставка (откроется после «Готов»)',
      updateLinkBtn: 'Обновить ссылку Yandex',
      completeBtn: 'Доставлен',
      modalTitle: 'Отправить ссылку Yandex клиенту',
      modalDesc: 'Заказ готов! Вставьте ссылку отслеживания Yandex доставки — бот отправит её клиенту в Telegram.',
      urlLabel: 'Ссылка Yandex доставки',
      sendBtn: 'Отправить клиенту',
      refresh: 'Обновить',
    },
    en: {
      accept: 'Accept',
      preparing: 'Preparing',
      ready: 'Ready',
      dispatchBtn: 'Dispatched (Send Yandex link)',
      dispatchLocked: 'Delivery link unlocks once Ready',
      updateLinkBtn: 'Update Yandex link',
      completeBtn: 'Complete',
      modalTitle: 'Send Yandex Delivery Link to Customer',
      modalDesc: 'Order is Ready! Paste the Yandex delivery link below and the bot will notify the customer on Telegram.',
      urlLabel: 'Yandex Delivery Tracking URL',
      sendBtn: 'Send to Customer',
      refresh: 'Refresh',
    },
  }[lang];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#29252A]">{p.title}</h1>
          <p className="text-sm text-[#817781] mt-1">{p.subtitle}</p>
        </div>

        {/* Filter Tabs + Refresh */}
        <div className="flex flex-wrap items-center gap-2">
          {['', 'PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'COMPLETED'].map((st) => {
            const label = st === '' ? t.common.all : getOrderStatusMeta(st, lang).shortLabel;
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  statusFilter === st
                    ? 'bg-[#E85D8E] text-white'
                    : 'bg-white border border-[#EEE6E9] text-[#29252A] hover:bg-[#FAF8F6]'
                }`}
              >
                {label}
              </button>
            );
          })}
          <Button variant="outline" size="sm" onClick={() => fetchOrders(false)} className="rounded-xl text-xs">
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> {copy.refresh}
          </Button>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-start gap-2.5 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-3xl p-6 border border-[#EEE6E9] animate-pulse h-36" />
          ))}
        </div>
      ) : orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((ord) => {
            const statusMeta = getOrderStatusMeta(ord.status, lang);
            const canDispatch = ord.status === 'READY' || ord.status === 'OUT_FOR_DELIVERY';
            const isTerminal = ['COMPLETED', 'REJECTED', 'CANCELLED'].includes(ord.status);

            return (
              <div
                key={ord.id}
                className="bg-white rounded-3xl border border-[#EEE6E9] p-6 shadow-soft hover:shadow-card transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
              >
                <div className="space-y-2 flex-1 w-full">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono font-bold text-base text-[#29252A]">#{ord.orderNumber}</span>
                    <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
                    <span className="text-xs text-[#817781]">• {formatDate(ord.createdAt)}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    <div>
                      <span className="text-[#817781] block">{p.customer}:</span>
                      <span className="font-bold text-[#29252A] text-sm">{ord.customerName}</span>
                      <a href={`tel:${ord.customerPhone}`} className="text-[#E85D8E] font-medium block hover:underline">
                        📞 {ord.customerPhone}
                      </a>
                    </div>

                    <div>
                      <span className="text-[#817781] block">{p.fulfillment}:</span>
                      <span className="font-bold text-[#29252A]">
                        {formatDate(ord.requestedDate)} ({ord.requestedTime})
                      </span>
                      <span className="text-[#817781] block">
                        {ord.deliveryType} {ord.deliveryAddress && `• ${ord.deliveryAddress}`}
                      </span>
                    </div>
                  </div>

                  {/* Items snapshot summary */}
                  <div className="pt-2 text-xs text-[#29252A] bg-[#FAF8F6] p-3 rounded-2xl border border-[#EEE6E9]">
                    <span className="font-bold text-[#817781] block text-[10px] uppercase tracking-wider mb-1">
                      {t.cart.title}:
                    </span>
                    {ord.items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between py-0.5">
                        <span>
                          • {item.productNameSnapshot} x{item.quantity}
                        </span>
                        <span className="font-semibold">{formatPrice(item.lineTotal)}</span>
                      </div>
                    ))}
                    {ord.customerMessage && (
                      <p className="mt-2 text-xs italic text-[#E85D8E] border-t border-[#EEE6E9] pt-1">
                        {t.cart.customerNotes}: "{ord.customerMessage}"
                      </p>
                    )}
                  </div>

                  {/* Saved Yandex tracking link preview */}
                  {ord.trackingUrl && (
                    <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-xs">
                      <span className="font-semibold text-sky-900 truncate max-w-md">
                        📍 Yandex link: {ord.trackingUrl}
                      </span>
                      <a
                        href={ord.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-sky-700 hover:underline inline-flex items-center gap-1"
                      >
                        Ochish <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Action Buttons based on status */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-end gap-3 w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-[#EEE6E9]">
                  <div className="text-right">
                    <span className="text-[10px] text-[#817781] uppercase font-bold tracking-wider block">
                      {p.total}
                    </span>
                    <span className="text-xl font-black text-[#E85D8E]">{formatPrice(ord.total)}</span>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {ord.status === 'PENDING' && (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          isLoading={updating}
                          onClick={() => handleUpdateStatus(ord.id, 'ACCEPTED')}
                          className="rounded-xl shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> {copy.accept}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openRejectModal(ord)}
                          className="rounded-xl text-[#DC5151] hover:bg-rose-50"
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" /> {t.dashboard.admin.reject}
                        </Button>
                      </>
                    )}

                    {ord.status === 'ACCEPTED' && (
                      <Button
                        variant="caramel"
                        size="sm"
                        isLoading={updating}
                        onClick={() => handleUpdateStatus(ord.id, 'PREPARING')}
                        className="rounded-xl"
                      >
                        <ChefHat className="w-3.5 h-3.5 mr-1" /> {copy.preparing}
                      </Button>
                    )}

                    {ord.status === 'PREPARING' && (
                      <Button
                        variant="primary"
                        size="sm"
                        isLoading={updating}
                        onClick={() => handleUpdateStatus(ord.id, 'READY')}
                        className="rounded-xl"
                      >
                        <PackageCheck className="w-3.5 h-3.5 mr-1" /> {copy.ready}
                      </Button>
                    )}

                    {/* Strictly locked before READY; unlocked when READY */}
                    {!isTerminal && !canDispatch && (
                      <span
                        title={copy.dispatchLocked}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#FAF8F6] border border-[#EEE6E9] text-[11px] font-medium text-[#817781]"
                      >
                        <Lock className="w-3 h-3" /> {copy.dispatchLocked}
                      </span>
                    )}

                    {ord.status === 'READY' && (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => openDispatchModal(ord)}
                          className="rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-sm"
                        >
                          <Truck className="w-3.5 h-3.5 mr-1" /> {copy.dispatchBtn}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          isLoading={updating}
                          onClick={() => handleUpdateStatus(ord.id, 'COMPLETED')}
                          className="rounded-xl text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> {copy.completeBtn}
                        </Button>
                      </>
                    )}

                    {ord.status === 'OUT_FOR_DELIVERY' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDispatchModal(ord)}
                          className="rounded-xl border-sky-200 text-sky-700 hover:bg-sky-50"
                        >
                          <Truck className="w-3.5 h-3.5 mr-1" /> {copy.updateLinkBtn}
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          isLoading={updating}
                          onClick={() => handleUpdateStatus(ord.id, 'COMPLETED')}
                          className="rounded-xl bg-[#269B69] hover:bg-emerald-700"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> {copy.completeBtn}
                        </Button>
                      </>
                    )}

                    <Link href={`/seller/orders/${ord.id}`}>
                      <Button variant="ghost" size="sm" className="rounded-xl text-xs">
                        <Eye className="w-3.5 h-3.5 mr-1" /> {p.manage}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState title={p.emptyTitle} description={p.emptyDesc} />
      )}

      {/* Reject Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title={t.dashboard.admin.reject}
        description={t.common.status}
      >
        <div className="space-y-4 pt-2">
          <Textarea
            label={t.common.status}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setRejectModalOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={updating}
              onClick={() => handleUpdateStatus(orderToReject.id, 'REJECTED', rejectionReason)}
            >
              {t.dashboard.admin.reject}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Yandex Delivery Link Dispatch Modal */}
      <Modal
        isOpen={Boolean(dispatchOrder)}
        onClose={() => setDispatchOrder(null)}
        title={copy.modalTitle}
        description={copy.modalDesc}
      >
        {dispatchOrder && (
          <form onSubmit={handleSendYandexDispatch} className="space-y-4 pt-2">
            <div className="p-3 rounded-xl bg-[#FAF8F6] border border-[#EEE6E9] text-xs space-y-1">
              <div className="font-bold text-[#29252A]">
                #{dispatchOrder.orderNumber} — {dispatchOrder.customerName}
              </div>
              <div className="text-[#817781]">📞 {dispatchOrder.customerPhone}</div>
              {dispatchOrder.deliveryAddress && (
                <div className="text-[#817781]">📍 {dispatchOrder.deliveryAddress}</div>
              )}
            </div>

            <Input
              label={copy.urlLabel}
              type="url"
              placeholder="https://go.yandex/..."
              value={trackingUrl}
              onChange={(e) => setTrackingUrl(e.target.value)}
              error={dispatchError || undefined}
              required
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setDispatchOrder(null)}>
                {t.common.cancel}
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={updating}
                className="bg-sky-600 hover:bg-sky-700 text-white rounded-xl"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" /> {copy.sendBtn}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
