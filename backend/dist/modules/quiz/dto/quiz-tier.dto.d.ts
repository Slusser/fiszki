export declare const QUIZ_TIERS: readonly ["easy", "hard", "expert"];
export type QuizTier = (typeof QUIZ_TIERS)[number];
export declare class QuizTierDto {
    tier: QuizTier;
}
