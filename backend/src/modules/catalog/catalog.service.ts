import { BadRequestException, Injectable } from '@nestjs/common';
import { AuthUserDto } from '../auth/dto/auth-user.dto';
import { CatalogRepository } from './catalog.repository';
import { CategoriesResponseDto } from './dto/categories-response.dto';
import { CategoryTiersResponseDto } from './dto/tiers-response.dto';
import { UnlockCategoryResponseDto } from './dto/unlock-category-response.dto';

@Injectable()
export class CatalogService {
  constructor(private readonly catalogRepository: CatalogRepository) {}

  getCategories(user: AuthUserDto): Promise<CategoriesResponseDto> {
    return this.catalogRepository.getCategories(user.userId);
  }

  getCategoryTiers(user: AuthUserDto, categoryId: string): Promise<CategoryTiersResponseDto> {
    return this.catalogRepository.getCategoryTiers(categoryId, user.userId);
  }

  async unlockCategory(
    user: AuthUserDto,
    categoryId: string,
  ): Promise<UnlockCategoryResponseDto> {
    try {
      return await this.catalogRepository.unlockCategory(user.userId, categoryId);
    } catch (error) {
      if (error instanceof Error && error.message === 'INSUFFICIENT_POINTS') {
        throw new BadRequestException('Not enough points to unlock this category');
      }

      throw error;
    }
  }
}
