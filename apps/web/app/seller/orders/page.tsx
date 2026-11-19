'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Clock,
  Phone,
  CheckCircle2,
  XCircle,
  Eye,
  AlertCircle,
  Calendar,
  ChefHat,
  Truck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Modal } from '@/components/ui/modal';
import { Textarea } from '@/components/ui/textarea';
import { formatPrice, formatDate } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

export default function SellerOrdersPage() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Reject modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [orderToReject, setOrderToReject] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const url = statusFilter ? `/orders/seller?status=${statusFilter}` : '/orders/seller';
      const data = await apiClient<any[]>(url);
      setOrders(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleUpdateStatus = async (orderId: string, newStatus: string, reason?: string) => {
    try {
      setUpdating(true);
      await apiClient(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: newStatus,
          rejectionReason: reason,
        }),
      });
      setRejectModalOpen(false);
      await fetchOrders();
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const openRejectModal = (order: any) => {
    setOrderToReject(order);
    setRejectionReason('Fully booked for this date/time window');
    setRejectModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="warning">{t.dashboard.seller.pendingOrders}</Badge>;
      case 'ACCEPTED':
        return <Badge variant="info">Accepted</Badge>;
      case 'PREPARING':
        return <Badge variant="pink">Baking in Progress</Badge>;
      case 'READY':
        return <Badge variant="success">Ready</Badge>;
      case 'OUT_FOR_DELIVERY':
        return <Badge variant="info">Out for Delivery</Badge>;
      case 'COMPLETED':
        return <Badge variant="success">{t.dashboard.seller.completedOrders}</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">{t.dashboard.admin.reject}</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline">{t.common.cancel}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const p = t.sellerPages.orders;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#29252A]">{p.title}</h1>
          <p className="text-sm text-[#817781] mt-1">{p.subtitle}</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {['', 'PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                statusFilter === st
                  ? 'bg-[#E85D8E] text-white'
                  : 'bg-white border border-[#EEE6E9] text-[#29252A] hover:bg-[#FAF8F6]'
              }`}
            >
              {st === '' ? t.common.all : st}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-3xl p-6 border border-[#EEE6E9] animate-pulse h-36" />
          ))}
        </div>
      ) : orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((ord) => (
            <div
              key={ord.id}
              className="bg-white rounded-3xl border border-[#EEE6E9] p-6 shadow-soft hover:shadow-card transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-base text-[#29252A]">#{ord.orderNumber}</span>
                  {getStatusBadge(ord.status)}
                  <span className="text-xs text-[#817781]">• {formatDate(ord.createdAt)}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-[#817781] block">{p.customer}:</span>
                    <span className="font-bold text-[#29252A] text-sm">{ord.customerName}</span>
                    <a
                      href={`tel:${ord.customerPhone}`}
                      className="text-[#E85D8E] font-medium block hover:underline"
                    >
                      📞 {ord.customerPhone}
                    </a>
                  </div>

                  <div>
                    <span className="text-[#817781] block">{p.fulfillment}:</span>
                    <span className="font-bold text-[#29252A]">{formatDate(ord.requestedDate)} ({ord.requestedTime})</span>
                    <span className="text-[#817781] block">{ord.deliveryType} {ord.deliveryAddress && `• ${ord.deliveryAddress}`}</span>
                  </div>
                </div>

                {/* Items snapshot summary */}
                <div className="pt-2 text-xs text-[#29252A] bg-[#FAF8F6] p-3 rounded-2xl border border-[#EEE6E9]">
                  <span className="font-bold text-[#817781] block text-[10px] uppercase tracking-wider mb-1">
                    {t.cart.title}:
                  </span>
                  {ord.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between py-0.5">
                      <span>• {item.productNameSnapshot} x{item.quantity}</span>
                      <span className="font-semibold">{formatPrice(item.lineTotal)}</span>
                    </div>
                  ))}
                  {ord.customerMessage && (
                    <p className="mt-2 text-xs italic text-[#E85D8E] border-t border-[#EEE6E9] pt-1">
                      {t.cart.customerNotes}: "{ord.customerMessage}"
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons based on status */}
              <div className="flex flex-col sm:flex-row lg:flex-col items-end gap-3 w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-[#EEE6E9]">
                <div className="text-right">
                  <span className="text-[10px] text-[#817781] uppercase font-bold tracking-wider block">
                    {p.total}
                  </span>
                  <span className="text-xl font-black text-[#E85D8E]">{formatPrice(ord.total)}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {ord.status === 'PENDING' && (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleUpdateStatus(ord.id, 'ACCEPTED')}
                        className="rounded-xl shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> {t.dashboard.admin.approve}
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
                      onClick={() => handleUpdateStatus(ord.id, 'PREPARING')}
                      className="rounded-xl"
                    >
                      <ChefHat className="w-3.5 h-3.5 mr-1" /> Baking
                    </Button>
                  )}

                  {ord.status === 'PREPARING' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleUpdateStatus(ord.id, 'READY')}
                      className="rounded-xl"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Ready
                    </Button>
                  )}

                  {ord.status === 'READY' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleUpdateStatus(ord.id, 'COMPLETED')}
                      className="rounded-xl bg-[#269B69] hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> {t.dashboard.seller.completedOrders}
                    </Button>
                  )}

                  <Link href={`/seller/orders/${ord.id}`}>
                    <Button variant="ghost" size="sm" className="rounded-xl text-xs">
                      <Eye className="w-3.5 h-3.5 mr-1" /> {p.manage}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title={p.emptyTitle}
          description={p.emptyDesc}
        />
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
    </div>
  );
}
