export interface WalletResponse {
  userId: string;
  pointsBalance: number;
  lifetimePoints: number;
  updatedAt: string | null;
}

export interface WalletLedgerQuery {
  limit?: number;
}

export interface WalletLedgerItem {
  id: string;
  reason: string;
  delta: number;
  referenceType: string | null;
  referenceId: string | null;
  createdAt: string;
}

export interface WalletLedgerResponse {
  entries: WalletLedgerItem[];
}
