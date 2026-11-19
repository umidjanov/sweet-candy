'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { ProductCard } from '@/components/product/product-card';
import { EmptyState } from '@/components/ui/empty-state';
import { apiClient } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

export default function FavoritesPage() {
  const { t } = useTranslation();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient<any[]>('/favorites')
      .then((data) => setFavorites(data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-[#29252A]">{t.account.favoritesTitle}</h1>
        <p className="text-sm text-[#817781] mt-1">{t.account.favoritesSubtitle}</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-3xl p-4 border border-[#EEE6E9] animate-pulse h-64" />
          ))}
        </div>
      ) : favorites.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {favorites.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No favorite sweets saved"
          description="Browse the catalog and click the heart icon on any cake or dessert to save it here."
          actionText="Explore Sweets"
          actionHref="/explore"
        />
      )}
    </div>
  );
}
