import type { AuthUserDto } from '../auth/dto/auth-user.dto';
import type { AnswerQuestionDto } from './dto/answer-question.dto';
import type { AnswerQuestionResponseDto } from './dto/answer-question-response.dto';
import type { FinishQuizSessionResponseDto } from './dto/finish-quiz-session-response.dto';
import type { NextQuestionResponseDto } from './dto/next-question-response.dto';
import type { StartQuizSessionResponseDto } from './dto/start-quiz-session-response.dto';
import type { StartQuizSessionDto } from './dto/start-quiz-session.dto';
import { QuizQuestionTokenService } from './quiz-question-token.service';
import { QuizRepository } from './quiz.repository';
export declare class QuizService {
    private readonly quizRepository;
    private readonly quizQuestionTokenService;
    private readonly logger;
    constructor(quizRepository: QuizRepository, quizQuestionTokenService: QuizQuestionTokenService);
    startSession(user: AuthUserDto, payload: StartQuizSessionDto): Promise<StartQuizSessionResponseDto>;
    getNextQuestion(user: AuthUserDto, sessionId: string): Promise<NextQuestionResponseDto>;
    answerQuestion(user: AuthUserDto, sessionId: string, payload: AnswerQuestionDto): Promise<AnswerQuestionResponseDto>;
    finishSession(user: AuthUserDto, sessionId: string): Promise<FinishQuizSessionResponseDto>;
    private shuffle;
}
