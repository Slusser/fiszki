import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { ResponseEnvelopeInterceptor } from '../src/common/interceptors/response-envelope.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AuthService } from '../src/modules/auth/auth.service';
import { CatalogService } from '../src/modules/catalog/catalog.service';
import { ProgressionService } from '../src/modules/progression/progression.service';
import { QuizService } from '../src/modules/quiz/quiz.service';
import { RewardsService } from '../src/modules/rewards/rewards.service';
import { UsersService } from '../src/modules/users/users.service';

interface EnvelopeResponse<TData, TError = unknown> {
  success: boolean;
  data: TData;
  error?: TError;
}

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  const currentUser = { userId: 'user-a', email: 'a@example.com' };
  const authHeader = { Authorization: 'Bearer dev-test-token' };

  let authServiceMock: { verifyAccessToken: jest.Mock };
  let usersServiceMock: { getMe: jest.Mock };
  let catalogServiceMock: {
    getCategories: jest.Mock;
    getCategoryTiers: jest.Mock;
    unlockCategory: jest.Mock;
  };
  let quizServiceMock: {
    startSession: jest.Mock;
    getNextQuestion: jest.Mock;
    answerQuestion: jest.Mock;
    finishSession: jest.Mock;
  };
  let progressionServiceMock: { getOverview: jest.Mock };
  let rewardsServiceMock: { getWallet: jest.Mock; getLedger: jest.Mock };

  beforeEach(async () => {
    authServiceMock = {
      verifyAccessToken: jest.fn().mockResolvedValue(currentUser),
    };
    usersServiceMock = {
      getMe: jest.fn().mockResolvedValue({
        userId: currentUser.userId,
        email: currentUser.email,
        pointsBalance: 220,
        lifetimePoints: 620,
      }),
    };
    catalogServiceMock = {
      getCategories: jest.fn().mockResolvedValue({
        items: [
          {
            id: '00000000-0000-4000-8000-000000000001',
            slug: 'start',
            name: 'Start',
            unlockCost: 0,
            unlocked: true,
          },
        ],
      }),
      getCategoryTiers: jest.fn().mockResolvedValue({
        categoryId: '00000000-0000-4000-8000-000000000001',
        tiers: [
          {
            tier: 'easy',
            unlocked: true,
            masteredWords: 3,
            totalWords: 10,
          },
        ],
      }),
      unlockCategory: jest.fn().mockResolvedValue({
        categoryId: '00000000-0000-4000-8000-000000000002',
        unlocked: true,
        alreadyUnlocked: false,
        spentPoints: 120,
        pointsBalance: 100,
      }),
    };
    quizServiceMock = {
      startSession: jest.fn().mockResolvedValue({
        sessionId: '11111111-1111-4111-8111-111111111111',
        status: 'active',
        categoryId: '00000000-0000-4000-8000-000000000001',
        tier: 'easy',
        resumed: false,
        startedAt: '2026-07-29T08:00:00.000Z',
      }),
      getNextQuestion: jest.fn().mockResolvedValue({
        sessionId: '11111111-1111-4111-8111-111111111111',
        categoryId: '00000000-0000-4000-8000-000000000001',
        tier: 'easy',
        completed: false,
        progress: {
          totalWords: 10,
          answeredWords: 0,
          remainingWords: 10,
          sessionAccuracy: 0,
        },
        question: {
          wordId: '22222222-2222-4222-8222-222222222222',
          prompt: 'dom',
          options: ['casa', 'mesa', 'perro', 'gato'],
          issuedAt: '2026-07-29T08:00:01.000Z',
          questionToken: 'question-token-1',
        },
      }),
      answerQuestion: jest.fn().mockResolvedValue({
        sessionId: '11111111-1111-4111-8111-111111111111',
        wordId: '22222222-2222-4222-8222-222222222222',
        isCorrect: true,
        wasTimeout: false,
        recordedOption: 'casa',
        progress: {
          totalWords: 10,
          answeredWords: 1,
          remainingWords: 9,
          sessionAccuracy: 100,
        },
        wordProgress: {
          wordId: '22222222-2222-4222-8222-222222222222',
          correctCount: 1,
          wrongCount: 0,
          requiredCorrect: 3,
          mastered: false,
        },
      }),
      finishSession: jest.fn().mockResolvedValue({
        sessionId: '11111111-1111-4111-8111-111111111111',
        categoryId: '00000000-0000-4000-8000-000000000001',
        tier: 'easy',
        status: 'finished',
        idempotent: false,
        score: 10,
        accuracy: 100,
        finishedAt: '2026-07-29T08:10:00.000Z',
        progress: {
          totalWords: 10,
          answeredWords: 10,
          remainingWords: 0,
          sessionAccuracy: 100,
        },
        tierCompleted: true,
        rewards: {
          basePoints: 100,
          accuracyBonusPoints: 25,
          grossPoints: 125,
          antiGrindMultiplier: 1,
          repeatsInLast24h: 0,
          isRepeatReward: false,
          finalPoints: 125,
          grantedPoints: 125,
          repeatPointsToday: 0,
          repeatPointsCap: 300,
        },
        rewardLedger: {
          reason: 'tier_completed',
          delta: 125,
        },
        wallet: {
          pointsBalance: 225,
          lifetimePoints: 745,
        },
      }),
    };
    progressionServiceMock = {
      getOverview: jest.fn().mockResolvedValue({
        categories: [],
        stats: {
          categoriesUnlocked: 1,
          masteredWords: 3,
          totalWords: 10,
          overallMasteryPercent: 30,
        },
      }),
    };
    rewardsServiceMock = {
      getWallet: jest.fn().mockResolvedValue({
        pointsBalance: 225,
        lifetimePoints: 745,
      }),
      getLedger: jest.fn().mockResolvedValue({
        items: [],
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AuthService)
      .useValue(authServiceMock)
      .overrideProvider(UsersService)
      .useValue(usersServiceMock)
      .overrideProvider(CatalogService)
      .useValue(catalogServiceMock)
      .overrideProvider(QuizService)
      .useValue(quizServiceMock)
      .overrideProvider(ProgressionService)
      .useValue(progressionServiceMock)
      .overrideProvider(RewardsService)
      .useValue(rewardsServiceMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());
    app.useGlobalFilters(new GlobalExceptionFilter());
    const config = new DocumentBuilder()
      .setTitle('Fiszki API')
      .setDescription('REST API dla MVP aplikacji fiszek')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
    await app.init();
  });

  it('/v1/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/v1/health')
      .expect(200)
      .expect(
        ({
          body,
        }: {
          body: { success: boolean; data: { status: string } };
        }) => {
          expect(body.success).toBe(true);
          expect(body.data.status).toBe('ok');
        },
      );
  });

  it('/v1/health/ready (GET)', () => {
    return request(app.getHttpServer())
      .get('/v1/health/ready')
      .expect(200)
      .expect(
        ({
          body,
        }: {
          body: {
            success: boolean;
            data: { status: string; checks: { app: string } };
          };
        }) => {
          expect(body.success).toBe(true);
          expect(body.data.status).toBe('ready');
          expect(body.data.checks.app).toBe('ok');
        },
      );
  });

  it('/v1/me (GET) should reject anonymous request', () => {
    return request(app.getHttpServer()).get('/v1/me').expect(401);
  });

  it('/v1/catalog/categories (GET) should reject anonymous request', () => {
    return request(app.getHttpServer())
      .get('/v1/catalog/categories')
      .expect(401);
  });

  it('/v1/quiz/sessions/start (POST) should reject anonymous request', () => {
    return request(app.getHttpServer())
      .post('/v1/quiz/sessions/start')
      .send({
        categoryId: '00000000-0000-4000-8000-000000000001',
        tier: 'easy',
      })
      .expect(401);
  });

  it('/v1/progress/overview (GET) should reject anonymous request', () => {
    return request(app.getHttpServer())
      .get('/v1/progress/overview')
      .expect(401);
  });

  it('/v1/wallet (GET) should reject anonymous request', () => {
    return request(app.getHttpServer()).get('/v1/wallet').expect(401);
  });

  it('/v1/wallet/ledger (GET) should reject anonymous request', () => {
    return request(app.getHttpServer()).get('/v1/wallet/ledger').expect(401);
  });

  it('runs critical user flow: me -> quiz -> finish -> unlock', async () => {
    const me = await request(app.getHttpServer())
      .get('/v1/me')
      .set(authHeader)
      .expect(200);
    const meBody = me.body as EnvelopeResponse<{ userId: string }>;
    expect(meBody.success).toBe(true);
    expect(meBody.data.userId).toBe(currentUser.userId);

    const started = await request(app.getHttpServer())
      .post('/v1/quiz/sessions/start')
      .set(authHeader)
      .send({
        categoryId: '00000000-0000-4000-8000-000000000001',
        tier: 'easy',
      })
      .expect(201);
    const startedBody = started.body as EnvelopeResponse<{ sessionId: string }>;
    const sessionId = startedBody.data.sessionId;
    expect(sessionId).toBeTruthy();

    const next = await request(app.getHttpServer())
      .get(`/v1/quiz/sessions/${sessionId}/next-question`)
      .set(authHeader)
      .expect(200);
    const nextBody = next.body as EnvelopeResponse<{
      completed: boolean;
      question: { questionToken: string };
    }>;
    expect(nextBody.data.completed).toBe(false);
    expect(nextBody.data.question.questionToken).toBe('question-token-1');

    const answered = await request(app.getHttpServer())
      .post(`/v1/quiz/sessions/${sessionId}/answer`)
      .set(authHeader)
      .send({
        questionToken: 'question-token-1',
        selectedOption: 'casa',
      })
      .expect(201);
    const answeredBody = answered.body as EnvelopeResponse<{
      isCorrect: boolean;
    }>;
    expect(answeredBody.data.isCorrect).toBe(true);

    const finished = await request(app.getHttpServer())
      .post(`/v1/quiz/sessions/${sessionId}/finish`)
      .set(authHeader)
      .expect(201);
    const finishedBody = finished.body as EnvelopeResponse<{
      status: string;
      rewards: { grantedPoints: number };
    }>;
    expect(finishedBody.data.status).toBe('finished');
    expect(finishedBody.data.rewards.grantedPoints).toBeGreaterThan(0);

    const unlocked = await request(app.getHttpServer())
      .post(
        '/v1/catalog/categories/00000000-0000-4000-8000-000000000002/unlock',
      )
      .set(authHeader)
      .expect(201);
    const unlockedBody = unlocked.body as EnvelopeResponse<{
      unlocked: boolean;
      spentPoints: number;
    }>;
    expect(unlockedBody.data.unlocked).toBe(true);
    expect(unlockedBody.data.spentPoints).toBe(120);
  });

  it('denies starting session for locked category', async () => {
    quizServiceMock.startSession.mockRejectedValueOnce(
      new ForbiddenException('Category is locked or unavailable'),
    );

    const response = await request(app.getHttpServer())
      .post('/v1/quiz/sessions/start')
      .set(authHeader)
      .send({
        categoryId: '00000000-0000-4000-8000-000000000099',
        tier: 'easy',
      })
      .expect(403);

    const responseBody = response.body as EnvelopeResponse<unknown>;
    expect(responseBody.success).toBe(false);
  });

  it('denies unlock when points are insufficient', async () => {
    catalogServiceMock.unlockCategory.mockRejectedValueOnce(
      new BadRequestException('Not enough points to unlock this category'),
    );

    const response = await request(app.getHttpServer())
      .post(
        '/v1/catalog/categories/00000000-0000-4000-8000-000000000009/unlock',
      )
      .set(authHeader)
      .expect(400);

    const responseBody = response.body as EnvelopeResponse<unknown>;
    expect(responseBody.success).toBe(false);
  });

  it('denies access to foreign quiz session answer', async () => {
    quizServiceMock.answerQuestion.mockRejectedValueOnce(
      new UnauthorizedException(
        'Question token does not match current session',
      ),
    );

    const response = await request(app.getHttpServer())
      .post('/v1/quiz/sessions/33333333-3333-4333-8333-333333333333/answer')
      .set(authHeader)
      .send({
        questionToken: 'question-token-foreign',
        selectedOption: 'casa',
      })
      .expect(401);

    const responseBody = response.body as EnvelopeResponse<unknown>;
    expect(responseBody.success).toBe(false);
  });

  it('validates DTO input for quiz start payload', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/quiz/sessions/start')
      .set(authHeader)
      .send({
        categoryId: 'not-a-uuid',
        tier: 'legendary',
        injected: true,
      })
      .expect(400);

    const responseBody = response.body as EnvelopeResponse<
      unknown,
      { details?: { message?: string[] } }
    >;
    expect(responseBody.success).toBe(false);
    const details = responseBody.error?.details ?? {};
    expect(details.message).toContain('property injected should not exist');
  });

  it('enforces rate limit on start endpoint', async () => {
    let lastStatus = 200;
    for (let i = 0; i < 21; i += 1) {
      const response = await request(app.getHttpServer())
        .post('/v1/quiz/sessions/start')
        .set(authHeader)
        .send({
          categoryId: '00000000-0000-4000-8000-000000000001',
          tier: 'easy',
        });
      lastStatus = response.status;
    }

    expect(lastStatus).toBe(429);
  });

  it('keeps finish endpoint idempotent for same session', async () => {
    quizServiceMock.finishSession
      .mockResolvedValueOnce({
        sessionId: '11111111-1111-4111-8111-111111111111',
        categoryId: '00000000-0000-4000-8000-000000000001',
        tier: 'easy',
        status: 'finished',
        idempotent: false,
        score: 10,
        accuracy: 100,
        finishedAt: '2026-07-29T08:10:00.000Z',
        progress: {
          totalWords: 10,
          answeredWords: 10,
          remainingWords: 0,
          sessionAccuracy: 100,
        },
        tierCompleted: true,
        rewards: {
          basePoints: 100,
          accuracyBonusPoints: 25,
          grossPoints: 125,
          antiGrindMultiplier: 1,
          repeatsInLast24h: 0,
          isRepeatReward: false,
          finalPoints: 125,
          grantedPoints: 125,
          repeatPointsToday: 0,
          repeatPointsCap: 300,
        },
        rewardLedger: {
          reason: 'tier_completed',
          delta: 125,
        },
        wallet: {
          pointsBalance: 225,
          lifetimePoints: 745,
        },
      })
      .mockResolvedValueOnce({
        sessionId: '11111111-1111-4111-8111-111111111111',
        categoryId: '00000000-0000-4000-8000-000000000001',
        tier: 'easy',
        status: 'finished',
        idempotent: true,
        score: 10,
        accuracy: 100,
        finishedAt: '2026-07-29T08:10:00.000Z',
        progress: {
          totalWords: 10,
          answeredWords: 10,
          remainingWords: 0,
          sessionAccuracy: 100,
        },
        tierCompleted: true,
        rewards: {
          basePoints: 0,
          accuracyBonusPoints: 0,
          grossPoints: 125,
          antiGrindMultiplier: 1,
          repeatsInLast24h: 0,
          isRepeatReward: false,
          finalPoints: 125,
          grantedPoints: 125,
          repeatPointsToday: 0,
          repeatPointsCap: 300,
        },
        rewardLedger: {
          reason: 'tier_completed',
          delta: 125,
        },
        wallet: {
          pointsBalance: 225,
          lifetimePoints: 745,
        },
      });

    const first = await request(app.getHttpServer())
      .post('/v1/quiz/sessions/11111111-1111-4111-8111-111111111111/finish')
      .set(authHeader)
      .expect(201);
    const second = await request(app.getHttpServer())
      .post('/v1/quiz/sessions/11111111-1111-4111-8111-111111111111/finish')
      .set(authHeader)
      .expect(201);

    const firstBody = first.body as EnvelopeResponse<{ idempotent: boolean }>;
    const secondBody = second.body as EnvelopeResponse<{ idempotent: boolean }>;
    expect(firstBody.data.idempotent).toBe(false);
    expect(secondBody.data.idempotent).toBe(true);
  });

  it('/docs-json (GET) should expose OpenAPI document', () => {
    return request(app.getHttpServer())
      .get('/docs-json')
      .expect(200)
      .expect(({ body }: { body: { openapi: string } }) => {
        expect(body.openapi).toBeDefined();
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
