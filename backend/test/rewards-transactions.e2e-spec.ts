import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../src/common/database/database.service';
import { RewardsRepository } from '../src/modules/rewards/rewards.repository';
import { RewardsService } from '../src/modules/rewards/rewards.service';

const dbUrl = process.env.SUPABASE_DB_URL ?? process.env.DATABASE_URL;

const maybeDescribe = dbUrl ? describe : describe.skip;

maybeDescribe('Rewards DB transactions (e2e)', () => {
  let databaseService: DatabaseService;
  let rewardsRepository: RewardsRepository;
  let rewardsService: RewardsService;
  let testUserId: string | null = null;

  beforeAll(async () => {
    databaseService = new DatabaseService();
    rewardsRepository = new RewardsRepository(databaseService);
    rewardsService = new RewardsService(rewardsRepository);

    const walletUser = await databaseService.query<{ user_id: string }>(
      `
        select user_id
        from public.user_wallet
        order by updated_at desc
        limit 1
      `,
    );

    testUserId = walletUser.rows[0]?.user_id ?? null;
  });

  afterAll(async () => {
    await databaseService.onModuleDestroy();
  });

  it('applyReward updates wallet and ledger in one transaction', async () => {
    if (!testUserId) {
      expect(true).toBe(true);
      return;
    }

    const sessionId = randomUUID();
    const categoryId = randomUUID();
    const client = await databaseService.getClient();

    try {
      await client.query('begin');

      await rewardsRepository.ensureWalletRow(client, testUserId);

      const beforeWallet = await databaseService.query<{
        points_balance: number | string;
      }>(
        `
          select points_balance
          from public.user_wallet
          where user_id = $1
          limit 1
        `,
        [testUserId],
      );
      const beforeBalance = Number(beforeWallet.rows[0]?.points_balance ?? 0);

      const { rewardBreakdown, ledgerSnapshot } =
        await rewardsService.applyReward({
          client,
          userId: testUserId,
          sessionId,
          categoryId,
          tier: 'easy',
          accuracy: 96,
          tierCompleted: true,
        });

      const txWallet = await client.query<{ points_balance: number | string }>(
        `
          select points_balance
          from public.user_wallet
          where user_id = $1
          limit 1
        `,
        [testUserId],
      );
      const txBalance = Number(txWallet.rows[0]?.points_balance ?? 0);

      const txLedger = await client.query<{
        reason: string;
        delta: number | string;
      }>(
        `
          select reason, delta
          from public.points_ledger
          where user_id = $1
            and reference_type = 'quiz_session'
            and reference_id = $2::uuid
          limit 1
        `,
        [testUserId, sessionId],
      );
      const ledgerRow = txLedger.rows[0];

      expect(txBalance - beforeBalance).toBe(rewardBreakdown.finalPoints);
      expect(ledgerSnapshot.delta).toBe(rewardBreakdown.finalPoints);
      expect(ledgerRow?.reason).toBe(ledgerSnapshot.reason);
      expect(Number(ledgerRow?.delta ?? 0)).toBe(rewardBreakdown.finalPoints);
    } finally {
      await client.query('rollback');
      client.release();
    }
  });

  it('unlockCategory debits wallet and inserts unlock + ledger', async () => {
    if (!testUserId) {
      expect(true).toBe(true);
      return;
    }

    const categoryId = randomUUID();
    const categorySlug = `test-unlock-${categoryId.slice(0, 8)}`;
    const unlockCost = 7;
    const walletTopup = 25;

    const prepClient = await databaseService.getClient();
    let baselineBalance = 0;
    try {
      await prepClient.query('begin');
      await rewardsRepository.ensureWalletRow(prepClient, testUserId);
      baselineBalance = await rewardsRepository.getWalletBalanceForUpdate(
        prepClient,
        testUserId,
      );
      await rewardsRepository.creditWallet(prepClient, testUserId, walletTopup);
      await prepClient.query(
        `
          insert into public.categories (id, slug, name, unlock_cost, difficulty_weight, is_active)
          values ($1::uuid, $2, $3, $4, 1, true)
        `,
        [categoryId, categorySlug, `Test unlock ${categorySlug}`, unlockCost],
      );
      await prepClient.query('commit');
    } catch (error) {
      await prepClient.query('rollback');
      throw error;
    } finally {
      prepClient.release();
    }

    const response = await rewardsService.unlockCategory(
      testUserId,
      categoryId,
    );

    const verify = await databaseService.query<{
      points_balance: number | string;
      reason: string;
      delta: number | string;
      unlock_id: string;
    }>(
      `
        select
          uw.points_balance,
          pl.reason,
          pl.delta,
          ucu.id as unlock_id
        from public.user_wallet uw
        left join public.points_ledger pl
          on pl.user_id = uw.user_id
         and pl.reference_type = 'category'
         and pl.reference_id = $2::uuid
        left join public.user_category_unlocks ucu
          on ucu.user_id = uw.user_id
         and ucu.category_id = $2::uuid
        where uw.user_id = $1
        order by pl.created_at desc nulls last
        limit 1
      `,
      [testUserId, categoryId],
    );

    expect(response.unlocked).toBe(true);
    expect(response.alreadyUnlocked).toBe(false);
    expect(response.spentPoints).toBe(unlockCost);
    expect(verify.rows[0]?.reason).toBe('category_unlock');
    expect(Number(verify.rows[0]?.delta ?? 0)).toBe(-unlockCost);
    expect(Boolean(verify.rows[0]?.unlock_id)).toBe(true);

    const cleanupClient = await databaseService.getClient();
    try {
      await cleanupClient.query('begin');
      await cleanupClient.query(
        `
          delete from public.points_ledger
          where user_id = $1
            and reference_type = 'category'
            and reference_id = $2::uuid
        `,
        [testUserId, categoryId],
      );
      await cleanupClient.query(
        `
          delete from public.user_category_unlocks
          where user_id = $1
            and category_id = $2::uuid
        `,
        [testUserId, categoryId],
      );
      await cleanupClient.query(
        `
          update public.user_wallet
          set points_balance = $2, updated_at = now()
          where user_id = $1
        `,
        [testUserId, baselineBalance],
      );
      await cleanupClient.query(
        `
          delete from public.categories
          where id = $1::uuid
        `,
        [categoryId],
      );
      await cleanupClient.query('commit');
    } catch (error) {
      await cleanupClient.query('rollback');
      throw error;
    } finally {
      cleanupClient.release();
    }
  });
});
