export interface ChargeContext {
  orderId: string;
  paymentMethodId: string;
  cardLast4: string;
}

export interface ChargeResult {
  status: 'approved' | 'declined';
  gatewayReference: string;
}

/**
 * Seam for a real processor (Culqi, VisaNet, ...). Any implementation must
 * only produce a charge result — it never persists anything; OrdersService
 * is what writes the Transaction row regardless of outcome.
 */
export interface PaymentGateway {
  readonly provider: string;
  charge(amount: number, context: ChargeContext): Promise<ChargeResult>;
}

export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');
