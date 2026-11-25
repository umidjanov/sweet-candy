'use client';

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Loader2, Mail, Sparkles } from 'lucide-react';
import { Input, InputProps } from './input';
import { apiClient } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

export interface EmailCheckResult {
  email: string;
  validFormat: boolean;
  domainValid: boolean;
  dnsChecked: boolean;
  exists: boolean;
  available: boolean;
  suggestion: string | null;
  reason: string;
}

export interface EmailValidationState {
  isChecking: boolean;
  isBlocking: boolean;
  result: EmailCheckResult | null;
}

const RECENT_EMAILS_KEY = 'sweetmarket_recent_emails';
const QUICK_DOMAINS = ['gmail.com', 'icloud.com', 'yandex.ru', 'mail.ru'];

export function saveRecentEmail(email?: string | null) {
  if (typeof window === 'undefined' || !email) return;
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes('@')) return;

  try {
    const raw = localStorage.getItem(RECENT_EMAILS_KEY);
    const parsed: string[] = raw ? JSON.parse(raw) : [];
    const next = [normalized, ...parsed.filter((item) => item !== normalized)].slice(0, 5);
    localStorage.setItem(RECENT_EMAILS_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage errors in restricted webviews
  }
}

function loadRecentEmails(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENT_EMAILS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string' && x.includes('@')) : [];
  } catch {
    return [];
  }
}

interface EmailFieldProps extends Omit<InputProps, 'onChange' | 'value'> {
  value: string;
  onValueChange: (value: string) => void;
  mode: 'register' | 'login';
  onValidationChange?: (state: EmailValidationState) => void;
}

