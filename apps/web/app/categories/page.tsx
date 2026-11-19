'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cake, ChevronRight } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

export default function CategoriesPage() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient('/categories')
      .then((data) => setCategories(data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-[#E85D8E]">
          {t.common.appName}
        </span>
        <h1 className="text-3xl font-black text-[#29252A] mt-1">{t.categoriesPage.title}</h1>
        <p className="text-sm text-[#817781] mt-1">
          {t.categoriesPage.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="bg-white rounded-3xl border border-[#EEE6E9] overflow-hidden shadow-soft flex flex-col justify-between"
          >
            <div>
              <div className="relative aspect-[16/9] w-full bg-[#FFF8EF] overflow-hidden">
                <img
                  src={cat.imageUrl || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587'}
                  alt={cat.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-[#29252A] mb-2">{cat.name}</h3>
                <p className="text-xs text-[#817781] leading-relaxed mb-4">{cat.description}</p>

                {cat.children && cat.children.length > 0 && (
                  <div className="space-y-1 pt-2 border-t border-[#EEE6E9]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#817781]">
                      Subcategories:
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {cat.children.map((sub: any) => (
                        <Link
                          key={sub.id}
                          href={`/explore?categoryId=${sub.id}`}
                          className="text-xs px-2.5 py-1 rounded-lg bg-[#FAF8F6] text-[#29252A] hover:bg-[#FFF0F5] hover:text-[#E85D8E] transition-colors"
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 pt-0">
              <Link
                href={`/categories/${cat.slug}`}
                className="w-full py-2.5 rounded-xl bg-[#FAF8F6] text-[#E85D8E] font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-[#FFF0F5] transition-colors"
              >
                Browse {cat.name} <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
