'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { ProductCard } from '@/components/product/product-card';
import { EmptyState } from '@/components/ui/empty-state';
import { apiClient } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

export default function CategoryDetailPage() {
  const params = useParams();
  const { slug } = params as { slug: string };
  const { t } = useTranslation();
  const [category, setCategory] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      apiClient(`/categories/${slug}`)
        .then((data) => setCategory(data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [slug]);

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-16 animate-pulse text-[#817781]">{t.common.loading}</div>;
  }

  if (!category) {
    return <div className="max-w-xl mx-auto px-4 py-20 text-center text-[#817781]">{t.common.notFound}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <nav className="flex items-center gap-2 text-xs text-[#817781]">
        <Link href="/" className="hover:text-[#E85D8E]">{t.nav.home}</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/categories" className="hover:text-[#E85D8E]">{t.nav.categories}</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[#29252A] font-semibold">{category.name}</span>
      </nav>

      <div>
        <h1 className="text-3xl font-black text-[#29252A]">{category.name}</h1>
        <p className="text-sm text-[#817781] mt-1">{category.description}</p>
      </div>

      {category.products && category.products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {category.products.map((p: any) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={category.name}
          description={t.common.notFound}
        />
      )}
    </div>
  );
}
