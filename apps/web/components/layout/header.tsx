'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { useTranslation } from '@/lib/i18n';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Button } from '../ui/button';
import { BrandLogo } from '../ui/brand-logo';
import {
  ShoppingBag,
  Heart,
  Menu,
  X,
  LogOut,
  Store,
  ShieldAlert,
  ChevronDown,
} from 'lucide-react';

export const Header: React.FC = () => {
  const { user, isAuthenticated, isSeller, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;

      window.requestAnimationFrame(() => {
        const currentY = Math.max(window.scrollY || window.pageYOffset || 0, 0);
        setIsScrolled(currentY > 10);

        if (mobileMenuOpen || userDropdownOpen) {
          setIsVisible(true);
        } else if (currentY <= 40) {
          setIsVisible(true);
        } else if (currentY > lastScrollY.current + 6 && currentY > 72) {
          // Scrolling down -> hide navbar smoothly
          setIsVisible(false);
        } else if (currentY < lastScrollY.current - 6) {
          // Scrolling up -> show navbar smoothly
          setIsVisible(true);
        }

        lastScrollY.current = currentY;
        ticking = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mobileMenuOpen, userDropdownOpen]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#EEE6E9] pt-[env(safe-area-inset-top)] transition-transform duration-300 ease-in-out will-change-transform ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        } ${isScrolled ? 'shadow-soft' : ''}`}
      >
      <div className="max-w-7xl 3xl:max-w-[1440px] mx-auto px-2.5 xs:px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 h-14 xs:h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="group min-w-0 flex-shrink-0 hover:opacity-95 transition-opacity">
            <BrandLogo size="md" tagline={t.common.tagline} />
          </Link>

          {/* Desktop Navigation (Laptops, MacBooks, iPad Pro Landscape) */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-8">
            <Link
              href="/"
              className="text-sm font-semibold text-[#29252A] hover:text-[#E85D8E] transition-colors whitespace-nowrap"
            >
              {t.nav.home}
            </Link>
            <Link
              href="/explore"
              className="text-sm font-semibold text-[#29252A] hover:text-[#E85D8E] transition-colors whitespace-nowrap"
            >
              {t.nav.explore}
            </Link>
            <Link
              href="/categories"
              className="text-sm font-semibold text-[#29252A] hover:text-[#E85D8E] transition-colors whitespace-nowrap"
            >
              {t.nav.categories}
            </Link>
            <Link
              href="/sellers"
              className="text-sm font-semibold text-[#29252A] hover:text-[#E85D8E] transition-colors whitespace-nowrap"
            >
              {t.nav.bakeries}
            </Link>
          </nav>

          {/* Action CTAs & Auth */}
          <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3 flex-shrink-0">
            {/* Language Switcher (shown on 360px+ phones, tablets & desktop; also inside watch/mobile drawer) */}
            <div className="hidden xs:block">
              <LanguageSwitcher variant="header" />
            </div>

            {/* Cart Icon */}
            <Link
              href="/cart"
              className="relative p-2 xs:p-2.5 rounded-xl text-[#29252A] hover:bg-[#FFF0F5] hover:text-[#E85D8E] transition-colors"
              title={t.nav.cart}
              aria-label={t.nav.cart}
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#E85D8E] text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Authenticated user menu (360px+ & Desktop) */}
            {isAuthenticated ? (
              <div className="relative hidden xs:block" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-[#EEE6E9] hover:border-[#E85D8E] bg-[#FAF8F6] transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#E85D8E] text-white flex items-center justify-center text-xs font-bold uppercase flex-shrink-0">
                    {user?.firstName?.[0] || 'U'}
                  </div>
                  <span className="text-sm font-semibold text-[#29252A] hidden md:inline max-w-[100px] truncate">
                    {user?.firstName}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#817781]" />
                </button>

                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-1rem)] bg-white rounded-2xl shadow-xl border border-[#EEE6E9] py-2 z-50"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-[#EEE6E9]">
                      <p className="text-xs text-[#817781]">{t.nav.signedInAs}</p>
                      <p className="text-sm font-bold text-[#29252A] truncate">
                        {user?.phone || user?.email}
                      </p>
                      <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FFF0F5] text-[#E85D8E]">
                        {user?.role}
                      </span>
                    </div>

                    {isSeller && (
                      <>
                        <Link
                          href="/seller/dashboard"
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-[#29252A] hover:bg-[#FFF0F5] hover:text-[#E85D8E]"
                        >
                          <Store className="w-4 h-4" /> {t.nav.sellerDashboard}
                        </Link>
                        <Link
                          href="/seller/orders"
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-[#29252A] hover:bg-[#FFF0F5] hover:text-[#E85D8E]"
                        >
                          {t.nav.incomingOrders}
                        </Link>
                        <Link
                          href="/seller/products"
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-[#29252A] hover:bg-[#FFF0F5] hover:text-[#E85D8E]"
                        >
                          {t.nav.myDesserts}
                        </Link>
                      </>
                    )}

                    {isAdmin && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-[#C83F72] font-semibold hover:bg-[#FFF0F5]"
                      >
                        <ShieldAlert className="w-4 h-4" /> {t.nav.adminPanel}
                      </Link>
                    )}

                    {!isSeller && !isAdmin && (
                      <>
                        <Link
                          href="/account/orders"
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-[#29252A] hover:bg-[#FFF0F5] hover:text-[#E85D8E]"
                        >
                          <ShoppingBag className="w-4 h-4" /> {t.nav.myOrders}
                        </Link>
                        <Link
                          href="/account/favorites"
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-[#29252A] hover:bg-[#FFF0F5] hover:text-[#E85D8E]"
                        >
                          <Heart className="w-4 h-4" /> {t.nav.favorites}
                        </Link>
                      </>
                    )}

                    <div className="border-t border-[#EEE6E9] my-1" />
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-[#DC5151] hover:bg-rose-50"
                    >
                      <LogOut className="w-4 h-4" /> {t.nav.logout}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-2 xl:gap-3">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="whitespace-nowrap">
                    {t.nav.login}
                  </Button>
                </Link>
                <Link href="/register/seller">
                  <Button variant="outline" size="sm" className="border-[#E85D8E] text-[#E85D8E] whitespace-nowrap">
                    {t.nav.openStore}
                  </Button>
                </Link>
                <Link href="/register/customer">
                  <Button variant="primary" size="sm" className="whitespace-nowrap">
                    {t.nav.register}
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile & Tablet hamburger button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 lg:hidden text-[#29252A] hover:bg-[#FFF0F5] rounded-xl transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 xs:w-6 xs:h-6" /> : <Menu className="w-5 h-5 xs:w-6 xs:h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile / Tablet / Smartwatch Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#EEE6E9] bg-white px-3 xs:px-4 sm:px-6 py-4 xs:py-5 space-y-4 max-h-[calc(100dvh-3.5rem)] overflow-y-auto shadow-lg">
          {/* Language Switcher */}
          <div className="pb-1">
            <LanguageSwitcher variant="mobile" />
          </div>

          <nav className="flex flex-col gap-1">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm xs:text-base font-semibold text-[#29252A] hover:text-[#E85D8E] hover:bg-[#FFF0F5] px-3 py-2.5 rounded-xl transition-colors"
            >
              {t.nav.home}
            </Link>
            <Link
              href="/explore"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm xs:text-base font-semibold text-[#29252A] hover:text-[#E85D8E] hover:bg-[#FFF0F5] px-3 py-2.5 rounded-xl transition-colors"
            >
              {t.nav.explore}
            </Link>
            <Link
              href="/categories"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm xs:text-base font-semibold text-[#29252A] hover:text-[#E85D8E] hover:bg-[#FFF0F5] px-3 py-2.5 rounded-xl transition-colors"
            >
              {t.nav.categories}
            </Link>
            <Link
              href="/sellers"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm xs:text-base font-semibold text-[#29252A] hover:text-[#E85D8E] hover:bg-[#FFF0F5] px-3 py-2.5 rounded-xl transition-colors"
            >
              {t.nav.bakeries}
            </Link>
          </nav>

          {/* Account shortcuts inside mobile/watch drawer */}
          {isAuthenticated ? (
            <div className="pt-3 border-t border-[#EEE6E9] space-y-1">
              <div className="px-3 py-1.5 text-xs text-[#817781]">
                <span className="font-bold text-[#29252A] block truncate">
                  {user?.firstName} {user?.lastName}
                </span>
                <span className="truncate block">{user?.phone || user?.email}</span>
              </div>

              {isSeller && (
                <>
                  <Link
                    href="/seller/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-[#E85D8E] bg-[#FFF0F5]"
                  >
                    <Store className="w-4 h-4" /> {t.nav.sellerDashboard}
                  </Link>
                  <Link
                    href="/seller/products"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-[#29252A] hover:bg-[#FAF8F6]"
                  >
                    {t.nav.myDesserts}
                  </Link>
                  <Link
                    href="/seller/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-[#29252A] hover:bg-[#FAF8F6]"
                  >
                    {t.nav.incomingOrders}
                  </Link>
                </>
              )}

              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-[#C83F72] bg-[#FFF0F5]"
                >
                  <ShieldAlert className="w-4 h-4" /> {t.nav.adminPanel}
                </Link>
              )}

              {!isSeller && !isAdmin && (
                <>
                  <Link
                    href="/account/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-[#29252A] hover:bg-[#FAF8F6]"
                  >
                    <ShoppingBag className="w-4 h-4" /> {t.nav.myOrders}
                  </Link>
                  <Link
                    href="/account/favorites"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-[#29252A] hover:bg-[#FAF8F6]"
                  >
                    <Heart className="w-4 h-4" /> {t.nav.favorites}
                  </Link>
                </>
              )}

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-[#DC5151] hover:bg-rose-50"
              >
                <LogOut className="w-4 h-4" /> {t.nav.logout}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 pt-3 border-t border-[#EEE6E9]">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full rounded-xl">
                  {t.nav.login}
                </Button>
              </Link>
              <Link href="/register/seller" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="secondary" className="w-full rounded-xl">
                  {t.nav.openStore}
                </Button>
              </Link>
              <Link href="/register/customer" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" className="w-full rounded-xl">
                  {t.nav.register}
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
      </header>
      <div className="h-14 xs:h-16 lg:h-20 flex-shrink-0" aria-hidden="true" />
    </>
  );
};
