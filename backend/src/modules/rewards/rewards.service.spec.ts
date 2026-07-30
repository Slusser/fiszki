import { RewardsService } from './rewards.service';

describe('RewardsService', () => {
  const createService = () => {
    const repo = {
      ensureWalletRow: jest.fn().mockResolvedValue(undefined),
      getTierRepeatCountInLast24h: jest.fn().mockResolvedValue(0),
      getRepeatPointsToday: jest.fn().mockResolvedValue(0),
      creditWallet: jest.fn().mockResolvedValue(undefined),
      insertLedgerEntry: jest.fn().mockResolvedValue(undefined),
      getClient: jest.fn(),
      getCategoryForUnlock: jest.fn(),
      getWalletBalanceForUpdate: jest.fn(),
      isCategoryUnlocked: jest.fn(),
      insertCategoryUnlock: jest.fn(),
      debitWallet: jest.fn(),
    };

    return { service: new RewardsService(repo as never), repo };
  };

  it('calculates first completion reward with full multiplier', () => {
    const { service } = createService();
    const result = service.calculateTierReward({
      tier: 'easy',
      accuracy: 96,
      repeatsInLast24h: 0,
      repeatPointsToday: 0,
    });

    expect(result.basePoints).toBe(100);
    expect(result.accuracyBonusPoints).toBe(25);
    expect(result.antiGrindMultiplier).toBe(1);
    expect(result.finalPoints).toBe(125);
  });

  it('applies anti-grind multiplier for first repeat', () => {
    const { service } = createService();
    const result = service.calculateTierReward({
      tier: 'hard',
      accuracy: 90,
      repeatsInLast24h: 1,
      repeatPointsToday: 0,
    });

    expect(result.basePoints).toBe(220);
    expect(result.accuracyBonusPoints).toBe(22);
    expect(result.antiGrindMultiplier).toBe(0.4);
    expect(result.finalPoints).toBe(97);
  });

  it('enforces repeat daily cap', () => {
    const { service } = createService();
    const result = service.calculateTierReward({
      tier: 'expert',
      accuracy: 100,
      repeatsInLast24h: 3,
      repeatPointsToday: 280,
    });

    expect(result.basePoints).toBe(420);
    expect(result.accuracyBonusPoints).toBe(105);
    expect(result.antiGrindMultiplier).toBe(0.1);
    expect(result.finalPoints).toBe(20);
  });

  it('applies reward and writes ledger for repeat completion', async () => {
    const { service, repo } = createService();
    repo.getTierRepeatCountInLast24h.mockResolvedValue(1);
    repo.getRepeatPointsToday.mockResolvedValue(280);
    const fakeClient = { query: jest.fn() };

    const result = await service.applyReward({
      client: fakeClient as never,
      userId: 'u1',
      sessionId: '00000000-0000-4000-8000-000000000010',
      categoryId: '00000000-0000-4000-8000-000000000011',
      tier: 'expert',
      accuracy: 100,
      tierCompleted: true,
    });

    expect(result.rewardBreakdown.finalPoints).toBe(20);
    expect(result.ledgerSnapshot.reason).toBe('tier_completed_repeat');
    expect(repo.creditWallet).toHaveBeenCalledWith(fakeClient, 'u1', 20);
    expect(repo.insertLedgerEntry).toHaveBeenCalledWith(
      fakeClient,
      expect.objectContaining({
        userId: 'u1',
        reason: 'tier_completed_repeat',
        delta: 20,
      }),
    );
  });

  it('unlocks category transactionally with wallet debit and ledger', async () => {
    const { service, repo } = createService();
    const fakeClient = {
      query: jest.fn().mockResolvedValue(undefined),
      release: jest.fn(),
    };
    repo.getClient.mockResolvedValue(fakeClient);
    repo.getCategoryForUnlock.mockResolvedValue({ unlock_cost: 120 });
    repo.getWalletBalanceForUpdate.mockResolvedValue(300);
    repo.isCategoryUnlocked.mockResolvedValue(false);
    repo.insertCategoryUnlock.mockResolvedValue(true);
    repo.debitWallet.mockResolvedValue(180);

    const result = await service.unlockCategory(
      'u1',
      '00000000-0000-4000-8000-000000000020',
    );

    expect(result.spentPoints).toBe(120);
    expect(result.pointsBalance).toBe(180);
    expect(repo.insertLedgerEntry).toHaveBeenCalledWith(
      fakeClient,
      expect.objectContaining({
        reason: 'category_unlock',
        delta: -120,
      }),
    );
    expect(fakeClient.query).toHaveBeenCalledWith('begin');
    expect(fakeClient.query).toHaveBeenCalledWith('commit');
    expect(fakeClient.release).toHaveBeenCalled();
  });
});
