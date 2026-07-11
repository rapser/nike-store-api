import { Product } from '@prisma/client';
import { ProductResponseDto } from './dto/product-response.dto';

export function toProductResponse(product: Product): ProductResponseDto {
  return {
    id: product.id,
    name: product.name,
    price: Number(product.price),
    description: product.description,
    detail: product.detail,
    images: product.images,
  };
}
