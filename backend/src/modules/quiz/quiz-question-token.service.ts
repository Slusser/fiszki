import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';

interface QuestionTokenPayload {
  sessionId: string;
  userId: string;
  wordId: string;
  issuedAtMs: number;
}

@Injectable()
export class QuizQuestionTokenService {
  private readonly secret = process.env.QUIZ_QUESTION_TOKEN_SECRET ?? 'dev-quiz-question-secret';

  create(payload: QuestionTokenPayload): string {
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = this.sign(encodedPayload);
    return `${encodedPayload}.${signature}`;
  }

  verify(token: string): QuestionTokenPayload {
    const [encodedPayload, providedSignature] = token.split('.');
    if (!encodedPayload || !providedSignature) {
      throw new UnauthorizedException('Invalid question token');
    }

    const expectedSignature = this.sign(encodedPayload);
    const providedBuffer = Buffer.from(providedSignature);
    const expectedBuffer = Buffer.from(expectedSignature);
    if (
      providedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(providedBuffer, expectedBuffer)
    ) {
      throw new UnauthorizedException('Invalid question token signature');
    }

    try {
      const payload = JSON.parse(
        Buffer.from(encodedPayload, 'base64url').toString('utf8'),
      ) as QuestionTokenPayload;

      if (
        typeof payload.sessionId !== 'string' ||
        typeof payload.userId !== 'string' ||
        typeof payload.wordId !== 'string' ||
        typeof payload.issuedAtMs !== 'number'
      ) {
        throw new UnauthorizedException('Malformed question token payload');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Malformed question token');
    }
  }

  private sign(encodedPayload: string): string {
    return createHmac('sha256', this.secret).update(encodedPayload).digest('base64url');
  }
}
