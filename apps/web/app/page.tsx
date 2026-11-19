'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  ArrowRight,
  Sparkles,
  Heart,
  ShieldCheck,
  Clock,
  Send,
  Star,
  Cake,
  CheckCircle2,
  ChevronRight,
  Store,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product/product-card';
import { apiClient } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

export default function HomePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);

  useEffect(() => {
    // Fetch featured data
    apiClient('/products/featured')
      .then((data) => setFeaturedProducts(data || []))
      .catch(() => {});

    apiClient('/categories')
      .then((data) => setCategories(data || []))
      .catch(() => {});

    apiClient('/sellers')
      .then((data) => setSellers((data || []).slice(0, 4)))
      .catch(() => {});
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/explore');
    }
  };

  const defaultCategories = [
    {
      name: 'Cakes',
      slug: 'cakes',
      desc: 'Birthday, Wedding & Custom Cakes',
      img: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Macarons & Sweets',
      slug: 'sweets',
      desc: 'French Macarons, Cookies & Cupcakes',
      img: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Desserts & Puddings',
      slug: 'desserts',
      desc: 'Tiramisu, Cheesecakes & Gelato',
      img: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Traditional Sweets',
      slug: 'traditional-sweets',
      desc: 'Baklava, Chak-Chak & Delights',
      img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
    },
  ];

  const popularCats = categories.length > 0 ? categories.slice(0, 4) : defaultCategories;

  return (
    <div className="space-y-12 xs:space-y-16 sm:space-y-20 lg:space-y-24 pb-10 sm:pb-16">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#FFF0F5]/60 via-[#FFF8EF]/40 to-transparent py-10 xs:py-14 sm:py-20 lg:py-28">
        <div className="max-w-7xl 3xl:max-w-[1440px] mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-4 xs:space-y-5 sm:space-y-6">
            {/* Sweet CANDY Logo Emblem */}
            <div className="w-24 h-24 xs:w-28 xs:h-28 sm:w-32 sm:h-32 mx-auto rounded-3xl bg-white/90 border border-[#F5D6DF] shadow-soft p-2 flex items-center justify-center">
              <img
                src="/logo-sweet-candy.jpg"
                alt="Sweet CANDY"
                className="w-full h-full object-contain rounded-2xl mix-blend-multiply"
              />
            </div>

            {/* Pill */}
            <div className="inline-flex items-center gap-1.5 xs:gap-2 px-3 xs:px-4 py-1.5 rounded-full bg-white border border-[#F5D6DF] shadow-soft text-[11px] xs:text-xs font-bold text-[#C85F7A] max-w-full">
              <Sparkles className="w-3.5 h-3.5 text-[#EA829C] flex-shrink-0" />
              <span className="truncate">{t.hero.badge}</span>
            </div>

            {/* Headline */}
            <h1 className="font-candy text-2xl xs:text-3xl sm:text-5xl lg:text-6xl font-black text-[#2D2528] tracking-tight leading-[1.12]">
              {t.hero.title}
            </h1>

            {/* Subtitle */}
            <p className="text-xs xs:text-sm sm:text-base lg:text-lg text-[#817781] leading-relaxed max-w-2xl mx-auto">
              {t.hero.subtitle}
            </p>

            {/* Search Bar */}
            <form
              onSubmit={handleSearchSubmit}
              className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center gap-2 p-2 bg-white rounded-2xl sm:rounded-3xl border border-[#EEE6E9] shadow-card max-w-xl mx-auto"
            >
              <div className="flex items-center gap-2.5 w-full px-3 sm:px-4 py-1.5 sm:py-0 min-w-0">
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-[#817781] flex-shrink-0" />
                <input
                  type="text"
                  placeholder={t.common.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full min-w-0 text-sm text-[#29252A] placeholder-[#817781]/60 focus:outline-none bg-transparent"
                />
              </div>
              <Button type="submit" variant="primary" size="md" className="w-full sm:w-auto px-5 sm:px-6 whitespace-nowrap">
                {t.common.search}
              </Button>
            </form>

            {/* CTA Buttons */}
            <div className="flex flex-col xs:flex-row flex-wrap items-center justify-center gap-2.5 xs:gap-3 sm:gap-4 pt-2 sm:pt-4">
              <Link href="/explore" className="w-full xs:w-auto">
                <Button variant="primary" size="lg" className="w-full xs:w-auto rounded-2xl">
                  {t.hero.exploreBtn} <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
              <Link href="/register/seller" className="w-full xs:w-auto">
                <Button variant="secondary" size="lg" className="w-full xs:w-auto rounded-2xl">
                  {t.hero.becomeSellerBtn}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* POPULAR CATEGORIES */}
      <section className="max-w-7xl 3xl:max-w-[1440px] mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-10 gap-3 sm:gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#E85D8E]">
              {t.common.appName}
            </span>
            <h2 className="text-xl xs:text-2xl sm:text-3xl font-black text-[#29252A] mt-1">
              {t.homeSections.popularCategories}
            </h2>
          </div>
          <Link
            href="/categories"
            className="inline-flex items-center gap-1.5 text-xs xs:text-sm font-bold text-[#E85D8E] hover:text-[#C83F72]"
          >
            {t.common.viewAll} <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 xs:gap-4 sm:gap-6">
          {popularCats.map((cat: any) => (
            <Link
              key={cat.slug}
              href={`/categories/${cat.slug}`}
              className="group relative rounded-2xl sm:rounded-3xl overflow-hidden aspect-[4/3] xs:aspect-[4/5] bg-[#FFF8EF] border border-[#EEE6E9] shadow-soft hover:shadow-card transition-all"
            >
              <img
                src={cat.imageUrl || cat.img || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587'}
                alt={cat.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#29252A]/90 via-[#29252A]/30 to-transparent flex flex-col justify-end p-4 sm:p-6">
                <h3 className="text-base xs:text-lg sm:text-xl font-bold text-white group-hover:text-[#FFF0F5] transition-colors">
                  {cat.name}
                </h3>
                <p className="text-[11px] sm:text-xs text-white/80 mt-0.5 sm:mt-1 line-clamp-1">
                  {cat.description || cat.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED SWEETS CATALOG */}
      <section className="max-w-7xl 3xl:max-w-[1440px] mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-10 gap-3 sm:gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#E85D8E]">
              {t.hero.directFromBakers}
            </span>
            <h2 className="text-xl xs:text-2xl sm:text-3xl font-black text-[#29252A] mt-1">
              {t.nav.explore}
            </h2>
          </div>
          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 text-xs xs:text-sm font-bold text-[#E85D8E] hover:text-[#C83F72]"
          >
            {t.common.viewAll} <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {featuredProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="p-6 xs:p-8 sm:p-12 text-center bg-white rounded-2xl sm:rounded-3xl border border-[#EEE6E9] shadow-soft">
            <Cake className="w-10 h-10 sm:w-12 sm:h-12 text-[#E85D8E] mx-auto mb-3" />
            <h3 className="text-base sm:text-lg font-bold text-[#29252A]">{t.common.notFound}</h3>
            <p className="text-xs text-[#817781] mt-1 mb-5 sm:mb-6">
              Sweet CANDY has started clean with zero fake accounts. Registered bakers are baking fresh sweets!
            </p>
            <Link href="/register/seller">
              <Button variant="primary">{t.hero.becomeSellerBtn}</Button>
            </Link>
          </div>
        )}
      </section>

      {/* WHY CHOOSE SWEETMARKET */}
      <section className="max-w-7xl 3xl:max-w-[1440px] mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#E85D8E]">
              {t.homeSections.whyChooseTitle}
            </span>
            <h2 className="text-2xl xs:text-3xl sm:text-4xl font-black text-[#29252A] mt-2 mb-5 sm:mb-6 leading-tight">
              {t.homeSections.whyChooseSub}
            </h2>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#FFF0F5] text-[#E85D8E] flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#29252A]">{t.homeSections.feature1Title}</h4>
                  <p className="text-xs text-[#817781] mt-1 leading-relaxed">
                    {t.homeSections.feature1Desc}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#FFF8EF] text-[#D99A52] flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#29252A]">{t.homeSections.feature2Title}</h4>
                  <p className="text-xs text-[#817781] mt-1 leading-relaxed">
                    {t.homeSections.feature2Desc}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-pink-50 text-[#C83F72] flex items-center justify-center flex-shrink-0">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#29252A]">{t.homeSections.feature3Title}</h4>
                  <p className="text-xs text-[#817781] mt-1 leading-relaxed">
                    {t.homeSections.feature3Desc}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative rounded-3xl overflow-hidden shadow-card border border-[#EEE6E9] aspect-[4/3]">
            <img
              src="https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=1000&q=80"
              alt="Artisan Baker"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* BECOME A SELLER CTA */}
      <section className="max-w-7xl 3xl:max-w-[1440px] mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#70452F] to-[#29252A] text-white p-5 xs:p-7 sm:p-12 lg:p-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 sm:gap-8 shadow-xl">
          <div className="max-w-xl space-y-3 sm:space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#D99A52]">
              {t.hero.becomeSellerBtn}
            </span>
            <h2 className="text-xl xs:text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              {t.homeSections.sellerBannerTitle}
            </h2>
            <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
              {t.homeSections.sellerBannerText}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Link href="/register/seller" className="w-full sm:w-auto">
              <Button variant="caramel" size="lg" className="w-full rounded-2xl">
                {t.homeSections.sellerBannerBtn}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="max-w-4xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-[#E85D8E]">
            Got Questions?
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#29252A] mt-1">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-[#EEE6E9] shadow-soft">
            <h4 className="font-bold text-sm sm:text-base text-[#29252A] mb-2">
              Can I contact the seller directly before or after placing an order?
            </h4>
            <p className="text-xs sm:text-sm text-[#817781] leading-relaxed">
              Yes! Every approved seller has their public contact phone number displayed on product details, allowing you to call directly with questions about custom decoration or allergy requirements.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-[#EEE6E9] shadow-soft">
            <h4 className="font-bold text-sm sm:text-base text-[#29252A] mb-2">
              How does Telegram integration work for sellers?
            </h4>
            <p className="text-xs sm:text-sm text-[#817781] leading-relaxed">
              Sellers connect their Telegram bot in one click using a secure connection link in their Seller Dashboard. Once connected, every new order sends an instant notification with full order details directly to their phone.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-[#EEE6E9] shadow-soft">
            <h4 className="font-bold text-sm sm:text-base text-[#29252A] mb-2">
              What happens if my cart contains sweets from different bakers?
            </h4>
            <p className="text-xs sm:text-sm text-[#817781] leading-relaxed">
              Sweet CANDY automatically isolates and splits orders by vendor during checkout. Each seller receives and fulfills only their own cakes and desserts, with separate status tracking.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
