"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuizQuestionTokenService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
let QuizQuestionTokenService = class QuizQuestionTokenService {
    secret = process.env.QUIZ_QUESTION_TOKEN_SECRET ?? 'dev-quiz-question-secret';
    create(payload) {
        const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
        const signature = this.sign(encodedPayload);
        return `${encodedPayload}.${signature}`;
    }
    verify(token) {
        const [encodedPayload, providedSignature] = token.split('.');
        if (!encodedPayload || !providedSignature) {
            throw new common_1.UnauthorizedException('Invalid question token');
        }
        const expectedSignature = this.sign(encodedPayload);
        const providedBuffer = Buffer.from(providedSignature);
        const expectedBuffer = Buffer.from(expectedSignature);
        if (providedBuffer.length !== expectedBuffer.length ||
            !(0, crypto_1.timingSafeEqual)(providedBuffer, expectedBuffer)) {
            throw new common_1.UnauthorizedException('Invalid question token signature');
        }
        try {
            const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
            if (typeof payload.sessionId !== 'string' ||
                typeof payload.userId !== 'string' ||
                typeof payload.wordId !== 'string' ||
                typeof payload.issuedAtMs !== 'number') {
                throw new common_1.UnauthorizedException('Malformed question token payload');
            }
            return payload;
        }
        catch {
            throw new common_1.UnauthorizedException('Malformed question token');
        }
    }
    sign(encodedPayload) {
        return (0, crypto_1.createHmac)('sha256', this.secret)
            .update(encodedPayload)
            .digest('base64url');
    }
};
exports.QuizQuestionTokenService = QuizQuestionTokenService;
exports.QuizQuestionTokenService = QuizQuestionTokenService = __decorate([
    (0, common_1.Injectable)()
], QuizQuestionTokenService);
//# sourceMappingURL=quiz-question-token.service.js.map