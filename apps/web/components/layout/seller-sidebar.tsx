'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Cake,
  PlusCircle,
  ShoppingBag,
  TrendingUp,
  Store,
  Send,
  Star,
  Settings,
  ArrowLeft,
  Menu,
  X,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { LanguageSwitcher } from './LanguageSwitcher';

export const SellerSidebar: React.FC = () => {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const navItems = [
    { label: t.dashboard.seller.title, href: '/seller/dashboard', icon: LayoutDashboard },
    { label: t.nav.myDesserts, href: '/seller/products', icon: Cake },
    { label: t.dashboard.seller.addNewProduct, href: '/seller/products/new', icon: PlusCircle },
    { label: t.dashboard.seller.totalOrders, href: '/seller/orders', icon: ShoppingBag },
    { label: t.dashboard.seller.analytics, href: '/seller/analytics', icon: TrendingUp },
    { label: t.dashboard.seller.storeProfile, href: '/seller/store', icon: Store },
    { label: t.dashboard.seller.telegramIntegration, href: '/seller/telegram', icon: Send },
    { label: t.dashboard.seller.reviews, href: '/seller/reviews', icon: Star },
    { label: t.dashboard.seller.storeSettings, href: '/seller/settings', icon: Settings },
  ];

  const isItemActive = (href: string) => {
    if (href === '/seller/dashboard') return pathname === href;
    if (href === '/seller/products') return pathname === '/seller/products' || pathname.endsWith('/edit');
    return pathname === href || pathname.startsWith(href + '/');
  };

  const activeItem = navItems.find((item) => isItemActive(item.href)) || navItems[0];

  return (
    <>
      {/* Mobile / Tablet / Smartwatch Top Bar + Scrollable Pills */}
      <div className="lg:hidden bg-white border-b border-[#EEE6E9] w-full">
        <div className="px-3 xs:px-4 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Store className="w-4 h-4 text-[#E85D8E] flex-shrink-0" />
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
            <span className="hidden xs:inline">{t.dashboard.seller.workspace}</span>
          </button>
        </div>

        {/* Horizontal Quick Navigation Pills (Swipeable on iPhone/Samsung/Poco/Watch) */}
        <div className="flex items-center gap-1.5 overflow-x-auto px-3 xs:px-4 pb-2.5 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item.href);
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

        {/* Expanded Vertical Menu Drawer on Mobile */}
        {mobileNavOpen && (
          <div className="border-t border-[#EEE6E9] bg-white px-3 xs:px-4 py-3 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item.href);
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
                  <Icon className={cn('w-4 h-4 flex-shrink-0', active ? 'text-[#E85D8E]' : 'text-[#817781]')} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
            <div className="pt-2 border-t border-[#EEE6E9] flex items-center justify-between gap-2">
              <Link
                href="/"
                onClick={() => setMobileNavOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[#817781] hover:text-[#29252A]"
              >
                <ArrowLeft className="w-4 h-4" /> {t.common.back}
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Desktop / MacBook Sticky Sidebar */}
      <aside className="hidden lg:flex w-64 xl:w-72 flex-shrink-0 bg-white border-r border-[#EEE6E9] sticky top-20 h-[calc(100vh-5rem)] p-4 flex-col justify-between overflow-y-auto">
        <div className="space-y-6">
          <div className="px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#817781]">
              {t.dashboard.seller.workspace}
            </p>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors',
                    active
                      ? 'bg-[#FFF0F5] text-[#E85D8E]'
                      : 'text-[#29252A] hover:bg-[#FAF8F6] hover:text-[#E85D8E]'
                  )}
                >
                  <Icon className={cn('w-4 h-4 flex-shrink-0', active ? 'text-[#E85D8E]' : 'text-[#817781]')} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-[#EEE6E9] space-y-3">
          <div className="px-1">
            <LanguageSwitcher variant="header" className="w-full" />
          </div>
          <Link
            href="/"
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#817781] hover:text-[#29252A] hover:bg-[#FAF8F6]"
          >
            <ArrowLeft className="w-4 h-4" /> {t.common.back}
          </Link>
        </div>
      </aside>
    </>
  );
};
