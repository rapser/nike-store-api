import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class CreatePaymentMethodDto {
  @ApiProperty({ example: 'Jordan Runner' })
  @IsString()
  holderName: string;

  @ApiProperty({
    example: '4111111111111111',
    description:
      'Used only to derive brand + last 4 digits; the full number is never stored.',
  })
  @IsString()
  @Length(12, 19)
  cardNumber: string;

  @ApiProperty({ example: '12/28' })
  @IsString()
  @Matches(/^(0[1-9]|1[0-2])\/\d{2}$/, {
    message: 'expiryDate must be in MM/YY format',
  })
  expiryDate: string;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
