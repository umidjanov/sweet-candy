'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { TelegramUser, TelegramWebApp } from '@/types/telegram';

interface TelegramContextType {
  isTelegramWebApp: boolean;
  telegramUser: TelegramUser | null;
  webApp: TelegramWebApp | null;
  triggerHaptic: (type?: 'light' | 'medium' | 'heavy') => void;
}

const TelegramContext = createContext<TelegramContextType>({
  isTelegramWebApp: false,
  telegramUser: null,
  webApp: null,
  triggerHaptic: () => {},
});

export const useTelegram = () => useContext(TelegramContext);

export const TelegramProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [isTelegramWebApp, setIsTelegramWebApp] = useState(false);
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if Telegram WebApp script has loaded
    const tg = window.Telegram?.WebApp;
    if (tg && tg.initData !== undefined) {
      // Confirmed running inside Telegram
      setIsTelegramWebApp(true);
      setWebApp(tg);

      // Tell Telegram client app is ready and expand to full viewport
      try {
        tg.ready();
        tg.expand();
        tg.setHeaderColor('#FAF8F6');
        tg.setBackgroundColor('#FAF8F6');
      } catch (e) {
        console.warn('Telegram WebApp init warning:', e);
      }

      if (tg.initDataUnsafe?.user) {
        setTelegramUser(tg.initDataUnsafe.user);
      }
    }
  }, []);

  // Sync Telegram BackButton with Next.js navigation
  useEffect(() => {
    if (!webApp) return;

    try {
      if (pathname !== '/' && pathname !== '') {
        webApp.BackButton.show();
        const handleBack = () => router.back();
        webApp.BackButton.onClick(handleBack);

        return () => {
          webApp.BackButton.offClick(handleBack);
        };
      } else {
        webApp.BackButton.hide();
      }
    } catch (e) {
      console.warn('Telegram BackButton warning:', e);
    }
  }, [webApp, pathname, router]);

  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    try {
      if (webApp?.HapticFeedback) {
        webApp.HapticFeedback.impactOccurred(type);
      }
    } catch (e) {
      // Ignored outside Telegram
    }
  };

  return (
    <TelegramContext.Provider
      value={{
        isTelegramWebApp,
        telegramUser,
        webApp,
        triggerHaptic,
      }}
    >
      {children}
    </TelegramContext.Provider>
  );
};
