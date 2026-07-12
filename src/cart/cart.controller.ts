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
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartResponseDto } from './dto/cart-response.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';

@ApiTags('cart')
@ApiBearerAuth()
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get the current cart' })
  getCart(@CurrentUser() user: AuthenticatedUser): Promise<CartResponseDto> {
    return this.cartService.getCart(user.userId);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add a product to the cart' })
  addItem(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddCartItemDto,
  ): Promise<CartResponseDto> {
    return this.cartService.addItem(user.userId, dto);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Update a cart item quantity' })
  updateItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    return this.cartService.updateItem(user.userId, id, dto);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Remove a cart item' })
  removeItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<CartResponseDto> {
    return this.cartService.removeItem(user.userId, id);
  }

  @Delete()
  @ApiOperation({ summary: 'Clear the cart' })
  clear(@CurrentUser() user: AuthenticatedUser): Promise<CartResponseDto> {
    return this.cartService.clear(user.userId);
  }
}
