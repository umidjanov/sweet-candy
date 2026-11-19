'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShoppingBag,
  Store,
  Clock,
  Phone,
  ChevronRight,
  MapPin,
  Calendar,
  AlertCircle,
  Star,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Textarea } from '@/components/ui/textarea';
import { formatPrice, formatDate } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params as { id: string };
  const { t } = useTranslation();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Cancellation state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Review state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedProductToReview, setSelectedProductToReview] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

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

  const handleCancelOrder = async () => {
    try {
      setCancelling(true);
      await apiClient(`/orders/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason: cancelReason }),
      });
      setCancelModalOpen(false);
      await fetchOrder();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const handleOpenReview = (item: any) => {
    setSelectedProductToReview(item);
    setRating(5);
    setReviewComment('');
    setReviewModalOpen(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductToReview) return;

    try {
      setReviewing(true);
      await apiClient('/reviews', {
        method: 'POST',
        body: JSON.stringify({
          orderId: order.id,
          productId: selectedProductToReview.productId,
          rating,
          comment: reviewComment,
        }),
      });
      setReviewSuccess(true);
      setReviewModalOpen(false);
      await fetchOrder();
    } catch (err: any) {
      alert(err.message || 'Failed to post review');
    } finally {
      setReviewing(false);
    }
  };

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-16 animate-pulse text-[#817781]">{t.common.loading}</div>;
  if (!order) return <div className="max-w-xl mx-auto px-4 py-20 text-center text-[#817781]">{t.common.notFound}</div>;

  const canCancel = order.status === 'PENDING' || order.status === 'ACCEPTED';
  const isCompleted = order.status === 'COMPLETED';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[#817781]">
        <Link href="/account/orders" className="hover:text-[#E85D8E]">{t.account.ordersTitle}</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[#29252A] font-semibold">#{order.orderNumber}</span>
      </nav>

      {/* Header Info */}
      <div className="bg-white rounded-3xl p-6 border border-[#EEE6E9] shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-[#29252A]">#{order.orderNumber}</h1>
            <Badge variant="pink">{order.status.replace(/_/g, ' ')}</Badge>
          </div>
          <p className="text-xs text-[#817781] mt-1">{formatDate(order.createdAt)}</p>
        </div>

        <div className="flex items-center gap-2">
          {order.seller.publicPhone && (
            <a href={`tel:${order.seller.publicPhone}`}>
              <Button variant="caramel" size="sm" className="rounded-xl">
                <Phone className="w-4 h-4 mr-1.5" /> {t.productDetail.callSeller}
              </Button>
            </a>
          )}

          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelModalOpen(true)}
              className="text-[#DC5151] hover:bg-rose-50 border-[#EEE6E9] rounded-xl"
            >
              {t.common.cancel}
            </Button>
          )}
        </div>
      </div>

      {reviewSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
          ✓ {t.cart.orderSuccess}
        </div>
      )}

      {/* Order Status History Timeline */}
      <div className="bg-white rounded-3xl p-6 border border-[#EEE6E9] shadow-soft space-y-4">
        <h3 className="font-bold text-base text-[#29252A] flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#E85D8E]" /> {t.common.status}
        </h3>

        <div className="space-y-3 pl-2 border-l-2 border-[#FFF0F5] ml-2">
          {order.statusHistory?.map((step: any, index: number) => (
            <div key={index} className="relative pl-6 space-y-1">
              <div className="absolute -left-[1.35rem] top-1 w-3.5 h-3.5 rounded-full bg-[#E85D8E] border-2 border-white" />
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#29252A]">{step.toStatus.replace(/_/g, ' ')}</span>
                <span className="text-[#817781]">{formatDate(step.createdAt)}</span>
              </div>
              {step.note && <p className="text-xs text-[#817781]">{step.note}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-3xl p-6 border border-[#EEE6E9] shadow-soft space-y-4">
        <h3 className="font-bold text-base text-[#29252A]">{t.cart.title}</h3>

        <div className="divide-y divide-[#EEE6E9]/60">
          {order.items?.map((item: any) => {
            const hasReviewed = order.reviews?.some((r: any) => r.productId === item.productId);

            return (
              <div key={item.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {item.productImageSnapshot ? (
                    <img
                      src={item.productImageSnapshot}
                      alt={item.productNameSnapshot}
                      className="w-16 h-16 rounded-2xl object-cover bg-[#FFF8EF] border border-[#EEE6E9]"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-[#FFF0F5] text-[#E85D8E] flex items-center justify-center">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                  )}

                  <div>
                    <h4 className="font-bold text-sm text-[#29252A]">{item.productNameSnapshot}</h4>
                    <p className="text-xs text-[#817781]">
                      {formatPrice(item.unitPriceSnapshot)} x {item.quantity}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  <span className="font-bold text-sm text-[#29252A]">
                    {formatPrice(item.lineTotal)}
                  </span>

                  {isCompleted && !hasReviewed && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleOpenReview(item)}
                      className="rounded-xl text-xs"
                    >
                      <Star className="w-3.5 h-3.5 mr-1" /> {t.common.reviews}
                    </Button>
                  )}

                  {hasReviewed && (
                    <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {t.common.success}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Pricing Summary */}
        <div className="pt-4 border-t border-[#EEE6E9] space-y-2 text-xs text-[#817781]">
          <div className="flex justify-between">
            <span>{t.checkout.orderSummary}:</span>
            <span className="font-semibold text-[#29252A]">{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-[#EEE6E9] text-sm">
            <span className="font-bold text-[#29252A]">{t.cart.total}</span>
            <span className="font-black text-lg text-[#E85D8E]">{formatPrice(order.total, order.currency)}</span>
          </div>
        </div>
      </div>

      {/* Fulfillment Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-[#EEE6E9] shadow-soft space-y-3 text-xs">
          <h4 className="font-bold text-sm text-[#29252A] uppercase tracking-wider">
            {t.checkout.deliverySchedule}
          </h4>
          <p><span className="text-[#817781]">{t.checkout.preferredDate}: </span><strong className="text-[#29252A]">{formatDate(order.requestedDate)}</strong></p>
          <p><span className="text-[#817781]">{t.checkout.preferredTime}: </span><strong className="text-[#29252A]">{order.requestedTime}</strong></p>
          {order.deliveryAddress && (
            <p><span className="text-[#817781]">{t.cart.deliveryAddress}: </span><strong className="text-[#29252A]">{order.deliveryAddress}</strong></p>
          )}
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#EEE6E9] shadow-soft space-y-3 text-xs">
          <h4 className="font-bold text-sm text-[#29252A] uppercase tracking-wider">
            {t.cart.customerNotes}
          </h4>
          <p className="italic text-[#29252A] bg-[#FAF8F6] p-3 rounded-xl border border-[#EEE6E9]">
            {order.customerMessage || '—'}
          </p>
        </div>
      </div>

      {/* Cancel Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title={t.common.cancel}
        description={t.common.status}
      >
        <div className="space-y-4 pt-2">
          <Textarea
            label={t.cart.customerNotes}
            placeholder="..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setCancelModalOpen(false)}>
              {t.common.back}
            </Button>
            <Button variant="danger" size="sm" isLoading={cancelling} onClick={handleCancelOrder}>
              {t.common.cancel}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Review Modal */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title={`${selectedProductToReview?.productNameSnapshot}`}
        description={t.productDetail.customerReviews}
      >
        <form onSubmit={handleSubmitReview} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#29252A] mb-1.5">
              {t.common.reviews}
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <Textarea
            label={t.common.reviews}
            placeholder="..."
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            rows={4}
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setReviewModalOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={reviewing}>
              {t.common.submit}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
