import { AuthUserDto } from '../auth/dto/auth-user.dto';
import { CatalogRepository } from './catalog.repository';
import { CategoriesResponseDto } from './dto/categories-response.dto';
import { CategoryTiersResponseDto } from './dto/tiers-response.dto';
import { UnlockCategoryResponseDto } from './dto/unlock-category-response.dto';
export declare class CatalogService {
    private readonly catalogRepository;
    constructor(catalogRepository: CatalogRepository);
    getCategories(user: AuthUserDto): Promise<CategoriesResponseDto>;
    getCategoryTiers(user: AuthUserDto, categoryId: string): Promise<CategoryTiersResponseDto>;
    unlockCategory(user: AuthUserDto, categoryId: string): Promise<UnlockCategoryResponseDto>;
}
