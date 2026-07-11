import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { AddFavoriteDto } from './dto/add-favorite.dto';
import { ProductResponseDto } from '../products/dto/product-response.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';

@ApiTags('favorites')
@ApiBearerAuth()
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  @ApiOperation({ summary: 'List favorite products' })
  list(@CurrentUser() user: AuthenticatedUser): Promise<ProductResponseDto[]> {
    return this.favoritesService.list(user.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Add a product to favorites' })
  add(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddFavoriteDto,
  ): Promise<ProductResponseDto[]> {
    return this.favoritesService.add(user.userId, dto.productId);
  }

  @Delete(':productId')
  @ApiOperation({ summary: 'Remove a product from favorites' })
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('productId') productId: string,
  ): Promise<ProductResponseDto[]> {
    return this.favoritesService.remove(user.userId, productId);
  }
}
