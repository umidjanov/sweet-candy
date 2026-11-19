'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Trash2, ArrowRight, Store, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from '@/lib/i18n';

export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const { items, groupedBySeller, totalAmount, updateQuantity, removeFromCart, isLoading } = useCart();

  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-[#FFF0F5] text-[#E85D8E] flex items-center justify-center mx-auto mb-2">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-[#29252A]">{t.cart.title}</h2>
        <p className="text-sm text-[#817781]">{t.auth.signInSubtitle}</p>
        <Link href="/login?redirect=/cart">
          <Button variant="primary">{t.nav.login}</Button>
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <EmptyState
          title={t.cart.emptyTitle}
          description={t.cart.emptyDesc}
          actionText={t.cart.startShopping}
          actionHref="/explore"
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl 3xl:max-w-[1440px] mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#29252A]">{t.cart.title}</h1>
        <p className="text-xs sm:text-sm text-[#817781] mt-1">
          {items.length} {t.cart.itemsCount}
        </p>
      </div>

      {groupedBySeller.length > 1 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600" />
          <span>{t.cart.multiSellerNotice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items Grouped By Seller */}
        <div className="lg:col-span-2 space-y-6">
          {groupedBySeller.map((group) => (
            <div
              key={group.seller.id}
              className="bg-white rounded-3xl border border-[#EEE6E9] p-6 shadow-soft space-y-4"
            >
              {/* Bakery Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#EEE6E9]">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-[#E85D8E]" />
                  <span className="font-bold text-base text-[#29252A]">{group.seller.storeName}</span>
                </div>
                <span className="text-xs text-[#817781]">📍 {group.seller.city}</span>
              </div>

              {/* Items for this seller */}
              <div className="divide-y divide-[#EEE6E9]/60">
                {group.items.map((item) => {
                  const coverImage =
                    item.product.images?.[0]?.url ||
                    'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=300&q=80';

                  return (
                    <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <img
                          src={coverImage}
                          alt={item.product.name}
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover bg-[#FFF8EF] border border-[#EEE6E9] flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <Link
                            href={`/products/${item.productId}`}
                            className="font-bold text-sm text-[#29252A] hover:text-[#E85D8E] line-clamp-2 sm:line-clamp-1"
                          >
                            {item.product.name}
                          </Link>
                          <p className="text-xs text-[#817781] mt-0.5">
                            {formatPrice(item.product.price)} / {t.cart.each}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pl-0 sm:pl-2">
                        {/* Quantity controls */}
                        <div className="flex items-center border border-[#EEE6E9] rounded-xl bg-white flex-shrink-0">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="px-2.5 py-1.5 text-xs font-bold text-[#29252A] hover:bg-[#FFF0F5] rounded-l-xl"
                          >
                            -
                          </button>
                          <span className="px-3 py-1.5 text-xs font-bold text-[#29252A]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="px-2.5 py-1.5 text-xs font-bold text-[#29252A] hover:bg-[#FFF0F5] rounded-r-xl"
                          >
                            +
                          </button>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3">
                          <span className="font-bold text-sm text-[#29252A] whitespace-nowrap text-right">
                            {formatPrice(item.lineTotal || 0)}
                          </span>

                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-1.5 text-[#817781] hover:text-rose-600 rounded-lg transition-colors flex-shrink-0"
                            title={t.common.delete}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Subtotal for this seller */}
              <div className="pt-3 border-t border-[#EEE6E9] flex justify-between text-xs text-[#817781]">
                <span>{t.cart.sellerSubtotal}</span>
                <span className="font-bold text-[#29252A] text-sm">
                  {formatPrice(group.subtotal)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary & Checkout Card */}
        <div>
          <div className="bg-white rounded-3xl border border-[#EEE6E9] p-6 shadow-soft space-y-6 sticky top-28">
            <h3 className="font-bold text-lg text-[#29252A] pb-3 border-b border-[#EEE6E9]">
              {t.cart.title}
            </h3>

            <div className="space-y-3 text-xs text-[#817781]">
              <div className="flex justify-between">
                <span>{t.cart.total}</span>
                <span className="font-semibold text-[#29252A]">{formatPrice(totalAmount)}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-[#EEE6E9] flex justify-between items-baseline">
              <span className="text-sm font-bold text-[#29252A]">{t.cart.total}</span>
              <span className="text-2xl font-black text-[#E85D8E]">{formatPrice(totalAmount)}</span>
            </div>

            <Link href="/checkout" className="block">
              <Button variant="primary" size="lg" className="w-full rounded-2xl shadow-md">
                {t.cart.checkoutBtn} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
