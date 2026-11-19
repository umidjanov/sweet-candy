'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, Store, ArrowRight, Cake } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export default function RegisterChoicePage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center p-4 py-16">
      <div className="w-full max-w-2xl space-y-8 text-center">
        <div>
          <div className="w-24 h-24 rounded-3xl bg-[#FFF6F8] border border-[#F5D6DF] flex items-center justify-center mx-auto mb-3 p-1.5 shadow-soft overflow-hidden">
            <img
              src="/logo-sweet-candy.jpg"
              alt="Sweet CANDY"
              className="w-full h-full object-contain rounded-2xl mix-blend-multiply"
            />
          </div>
          <h1 className="text-3xl font-black text-[#29252A]">{t.auth.joinTitle}</h1>
          <p className="text-sm text-[#817781] mt-1">{t.auth.joinSubtitle}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Customer Choice */}
          <Link
            href="/register/customer"
            className="group bg-white rounded-3xl p-8 border-2 border-[#EEE6E9] hover:border-[#E85D8E] shadow-soft hover:shadow-card transition-all text-left flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#FFF0F5] text-[#E85D8E] flex items-center justify-center group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-[#29252A] group-hover:text-[#E85D8E] transition-colors">
                {t.auth.iAmCustomer}
              </h3>
              <p className="text-xs text-[#817781] leading-relaxed">
                {t.auth.customerChoiceDesc}
              </p>
            </div>
            <div className="mt-8 flex items-center text-xs font-bold text-[#E85D8E] gap-1 group-hover:translate-x-1 transition-transform">
              {t.auth.continueAsCustomer} <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          {/* Seller Choice */}
          <Link
            href="/register/seller"
            className="group bg-white rounded-3xl p-8 border-2 border-[#EEE6E9] hover:border-[#D99A52] shadow-soft hover:shadow-card transition-all text-left flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#FFF8EF] text-[#D99A52] flex items-center justify-center group-hover:scale-105 transition-transform">
                <Store className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-[#29252A] group-hover:text-[#D99A52] transition-colors">
                {t.auth.iAmSeller}
              </h3>
              <p className="text-xs text-[#817781] leading-relaxed">
                {t.auth.sellerChoiceDesc}
              </p>
            </div>
            <div className="mt-8 flex items-center text-xs font-bold text-[#D99A52] gap-1 group-hover:translate-x-1 transition-transform">
              {t.auth.continueAsSeller} <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>

        <p className="text-xs text-[#817781]">
          {t.auth.alreadyHaveAccount}{' '}
          <Link href="/login" className="font-bold text-[#E85D8E] hover:underline">
            {t.auth.logInHere}
          </Link>
        </p>
      </div>
    </div>
  );
}
