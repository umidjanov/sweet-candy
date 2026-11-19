'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Store,
  Calendar,
  AlertCircle,
  Truck,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { groupedBySeller, clearCart } = useCart();

  const [deliveryType, setDeliveryType] = useState<'DELIVERY' | 'PICKUP'>('DELIVERY');
  const [requestedDate, setRequestedDate] = useState('');
  const [requestedTime, setRequestedTime] = useState('14:00 - 16:00');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerMessage, setCustomerMessage] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setCustomerName((prev) => prev || `${user.firstName || ''} ${user.lastName || ''}`.trim());
      setCustomerPhone((prev) => prev || user.phone || '');
    }
  }, [user]);

  const c = t.checkout;

  // Delivery fee per seller order (25,000 UZS)
  const deliveryFeePerSeller = deliveryType === 'DELIVERY' ? 25000 : 0;
  const totalDeliveryFee = deliveryFeePerSeller * groupedBySeller.length;

  const itemsSubtotal = groupedBySeller.reduce((sum, g) => sum + g.subtotal, 0);
  const grandTotal = itemsSubtotal + totalDeliveryFee;

  const handlePlaceOrders = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!requestedDate) {
      setError(c.errSelectDate);
      return;
    }

    if (deliveryType === 'DELIVERY' && (!deliveryAddress || deliveryAddress.trim().length < 5)) {
      setError(c.errEnterAddress);
      return;
    }

    setLoading(true);

    try {
      for (const group of groupedBySeller) {
        await apiClient('/orders', {
          method: 'POST',
          body: JSON.stringify({
            sellerId: group.seller.id,
            items: group.items.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
            })),
            requestedDate,
            requestedTime,
            deliveryType,
            deliveryAddress: deliveryType === 'DELIVERY' ? deliveryAddress : undefined,
            customerName,
            customerPhone,
            customerMessage,
          }),
        });
      }

      await clearCart();
      router.push('/account/orders?success=true');
    } catch (err: any) {
      setError(err.message || c.errPlaceOrder);
    } finally {
      setLoading(false);
    }
  };

  // Earliest date is tomorrow (homemade freshly baked prep time)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const fulfillmentLabel = deliveryType === 'DELIVERY' ? c.deliveryLabel : c.pickupLabel;

  return (
    <div className="max-w-7xl 3xl:max-w-[1440px] mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#29252A]">{c.title}</h1>
        <p className="text-xs sm:text-sm text-[#817781] mt-1">{c.subtitle}</p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrders} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Delivery or Pickup */}
          <div className="bg-white rounded-3xl border border-[#EEE6E9] p-6 shadow-soft space-y-4">
            <h3 className="font-bold text-base text-[#29252A] flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#E85D8E]" /> {c.step1Title}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setDeliveryType('DELIVERY')}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  deliveryType === 'DELIVERY'
                    ? 'border-[#E85D8E] bg-[#FFF0F5]/50'
                    : 'border-[#EEE6E9] bg-white hover:border-gray-300'
                }`}
              >
                <span className="font-bold text-sm text-[#29252A] block">{c.courierDelivery}</span>
                <span className="text-xs text-[#817781] mt-1 block">{c.courierDeliveryDesc}</span>
              </button>

              <button
                type="button"
                onClick={() => setDeliveryType('PICKUP')}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  deliveryType === 'PICKUP'
                    ? 'border-[#E85D8E] bg-[#FFF0F5]/50'
                    : 'border-[#EEE6E9] bg-white hover:border-gray-300'
                }`}
              >
                <span className="font-bold text-sm text-[#29252A] block">{c.selfPickup}</span>
                <span className="text-xs text-[#817781] mt-1 block">{c.selfPickupDesc}</span>
              </button>
            </div>

            {deliveryType === 'DELIVERY' && (
              <Input
                label={c.deliveryAddressLabel}
                placeholder={c.addressPlaceholder}
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                required
              />
            )}
          </div>

          {/* Step 2: Date & Preferred Time */}
          <div className="bg-white rounded-3xl border border-[#EEE6E9] p-6 shadow-soft space-y-4">
            <h3 className="font-bold text-base text-[#29252A] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#E85D8E]" /> {c.step2Title}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#29252A] mb-1.5">
                  {c.requiredDateLabel}
                </label>
                <input
                  type="date"
                  min={minDate}
                  value={requestedDate}
                  onChange={(e) => setRequestedDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#EEE6E9] rounded-xl text-sm text-[#29252A] focus:outline-none focus:border-[#E85D8E]"
                  required
                />
                <span className="text-[11px] text-[#817781] mt-1 block">
                  {c.requiredDateHelper}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#29252A] mb-1.5">
                  {c.preferredTime}
                </label>
                <select
                  value={requestedTime}
                  onChange={(e) => setRequestedTime(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#EEE6E9] rounded-xl text-sm text-[#29252A] focus:outline-none focus:border-[#E85D8E]"
                >
                  <option value="10:00 - 12:00">{c.timeMorning}</option>
                  <option value="12:00 - 14:00">{c.timeMidday}</option>
                  <option value="14:00 - 16:00">{c.timeAfternoon}</option>
                  <option value="16:00 - 18:00">{c.timeEvening}</option>
                  <option value="18:00 - 20:00">{c.timeNight}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Step 3: Contact & Message */}
          <div className="bg-white rounded-3xl border border-[#EEE6E9] p-6 shadow-soft space-y-4">
            <h3 className="font-bold text-base text-[#29252A]">{c.step3Title}</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={c.fullNameLabel}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />

              <Input
                label={c.contactPhoneLabel}
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                helperText={c.contactPhoneHelper}
                required
              />
            </div>

            <Textarea
              label={c.messageLabel}
              placeholder={c.notesPlaceholder}
              value={customerMessage}
              onChange={(e) => setCustomerMessage(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* Order Breakdown */}
        <div>
          <div className="bg-white rounded-3xl border border-[#EEE6E9] p-6 shadow-soft space-y-6 sticky top-28">
            <h3 className="font-bold text-lg text-[#29252A] pb-3 border-b border-[#EEE6E9]">
              {c.orderConfirmation}
            </h3>

            <div className="space-y-4">
              {groupedBySeller.map((g) => (
                <div key={g.seller.id} className="text-xs space-y-1 pb-3 border-b border-[#EEE6E9]/60">
                  <div className="flex items-center gap-1 font-bold text-[#29252A]">
                    <Store className="w-3.5 h-3.5 text-[#E85D8E]" />
                    <span>{g.seller.storeName}</span>
                  </div>
                  {g.items.map((i) => (
                    <div key={i.id} className="flex justify-between text-[#817781]">
                      <span>{i.product.name} ×{i.quantity}</span>
                      <span>{formatPrice(i.lineTotal || 0)}</span>
                    </div>
                  ))}
                </div>
              ))}

              <div className="space-y-2 text-xs text-[#817781] pt-2">
                <div className="flex justify-between">
                  <span>{c.subtotal}</span>
                  <span className="font-semibold text-[#29252A]">{formatPrice(itemsSubtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{c.deliveryLabel} ({fulfillmentLabel}):</span>
                  <span className="font-semibold text-[#29252A]">{formatPrice(totalDeliveryFee)}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-[#EEE6E9] flex justify-between items-baseline">
                <span className="text-base font-bold text-[#29252A]">{c.totalLabel}</span>
                <span className="text-2xl font-black text-[#E85D8E]">{formatPrice(grandTotal)}</span>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={loading}
                className="w-full rounded-2xl shadow-md"
              >
                {c.confirmAndOrder} <ArrowRight className="w-4 h-4 ml-1" />
              </Button>

              <div className="p-3 rounded-xl bg-[#FFF8EF] border border-[#EEE6E9] text-[11px] text-[#817781] space-y-1 leading-relaxed">
                <p className="font-semibold text-[#29252A]">{c.telegramNoticeTitle}</p>
                <p>{c.telegramNoticeDesc}</p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
