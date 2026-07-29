import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiClientService } from '../api/api-client.service';
import {
  ApiSuccessResponse,
  CategoriesResponse,
  CategoryTiersResponse,
  UnlockCategoryResponse,
} from '../api/models';

@Injectable({ providedIn: 'root' })
export class CatalogApiService {
  private readonly apiClient = inject(ApiClientService);

  getCategories(): Observable<CategoriesResponse> {
    return this.apiClient
      .get<ApiSuccessResponse<CategoriesResponse>>('/catalog/categories')
      .pipe(map((response) => response.data));
  }

  getCategoryTiers(categoryId: string): Observable<CategoryTiersResponse> {
    return this.apiClient
      .get<ApiSuccessResponse<CategoryTiersResponse>>(`/catalog/categories/${categoryId}/tiers`)
      .pipe(map((response) => response.data));
  }

  unlockCategory(categoryId: string): Observable<UnlockCategoryResponse> {
    return this.apiClient
      .post<ApiSuccessResponse<UnlockCategoryResponse>, Record<string, never>>(
        `/catalog/categories/${categoryId}/unlock`,
        {},
      )
      .pipe(map((response) => response.data));
  }
}
