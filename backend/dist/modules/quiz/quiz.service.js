"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var QuizService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuizService = void 0;
const common_1 = require("@nestjs/common");
const quiz_question_token_service_1 = require("./quiz-question-token.service");
const quiz_repository_1 = require("./quiz.repository");
const QUESTION_TIMEOUT_MS = 30_000;
let QuizService = QuizService_1 = class QuizService {
    quizRepository;
    quizQuestionTokenService;
    logger = new common_1.Logger(QuizService_1.name);
    constructor(quizRepository, quizQuestionTokenService) {
        this.quizRepository = quizRepository;
        this.quizQuestionTokenService = quizQuestionTokenService;
    }
    startSession(user, payload) {
        const startedAt = Date.now();
        return this.quizRepository
            .startSession(user.userId, payload.categoryId, payload.tier)
            .finally(() => {
            this.logger.debug(`startSession user=${user.userId} tier=${payload.tier} took=${Date.now() - startedAt}ms`);
        });
    }
    async getNextQuestion(user, sessionId) {
        const startedAt = Date.now();
        const session = await this.quizRepository.getSessionOrThrow(sessionId, user.userId);
        const progress = await this.quizRepository.getSessionProgressMeta(session.id, session.category_id, session.tier);
        const candidate = await this.quizRepository.getNextQuestionCandidate(session.id, session.category_id, session.tier);
        if (!candidate) {
            const response = {
                sessionId: session.id,
                categoryId: session.category_id,
                tier: session.tier,
                completed: true,
                progress,
                question: null,
            };
            this.logger.debug(`nextQuestion user=${user.userId} session=${sessionId} completed=true took=${Date.now() - startedAt}ms`);
            return response;
        }
        const distractors = await this.quizRepository.getDistractors(session.category_id, session.tier, candidate.id);
        const options = this.shuffle([candidate.target_word, ...distractors]);
        const issuedAtMs = Date.now();
        const questionToken = this.quizQuestionTokenService.create({
            sessionId: session.id,
            userId: user.userId,
            wordId: candidate.id,
            issuedAtMs,
        });
        const response = {
            sessionId: session.id,
            categoryId: session.category_id,
            tier: session.tier,
            completed: false,
            progress,
            question: {
                wordId: candidate.id,
                prompt: candidate.source_word,
                options,
                issuedAt: new Date(issuedAtMs).toISOString(),
                questionToken,
            },
        };
        this.logger.debug(`nextQuestion user=${user.userId} session=${sessionId} took=${Date.now() - startedAt}ms`);
        return response;
    }
    async answerQuestion(user, sessionId, payload) {
        const startedAt = Date.now();
        const session = await this.quizRepository.getSessionOrThrow(sessionId, user.userId);
        const tokenPayload = this.quizQuestionTokenService.verify(payload.questionToken);
        if (tokenPayload.sessionId !== session.id || tokenPayload.userId !== user.userId) {
            throw new common_1.UnauthorizedException('Question token does not match current session');
        }
        const elapsedMs = Date.now() - tokenPayload.issuedAtMs;
        if (elapsedMs < 0) {
            throw new common_1.BadRequestException('Question token timestamp is invalid');
        }
        const word = await this.quizRepository.validateSessionWord(session.id, session.category_id, session.tier, tokenPayload.wordId);
        const wasTimeout = elapsedMs > QUESTION_TIMEOUT_MS;
        const normalizedSelectedOption = payload.selectedOption.trim();
        const isCorrect = !wasTimeout && normalizedSelectedOption === word.target_word;
        const recordedOption = wasTimeout ? '__timeout__' : normalizedSelectedOption;
        const result = await this.quizRepository.saveAnswerAndUpdateProgress({
            userId: user.userId,
            sessionId: session.id,
            categoryId: session.category_id,
            tier: session.tier,
            wordId: word.id,
            selectedOption: recordedOption,
            isCorrect,
        });
        const response = {
            sessionId: session.id,
            wordId: word.id,
            isCorrect,
            wasTimeout,
            recordedOption,
            progress: result.sessionProgress,
            wordProgress: result.wordProgress,
        };
        this.logger.debug(`answerQuestion user=${user.userId} session=${sessionId} timeout=${wasTimeout} took=${Date.now() - startedAt}ms`);
        return response;
    }
    finishSession(user, sessionId) {
        const startedAt = Date.now();
        return this.quizRepository.finishSession(user.userId, sessionId).finally(() => {
            this.logger.debug(`finishSession user=${user.userId} session=${sessionId} took=${Date.now() - startedAt}ms`);
        });
    }
    shuffle(items) {
        const arr = [...items];
        for (let i = arr.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }
};
exports.QuizService = QuizService;
exports.QuizService = QuizService = QuizService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [quiz_repository_1.QuizRepository,
        quiz_question_token_service_1.QuizQuestionTokenService])
], QuizService);
//# sourceMappingURL=quiz.service.js.map