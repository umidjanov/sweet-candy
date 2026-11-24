'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { useTelegram } from './telegram-provider';
import { useTranslation } from '@/lib/i18n';
import {
  Cake,
  LayoutGrid,
  ShoppingBag,
  PackageCheck,
  Store,
  ShieldCheck,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const TelegramNavBar: React.FC = () => {
  const pathname = usePathname();
  const { user, isAuthenticated, isSeller, isAdmin } = useAuth();
  const { itemCount } = useCart();
  const { triggerHaptic } = useTelegram();
  const { t } = useTranslation();

  // Determine role-based links
  const ordersHref = isSeller
    ? '/seller/orders'
    : isAdmin
    ? '/admin/orders'
    : '/account/orders';

  const dashboardHref = isSeller
    ? '/seller/dashboard'
    : isAdmin
    ? '/admin'
    : isAuthenticated
    ? '/account/profile'
    : '/login';

  const dashboardLabel = isSeller
    ? t.nav.sellerDashboard
    : isAdmin
    ? t.nav.adminPanel
    : isAuthenticated
    ? t.nav.profile
    : t.nav.login;

  const DashboardIcon = isSeller
    ? Store
    : isAdmin
    ? ShieldCheck
    : User;

  const navTabs = [
    {
      label: t.nav.home,
      href: '/',
      icon: Cake,
      active: pathname === '/' || pathname === '/explore',
    },
    {
      label: t.nav.categories,
      href: '/categories',
      icon: LayoutGrid,
      active: pathname.startsWith('/categories'),
    },
    {
      label: t.nav.cart,
      href: '/cart',
      icon: ShoppingBag,
      badge: itemCount > 0 ? itemCount : undefined,
      active: pathname === '/cart' || pathname === '/checkout',
    },
    {
      label: t.nav.myOrders,
      href: ordersHref,
      icon: PackageCheck,
      active:
        pathname.startsWith('/account/orders') ||
        pathname.startsWith('/seller/orders') ||
        pathname.startsWith('/admin/orders'),
    },
    {
      label: dashboardLabel,
      href: dashboardHref,
      icon: DashboardIcon,
      active:
        pathname.startsWith('/seller') ||
        pathname.startsWith('/admin') ||
        pathname.startsWith('/account/profile') ||
        pathname === '/login',
    },
  ];

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-[#EEE6E9] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom)]"
      aria-label="Mobile Navigation"
    >
      <div className="flex items-center justify-around h-14 xs:h-16 px-1 max-w-lg mx-auto">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              onClick={() => triggerHaptic('light')}
              className={cn(
                'flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all relative select-none rounded-2xl active:scale-95',
                tab.active
                  ? 'text-[#E85D8E] font-bold'
                  : 'text-[#817781] hover:text-[#29252A] font-medium'
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    'w-5 h-5 xs:w-5.5 xs:h-5.5 transition-transform duration-200',
                    tab.active && 'scale-110'
                  )}
                />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 bg-[#E85D8E] text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs animate-in zoom-in-75">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] xs:text-[11px] leading-tight mt-1 truncate max-w-[64px]">
                {tab.label}
              </span>
              {tab.active && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#E85D8E]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
