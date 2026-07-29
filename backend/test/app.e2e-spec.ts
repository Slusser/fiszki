import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { ResponseEnvelopeInterceptor } from '../src/common/interceptors/response-envelope.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('v1');
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
      .expect(({ body }: { body: { success: boolean; data: { status: string } } }) => {
        expect(body.success).toBe(true);
        expect(body.data.status).toBe('ok');
      });
  });

  it('/v1/health/ready (GET)', () => {
    return request(app.getHttpServer())
      .get('/v1/health/ready')
      .expect(200)
      .expect(
        ({
          body,
        }: {
          body: { success: boolean; data: { status: string; checks: { app: string } } };
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
    return request(app.getHttpServer()).get('/v1/catalog/categories').expect(401);
  });

  it('/v1/quiz/sessions/start (POST) should reject anonymous request', () => {
    return request(app.getHttpServer())
      .post('/v1/quiz/sessions/start')
      .send({ categoryId: '00000000-0000-4000-8000-000000000001', tier: 'easy' })
      .expect(401);
  });

  it('/v1/progress/overview (GET) should reject anonymous request', () => {
    return request(app.getHttpServer()).get('/v1/progress/overview').expect(401);
  });

  it('/v1/wallet (GET) should reject anonymous request', () => {
    return request(app.getHttpServer()).get('/v1/wallet').expect(401);
  });

  it('/v1/wallet/ledger (GET) should reject anonymous request', () => {
    return request(app.getHttpServer()).get('/v1/wallet/ledger').expect(401);
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
