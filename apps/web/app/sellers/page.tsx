'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Store, Star, MapPin, Phone, Cake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { apiClient } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

export default function SellersPage() {
  const { t } = useTranslation();
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');

  const fetchSellers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (city) params.set('city', city);
      const data = await apiClient<any[]>(`/sellers?${params.toString()}`);
      setSellers(data || []);
    } catch (err) {
      console.error('Error fetching sellers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, [city]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#E85D8E]">
            {t.common.appName}
          </span>
          <h1 className="text-3xl font-black text-[#29252A] mt-1">{t.sellersPage.title}</h1>
          <p className="text-sm text-[#817781] mt-1">
            {t.sellersPage.subtitle}
          </p>
        </div>

        {/* Search & City Filter */}
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Search bakeries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchSellers()}
            className="px-4 py-2 bg-white border border-[#EEE6E9] rounded-xl text-xs text-[#29252A] focus:outline-none focus:border-[#E85D8E]"
          />
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="px-3 py-2 bg-white border border-[#EEE6E9] rounded-xl text-xs text-[#29252A] focus:outline-none focus:border-[#E85D8E]"
          >
            <option value="">All Cities</option>
            <option value="Tashkent">Tashkent</option>
            <option value="Samarkand">Samarkand</option>
            <option value="Bukhara">Bukhara</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-3xl p-6 border border-[#EEE6E9] animate-pulse space-y-4">
              <div className="w-16 h-16 bg-gray-200 rounded-2xl" />
              <div className="h-5 bg-gray-200 rounded w-1/2" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : sellers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sellers.map((seller) => (
            <Link
              key={seller.id}
              href={`/sellers/${seller.slug || seller.id}`}
              className="group bg-white rounded-3xl border border-[#EEE6E9] p-6 shadow-soft hover:shadow-card transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#FFF8EF] border border-[#EEE6E9] flex items-center justify-center text-[#E85D8E] font-bold text-xl overflow-hidden flex-shrink-0">
                    {seller.logoUrl ? (
                      <img src={seller.logoUrl} alt={seller.storeName} className="w-full h-full object-cover" />
                    ) : (
                      <Store className="w-8 h-8" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 font-bold text-sm text-[#29252A]">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span>{Number(seller.ratingAverage || 0).toFixed(1)}</span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-[#29252A] group-hover:text-[#E85D8E] transition-colors mb-2">
                  {seller.storeName}
                </h3>
                <p className="text-xs text-[#817781] line-clamp-3 mb-4 leading-relaxed">
                  {seller.description}
                </p>
              </div>

              <div className="pt-4 border-t border-[#EEE6E9] flex items-center justify-between text-xs text-[#817781]">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#E85D8E]" />
                  <span>{seller.city}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Cake className="w-3.5 h-3.5 text-[#E85D8E]" />
                  <span>{seller._count?.products || 0} Sweets</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No registered bakeries found"
          description="Be the first artisan to open your store on Sweet CANDY!"
          actionText="Register as a Seller"
          actionHref="/register/seller"
        />
      )}
    </div>
  );
}
