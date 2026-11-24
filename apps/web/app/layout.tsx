import './globals.css';
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { I18nProvider } from '@/lib/i18n';
import { AuthProvider } from '@/lib/auth-context';
import { CartProvider } from '@/lib/cart-context';
import { TelegramProvider } from '@/components/telegram/telegram-provider';
import { TelegramNavBar } from '@/components/telegram/telegram-nav-bar';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export const metadata: Metadata = {
  title: 'Sweet CANDY — Homemade Sweets Made With Love',
  description:
    'Sweet CANDY — a multi-vendor marketplace connecting passionate home confectioners, cake designers, and dessert artisans with sweet lovers.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#FAF8F6',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz">
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="min-h-[100dvh] flex flex-col font-sans bg-[#FAF8F6] text-[#29252A] antialiased overflow-x-hidden selection:bg-[#FFF0F5] selection:text-[#E85D8E]">
        <I18nProvider>
          <AuthProvider>
            <CartProvider>
              <TelegramProvider>
                <Header />
                <main className="flex-1 w-full min-w-0 pb-16 lg:pb-0">{children}</main>
                <Footer />
                <TelegramNavBar />
              </TelegramProvider>
            </CartProvider>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
