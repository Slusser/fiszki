import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './common/database/database.module';
import { RequestLoggingMiddleware } from './common/middleware/request-logging.middleware';
import { AuthModule } from './modules/auth/auth.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { HealthModule } from './modules/health/health.module';
import { ProgressionModule } from './modules/progression/progression.module';
import { QuizModule } from './modules/quiz/quiz.module';
import { RewardsModule } from './modules/rewards/rewards.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 120,
      },
    ]),
    DatabaseModule,
    AuthModule,
    UsersModule,
    CatalogModule,
    QuizModule,
    ProgressionModule,
    RewardsModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggingMiddleware).forRoutes('*');
  }
}
