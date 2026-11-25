'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Cake, ArrowRight, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get('redirect') || '/';
  const isExpired = searchParams?.get('expired') === '1';

  const { login } = useAuth();
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(phone, password);
      if (user.role === 'ADMIN') {
        router.push('/admin');
      } else if (user.role === 'SELLER') {
        router.push('/seller/dashboard');
      } else {
        router.push(redirect);
      }
    } catch (err: any) {
      setError(err.message || 'Invalid phone number or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl border border-[#EEE6E9] shadow-card p-8 sm:p-10 space-y-6 relative">
      <div className="flex justify-end">
        <LanguageSwitcher variant="header" />
      </div>

      <div className="text-center space-y-2">
        <div className="w-24 h-24 rounded-3xl bg-[#FFF6F8] border border-[#F5D6DF] flex items-center justify-center mx-auto mb-2 p-1.5 shadow-soft overflow-hidden">
          <img
            src="/logo-sweet-candy.jpg"
            alt="Sweet CANDY"
            className="w-full h-full object-contain rounded-2xl mix-blend-multiply"
          />
        </div>
        <h1 className="text-2xl font-black text-[#29252A]">{t.auth.welcomeBack}</h1>
        <p className="text-xs text-[#817781]">{t.auth.signInSubtitle}</p>
      </div>

      {isExpired && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-start gap-2.5 shadow-2xs animate-in fade-in">
          <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">{t.auth.sessionExpiredNotice}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={t.auth.phoneOrEmail}
          type="text"
          placeholder="+998 90 123 45 67 or email"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />

        <Input
          label={t.auth.password}
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Button type="submit" variant="primary" size="lg" isLoading={loading} className="w-full rounded-2xl mt-2">
          {t.auth.loginBtn} <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </form>

      <div className="pt-4 border-t border-[#EEE6E9] text-center space-y-3 text-xs text-[#817781]">
        <p>
          {t.auth.dontHaveAccount}{' '}
          <Link href="/register/customer" className="font-bold text-[#E85D8E] hover:underline">
            {t.auth.registerAsCustomer}
          </Link>
        </p>
        <p>
          <Link href="/register/seller" className="font-bold text-[#D99A52] hover:underline">
            {t.auth.openBakeryStore}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center p-4 sm:p-6 py-12">
      <Suspense fallback={<div className="text-sm text-[#817781]">{t.common.loading}</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