export function EmailField({
  value,
  onValueChange,
  mode,
  onValidationChange,
  label,
  id,
  name = 'email',
  type = 'email',
  autoComplete,
  inputMode = 'email',
  placeholder,
  helperText,
  required,
  ...rest
}: EmailFieldProps) {
  const { lang } = useTranslation();
  const listId = useId();
  const [recentEmails, setRecentEmails] = useState<string[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<EmailCheckResult | null>(null);
  const [checkError, setCheckError] = useState(false);
  const requestSeqRef = useRef(0);

  useEffect(() => {
    setRecentEmails(loadRecentEmails());
  }, []);

  const trimmed = value.trim();
  const shouldVerifyEmail = mode === 'register' ? trimmed.length > 0 : trimmed.includes('@');

  useEffect(() => {
    const seq = ++requestSeqRef.current;

    if (!shouldVerifyEmail) {
      setIsChecking(false);
      setResult(null);
      setCheckError(false);
      onValidationChange?.({ isChecking: false, isBlocking: false, result: null });
      return;
    }

    setIsChecking(true);
    setCheckError(false);
    onValidationChange?.({ isChecking: true, isBlocking: false, result: null });

    const timer = setTimeout(async () => {
      try {
        const res = await apiClient<EmailCheckResult>(
          `/auth/check-email?email=${encodeURIComponent(trimmed)}`
        );
        if (seq !== requestSeqRef.current) return;

        setResult(res);
        setIsChecking(false);

        const blocking =
          !res.validFormat ||
          !res.domainValid ||
          (mode === 'register' && res.exists);

        onValidationChange?.({
          isChecking: false,
          isBlocking: blocking,
          result: res,
        });
      } catch {
        if (seq !== requestSeqRef.current) return;
        setIsChecking(false);
        setResult(null);
        setCheckError(true);
        onValidationChange?.({ isChecking: false, isBlocking: false, result: null });
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [trimmed, mode, shouldVerifyEmail]);

  const localPrefix = useMemo(() => {
    if (!trimmed || trimmed.includes('@') || /[\s+]/.test(trimmed)) return '';
    if (!/^[a-z0-9._-]+$/i.test(trimmed)) return '';
    return trimmed.toLowerCase();
  }, [trimmed]);

  const copy = {
    uz: {
      autofillHint: 'Google/Chrome hisobingizdagi emailni bosib tanlang yoki boshqa email kiriting',
      savedLabel: 'Saqlangan emaillar:',
      checking: 'Email tekshirilmoqda...',
      invalidFormat: "Email formati noto'g'ri (masalan: ali@gmail.com)",
      typoSuggestion: (s: string) => `Domen xato ko'rinadi. Balki ${s} dir?`,
      applyFix: 'To‘g‘rilash',
      badDomain: 'Email domeni mavjud emas yoki pochta serveri topilmadi',
      alreadyExists: "Bu email bilan akkaunt allaqachon ro'yxatdan o'tgan",
      verifiedAvailable: 'Email manzil tasdiqlandi va foydalanishga tayyor',
      foundInSystem: 'Email tizimda topildi',
      notRegisteredYet: 'Bu email bazada topilmadi',
    },
    ru: {
      autofillHint: 'Нажмите, чтобы выбрать email из Google/Chrome, или введите другой email',
      savedLabel: 'Сохранённые email:',
      checking: 'Проверка email...',
      invalidFormat: 'Неверный формат email (например: ali@gmail.com)',
      typoSuggestion: (s: string) => `Похоже на опечатку в домене. Возможно, ${s}?`,
      applyFix: 'Исправить',
      badDomain: 'Домен не существует или почтовый сервер не найден',
      alreadyExists: 'Этот email уже зарегистрирован',
      verifiedAvailable: 'Email проверен и доступен',
      foundInSystem: 'Email найден в системе',
      notRegisteredYet: 'Этот email не найден в базе',
    },
    en: {
      autofillHint: 'Tap to pick an email linked to your Google/Chrome account or type another',
      savedLabel: 'Saved emails:',
      checking: 'Verifying email...',
      invalidFormat: 'Invalid email format (example: ali@gmail.com)',
      typoSuggestion: (s: string) => `Domain looks misspelled. Did you mean ${s}?`,
      applyFix: 'Use this',
      badDomain: 'Email domain does not exist or has no mail server',
      alreadyExists: 'An account with this email already exists',
      verifiedAvailable: 'Email verified and available',
      foundInSystem: 'Email found in system',
      notRegisteredYet: 'No account found with this email',
    },
  }[lang];

  const errorBorderMsg =
    result && shouldVerifyEmail
      ? !result.validFormat
        ? copy.invalidFormat
        : !result.domainValid && !result.suggestion
          ? copy.badDomain
          : mode === 'register' && result.exists
            ? copy.alreadyExists
            : undefined
      : undefined;

  return (
    <div className="space-y-1.5">
      <Input
        id={id || 'email'}
        name={name}
        type={type}
        autoComplete={autoComplete || (mode === 'login' ? 'username email' : 'email')}
        inputMode={inputMode}
        list={recentEmails.length > 0 ? listId : undefined}
        label={label}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        required={required}
        error={errorBorderMsg}
        {...rest}
      />

      {recentEmails.length > 0 && (
        <datalist id={listId}>
          {recentEmails.map((em) => (
            <option key={em} value={em} />
          ))}
        </datalist>
      )}

      {/* Quick Chrome/saved email picker pills */}
      {recentEmails.length > 0 && trimmed === '' && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[11px] text-[#817781] inline-flex items-center gap-1">
            <Mail className="w-3 h-3 text-[#E85D8E]" />
            {copy.savedLabel}
          </span>
          {recentEmails.map((em) => (
            <button
              key={em}
              type="button"
              onClick={() => onValueChange(em)}
              className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFF0F5] text-[#C84473] border border-[#F5D6DF] hover:bg-[#FFE3EE] transition-colors"
            >
              {em}
            </button>
          ))}
        </div>
      )}

      {/* One-tap domain autocomplete suggestions while typing username before '@' */}
      {localPrefix && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {QUICK_DOMAINS.map((domain) => {
            const candidate = `${localPrefix}@${domain}`;
            return (
              <button
                key={domain}
                type="button"
                onClick={() => onValueChange(candidate)}
                className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FAF8F6] text-[#29252A] border border-[#EEE6E9] hover:border-[#E85D8E] hover:text-[#E85D8E] transition-colors inline-flex items-center gap-1"
              >
                <Sparkles className="w-2.5 h-2.5 text-[#D99A52]" />
                {candidate}
              </button>
            );
          })}
        </div>
      )}

      {/* Live email verification feedback */}
      {shouldVerifyEmail ? (
        isChecking ? (
          <p className="text-xs text-[#817781] flex items-center gap-1.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E85D8E]" />
            <span>{copy.checking}</span>
          </p>
        ) : result ? (
          !result.validFormat || !result.domainValid ? (
            result.suggestion ? (
              <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <span>{copy.typoSuggestion(result.suggestion)}</span>
                </span>
                <button
                  type="button"
                  onClick={() => onValueChange(result.suggestion!)}
                  className="px-2.5 py-1 rounded-lg bg-amber-600 text-white text-[11px] font-bold hover:bg-amber-700 transition-colors flex-shrink-0"
                >
                  {copy.applyFix}
                </button>
              </div>
            ) : !errorBorderMsg ? (
              <p className="text-xs text-[#DC5151] flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{copy.badDomain}</span>
              </p>
            ) : null
          ) : mode === 'register' && result.exists ? null : mode === 'register' && result.available ? (
            <p className="text-xs text-emerald-700 flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>{copy.verifiedAvailable}</span>
            </p>
          ) : mode === 'login' && result.exists ? (
            <p className="text-xs text-emerald-700 flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>{copy.foundInSystem}</span>
            </p>
          ) : mode === 'login' && !result.exists ? (
            <p className="text-xs text-amber-700 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <span>{copy.notRegisteredYet}</span>
            </p>
          ) : null
        ) : checkError ? null : null
      ) : (
        <p className="text-[11px] text-[#817781]">{helperText || copy.autofillHint}</p>
      )}
    </div>
  );
}

