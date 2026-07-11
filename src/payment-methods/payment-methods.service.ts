import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/exceptions/api.exception';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { PaymentMethodResponseDto } from './dto/payment-method-response.dto';
import { toPaymentMethodResponse } from './payment-methods.mapper';
import { detectCardBrand, lastFourDigits } from './card-brand.util';

@Injectable()
export class PaymentMethodsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string): Promise<PaymentMethodResponseDto[]> {
    const methods = await this.prisma.paymentMethod.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    return methods.map(toPaymentMethodResponse);
  }

  async create(
    userId: string,
    dto: CreatePaymentMethodDto,
  ): Promise<PaymentMethodResponseDto> {
    if (dto.isDefault) {
      await this.prisma.paymentMethod.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const method = await this.prisma.paymentMethod.create({
      data: {
        userId,
        holderName: dto.holderName,
        cardBrand: detectCardBrand(dto.cardNumber),
        cardLast4: lastFourDigits(dto.cardNumber),
        expiryDate: dto.expiryDate,
        isDefault: dto.isDefault ?? false,
      },
    });

    return toPaymentMethodResponse(method);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdatePaymentMethodDto,
  ): Promise<PaymentMethodResponseDto> {
    const existing = await this.prisma.paymentMethod.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new ApiException(
        'PAYMENT_METHOD_NOT_FOUND',
        HttpStatus.NOT_FOUND,
        'not_found_error',
      );
    }

    if (dto.isDefault) {
      await this.prisma.paymentMethod.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const updated = await this.prisma.paymentMethod.update({
      where: { id },
      data: {
        holderName: dto.holderName,
        expiryDate: dto.expiryDate,
        isDefault: dto.isDefault,
      },
    });

    return toPaymentMethodResponse(updated);
  }

  async remove(
    userId: string,
    id: string,
  ): Promise<PaymentMethodResponseDto[]> {
    const existing = await this.prisma.paymentMethod.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new ApiException(
        'PAYMENT_METHOD_NOT_FOUND',
        HttpStatus.NOT_FOUND,
        'not_found_error',
      );
    }

    await this.prisma.paymentMethod.delete({ where: { id } });
    return this.list(userId);
  }
}
