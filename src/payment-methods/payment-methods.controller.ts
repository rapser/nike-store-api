import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaymentMethodsService } from './payment-methods.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { PaymentMethodResponseDto } from './dto/payment-method-response.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';

@ApiTags('payment-methods')
@ApiBearerAuth()
@Controller('payment-methods')
export class PaymentMethodsController {
  constructor(private readonly paymentMethodsService: PaymentMethodsService) {}

  @Get()
  @ApiOperation({ summary: 'List saved payment methods' })
  list(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PaymentMethodResponseDto[]> {
    return this.paymentMethodsService.list(user.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Add a payment method' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePaymentMethodDto,
  ): Promise<PaymentMethodResponseDto> {
    return this.paymentMethodsService.create(user.userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a payment method' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdatePaymentMethodDto,
  ): Promise<PaymentMethodResponseDto> {
    return this.paymentMethodsService.update(user.userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a payment method' })
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<PaymentMethodResponseDto[]> {
    return this.paymentMethodsService.remove(user.userId, id);
  }
}
