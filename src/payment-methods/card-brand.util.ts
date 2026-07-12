export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'other';

export function detectCardBrand(cardNumber: string): CardBrand {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.startsWith('4')) return 'visa';
  if (digits.startsWith('34') || digits.startsWith('37')) return 'amex';
  if (digits.startsWith('5') || digits.startsWith('2')) return 'mastercard';
  if (digits.startsWith('6')) return 'discover';
  return 'other';
}

export function lastFourDigits(cardNumber: string): string {
  const digits = cardNumber.replace(/\D/g, '');
  return digits.slice(-4);
}
