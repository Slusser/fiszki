import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CatalogApiService } from '../catalog/catalog-api.service';
import { TierName } from '../api/models';
import { canAccessTier } from '../catalog/tier-access.util';

export const unlockGuard: CanActivateFn = async (route) => {
  const router = inject(Router);
  const catalogApi = inject(CatalogApiService);

  const categoryId = route.paramMap.get('categoryId');
  const tier = route.paramMap.get('tier') as TierName | null;

  if (!categoryId || !tier || !isTierName(tier)) {
    return router.createUrlTree(['/katalog'], {
      queryParams: { reason: 'invalid_quiz_route' },
    });
  }

  const categories = await firstValueFrom(catalogApi.getCategories());
  const category = categories.categories.find((item) => item.id === categoryId);

  if (!category) {
    return router.createUrlTree(['/katalog'], {
      queryParams: {
        reason: 'category_not_found',
        blockedCategoryId: categoryId,
        blockedTier: tier,
      },
    });
  }

  if (!category.isUnlocked) {
    return router.createUrlTree(['/katalog'], {
      queryParams: { reason: 'category_locked', blockedCategoryId: categoryId, blockedTier: tier },
    });
  }

  const tiersResponse = await firstValueFrom(catalogApi.getCategoryTiers(categoryId));
  const tierAccessible = canAccessTier(tier, tiersResponse.tiers);
  if (!tierAccessible) {
    return router.createUrlTree(['/katalog'], {
      queryParams: { reason: 'tier_locked', blockedCategoryId: categoryId, blockedTier: tier },
    });
  }

  return true;
};

function isTierName(value: string): value is TierName {
  return value === 'easy' || value === 'hard' || value === 'expert';
}
