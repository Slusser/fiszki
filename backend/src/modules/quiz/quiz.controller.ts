import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUserDto } from '../auth/dto/auth-user.dto';
import { AnswerQuestionDto } from './dto/answer-question.dto';
import type { AnswerQuestionResponseDto } from './dto/answer-question-response.dto';
import type { FinishQuizSessionResponseDto } from './dto/finish-quiz-session-response.dto';
import type { NextQuestionResponseDto } from './dto/next-question-response.dto';
import { SessionIdParamDto } from './dto/session-id-param.dto';
import type { StartQuizSessionResponseDto } from './dto/start-quiz-session-response.dto';
import { StartQuizSessionDto } from './dto/start-quiz-session.dto';
import { QuizService } from './quiz.service';

@Controller('quiz')
@UseGuards(SupabaseAuthGuard)
@ApiTags('quiz')
@ApiBearerAuth()
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Post('sessions/start')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: 'Start or resume quiz session' })
  @ApiOkResponse({ description: 'Quiz session started or resumed' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiTooManyRequestsResponse({ description: 'Rate limit exceeded' })
  startSession(
    @CurrentUser() user: AuthUserDto,
    @Body() payload: StartQuizSessionDto,
  ): Promise<StartQuizSessionResponseDto> {
    return this.quizService.startSession(user, payload);
  }

  @Get('sessions/:sessionId/next-question')
  @ApiOperation({ summary: 'Get next quiz question' })
  @ApiOkResponse({ description: 'Next question or completion state returned' })
  @ApiBadRequestResponse({ description: 'Session not active' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  getNextQuestion(
    @CurrentUser() user: AuthUserDto,
    @Param() params: SessionIdParamDto,
  ): Promise<NextQuestionResponseDto> {
    return this.quizService.getNextQuestion(user, params.sessionId);
  }

  @Post('sessions/:sessionId/answer')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @ApiOperation({ summary: 'Submit answer for current session question' })
  @ApiOkResponse({ description: 'Answer processed and progression updated' })
  @ApiBadRequestResponse({
    description: 'Invalid token/timestamp or business rule failure',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiTooManyRequestsResponse({ description: 'Rate limit exceeded' })
  answerQuestion(
    @CurrentUser() user: AuthUserDto,
    @Param() params: SessionIdParamDto,
    @Body() payload: AnswerQuestionDto,
  ): Promise<AnswerQuestionResponseDto> {
    return this.quizService.answerQuestion(user, params.sessionId, payload);
  }

  @Post('sessions/:sessionId/finish')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: 'Finish session and calculate rewards' })
  @ApiOkResponse({
    description: 'Session finished and rewards applied (idempotent)',
  })
  @ApiBadRequestResponse({ description: 'Session cannot be finished yet' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiTooManyRequestsResponse({ description: 'Rate limit exceeded' })
  finishSession(
    @CurrentUser() user: AuthUserDto,
    @Param() params: SessionIdParamDto,
  ): Promise<FinishQuizSessionResponseDto> {
    return this.quizService.finishSession(user, params.sessionId);
  }
}
