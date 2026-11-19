'use client';

import React from 'react';
import Link from 'next/link';
import { Cake, Phone, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center p-4 py-16">
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#EEE6E9] shadow-card p-8 sm:p-10 space-y-6 text-center">
        <div className="w-24 h-24 rounded-3xl bg-[#FFF6F8] border border-[#F5D6DF] flex items-center justify-center mx-auto p-1.5 shadow-soft overflow-hidden">
          <img
            src="/logo-sweet-candy.jpg"
            alt="Sweet CANDY"
            className="w-full h-full object-contain rounded-2xl mix-blend-multiply"
          />
        </div>

        <h1 className="text-2xl font-black text-[#29252A]">{t.auth.password}</h1>
        <p className="text-xs text-[#817781] leading-relaxed">
          {t.footer.support}
        </p>

        <div className="p-4 rounded-2xl bg-[#FFF8EF] border border-[#EEE6E9] text-xs text-[#817781] space-y-2 text-left">
          <p className="font-bold text-[#29252A]">{t.footer.support}:</p>
          <p className="flex items-center gap-2 text-[#29252A]">
            <Phone className="w-4 h-4 text-[#E85D8E]" /> +998 (71) 200-00-00
          </p>
          <p>Email: support@sweetmarket.uz</p>
        </div>

        <Link href="/login" className="block pt-2">
          <Button variant="outline" className="w-full rounded-2xl">
            <ArrowLeft className="w-4 h-4 mr-2" /> {t.common.back}
          </Button>
        </Link>
      </div>
    </div>
  );
}
