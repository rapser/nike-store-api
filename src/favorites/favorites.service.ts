import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/exceptions/api.exception';
import { ProductResponseDto } from '../products/dto/product-response.dto';
import { toProductResponse } from '../products/products.mapper';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string): Promise<ProductResponseDto[]> {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { createdAt: 'asc' },
    });
    return favorites.map((favorite) => toProductResponse(favorite.product));
  }

  async add(userId: string, productId: string): Promise<ProductResponseDto[]> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new ApiException(
        'PRODUCT_NOT_FOUND',
        HttpStatus.NOT_FOUND,
        'not_found_error',
      );
    }

    await this.prisma.favorite.upsert({
      where: { userId_productId: { userId, productId } },
      update: {},
      create: { userId, productId },
    });

    return this.list(userId);
  }

  async remove(
    userId: string,
    productId: string,
  ): Promise<ProductResponseDto[]> {
    const favorite = await this.prisma.favorite.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (!favorite) {
      throw new ApiException(
        'FAVORITE_NOT_FOUND',
        HttpStatus.NOT_FOUND,
        'not_found_error',
      );
    }

    await this.prisma.favorite.delete({ where: { id: favorite.id } });
    return this.list(userId);
  }
}
