'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Store, Star, MapPin, Phone, Clock, Cake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProductCard } from '@/components/product/product-card';
import { EmptyState } from '@/components/ui/empty-state';
import { apiClient } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

export default function PublicStorePage() {
  const params = useParams();
  const { id } = params as { id: string };
  const { t } = useTranslation();
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      apiClient(`/sellers/profile/${id}`)
        .then((data) => setStore(data))
        .catch((err) => console.error('Error fetching store:', err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 animate-pulse space-y-8">
        <div className="h-48 bg-gray-200 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-gray-200 rounded-2xl" />
          <div className="md:col-span-2 h-64 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-[#29252A]">{t.sellerStore.notFound}</h2>
        <p className="text-sm text-[#817781]">{t.sellerStore.notFoundDesc}</p>
      </div>
    );
  }

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Store Header Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#FFF0F5] to-[#FFF8EF] border border-[#EEE6E9] p-8 sm:p-12 shadow-soft">
        {store.coverImageUrl && (
          <>
            <img
              src={store.coverImageUrl}
              alt={`${store.storeName} cover`}
              className="absolute inset-0 w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-white/85 via-white/75 to-[#FFF8EF]/70" />
          </>
        )}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center gap-6">
            <div className="w-24 h-24 rounded-3xl bg-white border-2 border-[#EEE6E9] shadow-soft flex items-center justify-center text-[#E85D8E] overflow-hidden flex-shrink-0">
              {store.logoUrl ? (
                <img src={store.logoUrl} alt={store.storeName} className="w-full h-full object-cover" />
              ) : (
                <Store className="w-12 h-12" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-black text-[#29252A]">{store.storeName}</h1>
                <Badge variant="success">{t.productDetail.verifiedBaker}</Badge>
              </div>
              <p className="text-sm text-[#817781] max-w-xl">{store.description}</p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-[#817781] pt-1">
                <span className="flex items-center gap-1 font-semibold text-[#29252A]">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  {Number(store.ratingAverage || 0).toFixed(1)} {t.common.reviews} ({store.ratingCount || 0})
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#E85D8E]" />
                  {store.city}, {store.address}
                </span>
                <span>• {t.sellerStore.serviceArea} {store.serviceArea}</span>
              </div>
            </div>
          </div>

          {/* Call Seller button */}
          {store.publicPhone && (
            <a href={`tel:${store.publicPhone}`}>
              <Button variant="caramel" size="lg" className="rounded-2xl">
                <Phone className="w-4 h-4 mr-2" /> {t.sellerStore.callSeller} ({store.publicPhone})
              </Button>
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Working Hours Sidebar */}
        <aside className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-[#EEE6E9] shadow-soft space-y-4">
            <h3 className="font-bold text-base text-[#29252A] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#E85D8E]" /> {t.sellerStore.workingHours}
            </h3>
            <div className="space-y-2 text-xs text-[#817781]">
              {store.availabilities && store.availabilities.length > 0 ? (
                store.availabilities.map((avail: any) => (
                  <div key={avail.dayOfWeek} className="flex justify-between py-1 border-b border-[#EEE6E9]/50">
                    <span className="font-medium text-[#29252A]">{days[avail.dayOfWeek]}</span>
                    <span>{avail.isOpen ? `${avail.openTime} - ${avail.closeTime}` : 'Closed'}</span>
                  </div>
                ))
              ) : (
                <p className="italic">Everyday: 09:00 - 20:00</p>
              )}
            </div>
          </div>
        </aside>

        {/* Store Catalog */}
        <main className="lg:col-span-3 space-y-6">
          <h2 className="text-2xl font-black text-[#29252A]">
            {t.sellerStore.sweetsCatalog} ({store.products?.length || 0})
          </h2>

          {store.products && store.products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {store.products.map((p: any) => (
                <ProductCard key={p.id} product={{ ...p, seller: store }} />
              ))}
            </div>
          ) : (
            <EmptyState
              title={t.sellerStore.noSweetsYet}
              description={t.common.notFound}
            />
          )}
        </main>
      </div>
    </div>
  );
}
