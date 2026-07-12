import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AddFavoriteDto {
  @ApiProperty({ example: '875942-100' })
  @IsString()
  productId: string;
}
