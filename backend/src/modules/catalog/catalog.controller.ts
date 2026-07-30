import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUserDto } from '../auth/dto/auth-user.dto';
import { CatalogService } from './catalog.service';
import { CategoryIdParamDto } from './dto/category-id-param.dto';
import type { CategoriesResponseDto } from './dto/categories-response.dto';
import type { CategoryTiersResponseDto } from './dto/tiers-response.dto';
import type { UnlockCategoryResponseDto } from './dto/unlock-category-response.dto';

@Controller('catalog')
@UseGuards(SupabaseAuthGuard)
@ApiTags('catalog')
@ApiBearerAuth()
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('categories')
  @ApiOperation({ summary: 'List available categories and unlock status' })
  @ApiOkResponse({ description: 'Categories fetched for current user' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  getCategories(
    @CurrentUser() user: AuthUserDto,
  ): Promise<CategoriesResponseDto> {
    return this.catalogService.getCategories(user);
  }

  @Get('categories/:categoryId/tiers')
  @ApiOperation({ summary: 'Get tier progress for selected category' })
  @ApiOkResponse({ description: 'Tier progression returned' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  getCategoryTiers(
    @CurrentUser() user: AuthUserDto,
    @Param() params: CategoryIdParamDto,
  ): Promise<CategoryTiersResponseDto> {
    return this.catalogService.getCategoryTiers(user, params.categoryId);
  }

  @Post('categories/:categoryId/unlock')
  @ApiOperation({ summary: 'Unlock category by spending points' })
  @ApiOkResponse({ description: 'Category unlocked or already unlocked' })
  @ApiBadRequestResponse({
    description: 'Insufficient points or invalid request',
  })
  @ApiForbiddenResponse({ description: 'Category unavailable' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  unlockCategory(
    @CurrentUser() user: AuthUserDto,
    @Param() params: CategoryIdParamDto,
  ): Promise<UnlockCategoryResponseDto> {
    return this.catalogService.unlockCategory(user, params.categoryId);
  }
}
