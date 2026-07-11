import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/exceptions/api.exception';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { toOrderResponse } from './orders.mapper';
import { generateOrderNumber } from './order-number.util';
import {
  round2,
  SHIPPING_COST,
  TAX_RATE,
} from '../common/constants/checkout.constants';
import {
  PAYMENT_GATEWAY,
  type PaymentGateway,
} from './payment-gateway/payment-gateway.interface';

const ORDER_INCLUDE = { items: true, paymentMethod: true } as const;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(PAYMENT_GATEWAY) private readonly paymentGateway: PaymentGateway,
  ) {}

  async list(userId: string): Promise<OrderResponseDto[]> {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: ORDER_INCLUDE,
      orderBy: { placedAt: 'desc' },
    });
    return orders.map(toOrderResponse);
  }

  async findOne(userId: string, id: string): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      include: ORDER_INCLUDE,
    });
    if (!order) {
      throw new ApiException(
        'ORDER_NOT_FOUND',
        HttpStatus.NOT_FOUND,
        'not_found_error',
      );
    }
    return toOrderResponse(order);
  }

  async checkout(
    userId: string,
    dto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    const cartItems = await this.prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
    });

    if (cartItems.length === 0) {
      throw new ApiException(
        'EMPTY_CART',
        HttpStatus.UNPROCESSABLE_ENTITY,
        'validation_error',
      );
    }

    const paymentMethod = await this.prisma.paymentMethod.findFirst({
      where: { id: dto.paymentMethodId, userId },
    });
    if (!paymentMethod) {
      throw new ApiException(
        'PAYMENT_METHOD_NOT_FOUND',
        HttpStatus.NOT_FOUND,
        'not_found_error',
      );
    }

    const subtotal = round2(
      cartItems.reduce(
        (sum, item) => sum + Number(item.product.price) * item.quantity,
        0,
      ),
    );
    const tax = round2(subtotal * TAX_RATE);
    const shipping = SHIPPING_COST;
    const total = round2(subtotal + tax + shipping);

    const order = await this.prisma.order.create({
      data: {
        number: generateOrderNumber(),
        userId,
        paymentMethodId: paymentMethod.id,
        subtotal,
        tax,
        shipping,
        total,
        status: 'pending',
        items: {
          create: cartItems.map((item) => ({
            productId: item.productId,
            shoeName: item.product.name,
            shoePrice: item.product.price,
            quantity: item.quantity,
          })),
        },
      },
      include: ORDER_INCLUDE,
    });

    const chargeResult = await this.paymentGateway.charge(total, {
      orderId: order.id,
      paymentMethodId: paymentMethod.id,
      cardLast4: paymentMethod.cardLast4,
    });

    await this.prisma.transaction.create({
      data: {
        orderId: order.id,
        gatewayProvider: this.paymentGateway.provider,
        gatewayReference: chargeResult.gatewayReference,
        status: chargeResult.status,
        amount: total,
      },
    });

    if (chargeResult.status === 'declined') {
      // Order + transaction stay in the DB as an audit record even though checkout failed.
      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: 'failed' },
      });
      throw new ApiException(
        'PAYMENT_DECLINED',
        HttpStatus.UNPROCESSABLE_ENTITY,
        'validation_error',
      );
    }

    const paidOrder = await this.prisma.order.update({
      where: { id: order.id },
      data: { status: 'paid' },
      include: ORDER_INCLUDE,
    });

    await this.prisma.cartItem.deleteMany({ where: { userId } });

    return toOrderResponse(paidOrder);
  }
}
