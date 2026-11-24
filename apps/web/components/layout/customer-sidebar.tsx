'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  ShoppingBag,
  Heart,
  User,
  Cake,
  Menu,
  X,
  ArrowLeft,
  ShoppingCart,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export const CustomerSidebar: React.FC = () => {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const navItems = [
    { label: t.nav.myOrders, href: '/account/orders', icon: ShoppingBag },
    { label: t.nav.favorites, href: '/account/favorites', icon: Heart },
    { label: t.nav.profile, href: '/account/profile', icon: User },
    { label: t.nav.cart, href: '/cart', icon: ShoppingCart },
    { label: t.nav.explore, href: '/explore', icon: Cake },
  ];

  const activeItem = navItems.find((item) => pathname === item.href || (item.href !== '/explore' && item.href !== '/cart' && pathname.startsWith(item.href))) || navItems[0];

  return (
    <>
      {/* Mobile Top Bar + Scrollable Pills */}
      <div className="lg:hidden bg-white border-b border-[#EEE6E9] w-full">
        <div className="px-3 xs:px-4 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <ShoppingBag className="w-4 h-4 text-[#E85D8E] flex-shrink-0" />
            <span className="text-xs xs:text-sm font-bold text-[#29252A] truncate">
              {activeItem.label}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[#EEE6E9] text-xs font-bold text-[#29252A] hover:bg-[#FFF0F5] flex-shrink-0"
          >
            {mobileNavOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            <span className="hidden xs:inline">Menyu</span>
          </button>
        </div>

        {/* Horizontal Quick Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto px-3 xs:px-4 pb-2.5 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== '/explore' && item.href !== '/cart' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileNavOpen(false)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-colors border',
                  active
                    ? 'bg-[#FFF0F5] text-[#E85D8E] border-[#fce4ec]'
                    : 'bg-[#FAF8F6] text-[#29252A] border-[#EEE6E9] hover:bg-[#FFF0F5]/60'
                )}
              >
                <Icon className={cn('w-3.5 h-3.5', active ? 'text-[#E85D8E]' : 'text-[#817781]')} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Expanded Drawer on Mobile */}
        {mobileNavOpen && (
          <div className="border-t border-[#EEE6E9] bg-white px-3 xs:px-4 py-3 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || (item.href !== '/explore' && item.href !== '/cart' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileNavOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors',
                    active
                      ? 'bg-[#FFF0F5] text-[#E85D8E]'
                      : 'text-[#29252A] hover:bg-[#FAF8F6]'
                  )}
                >
                  <Icon className={cn('w-4 h-4', active ? 'text-[#E85D8E]' : 'text-[#817781]')} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-[#EEE6E9] min-h-[calc(100dvh-5rem)] p-4 flex-shrink-0">
        <div className="mb-6 px-3">
          <h2 className="text-xs uppercase font-bold text-[#817781] tracking-wider">
            {t.nav.profile}
          </h2>
          <p className="text-base font-bold text-[#29252A] mt-0.5">Xaridor kabineti</p>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== '/explore' && item.href !== '/cart' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold transition-all',
                  active
                    ? 'bg-[#FFF0F5] text-[#E85D8E] shadow-2xs font-bold'
                    : 'text-[#29252A] hover:bg-[#FAF8F6] hover:text-[#E85D8E]'
                )}
              >
                <Icon className={cn('w-4 h-4', active ? 'text-[#E85D8E]' : 'text-[#817781]')} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="pt-4 border-t border-[#EEE6E9]">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[#817781] hover:text-[#29252A] hover:bg-[#FAF8F6] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t.nav.home}</span>
          </Link>
        </div>
      </aside>
    </>
  );
};
