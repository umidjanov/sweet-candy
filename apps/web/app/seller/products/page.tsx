'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { PlusCircle, Edit, Trash2, Eye, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { formatPrice } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from '@/lib/i18n';

export default function SellerProductsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);

  const fetchMyProducts = async () => {
    if (!user?.sellerProfile?.id) return;
    try {
      setLoading(true);
      const res = await apiClient<any>(`/products?sellerId=${user.sellerProfile.id}&limit=50`);
      setProducts(Array.isArray(res) ? res : res.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyProducts();
  }, [user]);

  const handleStatusChange = async (productId: string, nextStatus: string) => {
    try {
      setUpdatingId(productId);
      await apiClient(`/products/${productId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      await fetchMyProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteProduct = async (productId: string, name: string) => {
    if (!confirm(`"${name}"?`)) return;
    try {
      await apiClient(`/products/${productId}`, { method: 'DELETE' });
      await fetchMyProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    }
  };

  const scrollTable = (direction: 'left' | 'right') => {
    if (!tableScrollRef.current) return;
    tableScrollRef.current.scrollBy({
      left: direction === 'right' ? 280 : -280,
      behavior: 'smooth',
    });
  };

  const p = t.sellerPages.products;
  const np = t.sellerPages.newProduct;

  const getStatusSelectStyle = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PRE_ORDER_ONLY':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'OUT_OF_STOCK':
        return 'bg-orange-50 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#29252A]">{p.title}</h1>
          <p className="text-xs sm:text-sm text-[#817781] mt-1">{p.subtitle}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {products.length > 0 && (
            <div className="flex items-center gap-1 bg-white border border-[#EEE6E9] rounded-xl p-1">
              <button
                type="button"
                onClick={() => scrollTable('left')}
                className="p-1.5 rounded-lg text-[#817781] hover:text-[#E85D8E] hover:bg-[#FFF0F5] transition-colors"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollTable('right')}
                className="p-1.5 rounded-lg text-[#817781] hover:text-[#E85D8E] hover:bg-[#FFF0F5] transition-colors"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <Link href="/seller/products/new">
            <Button variant="primary" size="md" className="rounded-xl whitespace-nowrap">
              <PlusCircle className="w-4 h-4 mr-1.5 flex-shrink-0" /> {p.addNew}
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-3xl p-6 border border-[#EEE6E9] animate-pulse h-28" />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="bg-white rounded-3xl border border-[#EEE6E9] shadow-soft overflow-hidden w-full">
          <div
            ref={tableScrollRef}
            className="w-full overflow-x-scroll scroll-smooth pb-1"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <table className="w-full min-w-[920px] text-left text-xs text-[#29252A]">
              <thead className="bg-[#FAF8F6] text-[#817781] uppercase font-bold border-b border-[#EEE6E9]">
                <tr>
                  <th className="px-5 py-4 min-w-[230px] whitespace-nowrap">{p.tableDessert}</th>
                  <th className="px-5 py-4 min-w-[130px] whitespace-nowrap">{p.tablePrice}</th>
                  <th className="px-5 py-4 min-w-[140px] whitespace-nowrap">{p.tablePrepTime}</th>
                  <th className="px-5 py-4 min-w-[200px] whitespace-nowrap">{p.tableStatus}</th>
                  <th className="px-5 py-4 min-w-[100px] whitespace-nowrap">{p.tableRating}</th>
                  <th className="px-5 py-4 min-w-[160px] text-right whitespace-nowrap">{p.tableActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEE6E9]">
                {products.map((prod) => {
                  const coverImage =
                    prod.images?.[0]?.url ||
                    'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=200&q=80';

                  return (
                    <tr key={prod.id} className="hover:bg-[#FAF8F6]/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={coverImage}
                            alt={prod.name}
                            className="w-12 h-12 rounded-xl object-cover bg-[#FFF8EF] border border-[#EEE6E9] flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <Link
                              href={`/products/${prod.id}`}
                              className="font-bold text-sm block hover:text-[#E85D8E] transition-colors whitespace-nowrap"
                            >
                              {prod.name}
                            </Link>
                            <span className="text-[#817781] text-[11px] whitespace-nowrap">
                              {prod.category?.name || 'Sweets'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-bold text-sm text-[#E85D8E] whitespace-nowrap">
                        {formatPrice(prod.price, prod.currency)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-[#817781]">
                          <Clock className="w-3.5 h-3.5 text-[#E85D8E] flex-shrink-0" /> {prod.preparationTimeHours}h
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <select
                          value={prod.availabilityStatus}
                          disabled={updatingId === prod.id}
                          onChange={(e) => handleStatusChange(prod.id, e.target.value)}
                          title={p.toggleStatus}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-[#E85D8E]/30 cursor-pointer transition-colors ${getStatusSelectStyle(
                            prod.availabilityStatus
                          )}`}
                        >
                          <option value="AVAILABLE">{np.optAvailable}</option>
                          <option value="PRE_ORDER_ONLY">{np.optPreOrder}</option>
                          <option value="OUT_OF_STOCK">{np.optOutOfStock}</option>
                          <option value="UNAVAILABLE">{np.optUnavailable}</option>
                        </select>
                      </td>
                      <td className="px-5 py-4 font-semibold whitespace-nowrap">
                        ⭐ {Number(prod.ratingAverage || 0).toFixed(1)} ({prod.ratingCount || 0})
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-2">
                          <Link
                            href={`/products/${prod.id}`}
                            title={t.productCard.viewDetails}
                            className="inline-flex items-center justify-center w-9 h-9 min-w-[36px] rounded-xl text-[#817781] hover:text-[#29252A] hover:bg-[#FFF0F5] transition-colors flex-shrink-0"
                          >
                            <Eye className="w-4 h-4 flex-shrink-0" />
                          </Link>
                          <Link
                            href={`/seller/products/${prod.id}/edit`}
                            title={p.edit}
                            className="inline-flex items-center justify-center w-9 h-9 min-w-[36px] rounded-xl border border-[#fce4ec] bg-white text-[#E85D8E] hover:bg-[#FFF0F5] transition-colors flex-shrink-0"
                          >
                            <Edit className="w-4 h-4 flex-shrink-0" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(prod.id, prod.name)}
                            title={p.delete}
                            className="inline-flex items-center justify-center w-9 h-9 min-w-[36px] rounded-xl border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 transition-colors flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4 flex-shrink-0" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          title={p.emptyTitle}
          description={p.emptyDesc}
          actionText={p.addNew}
          actionHref="/seller/products/new"
        />
      )}
    </div>
  );
}
