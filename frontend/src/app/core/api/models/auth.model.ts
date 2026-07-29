export interface AuthUser {
  userId: string;
  email: string | null;
}

export interface MeResponse {
  userId: string;
  email: string | null;
  displayName: string | null;
  pointsBalance: number;
  lifetimePoints: number;
  createdAt: string | null;
}
