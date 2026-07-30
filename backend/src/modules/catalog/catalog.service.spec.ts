import { BadRequestException } from '@nestjs/common';
import { CatalogService } from './catalog.service';

describe('CatalogService', () => {
  it('maps insufficient points error to business bad request', async () => {
    const repo = {
      getCategories: jest.fn(),
      getCategoryTiers: jest.fn(),
    };
    const rewardsService = {
      unlockCategory: jest
        .fn()
        .mockRejectedValue(new Error('INSUFFICIENT_POINTS')),
    };

    const service = new CatalogService(repo as never, rewardsService as never);

    await expect(
      service.unlockCategory(
        { userId: 'u1', email: null },
        '00000000-0000-4000-8000-000000000001',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
