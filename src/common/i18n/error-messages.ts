export type SupportedLanguage = 'es' | 'en';

export const DEFAULT_LANGUAGE: SupportedLanguage = 'es';

/**
 * Message dictionary keyed by stable error `code`. `code` and every other
 * field in the error envelope stays in English (REST convention); only the
 * human-readable `message` is localized.
 */
export const ERROR_MESSAGES: Record<
  string,
  Record<SupportedLanguage, string>
> = {
  VALIDATION_ERROR: {
    es: 'Los datos enviados no son válidos.',
    en: 'The submitted data is invalid.',
  },
  EMAIL_ALREADY_IN_USE: {
    es: 'Ya existe una cuenta con este correo.',
    en: 'An account with this email already exists.',
  },
  INVALID_CREDENTIALS: {
    es: 'Correo o contraseña incorrectos.',
    en: 'Incorrect email or password.',
  },
  UNAUTHORIZED: {
    es: 'No autenticado. Inicia sesión para continuar.',
    en: 'Not authenticated. Please log in to continue.',
  },
  INVALID_REFRESH_TOKEN: {
    es: 'La sesión expiró o no es válida. Inicia sesión de nuevo.',
    en: 'The session expired or is invalid. Please log in again.',
  },
  FORBIDDEN: {
    es: 'No tienes permiso para realizar esta acción.',
    en: 'You do not have permission to perform this action.',
  },
  NOT_FOUND: {
    es: 'El recurso solicitado no existe.',
    en: 'The requested resource was not found.',
  },
  PRODUCT_NOT_FOUND: {
    es: 'El producto no existe.',
    en: 'The product was not found.',
  },
  CART_ITEM_NOT_FOUND: {
    es: 'El artículo no está en el carrito.',
    en: 'The item is not in the cart.',
  },
  FAVORITE_NOT_FOUND: {
    es: 'El producto no está en tus favoritos.',
    en: 'The product is not in your favorites.',
  },
  PAYMENT_METHOD_NOT_FOUND: {
    es: 'El método de pago no existe.',
    en: 'The payment method was not found.',
  },
  ADDRESS_NOT_FOUND: {
    es: 'La dirección no existe.',
    en: 'The address was not found.',
  },
  ORDER_NOT_FOUND: {
    es: 'El pedido no existe.',
    en: 'The order was not found.',
  },
  EMPTY_CART: {
    es: 'El carrito está vacío.',
    en: 'The cart is empty.',
  },
  PAYMENT_DECLINED: {
    es: 'El pago fue rechazado. Intenta con otro método de pago.',
    en: 'The payment was declined. Try a different payment method.',
  },
  RATE_LIMIT_EXCEEDED: {
    es: 'Demasiadas solicitudes. Intenta de nuevo en unos segundos.',
    en: 'Too many requests. Please try again in a few seconds.',
  },
  INTERNAL_ERROR: {
    es: 'Ocurrió un error inesperado. Intenta de nuevo más tarde.',
    en: 'An unexpected error occurred. Please try again later.',
  },
};

export function resolveLanguage(acceptLanguage?: string): SupportedLanguage {
  if (!acceptLanguage) return DEFAULT_LANGUAGE;
  const normalized = acceptLanguage.toLowerCase();
  if (normalized.includes('en')) return 'en';
  if (normalized.includes('es')) return 'es';
  return DEFAULT_LANGUAGE;
}

export function getErrorMessage(
  code: string,
  language: SupportedLanguage,
): string {
  const entry = ERROR_MESSAGES[code];
  if (!entry) return ERROR_MESSAGES.INTERNAL_ERROR[language];
  return entry[language];
}
