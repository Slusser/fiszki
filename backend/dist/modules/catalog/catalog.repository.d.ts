import { DatabaseService } from '../../common/database/database.service';
import { CategoriesResponseDto } from './dto/categories-response.dto';
import { CategoryTiersResponseDto } from './dto/tiers-response.dto';
import { UnlockCategoryResponseDto } from './dto/unlock-category-response.dto';
export declare class CatalogRepository {
    private readonly databaseService;
    constructor(databaseService: DatabaseService);
    getCategories(userId: string): Promise<CategoriesResponseDto>;
    getCategoryTiers(categoryId: string, userId: string): Promise<CategoryTiersResponseDto>;
    unlockCategory(userId: string, categoryId: string): Promise<UnlockCategoryResponseDto>;
    private unlockCategoryTx;
}
