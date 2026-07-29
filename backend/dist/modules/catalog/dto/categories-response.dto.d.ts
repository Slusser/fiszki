export interface CategoryListItemDto {
    id: string;
    slug: string;
    name: string;
    unlockCost: number;
    difficultyWeight: number;
    isUnlocked: boolean;
    unlockedAt: string | null;
}
export interface CategoriesResponseDto {
    categories: CategoryListItemDto[];
}
