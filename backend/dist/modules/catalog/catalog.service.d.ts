import { AuthUserDto } from '../auth/dto/auth-user.dto';
import { RewardsService } from '../rewards/rewards.service';
import { CatalogRepository } from './catalog.repository';
import { CategoriesResponseDto } from './dto/categories-response.dto';
import { CategoryTiersResponseDto } from './dto/tiers-response.dto';
import { UnlockCategoryResponseDto } from './dto/unlock-category-response.dto';
export declare class CatalogService {
    private readonly catalogRepository;
    private readonly rewardsService;
    constructor(catalogRepository: CatalogRepository, rewardsService: RewardsService);
    getCategories(user: AuthUserDto): Promise<CategoriesResponseDto>;
    getCategoryTiers(user: AuthUserDto, categoryId: string): Promise<CategoryTiersResponseDto>;
    unlockCategory(user: AuthUserDto, categoryId: string): Promise<UnlockCategoryResponseDto>;
}
