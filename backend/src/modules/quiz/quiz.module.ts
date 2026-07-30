import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RewardsModule } from '../rewards/rewards.module';
import { QuizController } from './quiz.controller';
import { QuizQuestionTokenService } from './quiz-question-token.service';
import { QuizRepository } from './quiz.repository';
import { QuizService } from './quiz.service';

@Module({
  imports: [AuthModule, RewardsModule],
  controllers: [QuizController],
  providers: [QuizService, QuizRepository, QuizQuestionTokenService],
  exports: [QuizService],
})
export class QuizModule {}
