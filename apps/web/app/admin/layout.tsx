'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-8 text-sm text-[#817781]">
        Verifying administrator credentials...
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-[#C83F72] flex items-center justify-center mx-auto mb-2">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-[#29252A]">Restricted Administration Panel</h2>
        <p className="text-sm text-[#817781]">
          This area requires verified administrator authorization.
        </p>
        <Link href="/login">
          <Button variant="primary">Log in with Admin Account</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100dvh-4rem)] w-full">
      <AdminSidebar />
      <div className="flex-1 min-w-0 w-full p-3 xs:p-4 sm:p-6 lg:p-8 xl:p-10 max-w-7xl mx-auto space-y-6">
        {children}
      </div>
    </div>
  );
}
