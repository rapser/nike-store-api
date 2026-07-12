import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/exceptions/api.exception';
import { toProductResponse } from '../products/products.mapper';
import { CartResponseDto } from './dto/cart-response.dto';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import {
  round2,
  SHIPPING_COST,
  TAX_RATE,
} from '../common/constants/checkout.constants';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(userId: string): Promise<CartResponseDto> {
    const items = await this.prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { createdAt: 'asc' },
    });
    return this.toCartResponse(items);
  }

  async addItem(userId: string, dto: AddCartItemDto): Promise<CartResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });
    if (!product) {
      throw new ApiException(
        'PRODUCT_NOT_FOUND',
        HttpStatus.NOT_FOUND,
        'not_found_error',
      );
    }

    const existing = await this.prisma.cartItem.findUnique({
      where: { userId_productId: { userId, productId: dto.productId } },
    });

    if (existing) {
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + dto.quantity },
      });
    } else {
      await this.prisma.cartItem.create({
        data: { userId, productId: dto.productId, quantity: dto.quantity },
      });
    }

    return this.getCart(userId);
  }

  async updateItem(
    userId: string,
    itemId: string,
    dto: UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, userId },
    });
    if (!item) {
      throw new ApiException(
        'CART_ITEM_NOT_FOUND',
        HttpStatus.NOT_FOUND,
        'not_found_error',
      );
    }

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: dto.quantity },
    });
    return this.getCart(userId);
  }

  async removeItem(userId: string, itemId: string): Promise<CartResponseDto> {
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, userId },
    });
    if (!item) {
      throw new ApiException(
        'CART_ITEM_NOT_FOUND',
        HttpStatus.NOT_FOUND,
        'not_found_error',
      );
    }

    await this.prisma.cartItem.delete({ where: { id: itemId } });
    return this.getCart(userId);
  }

  async clear(userId: string): Promise<CartResponseDto> {
    await this.prisma.cartItem.deleteMany({ where: { userId } });
    return this.getCart(userId);
  }

  private toCartResponse(
    items: Array<{
      id: string;
      quantity: number;
      product: Parameters<typeof toProductResponse>[0];
    }>,
  ): CartResponseDto {
    const mappedItems = items.map((item) => {
      const product = toProductResponse(item.product);
      return {
        id: item.id,
        product,
        quantity: item.quantity,
        lineTotal: round2(product.price * item.quantity),
      };
    });

    const subtotal = round2(
      mappedItems.reduce((sum, item) => sum + item.lineTotal, 0),
    );
    const tax = round2(subtotal * TAX_RATE);
    const shipping = SHIPPING_COST;
    const total = round2(subtotal + tax + shipping);

    return { items: mappedItems, subtotal, tax, shipping, total };
  }
}
