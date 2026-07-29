export interface UnlockCategoryResponseDto {
    categoryId: string;
    unlocked: boolean;
    alreadyUnlocked: boolean;
    spentPoints: number;
    pointsBalance: number;
}
