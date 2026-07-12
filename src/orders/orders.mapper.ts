import { Order, OrderItem, PaymentMethod } from '@prisma/client';
import { OrderResponseDto } from './dto/order-response.dto';
import { toPaymentMethodResponse } from '../payment-methods/payment-methods.mapper';

type OrderWithRelations = Order & {
  items: OrderItem[];
  paymentMethod: PaymentMethod | null;
};

export function toOrderResponse(order: OrderWithRelations): OrderResponseDto {
  return {
    id: order.id,
    number: order.number,
    items: order.items.map((item) => ({
      productId: item.productId,
      shoeName: item.shoeName,
      shoePrice: Number(item.shoePrice),
      quantity: item.quantity,
    })),
    subtotal: Number(order.subtotal),
    tax: Number(order.tax),
    shipping: Number(order.shipping),
    total: Number(order.total),
    status: order.status,
    paymentMethod: order.paymentMethod
      ? toPaymentMethodResponse(order.paymentMethod)
      : null,
    placedAt: order.placedAt.toISOString(),
  };
}
