'use client';

import React, { useState, useEffect } from 'react';
import { Cake, EyeOff, Eye, Trash2, Search, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

export default function AdminProductsPage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await apiClient<any>(`/products?limit=50${search ? `&q=${encodeURIComponent(search)}` : ''}`);
      setProducts(Array.isArray(res) ? res : res.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleToggleHide = async (productId: string, currentHidden: boolean) => {
    try {
      await apiClient(`/admin/products/${productId}/moderation`, {
        method: 'PATCH',
        body: JSON.stringify({ isHidden: !currentHidden }),
      });
      await fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to update product moderation');
    }
  };

  const handleDelete = async (productId: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${name}"?`)) return;
    try {
      await apiClient(`/products/${productId}`, { method: 'DELETE' });
      await fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    }
  };

  const p = t.adminPages.products;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#29252A]">{p.title}</h1>
          <p className="text-sm text-[#817781] mt-1">{p.subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder={p.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchProducts()}
            className="px-4 py-2 bg-white border border-[#EEE6E9] rounded-xl text-xs text-[#29252A] focus:outline-none focus:border-[#E85D8E]"
          />
          <Button variant="secondary" size="sm" onClick={fetchProducts}>
            {t.common.search}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-3xl p-6 border border-[#EEE6E9] animate-pulse h-24" />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="bg-white rounded-3xl border border-[#EEE6E9] shadow-soft overflow-hidden w-full">
          <div className="w-full overflow-x-scroll scroll-smooth pb-1" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full min-w-[820px] text-left text-xs text-[#29252A]">
            <thead className="bg-[#FAF8F6] text-[#817781] uppercase font-bold border-b border-[#EEE6E9]">
              <tr>
                <th className="px-6 py-4">{t.sellerPages.products.tableDessert}</th>
                <th className="px-6 py-4">{t.dashboard.admin.sellersCount}</th>
                <th className="px-6 py-4">{t.common.price}</th>
                <th className="px-6 py-4">{t.common.status}</th>
                <th className="px-6 py-4 text-right">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEE6E9]">
              {products.map((prod) => {
                const cover = prod.images?.[0]?.url || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=150&q=80';

                return (
                  <tr key={prod.id} className="hover:bg-[#FAF8F6]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={cover} alt={prod.name} className="w-10 h-10 rounded-xl object-cover" />
                        <div>
                          <span className="font-bold text-sm block">{prod.name}</span>
                          <span className="text-[#817781] text-[11px]">{prod.category?.name}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-[#D99A52]">
                      {prod.seller?.storeName || 'Artisan Bakery'}
                    </td>
                    <td className="px-6 py-4 font-bold text-[#E85D8E]">
                      {formatPrice(prod.price, prod.currency)}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="success">{prod.availabilityStatus}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        className="inline-flex items-center justify-center w-9 h-9 min-w-[36px] rounded-xl border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 transition-colors flex-shrink-0"
                        onClick={() => handleDelete(prod.id, prod.name)}
                      >
                        <Trash2 className="w-4 h-4 flex-shrink-0" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#EEE6E9] shadow-soft">
          <p className="text-sm text-[#817781]">{t.common.notFound}</p>
        </div>
      )}
    </div>
  );
}
