import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  ChargeContext,
  ChargeResult,
  PaymentGateway,
} from './payment-gateway.interface';

/**
 * Local stand-in until a real processor (Culqi/VisaNet) is wired in — no
 * network calls. Cards ending in 0002 simulate a decline (same convention
 * Stripe test cards use), everything else is approved.
 */
@Injectable()
export class MockPaymentGateway implements PaymentGateway {
  readonly provider = 'mock';

  charge(_amount: number, context: ChargeContext): Promise<ChargeResult> {
    const status = context.cardLast4 === '0002' ? 'declined' : 'approved';
    return Promise.resolve({
      status,
      gatewayReference: `mock_${randomUUID()}`,
    });
  }
}
