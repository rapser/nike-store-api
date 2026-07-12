import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/exceptions/api.exception';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { AddressResponseDto } from './dto/address-response.dto';
import { toAddressResponse } from './addresses.mapper';

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string): Promise<AddressResponseDto[]> {
    const addresses = await this.prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    return addresses.map(toAddressResponse);
  }

  async create(
    userId: string,
    dto: CreateAddressDto,
  ): Promise<AddressResponseDto> {
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const address = await this.prisma.address.create({
      data: { ...dto, userId, isDefault: dto.isDefault ?? false },
    });

    return toAddressResponse(address);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateAddressDto,
  ): Promise<AddressResponseDto> {
    const existing = await this.prisma.address.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new ApiException(
        'ADDRESS_NOT_FOUND',
        HttpStatus.NOT_FOUND,
        'not_found_error',
      );
    }

    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const updated = await this.prisma.address.update({
      where: { id },
      data: dto,
    });
    return toAddressResponse(updated);
  }

  async remove(userId: string, id: string): Promise<AddressResponseDto[]> {
    const existing = await this.prisma.address.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new ApiException(
        'ADDRESS_NOT_FOUND',
        HttpStatus.NOT_FOUND,
        'not_found_error',
      );
    }

    await this.prisma.address.delete({ where: { id } });
    return this.list(userId);
  }
}
