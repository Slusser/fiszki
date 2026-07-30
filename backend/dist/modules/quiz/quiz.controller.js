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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuizController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const throttler_1 = require("@nestjs/throttler");
const auth_guard_1 = require("../auth/auth.guard");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const answer_question_dto_1 = require("./dto/answer-question.dto");
const session_id_param_dto_1 = require("./dto/session-id-param.dto");
const start_quiz_session_dto_1 = require("./dto/start-quiz-session.dto");
const quiz_service_1 = require("./quiz.service");
let QuizController = class QuizController {
    quizService;
    constructor(quizService) {
        this.quizService = quizService;
    }
    startSession(user, payload) {
        return this.quizService.startSession(user, payload);
    }
    getNextQuestion(user, params) {
        return this.quizService.getNextQuestion(user, params.sessionId);
    }
    answerQuestion(user, params, payload) {
        return this.quizService.answerQuestion(user, params.sessionId, payload);
    }
    finishSession(user, params) {
        return this.quizService.finishSession(user, params.sessionId);
    }
};
exports.QuizController = QuizController;
__decorate([
    (0, common_1.Post)('sessions/start'),
    (0, throttler_1.Throttle)({ default: { limit: 20, ttl: 60_000 } }),
    (0, swagger_1.ApiOperation)({ summary: 'Start or resume quiz session' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Quiz session started or resumed' }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Missing or invalid bearer token' }),
    (0, swagger_1.ApiTooManyRequestsResponse)({ description: 'Rate limit exceeded' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, start_quiz_session_dto_1.StartQuizSessionDto]),
    __metadata("design:returntype", Promise)
], QuizController.prototype, "startSession", null);
__decorate([
    (0, common_1.Get)('sessions/:sessionId/next-question'),
    (0, swagger_1.ApiOperation)({ summary: 'Get next quiz question' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Next question or completion state returned' }),
    (0, swagger_1.ApiBadRequestResponse)({ description: 'Session not active' }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Missing or invalid bearer token' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, session_id_param_dto_1.SessionIdParamDto]),
    __metadata("design:returntype", Promise)
], QuizController.prototype, "getNextQuestion", null);
__decorate([
    (0, common_1.Post)('sessions/:sessionId/answer'),
    (0, throttler_1.Throttle)({ default: { limit: 60, ttl: 60_000 } }),
    (0, swagger_1.ApiOperation)({ summary: 'Submit answer for current session question' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Answer processed and progression updated' }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'Invalid token/timestamp or business rule failure',
    }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Missing or invalid bearer token' }),
    (0, swagger_1.ApiTooManyRequestsResponse)({ description: 'Rate limit exceeded' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, session_id_param_dto_1.SessionIdParamDto,
        answer_question_dto_1.AnswerQuestionDto]),
    __metadata("design:returntype", Promise)
], QuizController.prototype, "answerQuestion", null);
__decorate([
    (0, common_1.Post)('sessions/:sessionId/finish'),
    (0, throttler_1.Throttle)({ default: { limit: 20, ttl: 60_000 } }),
    (0, swagger_1.ApiOperation)({ summary: 'Finish session and calculate rewards' }),
    (0, swagger_1.ApiOkResponse)({
        description: 'Session finished and rewards applied (idempotent)',
    }),
    (0, swagger_1.ApiBadRequestResponse)({ description: 'Session cannot be finished yet' }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Missing or invalid bearer token' }),
    (0, swagger_1.ApiTooManyRequestsResponse)({ description: 'Rate limit exceeded' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, session_id_param_dto_1.SessionIdParamDto]),
    __metadata("design:returntype", Promise)
], QuizController.prototype, "finishSession", null);
exports.QuizController = QuizController = __decorate([
    (0, common_1.Controller)('quiz'),
    (0, common_1.UseGuards)(auth_guard_1.SupabaseAuthGuard),
    (0, swagger_1.ApiTags)('quiz'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [quiz_service_1.QuizService])
], QuizController);
//# sourceMappingURL=quiz.controller.js.map