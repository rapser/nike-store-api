import { ApiProperty } from '@nestjs/swagger';

export class NikePlusActivityResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  value: string;

  @ApiProperty()
  unit: string;
}
