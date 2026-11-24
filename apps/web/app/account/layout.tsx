'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { CustomerSidebar } from '@/components/layout/customer-sidebar';
import { User, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-8 text-sm text-[#817781]">
        Yuklanmoqda...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-[#FFF0F5] text-[#E85D8E] flex items-center justify-center mx-auto mb-2">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-[#29252A]">Kabinetga kirish talab etiladi</h2>
        <p className="text-sm text-[#817781]">
          Buyurtmalaringiz, sevimli shirinliklaringiz va profil sozlamalarini ko'rish uchun profilingizga kiring.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Link href="/login">
            <Button variant="primary">
              <LogIn className="w-4 h-4 mr-2" /> Tizimga kirish
            </Button>
          </Link>
          <Link href="/register/customer">
            <Button variant="outline">Ro‘yxatdan o‘tish</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100dvh-4rem)] w-full pb-16 lg:pb-0">
      <CustomerSidebar />
      <div className="flex-1 min-w-0 w-full p-3 xs:p-4 sm:p-6 lg:p-8 xl:p-10 max-w-6xl mx-auto space-y-6">
        {children}
      </div>
    </div>
  );
}
