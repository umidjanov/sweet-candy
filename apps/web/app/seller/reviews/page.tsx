'use client';

import React, { useState, useEffect } from 'react';
import { Star, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDate } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

export default function SellerReviewsPage() {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient<any[]>('/reviews/seller/my')
      .then((data) => setReviews(data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const p = t.sellerPages.reviews;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-black text-[#29252A]">{p.title}</h1>
        <p className="text-sm text-[#817781] mt-1">{p.subtitle}</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-3xl p-6 border border-[#EEE6E9] animate-pulse h-28" />
          ))}
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div key={rev.id} className="bg-white rounded-3xl p-6 border border-[#EEE6E9] shadow-soft space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-[#29252A]">
                    {rev.customer?.firstName} {rev.customer?.lastName}
                  </h4>
                  <span className="text-xs text-[#817781] block">
                    {rev.product?.name}
                  </span>
                </div>

                <div className="flex items-center gap-1 font-bold text-sm text-[#29252A]">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>{rev.rating}.0</span>
                </div>
              </div>

              <p className="text-xs text-[#29252A] leading-relaxed bg-[#FAF8F6] p-3 rounded-xl border border-[#EEE6E9]">
                "{rev.comment}"
              </p>

              <span className="text-[10px] text-[#817781] block text-right">
                {formatDate(rev.createdAt)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title={p.emptyTitle}
          description={p.emptyDesc}
        />
      )}
    </div>
  );
}
