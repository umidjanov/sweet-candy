'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from '@/lib/i18n';

export default function CustomerRegisterPage() {
  const router = useRouter();
  const { registerCustomer } = useAuth();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await registerCustomer(formData);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#EEE6E9] shadow-card p-8 sm:p-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF0F5] text-[#E85D8E] flex items-center justify-center mx-auto mb-2">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-[#29252A]">{t.auth.customerRegisterTitle}</h1>
          <p className="text-xs text-[#817781]">{t.hero.subtitle}</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
            <Input
              label={t.auth.firstName}
              name="firstName"
              placeholder="Ali"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
            <Input
              label={t.auth.lastName}
              name="lastName"
              placeholder="Valiyev"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>

          <Input
            label={t.common.phone}
            name="phone"
            type="tel"
            placeholder="+998 90 123 45 67"
            value={formData.phone}
            onChange={handleChange}
            required
          />

          <Input
            label={`${t.common.email}`}
            name="email"
            type="email"
            placeholder="ali@example.com"
            value={formData.email}
            onChange={handleChange}
          />

          <Input
            label={t.auth.password}
            name="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <Input
            label={t.auth.confirmPassword}
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />

          <Button type="submit" variant="primary" size="lg" isLoading={loading} className="w-full rounded-2xl mt-4">
            {t.nav.register} <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </form>

        <p className="text-xs text-center text-[#817781] pt-4 border-t border-[#EEE6E9]">
          {t.auth.alreadyHaveAccount}{' '}
          <Link href="/login" className="font-bold text-[#E85D8E] hover:underline">
            {t.nav.login}
          </Link>
        </p>
      </div>
    </div>
  );
}
