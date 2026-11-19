'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { uz } from './translations/uz';
import { ru } from './translations/ru';
import { en } from './translations/en';

export type Language = 'uz' | 'ru' | 'en';

export interface LanguageOption {
  code: Language;
  name: string;
  flag: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'uz', name: "O'zbekcha", flag: '🇺🇿' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
];

const translations = { uz, ru, en };

type TranslationType = typeof uz;

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: TranslationType;
  languages: LanguageOption[];
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>('uz');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sweetmarket_lang') as Language;
    if (saved && (saved === 'uz' || saved === 'ru' || saved === 'en')) {
      setLangState(saved);
      document.documentElement.lang = saved;
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sweetmarket_lang' && e.newValue) {
        const newL = e.newValue as Language;
        if (newL === 'uz' || newL === 'ru' || newL === 'en') {
          setLangState(newL);
          document.documentElement.lang = newL;
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    setMounted(true);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sweetmarket_lang', newLang);
      document.cookie = `sweetmarket_lang=${newLang}; path=/; max-age=31536000; SameSite=Lax`;
      document.documentElement.lang = newLang;
      // Dispatch custom event for any in-window listeners
      window.dispatchEvent(new Event('sweetmarket_lang_change'));
    }
  };

  const currentTranslations = translations[lang] || translations.uz;

  return (
    <I18nContext.Provider
      value={{
        lang,
        setLang,
        t: currentTranslations,
        languages: LANGUAGES,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}

