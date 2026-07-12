import { Module } from '@nestjs/common';
import { NikePlusController } from './nikeplus.controller';
import { NikePlusService } from './nikeplus.service';

@Module({
  controllers: [NikePlusController],
  providers: [NikePlusService],
})
export class NikePlusModule {}
