export interface MeResponseDto {
    userId: string;
    email: string | null;
    displayName: string | null;
    pointsBalance: number;
    lifetimePoints: number;
    createdAt: string | null;
}
