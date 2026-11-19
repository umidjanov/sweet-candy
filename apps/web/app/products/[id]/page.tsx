'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  Star,
  Clock,
  Phone,
  AlertCircle,
  ShoppingBag,
  Store,
  ChevronRight,
  Heart,
  Calendar,
  CheckCircle2,
  Truck,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { formatPrice, formatDate } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from '@/lib/i18n';

function ProductDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { id } = params as { id: string };
  const { addToCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [addedToast, setAddedToast] = useState(false);
  const [actionError, setActionError] = useState('');

  // Pre-order modal state
  const [preOrderModalOpen, setPreOrderModalOpen] = useState(false);
  const [preOrderSubmitting, setPreOrderSubmitting] = useState(false);
  const [preOrderError, setPreOrderError] = useState('');
  const [createdPreOrder, setCreatedPreOrder] = useState<any>(null);

  const getDefaultDate = (prepHours = 24) => {
    const d = new Date(Date.now() + Math.max(prepHours, 24) * 60 * 60 * 1000);
    return d.toISOString().split('T')[0];
  };

  const [preOrderForm, setPreOrderForm] = useState({
    deliveryType: 'PICKUP' as 'PICKUP' | 'DELIVERY',
    requestedDate: getDefaultDate(24),
    requestedTime: '14:00',
    deliveryAddress: '',
    customerName: '',
    customerPhone: '',
    customerMessage: '',
  });

  useEffect(() => {
    if (user) {
      setPreOrderForm((prev) => ({
        ...prev,
        customerName: prev.customerName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        customerPhone: prev.customerPhone || user.phone || '',
      }));
    }
  }, [user]);

  useEffect(() => {
    if (id) {
      apiClient(`/products/${id}`)
        .then((data) => {
          setProduct(data);
          const firstImg =
            data.images?.[0]?.url ||
            'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1000&q=80';
          setSelectedImage(firstImg);
          setQuantity(data.minimumQuantity || 1);
          setPreOrderForm((prev) => ({
            ...prev,
            requestedDate: getDefaultDate(data.preparationTimeHours || 24),
          }));
        })
        .catch((err) => console.error('Error fetching product:', err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  // Auto-open pre-order modal if ?preorder=1 and authenticated
  useEffect(() => {
    if (!loading && product && searchParams.get('preorder') === '1' && isAuthenticated) {
      if (product.availabilityStatus !== 'UNAVAILABLE') {
        setPreOrderModalOpen(true);
      }
    }
  }, [loading, product, searchParams, isAuthenticated]);

  const handleAddToCart = async () => {
    setActionError('');
    if (!isAuthenticated) {
      router.push(`/login?redirect=/products/${id}`);
      return;
    }

    try {
      await addToCart(product.id, quantity);
      setAddedToast(true);
      setTimeout(() => setAddedToast(false), 3000);
    } catch (err: any) {
      setActionError(err.message || t.common.error);
    }
  };

  const handleOrderNow = async () => {
    setActionError('');
    if (!isAuthenticated) {
      router.push(`/login?redirect=/products/${id}`);
      return;
    }
    try {
      await addToCart(product.id, quantity);
      router.push('/cart');
    } catch (err: any) {
      setActionError(err.message || t.common.error);
    }
  };

  const handleOpenPreOrder = () => {
    setPreOrderError('');
    setCreatedPreOrder(null);
    if (!isAuthenticated) {
      router.push(`/login?redirect=/products/${id}?preorder=1`);
      return;
    }
    setPreOrderModalOpen(true);
  };

  const handleSubmitPreOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setPreOrderError('');

    if (
      preOrderForm.deliveryType === 'DELIVERY' &&
      (!preOrderForm.deliveryAddress || preOrderForm.deliveryAddress.trim().length < 5)
    ) {
      setPreOrderError(t.cart.deliveryAddress);
      return;
    }

    setPreOrderSubmitting(true);
    try {
      const notePrefix = '[Oldindan buyurtma / Pre-Order]';
      const finalMessage = preOrderForm.customerMessage.trim()
        ? `${notePrefix} ${preOrderForm.customerMessage.trim()}`
        : notePrefix;

      const order = await apiClient<any>('/orders', {
        method: 'POST',
        body: JSON.stringify({
          sellerId: product.seller.id,
          items: [{ productId: product.id, quantity }],
          requestedDate: preOrderForm.requestedDate,
          requestedTime: preOrderForm.requestedTime,
          deliveryType: preOrderForm.deliveryType,
          deliveryAddress:
            preOrderForm.deliveryType === 'DELIVERY' ? preOrderForm.deliveryAddress.trim() : undefined,
          customerName: preOrderForm.customerName.trim(),
          customerPhone: preOrderForm.customerPhone.trim(),
          customerMessage: finalMessage,
        }),
      });

      setCreatedPreOrder(order);
    } catch (err: any) {
      setPreOrderError(err.message || t.common.error);
    } finally {
      setPreOrderSubmitting(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/products/${id}`);
      return;
    }
    try {
      const res = await apiClient<{ isFavorite: boolean }>(`/favorites/${id}`, { method: 'POST' });
      setIsFavorite(res.isFavorite);
    } catch {
      // Ignore
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 animate-pulse space-y-8">
        <div className="h-6 bg-gray-200 rounded w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="aspect-[4/3] bg-gray-200 rounded-3xl" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-24 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-[#29252A]">{t.productDetail.notFoundTitle}</h2>
        <p className="text-sm text-[#817781]">{t.productDetail.notFoundDesc}</p>
        <Link href="/explore">
          <Button variant="primary">{t.productDetail.returnToCatalog}</Button>
        </Link>
      </div>
    );
  }

  const images = product.images?.length > 0 ? product.images.map((i: any) => i.url) : [selectedImage];
  const allergens = product.ingredients?.filter((i: any) => i.isAllergen) || [];
  const regularIngredients = product.ingredients?.filter((i: any) => !i.isAllergen) || [];

  const isAvailable = product.availabilityStatus === 'AVAILABLE';
  const isPreOrderStatus =
    product.availabilityStatus === 'PRE_ORDER_ONLY' ||
    product.availabilityStatus === 'OUT_OF_STOCK';
  const isUnavailable = product.availabilityStatus === 'UNAVAILABLE';

  const unitPriceNum = Number(product.price || 0);
  const preOrderSubtotal = unitPriceNum * quantity;
  const preOrderDeliveryFee = preOrderForm.deliveryType === 'DELIVERY' ? 25000 : 0;
  const preOrderTotal = preOrderSubtotal + preOrderDeliveryFee;

  const renderStatusBadge = () => {
    switch (product.availabilityStatus) {
      case 'AVAILABLE':
        return <Badge variant="success">{t.productDetail.availableForOrder}</Badge>;
      case 'PRE_ORDER_ONLY':
        return <Badge variant="warning">{t.productDetail.preOrderOnlyBadge}</Badge>;
      case 'OUT_OF_STOCK':
        return <Badge variant="warning">{t.productDetail.outOfStockBadge}</Badge>;
      default:
        return <Badge variant="outline">{t.productDetail.unavailableBadge}</Badge>;
    }
  };

  return (
    <div className="max-w-7xl 3xl:max-w-[1440px] mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 py-5 sm:py-10 space-y-8 sm:space-y-12">
      {/* Breadcrumbs */}
      <nav className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-[#817781]">
        <Link href="/" className="hover:text-[#E85D8E]">{t.productDetail.home}</Link>
        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
        <Link href="/explore" className="hover:text-[#E85D8E]">{t.productDetail.catalog}</Link>
        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="text-[#29252A] font-semibold truncate max-w-[180px] sm:max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
        {/* Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-[4/3] w-full rounded-3xl overflow-hidden bg-[#FFF8EF] border border-[#EEE6E9] shadow-soft">
            <img
              src={selectedImage}
              alt={product.name}
              className="w-full h-full object-cover transition-all duration-300"
            />
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <button
                onClick={handleToggleFavorite}
                className="p-2.5 rounded-2xl bg-white/90 backdrop-blur-md shadow-sm hover:scale-105 transition-transform"
                title={t.nav.favorites}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'text-[#E85D8E] fill-[#E85D8E]' : 'text-[#817781]'}`} />
              </button>
            </div>
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {images.map((url: string, index: number) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(url)}
                  className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                    selectedImage === url ? 'border-[#E85D8E] scale-105' : 'border-[#EEE6E9] opacity-70'
                  }`}
                >
                  <img src={url} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details & Purchase / Pre-Order Form */}
        <div className="space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="pink">{product.category?.name || 'Sweets'}</Badge>
              {renderStatusBadge()}
            </div>

            <h1 className="text-2xl xs:text-3xl sm:text-4xl font-black text-[#29252A] leading-tight">
              {product.name}
            </h1>

            {/* Rating & Prep Time */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3 text-xs sm:text-sm text-[#817781]">
              <div className="flex items-center gap-1.5 font-bold text-[#29252A]">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>{Number(product.ratingAverage || 0).toFixed(1)}</span>
                <span className="font-normal text-[#817781]">({product.ratingCount || 0} {t.common.reviews})</span>
              </div>
              <span className="hidden xs:inline">•</span>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#E85D8E]" />
                <span>{product.preparationTimeHours} {t.productDetail.prepTime}</span>
              </div>
            </div>
          </div>

          {/* Pre-Order Info Banner for PRE_ORDER_ONLY or OUT_OF_STOCK */}
          {isPreOrderStatus && (
            <div className="p-4 rounded-2xl bg-[#FFF8EF] border border-[#D99A52]/40 flex items-start gap-3">
              <Calendar className="w-5 h-5 text-[#D99A52] flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-[#70452F]">{t.productDetail.preOrderNoticeTitle}</p>
                <p className="text-xs text-[#817781] leading-relaxed">{t.productDetail.preOrderNoticeDesc}</p>
              </div>
            </div>
          )}

          {/* Price */}
          <div className="p-4 rounded-2xl bg-[#FFF0F5]/50 border border-[#fce4ec] flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#817781]">
                {t.productDetail.pricePerItem}
              </span>
              <p className="text-2xl sm:text-3xl font-black text-[#E85D8E]">
                {formatPrice(product.price, product.currency || 'UZS')}
              </p>
            </div>
            {product.minimumQuantity > 1 && (
              <span className="text-xs text-[#817781]">{t.productDetail.minQuantity} {product.minimumQuantity}</span>
            )}
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#29252A] mb-2">
              {t.productDetail.description}
            </h3>
            <p className="text-sm text-[#817781] leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>

          {/* Portion & Weight Specs */}
          {(product.portionSize || product.weightGrams) && (
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-4 p-4 rounded-2xl bg-white border border-[#EEE6E9]">
              {product.portionSize && (
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#817781]">
                    {t.productDetail.portionSize}
                  </span>
                  <p className="text-sm font-semibold text-[#29252A]">{product.portionSize}</p>
                </div>
              )}
              {product.weightGrams && (
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#817781]">
                    {t.productDetail.weight}
                  </span>
                  <p className="text-sm font-semibold text-[#29252A]">{product.weightGrams} {t.productDetail.grams}</p>
                </div>
              )}
            </div>
          )}

          {/* Ingredients & Allergen Declaration */}
          {(allergens.length > 0 || regularIngredients.length > 0) && (
            <div className="space-y-3 p-5 rounded-2xl bg-white border border-[#EEE6E9]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#29252A]">
                {t.productDetail.ingredientsAndAllergens}
              </h3>

              {allergens.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-800 mb-1">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    {t.productDetail.containsAllergens}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {allergens.map((ing: any, i: number) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-semibold">
                        {ing.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {regularIngredients.length > 0 && (
                <div className="text-xs text-[#817781] leading-relaxed">
                  <span className="font-semibold text-[#29252A]">{t.productDetail.ingredientsLabel} </span>
                  {regularIngredients.map((i: any) => i.name).join(', ')}
                </div>
              )}
            </div>
          )}

          {/* Quantity selector & Actions */}
          <div className="space-y-4 pt-4 border-t border-[#EEE6E9]">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#29252A]">
                {t.productDetail.quantity}
              </span>
              <div className="flex items-center border border-[#EEE6E9] rounded-xl bg-white">
                <button
                  onClick={() => setQuantity((q) => Math.max(product.minimumQuantity || 1, q - 1))}
                  className="px-3 py-1.5 text-base font-bold text-[#29252A] hover:bg-[#FFF0F5] rounded-l-xl"
                >
                  -
                </button>
                <span className="px-4 py-1.5 text-sm font-bold text-[#29252A] min-w-[3rem] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="px-3 py-1.5 text-base font-bold text-[#29252A] hover:bg-[#FFF0F5] rounded-r-xl"
                >
                  +
                </button>
              </div>
            </div>

            {actionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold text-center">
                {actionError}
              </div>
            )}

            {isUnavailable ? (
              <div className="p-4 rounded-2xl bg-gray-100 border border-gray-200 text-center text-xs font-semibold text-gray-600">
                {t.productDetail.unavailableBadge}
              </div>
            ) : isPreOrderStatus ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  variant="caramel"
                  size="lg"
                  onClick={handleOpenPreOrder}
                  className="w-full rounded-2xl shadow-md"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  {t.productDetail.preOrderBtn}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleAddToCart}
                  className="w-full rounded-2xl border-[#E85D8E] text-[#E85D8E] hover:bg-[#FFF0F5]"
                >
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  {t.productDetail.addToCart}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleAddToCart}
                    className="w-full rounded-2xl border-[#E85D8E] text-[#E85D8E] hover:bg-[#FFF0F5]"
                  >
                    <ShoppingBag className="w-5 h-5 mr-2" />
                    {t.productDetail.addToCart}
                  </Button>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleOrderNow}
                    className="w-full rounded-2xl shadow-md"
                  >
                    {t.productDetail.orderNow}
                  </Button>
                </div>
                <Button
                  variant="caramel"
                  size="md"
                  onClick={handleOpenPreOrder}
                  className="w-full rounded-2xl"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  {t.productDetail.preOrderBtn}
                </Button>
              </div>
            )}

            {addedToast && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold text-center animate-in fade-in">
                ✓ {quantity} {t.productDetail.addedToCartToast}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SELLER CONTACT & INFO CARD */}
      <section className="bg-white rounded-2xl sm:rounded-3xl p-4 xs:p-6 sm:p-8 border border-[#EEE6E9] shadow-soft">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 sm:gap-6">
          <div className="flex flex-col xs:flex-row items-start xs:items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#FFF8EF] border border-[#EEE6E9] flex items-center justify-center text-[#E85D8E] font-bold text-xl overflow-hidden flex-shrink-0">
              {product.seller.logoUrl ? (
                <img src={product.seller.logoUrl} alt={product.seller.storeName} className="w-full h-full object-cover" />
              ) : (
                <Store className="w-7 h-7 sm:w-8 sm:h-8" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/sellers/${product.seller.slug || product.seller.id}`}
                  className="text-lg sm:text-xl font-bold text-[#29252A] hover:text-[#E85D8E] transition-colors"
                >
                  {product.seller.storeName}
                </Link>
                <Badge variant="success">{t.productDetail.verifiedBaker}</Badge>
              </div>
              <p className="text-xs text-[#817781] mt-1 max-w-xl">
                {product.seller.description}
              </p>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-[#817781] mt-2">
                <span>📍 {product.seller.city}, {product.seller.address}</span>
                <span>⭐ {Number(product.seller.ratingAverage || 0).toFixed(1)} rating</span>
              </div>
            </div>
          </div>

          {/* Seller Phone CTA */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {product.seller.publicPhone ? (
              <a href={`tel:${product.seller.publicPhone}`} className="w-full sm:w-auto">
                <Button variant="caramel" size="md" className="w-full rounded-xl">
                  <Phone className="w-4 h-4 mr-2" /> {t.productDetail.callSeller} ({product.seller.publicPhone})
                </Button>
              </a>
            ) : (
              <span className="text-xs text-[#817781] italic">{t.productDetail.directPhoneHidden}</span>
            )}
            <Link href={`/sellers/${product.seller.slug || product.seller.id}`} className="w-full sm:w-auto">
              <Button variant="outline" size="md" className="w-full rounded-xl">
                {t.productDetail.viewBakeryStore}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CUSTOMER REVIEWS */}
      <section className="bg-white rounded-3xl p-8 border border-[#EEE6E9] shadow-soft space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#EEE6E9]">
          <div>
            <h3 className="text-xl font-bold text-[#29252A]">{t.productDetail.customerReviews}</h3>
            <p className="text-xs text-[#817781] mt-0.5">{t.productDetail.verifiedOrdersOnly}</p>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <span className="text-xl font-black text-[#29252A]">
              {Number(product.ratingAverage || 0).toFixed(1)}
            </span>
          </div>
        </div>

        {product.reviews && product.reviews.length > 0 ? (
          <div className="space-y-4">
            {product.reviews.map((rev: any) => (
              <div key={rev.id} className="p-4 rounded-2xl bg-[#FAF8F6] border border-[#EEE6E9] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[#29252A]">
                    {rev.customer.firstName} {rev.customer.lastName}
                  </span>
                  <span className="text-xs text-[#817781]">{formatDate(rev.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < rev.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-[#29252A] leading-relaxed">{rev.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#817781] text-center py-6">
            {t.productDetail.noReviewsYet}
          </p>
        )}
      </section>

      {/* PRE-ORDER MODAL */}
      <Modal
        isOpen={preOrderModalOpen}
        onClose={() => setPreOrderModalOpen(false)}
        title={t.productDetail.preOrderModalTitle}
        description={t.productDetail.preOrderModalDesc}
      >
        {createdPreOrder ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-[#29252A]">{t.productDetail.preOrderSuccessTitle}</h3>
            <p className="text-sm text-[#817781]">
              {t.productDetail.preOrderSuccessDesc}{' '}
              <span className="font-mono font-bold text-[#E85D8E]">#{createdPreOrder.orderNumber}</span>
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="outline" size="md" onClick={() => setPreOrderModalOpen(false)} className="rounded-xl">
                {t.common.cancel}
              </Button>
              <Link href={`/account/orders/${createdPreOrder.id}`}>
                <Button variant="primary" size="md" className="rounded-xl">
                  {t.productDetail.viewMyOrder}
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitPreOrder} className="space-y-4 pt-2 max-h-[75vh] overflow-y-auto pr-1">
            {/* Compact Product Preview */}
            <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#FFF8EF] border border-[#EEE6E9]">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={selectedImage}
                  alt={product.name}
                  className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="font-bold text-xs text-[#29252A] truncate">{product.name}</p>
                  <p className="text-[11px] text-[#817781]">
                    {formatPrice(product.price, product.currency || 'UZS')} × {quantity}
                  </p>
                </div>
              </div>
              <span className="font-black text-sm text-[#E85D8E] whitespace-nowrap">
                {formatPrice(preOrderSubtotal, product.currency || 'UZS')}
              </span>
            </div>

            {preOrderError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{preOrderError}</span>
              </div>
            )}

            {/* Fulfillment Type Toggle */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#29252A] mb-1.5">
                {t.productDetail.fulfillmentMethod}
              </label>
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPreOrderForm({ ...preOrderForm, deliveryType: 'PICKUP' })}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    preOrderForm.deliveryType === 'PICKUP'
                      ? 'bg-[#FFF0F5] border-[#E85D8E] text-[#E85D8E]'
                      : 'bg-white border-[#EEE6E9] text-[#29252A] hover:bg-[#FAF8F6]'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" /> {t.productDetail.pickup}
                </button>
                <button
                  type="button"
                  onClick={() => setPreOrderForm({ ...preOrderForm, deliveryType: 'DELIVERY' })}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    preOrderForm.deliveryType === 'DELIVERY'
                      ? 'bg-[#FFF0F5] border-[#E85D8E] text-[#E85D8E]'
                      : 'bg-white border-[#EEE6E9] text-[#29252A] hover:bg-[#FAF8F6]'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" /> {t.productDetail.delivery}
                </button>
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
              <Input
                label={t.productDetail.preOrderDate}
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={preOrderForm.requestedDate}
                onChange={(e) => setPreOrderForm({ ...preOrderForm, requestedDate: e.target.value })}
                required
              />
              <Input
                label={t.productDetail.preOrderTime}
                type="time"
                value={preOrderForm.requestedTime}
                onChange={(e) => setPreOrderForm({ ...preOrderForm, requestedTime: e.target.value })}
                required
              />
            </div>

            {/* Delivery Address (if Delivery) */}
            {preOrderForm.deliveryType === 'DELIVERY' && (
              <Input
                label={t.productDetail.preOrderAddress}
                placeholder={t.checkout.addressPlaceholder}
                value={preOrderForm.deliveryAddress}
                onChange={(e) => setPreOrderForm({ ...preOrderForm, deliveryAddress: e.target.value })}
                required
              />
            )}

            {/* Contact info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label={t.productDetail.customerName}
                value={preOrderForm.customerName}
                onChange={(e) => setPreOrderForm({ ...preOrderForm, customerName: e.target.value })}
                required
              />
              <Input
                label={t.productDetail.customerPhone}
                type="tel"
                value={preOrderForm.customerPhone}
                onChange={(e) => setPreOrderForm({ ...preOrderForm, customerPhone: e.target.value })}
                required
              />
            </div>

            {/* Notes */}
            <Textarea
              label={t.productDetail.preOrderNotes}
              placeholder={t.checkout.notesPlaceholder}
              value={preOrderForm.customerMessage}
              onChange={(e) => setPreOrderForm({ ...preOrderForm, customerMessage: e.target.value })}
              rows={2}
            />

            {/* Totals */}
            <div className="p-3 rounded-2xl bg-[#FAF8F6] border border-[#EEE6E9] space-y-1 text-xs">
              {preOrderDeliveryFee > 0 && (
                <div className="flex justify-between text-[#817781]">
                  <span>{t.productDetail.deliveryFeeLabel}:</span>
                  <span>{formatPrice(preOrderDeliveryFee, product.currency || 'UZS')}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-sm text-[#29252A]">
                <span>{t.cart.total}</span>
                <span className="text-[#E85D8E]">{formatPrice(preOrderTotal, product.currency || 'UZS')}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="md" onClick={() => setPreOrderModalOpen(false)} className="rounded-xl">
                {t.common.cancel}
              </Button>
              <Button type="submit" variant="caramel" size="md" isLoading={preOrderSubmitting} className="rounded-xl shadow-md">
                <Calendar className="w-4 h-4 mr-1.5" /> {t.productDetail.submitPreOrder}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export default function ProductDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-16 animate-pulse space-y-8">
          <div className="h-6 bg-gray-200 rounded w-1/4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="aspect-[4/3] bg-gray-200 rounded-3xl" />
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        </div>
      }
    >
      <ProductDetailContent />
    </Suspense>
  );
}
