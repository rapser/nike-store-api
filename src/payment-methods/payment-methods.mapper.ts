import { PaymentMethod } from '@prisma/client';
import { PaymentMethodResponseDto } from './dto/payment-method-response.dto';

const BRAND_DISPLAY_NAMES: Record<string, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'Amex',
  discover: 'Discover',
  other: 'Card',
};

export function toPaymentMethodResponse(
  paymentMethod: PaymentMethod,
): PaymentMethodResponseDto {
  const brandDisplayName =
    BRAND_DISPLAY_NAMES[paymentMethod.cardBrand] ?? 'Card';
  return {
    id: paymentMethod.id,
    holderName: paymentMethod.holderName,
    cardBrand: paymentMethod.cardBrand,
    cardLast4: paymentMethod.cardLast4,
    expiryDate: paymentMethod.expiryDate,
    isDefault: paymentMethod.isDefault,
    maskedDisplay: `${brandDisplayName} •••• ${paymentMethod.cardLast4}`,
  };
}
