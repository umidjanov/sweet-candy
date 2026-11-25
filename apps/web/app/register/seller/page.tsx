'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Store, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { EmailField, EmailValidationState, saveRecentEmail } from '@/components/ui/email-field';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from '@/lib/i18n';

export default function SellerRegisterPage() {
  const router = useRouter();
  const { registerSeller } = useAuth();
  const { t, lang } = useTranslation();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    storeName: '',
    description: '',
    address: '',
    city: 'Tashkent',
    serviceArea: '',
    publicPhone: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailState, setEmailState] = useState<EmailValidationState>({
    isChecking: false,
    isBlocking: false,
    result: null,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.email.trim() && emailState.isBlocking) {
      setError(
        lang === 'ru'
          ? 'Пожалуйста, укажите корректный и свободный email адрес.'
          : lang === 'en'
            ? 'Please enter a valid, available email address.'
            : 'Iltimos, to‘g‘ri va bo‘sh email manzil kiriting.'
      );
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t.auth.passwordsDoNotMatch);
      return;
    }

    setLoading(true);
    try {
      await registerSeller(formData);
      if (formData.email.trim()) saveRecentEmail(formData.email);
      router.push('/seller/dashboard');
    } catch (err: any) {
      setError(err.message || 'Seller registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-[#EEE6E9] shadow-card p-8 sm:p-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF8EF] text-[#D99A52] flex items-center justify-center mx-auto mb-2">
            <Store className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-[#29252A]">{t.auth.sellerRegisterTitle}</h1>
          <p className="text-xs text-[#817781]">{t.auth.sellerChoiceDesc}</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#FAF8F6] border border-[#EEE6E9] space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#29252A]">
              {t.auth.sellerSection1}
            </h3>

            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
              <Input
                label={t.auth.firstName}
                name="firstName"
                autoComplete="given-name"
                placeholder="Malika"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
              <Input
                label={t.auth.lastName}
                name="lastName"
                autoComplete="family-name"
                placeholder="Alieva"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>

            <Input
              label={t.common.phone}
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+998 90 123 45 67"
              value={formData.phone}
              onChange={handleChange}
              required
            />

            <EmailField
              label={t.common.email}
              name="email"
              mode="register"
              placeholder="malika@gmail.com"
              value={formData.email}
              onValueChange={(val) => setFormData((prev) => ({ ...prev, email: val }))}
              onValidationChange={setEmailState}
            />
          </div>

          <div className="p-4 rounded-2xl bg-[#FFF8EF]/50 border border-[#fce4ec] space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#D99A52]">
              {t.auth.sellerSection2}
            </h3>

            <Input
              label={t.auth.storeName}
              name="storeName"
              placeholder="Sweet Petals Bakery"
              value={formData.storeName}
              onChange={handleChange}
              required
            />

            <Textarea
              label={t.auth.storeDescription}
              name="description"
              placeholder="Tortlar, pishiriqlar, shirinliklar..."
              value={formData.description}
              onChange={handleChange}
              rows={3}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#29252A] mb-1.5">
                  {t.auth.city}
                </label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white border border-[#EEE6E9] rounded-xl text-sm text-[#29252A] focus:outline-none focus:border-[#E85D8E]"
                >
                  <option value="Tashkent">Toshkent (Tashkent)</option>
                  <option value="Samarkand">Samarqand (Samarkand)</option>
                  <option value="Bukhara">Buxoro (Bukhara)</option>
                </select>
              </div>

              <Input
                label={t.auth.publicPhone}
                name="publicPhone"
                type="tel"
                placeholder="+998 90 765 43 21"
                value={formData.publicPhone}
                onChange={handleChange}
              />
            </div>

            <Input
              label={t.auth.storeAddress}
              name="address"
              placeholder="14 Mirobod ko'chasi, Toshkent"
              value={formData.address}
              onChange={handleChange}
              required
            />

            <Input
              label={t.auth.serviceArea}
              name="serviceArea"
              placeholder="Toshkent shahri va viloyati bo'ylab"
              value={formData.serviceArea}
              onChange={handleChange}
              required
            />
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF8F6] border border-[#EEE6E9] space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#29252A]">
              {t.auth.sellerSection3}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label={t.auth.password}
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <Input
                label={t.auth.confirmPassword}
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <Button type="submit" variant="caramel" size="lg" isLoading={loading} className="w-full rounded-2xl mt-4">
            {t.auth.submitSellerApplication} <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </form>

        <p className="text-xs text-center text-[#817781] pt-4 border-t border-[#EEE6E9]">
          {t.auth.alreadyHaveAccount}{' '}
          <Link href="/login" className="font-bold text-[#E85D8E] hover:underline">
            {t.auth.logInHere}
          </Link>
        </p>
      </div>
    </div>
  );
}
