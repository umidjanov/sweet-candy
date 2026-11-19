'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Store,
  Cake,
  FolderTree,
  ShoppingBag,
  FileText,
  Settings,
  ArrowLeft,
  ShieldCheck,
  Menu,
  X,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { LanguageSwitcher } from './LanguageSwitcher';

export const AdminSidebar: React.FC = () => {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const navItems = [
    { label: t.dashboard.admin.title, href: '/admin', icon: LayoutDashboard },
    { label: t.dashboard.admin.usersCount, href: '/admin/users', icon: Users },
    { label: t.dashboard.admin.sellersCount, href: '/admin/sellers', icon: Store },
    { label: t.dashboard.admin.products, href: '/admin/products', icon: Cake },
    { label: t.dashboard.admin.categories, href: '/admin/categories', icon: FolderTree },
    { label: t.dashboard.admin.ordersCount, href: '/admin/orders', icon: ShoppingBag },
    { label: t.dashboard.admin.auditLogs, href: '/admin/audit-logs', icon: FileText },
    { label: t.dashboard.admin.settings, href: '/admin/settings', icon: Settings },
  ];

  const activeItem = navItems.find((item) => pathname === item.href) || navItems[0];

  return (
    <>
      {/* Mobile / Tablet / Smartwatch Top Bar + Scrollable Pills */}
      <div className="lg:hidden bg-white border-b border-[#EEE6E9] w-full">
        <div className="px-3 xs:px-4 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="w-4 h-4 text-[#C83F72] flex-shrink-0" />
            <span className="text-xs xs:text-sm font-bold text-[#29252A] truncate">
              {activeItem.label}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[#EEE6E9] text-xs font-bold text-[#C83F72] hover:bg-[#FFF0F5] flex-shrink-0"
          >
            {mobileNavOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            <span className="hidden xs:inline">Admin</span>
          </button>
        </div>

        {/* Horizontal Swipeable Admin Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto px-3 xs:px-4 pb-2.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileNavOpen(false)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-colors border',
                  isActive
                    ? 'bg-[#FFF0F5] text-[#C83F72] border-[#fce4ec]'
                    : 'bg-[#FAF8F6] text-[#29252A] border-[#EEE6E9] hover:bg-[#FFF0F5]/60'
                )}
              >
                <Icon className={cn('w-3.5 h-3.5', isActive ? 'text-[#C83F72]' : 'text-[#817781]')} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {mobileNavOpen && (
          <div className="border-t border-[#EEE6E9] bg-white px-3 xs:px-4 py-3 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileNavOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors',
                    isActive
                      ? 'bg-[#FFF0F5] text-[#C83F72]'
                      : 'text-[#29252A] hover:bg-[#FAF8F6]'
                  )}
                >
                  <Icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-[#C83F72]' : 'text-[#817781]')} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
            <div className="pt-2 border-t border-[#EEE6E9]">
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
          <div className="px-3 py-2 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#C83F72] flex-shrink-0" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#C83F72]">
              {t.dashboard.admin.controlPanel}
            </p>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors',
                    isActive
                      ? 'bg-[#FFF0F5] text-[#C83F72] border-r-2 border-[#C83F72]'
                      : 'text-[#29252A] hover:bg-[#FAF8F6] hover:text-[#C83F72]'
                  )}
                >
                  <Icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-[#C83F72]' : 'text-[#817781]')} />
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
