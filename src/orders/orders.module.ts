import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { MockPaymentGateway } from './payment-gateway/mock-payment-gateway';
import { PAYMENT_GATEWAY } from './payment-gateway/payment-gateway.interface';

@Module({
  controllers: [OrdersController],
  providers: [
    OrdersService,
    { provide: PAYMENT_GATEWAY, useClass: MockPaymentGateway },
  ],
})
export class OrdersModule {}
