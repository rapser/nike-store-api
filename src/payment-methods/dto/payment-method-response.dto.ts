import { ApiProperty } from '@nestjs/swagger';

export class PaymentMethodResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  holderName: string;

  @ApiProperty()
  cardBrand: string;

  @ApiProperty()
  cardLast4: string;

  @ApiProperty()
  expiryDate: string;

  @ApiProperty()
  isDefault: boolean;

  @ApiProperty({ example: 'Visa •••• 1111' })
  maskedDisplay: string;
}
