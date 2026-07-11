import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Matches } from 'class-validator';

export class UpdatePaymentMethodDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  holderName?: string;

  @ApiProperty({ required: false, example: '12/28' })
  @IsOptional()
  @IsString()
  @Matches(/^(0[1-9]|1[0-2])\/\d{2}$/, {
    message: 'expiryDate must be in MM/YY format',
  })
  expiryDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
