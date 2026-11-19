'use client';

import React from 'react';
import Link from 'next/link';
import { Phone, Mail, MapPin, Heart } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { LanguageSwitcher } from './LanguageSwitcher';
import { BrandLogo } from '../ui/brand-logo';

export const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-white border-t border-[#EEE6E9] pt-10 sm:pt-14 lg:pt-16 pb-8 sm:pb-12 mt-12 sm:mt-20">
      <div className="max-w-7xl 3xl:max-w-[1440px] mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 mb-10 sm:mb-12">
          {/* Brand Info */}
          <div className="space-y-3 xs:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-block">
              <BrandLogo size="sm" />
            </Link>
            <p className="text-xs sm:text-sm text-[#817781] leading-relaxed">
              {t.footer.about}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-[#817781]">
              <span>Made with</span>
              <Heart className="w-3.5 h-3.5 text-[#E85D8E] fill-[#E85D8E] flex-shrink-0" />
              <span>for sweet lovers</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#29252A] mb-3 sm:mb-4">
              {t.footer.navigation}
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-[#817781]">
              <li>
                <Link href="/explore" className="hover:text-[#E85D8E] transition-colors">
                  {t.nav.explore}
                </Link>
              </li>
              <li>
                <Link href="/categories" className="hover:text-[#E85D8E] transition-colors">
                  {t.nav.categories}
                </Link>
              </li>
              <li>
                <Link href="/sellers" className="hover:text-[#E85D8E] transition-colors">
                  {t.nav.bakeries}
                </Link>
              </li>
            </ul>
          </div>

          {/* For Sellers */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#29252A] mb-3 sm:mb-4">
              {t.footer.forSellers}
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-[#817781]">
              <li>
                <Link href="/register/seller" className="hover:text-[#E85D8E] transition-colors font-medium text-[#E85D8E]">
                  {t.nav.openStore}
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-[#E85D8E] transition-colors">
                  {t.nav.login}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="xs:col-span-2 lg:col-span-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#29252A] mb-3 sm:mb-4">
              {t.footer.support}
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-[#817781]">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#E85D8E] flex-shrink-0" />
                <a href="tel:+998712000000" className="hover:text-[#E85D8E] break-all">
                  +998 (71) 200-00-00
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#E85D8E] flex-shrink-0" />
                <a href="mailto:support@sweetmarket.uz" className="hover:text-[#E85D8E] break-all">
                  support@sweetmarket.uz
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#E85D8E] flex-shrink-0" />
                <span>Tashkent, Uzbekistan</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 sm:pt-8 border-t border-[#EEE6E9] flex flex-col sm:flex-row items-center justify-between text-xs text-[#817781] gap-4 text-center sm:text-left">
          <p>© {new Date().getFullYear()} Sweet CANDY. {t.footer.allRightsReserved}</p>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-4 sm:gap-6">
            <Link href="/terms" className="hover:text-[#E85D8E]">{t.footer.terms}</Link>
            <Link href="/privacy" className="hover:text-[#E85D8E]">{t.footer.privacy}</Link>
            <LanguageSwitcher variant="header" />
          </div>
        </div>
      </div>
    </footer>
  );
};
