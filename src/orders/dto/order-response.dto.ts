import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethodResponseDto } from '../../payment-methods/dto/payment-method-response.dto';

export class OrderItemResponseDto {
  @ApiProperty()
  productId: string;

  @ApiProperty()
  shoeName: string;

  @ApiProperty()
  shoePrice: number;

  @ApiProperty()
  quantity: number;
}

export class OrderResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  number: string;

  @ApiProperty({ type: [OrderItemResponseDto] })
  items: OrderItemResponseDto[];

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  tax: number;

  @ApiProperty()
  shipping: number;

  @ApiProperty()
  total: number;

  @ApiProperty({
    enum: ['pending', 'paid', 'failed', 'shipped', 'delivered', 'cancelled'],
  })
  status: string;

  @ApiProperty({ type: PaymentMethodResponseDto, nullable: true })
  paymentMethod: PaymentMethodResponseDto | null;

  @ApiProperty()
  placedAt: string;
}
