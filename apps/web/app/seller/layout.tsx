'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { SellerSidebar } from '@/components/layout/seller-sidebar';
import { AlertCircle, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isSeller, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-8 text-sm text-[#817781]">
        Loading seller workspace...
      </div>
    );
  }

  if (!isAuthenticated || !isSeller) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-[#FFF8EF] text-[#D99A52] flex items-center justify-center mx-auto mb-2">
          <Store className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-[#29252A]">Seller Access Restricted</h2>
        <p className="text-sm text-[#817781]">
          You need an approved seller account to access the baker management dashboard.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Link href="/login">
            <Button variant="outline">Log in as Seller</Button>
          </Link>
          <Link href="/register/seller">
            <Button variant="primary">Register as Seller</Button>
          </Link>
        </div>
      </div>
    );
  }

  const approvalStatus = user?.sellerProfile?.approvalStatus;

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100dvh-4rem)] w-full">
      <SellerSidebar />
      <div className="flex-1 min-w-0 w-full p-3 xs:p-4 sm:p-6 lg:p-8 xl:p-10 max-w-7xl mx-auto space-y-6">
        {approvalStatus === 'PENDING' && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600" />
            <div>
              <p className="font-bold">Store Application Under Review</p>
              <p className="font-normal text-amber-800">
                Your bakery profile has been submitted and is awaiting administrator verification. You can add your desserts now; they will become publicly visible once approved.
              </p>
            </div>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
