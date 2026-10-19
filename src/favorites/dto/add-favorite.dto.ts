import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AddFavoriteDto {
  @ApiProperty({ example: '194500874572' })
  @IsString()
  productId: string;
}
