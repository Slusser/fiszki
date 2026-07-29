import type { AuthUserDto } from '../auth/dto/auth-user.dto';
import { CatalogService } from './catalog.service';
import { CategoryIdParamDto } from './dto/category-id-param.dto';
import type { CategoriesResponseDto } from './dto/categories-response.dto';
import type { CategoryTiersResponseDto } from './dto/tiers-response.dto';
import type { UnlockCategoryResponseDto } from './dto/unlock-category-response.dto';
export declare class CatalogController {
    private readonly catalogService;
    constructor(catalogService: CatalogService);
    getCategories(user: AuthUserDto): Promise<CategoriesResponseDto>;
    getCategoryTiers(user: AuthUserDto, params: CategoryIdParamDto): Promise<CategoryTiersResponseDto>;
    unlockCategory(user: AuthUserDto, params: CategoryIdParamDto): Promise<UnlockCategoryResponseDto>;
}
