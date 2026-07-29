import type { AuthUserDto } from '../auth/dto/auth-user.dto';
import { AnswerQuestionDto } from './dto/answer-question.dto';
import type { AnswerQuestionResponseDto } from './dto/answer-question-response.dto';
import type { FinishQuizSessionResponseDto } from './dto/finish-quiz-session-response.dto';
import type { NextQuestionResponseDto } from './dto/next-question-response.dto';
import { SessionIdParamDto } from './dto/session-id-param.dto';
import type { StartQuizSessionResponseDto } from './dto/start-quiz-session-response.dto';
import { StartQuizSessionDto } from './dto/start-quiz-session.dto';
import { QuizService } from './quiz.service';
export declare class QuizController {
    private readonly quizService;
    constructor(quizService: QuizService);
    startSession(user: AuthUserDto, payload: StartQuizSessionDto): Promise<StartQuizSessionResponseDto>;
    getNextQuestion(user: AuthUserDto, params: SessionIdParamDto): Promise<NextQuestionResponseDto>;
    answerQuestion(user: AuthUserDto, params: SessionIdParamDto, payload: AnswerQuestionDto): Promise<AnswerQuestionResponseDto>;
    finishSession(user: AuthUserDto, params: SessionIdParamDto): Promise<FinishQuizSessionResponseDto>;
}
