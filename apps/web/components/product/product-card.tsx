'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Star, Clock, ShoppingBag, Eye, Store, Calendar } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from '@/lib/i18n';

export interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug?: string;
    description: string;
    price: number | string;
    currency?: string;
    preparationTimeHours: number;
    availabilityStatus: string;
    ratingAverage: number;
    ratingCount?: number;
    images?: { url: string }[];
    seller: {
      id: string;
      storeName: string;
      slug?: string;
      city?: string;
    };
  };
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const router = useRouter();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();

  const coverImage =
    product.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80';

  const isAvailable = product.availabilityStatus === 'AVAILABLE';
  const isPreOrder =
    product.availabilityStatus === 'PRE_ORDER_ONLY' ||
    product.availabilityStatus === 'OUT_OF_STOCK';
  const isUnavailable = product.availabilityStatus === 'UNAVAILABLE';

  const handleOrderClick = async () => {
    if (isPreOrder) {
      router.push(`/products/${product.id}?preorder=1`);
      return;
    }
    if (!isAuthenticated) {
      router.push(`/login?redirect=/products/${product.id}`);
      return;
    }
    try {
      await addToCart(product.id, 1);
    } catch {
      router.push(`/products/${product.id}`);
    }
  };

  return (
    <div className="group bg-white rounded-3xl border border-[#EEE6E9] shadow-soft hover:shadow-card transition-all duration-300 flex flex-col overflow-hidden">
      {/* Clickable Photo Container */}
      <Link
        href={`/products/${product.id}`}
        className="relative aspect-[4/3] w-full overflow-hidden bg-[#FFF8EF] block"
      >
        <img
          src={coverImage}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Preparation time badge */}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-xl shadow-sm text-xs font-semibold text-[#29252A] flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[#E85D8E]" />
          <span>{product.preparationTimeHours} {t.productCard.prep}</span>
        </div>

        {/* Availability Badge */}
        {product.availabilityStatus === 'PRE_ORDER_ONLY' && (
          <div className="absolute top-3 right-3">
            <Badge variant="warning">{t.productCard.preOrderOnly}</Badge>
          </div>
        )}
        {product.availabilityStatus === 'OUT_OF_STOCK' && (
          <div className="absolute top-3 right-3">
            <Badge variant="warning">{t.productCard.outOfStockPreOrder}</Badge>
          </div>
        )}
        {isUnavailable && (
          <div className="absolute top-3 right-3">
            <Badge variant="outline">{t.productCard.unavailable}</Badge>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-3.5 xs:p-4 sm:p-5 flex-1 flex flex-col justify-between min-w-0">
        <div>
          {/* Seller Link & Rating */}
          <div className="flex items-center justify-between gap-2 text-xs text-[#817781] mb-2">
            <Link
              href={`/sellers/${product.seller.slug || product.seller.id}`}
              className="flex items-center gap-1 hover:text-[#E85D8E] font-medium truncate max-w-[65%]"
            >
              <Store className="w-3.5 h-3.5 text-[#E85D8E] flex-shrink-0" />
              <span className="truncate">{product.seller.storeName}</span>
            </Link>

            <div className="flex items-center gap-1 font-bold text-[#29252A] flex-shrink-0">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>{Number(product.ratingAverage || 0).toFixed(1)}</span>
            </div>
          </div>

          {/* Product Title */}
          <Link href={`/products/${product.id}`} className="group-hover:text-[#E85D8E] transition-colors">
            <h3 className="font-bold text-sm sm:text-base text-[#29252A] line-clamp-1 mb-1.5">
              {product.name}
            </h3>
          </Link>

          {/* Short Description */}
          <p className="text-xs text-[#817781] line-clamp-2 leading-relaxed mb-3 sm:mb-4">
            {product.description}
          </p>
        </div>

        {/* Price & Action Buttons */}
        <div className="pt-3 border-t border-[#EEE6E9] flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[10px] text-[#817781] block uppercase tracking-wider font-semibold">
              {t.productCard.price}
            </span>
            <span className="text-sm sm:text-base font-black text-[#29252A] whitespace-nowrap">
              {formatPrice(product.price, product.currency || 'UZS')}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Link
              href={`/products/${product.id}`}
              className="p-2 sm:p-2.5 rounded-xl border border-[#EEE6E9] text-[#817781] hover:text-[#29252A] hover:bg-[#FAF8F6] transition-colors"
              title={t.productCard.viewDetails}
            >
              <Eye className="w-4 h-4" />
            </Link>

            {isPreOrder ? (
              <Link
                href={`/products/${product.id}?preorder=1`}
                className="px-2.5 xs:px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl bg-[#D99A52] text-white hover:bg-[#c2833c] text-xs font-bold transition-all shadow-sm hover:shadow-md flex items-center gap-1.5 whitespace-nowrap"
              >
                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{t.productCard.preOrderBtn}</span>
              </Link>
            ) : (
              <button
                onClick={handleOrderClick}
                disabled={isUnavailable}
                className="px-2.5 xs:px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl bg-[#E85D8E] text-white hover:bg-[#C83F72] disabled:opacity-50 text-xs font-bold transition-all shadow-sm hover:shadow-md flex items-center gap-1.5 whitespace-nowrap"
              >
                <ShoppingBag className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{t.productCard.orderBtn}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
