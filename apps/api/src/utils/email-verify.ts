import { promises as dns } from 'dns';

export interface EmailVerificationResult {
  normalized: string;
  validFormat: boolean;
  domainValid: boolean;
  dnsChecked: boolean;
  suggestion?: string;
  reason?:
    | 'EMPTY'
    | 'INVALID_FORMAT'
    | 'TYPO_DOMAIN'
    | 'DOMAIN_NOT_FOUND'
    | 'NO_MAIL_SERVER'
    | 'OK';
}

const DOMAIN_TYPO_MAP: Record<string, string> = {
  'gmial.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'gmail.om': 'gmail.com',
  'gmail.uz': 'gmail.com',
  'gmail.ru': 'gmail.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yahoo.con': 'yahoo.com',
  'yhoo.com': 'yahoo.com',
  'hotmal.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'hotmail.con': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outlook.con': 'outlook.com',
  'yanex.ru': 'yandex.ru',
  'yandx.ru': 'yandex.ru',
  'yandex.con': 'yandex.ru',
  'mail.con': 'mail.ru',
  'iclod.com': 'icloud.com',
  'icloud.con': 'icloud.com',
  'icloud.co': 'icloud.com',
};

const BASIC_EMAIL_REGEX = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error('DNS_TIMEOUT')), ms);
    }),
  ]);
}

export async function verifyEmailAddress(
  rawEmail: string,
  options?: { skipDns?: boolean }
): Promise<EmailVerificationResult> {
  const normalized = rawEmail.trim().toLowerCase();

  if (!normalized) {
    return {
      normalized,
      validFormat: false,
      domainValid: false,
      dnsChecked: false,
      reason: 'EMPTY',
    };
  }

  const parts = normalized.split('@');
  if (
    parts.length !== 2 ||
    parts[0].length === 0 ||
    parts[0].length > 64 ||
    normalized.length > 254 ||
    !BASIC_EMAIL_REGEX.test(normalized)
  ) {
    return {
      normalized,
      validFormat: false,
      domainValid: false,
      dnsChecked: false,
      reason: 'INVALID_FORMAT',
    };
  }

  const [localPart, domain] = parts;
  const labels = domain.split('.');
  const tld = labels[labels.length - 1] || '';

  if (
    domain.length > 253 ||
    labels.some((l) => !l || l.startsWith('-') || l.endsWith('-')) ||
    tld.length < 2 ||
    /^\d+$/.test(tld)
  ) {
    return {
      normalized,
      validFormat: false,
      domainValid: false,
      dnsChecked: false,
      reason: 'INVALID_FORMAT',
    };
  }

  const typoFix = DOMAIN_TYPO_MAP[domain];
  if (typoFix) {
    return {
      normalized,
      validFormat: true,
      domainValid: false,
      dnsChecked: false,
      suggestion: `${localPart}@${typoFix}`,
      reason: 'TYPO_DOMAIN',
    };
  }

  if (options?.skipDns) {
    return {
      normalized,
      validFormat: true,
      domainValid: true,
      dnsChecked: false,
      reason: 'OK',
    };
  }

  try {
    const mxRecords = await withTimeout(dns.resolveMx(domain), 2500);
    if (Array.isArray(mxRecords) && mxRecords.length > 0 && mxRecords.some((r) => Boolean(r.exchange))) {
      return {
        normalized,
        validFormat: true,
        domainValid: true,
        dnsChecked: true,
        reason: 'OK',
      };
    }
  } catch (err: any) {
    const code = err?.code;
    if (code === 'ENOTFOUND') {
      return {
        normalized,
        validFormat: true,
        domainValid: false,
        dnsChecked: true,
        reason: 'DOMAIN_NOT_FOUND',
      };
    }

    if (code === 'ENODATA') {
      try {
        const aRecords = await withTimeout(dns.resolve4(domain), 2000);
        if (Array.isArray(aRecords) && aRecords.length > 0) {
          return {
            normalized,
            validFormat: true,
            domainValid: true,
            dnsChecked: true,
            reason: 'OK',
          };
        }
      } catch (aErr: any) {
        if (aErr?.code === 'ENOTFOUND' || aErr?.code === 'ENODATA') {
          return {
            normalized,
            validFormat: true,
            domainValid: false,
            dnsChecked: true,
            reason: 'NO_MAIL_SERVER',
          };
        }
      }
    }

    // Timeout / offline environment fallback: keep format valid without hard blocking
    return {
      normalized,
      validFormat: true,
      domainValid: true,
      dnsChecked: false,
      reason: 'OK',
    };
  }

  return {
    normalized,
    validFormat: true,
    domainValid: false,
    dnsChecked: true,
    reason: 'NO_MAIL_SERVER',
  };
}

