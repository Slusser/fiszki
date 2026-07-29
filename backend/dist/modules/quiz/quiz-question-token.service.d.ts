interface QuestionTokenPayload {
    sessionId: string;
    userId: string;
    wordId: string;
    issuedAtMs: number;
}
export declare class QuizQuestionTokenService {
    private readonly secret;
    create(payload: QuestionTokenPayload): string;
    verify(token: string): QuestionTokenPayload;
    private sign;
}
export {};
