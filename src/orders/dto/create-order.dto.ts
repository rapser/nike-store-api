import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({
    description: 'Saved payment method id used to charge this order',
  })
  @IsString()
  paymentMethodId: string;
}
