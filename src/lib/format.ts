import type {CartItemInput} from '../../shared/catalog.ts';

const ZAR_FORMATTER = new Intl.NumberFormat('en-ZA', {
  style: 'currency',
  currency: 'ZAR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatZar(cents: number): string {
  return ZAR_FORMATTER.format(cents / 100);
}

export function sanitizeCardDigits(value: string): string {
  return value.replace(/\D/g, '').slice(0, 19);
}

export function formatCardNumberDisplay(value: string): string {
  const digits = sanitizeCardDigits(value);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

export function detectCardBrand(digits: string): 'Visa' | 'Mastercard' | 'Card' {
  if (/^4/.test(digits)) {
    return 'Visa';
  }
  if (/^(5[1-5]|2[2-7])/.test(digits)) {
    return 'Mastercard';
  }
  return 'Card';
}

export function passesLuhnCheck(digits: string): boolean {
  if (digits.length < 13 || digits.length > 19) {
    return false;
  }
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number(digits[i]);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

export function isValidCardExpiry(expiry: string): boolean {
  const match = /^(\d{2})\s*\/\s*(\d{2})$/.exec(expiry.trim());
  if (!match) {
    return false;
  }
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) {
    return false;
  }
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  return year > currentYear || (year === currentYear && month >= currentMonth);
}

export function createClientPaymentToken(last4: string): string {
  const randomBytes = new Uint8Array(12);
  crypto.getRandomValues(randomBytes);
  const hex = Array.from(randomBytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `tok_sa_${last4}_${hex}`;
}

const BAG_STORAGE_KEY = 'dtcorp_sa_bag_v1';

export function loadSavedBag(): CartItemInput[] {
  try {
    const raw = window.localStorage.getItem(BAG_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (item): item is CartItemInput =>
        Boolean(item) &&
        typeof item === 'object' &&
        typeof (item as CartItemInput).productId === 'string' &&
        typeof (item as CartItemInput).variantId === 'string' &&
        Number.isInteger((item as CartItemInput).quantity) &&
        (item as CartItemInput).quantity >= 1 &&
        (item as CartItemInput).quantity <= 20,
    );
  } catch {
    return [];
  }
}

export function saveBagToStorage(items: readonly CartItemInput[]): void {
  try {
    window.localStorage.setItem(BAG_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage quota / private mode failures
  }
}
