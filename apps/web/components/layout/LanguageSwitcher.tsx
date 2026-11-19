'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation, Language, LANGUAGES } from '@/lib/i18n';
import { Globe, ChevronDown, Check } from 'lucide-react';

interface LanguageSwitcherProps {
  variant?: 'header' | 'footer' | 'mobile';
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'header',
  className = '',
}) => {
  const { lang, setLang } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code: Language) => {
    setLang(code);
    setIsOpen(false);
  };

  if (variant === 'mobile') {
    return (
      <div className={`flex items-center gap-2 p-1 bg-[#FFF0F5] rounded-2xl border border-[#EEE6E9] ${className}`}>
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            onClick={() => setLang(l.code)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              lang === l.code
                ? 'bg-white text-[#E85D8E] shadow-sm'
                : 'text-[#817781] hover:text-[#29252A]'
            }`}
          >
            <span>{l.flag}</span>
            <span>{l.code.toUpperCase()}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-[#29252A] hover:bg-[#FFF0F5] hover:text-[#E85D8E] border border-[#EEE6E9] bg-white transition-colors shadow-2xs"
        aria-label="Change language"
      >
        <span className="text-base leading-none">{currentLang.flag}</span>
        <span className="uppercase font-semibold tracking-wide">{currentLang.code}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-[#817781] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-[#EEE6E9] py-1.5 z-50 animate-in fade-in zoom-in-95">
          <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-[#817781] border-b border-[#EEE6E9]">
            Tilni tanlang / Язык / Language
          </div>
          {LANGUAGES.map((l) => {
            const isSelected = lang === l.code;
            return (
              <button
                key={l.code}
                onClick={() => handleSelect(l.code)}
                className={`w-full flex items-center justify-between px-3.5 py-2 text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-[#FFF0F5] text-[#E85D8E] font-bold'
                    : 'text-[#29252A] hover:bg-neutral-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base leading-none">{l.flag}</span>
                  <span>{l.name}</span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-[#E85D8E]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

