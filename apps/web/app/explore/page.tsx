'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';
import { ProductCard } from '@/components/product/product-card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { apiClient } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

function ExploreContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useTranslation();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<any>({ page: 1, total: 0, totalPages: 1 });

  // Filters state
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [categoryId, setCategoryId] = useState(searchParams.get('categoryId') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    apiClient('/categories')
      .then((data) => setCategories(data || []))
      .catch(() => {});
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (categoryId) params.set('categoryId', categoryId);
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);
      if (city) params.set('city', city);
      params.set('sort', sort);
      params.set('page', page.toString());
      params.set('limit', '12');

      const res = await apiClient<any>(`/products?${params.toString()}`);
      if (Array.isArray(res)) {
        setProducts(res);
      } else if (res?.products) {
        setProducts(res.products);
        if (res.meta) setMeta(res.meta);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error('Error searching products:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [categoryId, sort, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleClearFilters = () => {
    setQ('');
    setCategoryId('');
    setMinPrice('');
    setMaxPrice('');
    setCity('');
    setSort('newest');
    setPage(1);
    router.push('/explore');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#29252A]">{t.nav.explore}</h1>
          <p className="text-sm text-[#817781] mt-1">
            {t.hero.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3 lg:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="flex items-center gap-2"
          >
            <SlidersHorizontal className="w-4 h-4" /> {t.common.filter}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className={`lg:block ${mobileFilterOpen ? 'block' : 'hidden'} space-y-6`}>
          <div className="bg-white rounded-3xl p-6 border border-[#EEE6E9] shadow-soft space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#EEE6E9]">
              <span className="font-bold text-base text-[#29252A] flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#E85D8E]" /> {t.common.filter}
              </span>
              <button
                onClick={handleClearFilters}
                className="text-xs font-semibold text-[#E85D8E] hover:underline"
              >
                {t.common.clearFilters}
              </button>
            </div>

            <form onSubmit={handleSearchSubmit} className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#29252A]">
                {t.common.search}
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder={t.common.searchPlaceholder}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#FAF8F6] border border-[#EEE6E9] rounded-xl text-xs text-[#29252A] focus:outline-none focus:border-[#E85D8E]"
                />
                <Search className="w-4 h-4 text-[#817781] absolute left-3 top-2.5" />
              </div>
              <Button type="submit" variant="secondary" size="sm" className="w-full mt-1">
                {t.common.search}
              </Button>
            </form>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#29252A]">
                {t.nav.categories}
              </label>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                <button
                  onClick={() => { setCategoryId(''); setPage(1); }}
                  className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                    categoryId === '' ? 'bg-[#FFF0F5] text-[#E85D8E] font-bold' : 'text-[#817781] hover:bg-[#FAF8F6]'
                  }`}
                >
                  {t.common.all}
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => { setCategoryId(c.id); setPage(1); }}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                      categoryId === c.id ? 'bg-[#FFF0F5] text-[#E85D8E] font-bold' : 'text-[#817781] hover:bg-[#FAF8F6]'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#29252A]">
                Price Range (UZS)
              </label>
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="px-3 py-2 bg-[#FAF8F6] border border-[#EEE6E9] rounded-xl text-xs text-[#29252A] focus:outline-none focus:border-[#E85D8E]"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="px-3 py-2 bg-[#FAF8F6] border border-[#EEE6E9] rounded-xl text-xs text-[#29252A] focus:outline-none focus:border-[#E85D8E]"
                />
              </div>
              <Button onClick={() => { setPage(1); fetchProducts(); }} variant="outline" size="sm" className="w-full mt-2">
                Filter by Price
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#29252A]">
                City / Region
              </label>
              <select
                value={city}
                onChange={(e) => { setCity(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 bg-[#FAF8F6] border border-[#EEE6E9] rounded-xl text-xs text-[#29252A] focus:outline-none focus:border-[#E85D8E]"
              >
                <option value="">All Cities</option>
                <option value="Tashkent">Tashkent</option>
                <option value="Samarkand">Samarkand</option>
                <option value="Bukhara">Bukhara</option>
              </select>
            </div>
          </div>
        </aside>

        <main className="lg:col-span-3 space-y-6 min-w-0">
          <div className="bg-white rounded-2xl px-4 sm:px-5 py-3 border border-[#EEE6E9] shadow-soft flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-[#817781] font-medium">
              Showing {products.length} sweet results
            </span>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#29252A]">Sort by:</span>
              <select
                value={sort}
                onChange={(e) => { setSort(e.target.value); setPage(1); }}
                className="px-2.5 py-1.5 bg-[#FAF8F6] border border-[#EEE6E9] rounded-lg text-xs font-medium text-[#29252A] focus:outline-none focus:border-[#E85D8E]"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="lowest_price">Price: Low to High</option>
                <option value="highest_price">Price: High to Low</option>
                <option value="popular">Most Popular</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-3xl p-4 border border-[#EEE6E9] animate-pulse space-y-4">
                  <div className="aspect-[4/3] bg-gray-100 rounded-2xl" />
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="h-8 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No sweets matched your search"
              description="Try adjusting your search terms, removing filters, or exploring other categories."
              actionText="Reset Filters"
              onAction={handleClearFilters}
            />
          )}

          {meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-8">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-xs font-semibold text-[#817781] px-4">
                Page {page} of {meta.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <div className="max-w-7xl 3xl:max-w-[1440px] mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <Suspense fallback={<div className="text-sm text-[#817781]">Loading sweets catalog...</div>}>
        <ExploreContent />
      </Suspense>
    </div>
  );
}
