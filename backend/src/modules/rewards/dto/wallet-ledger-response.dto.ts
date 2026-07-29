export interface WalletLedgerItemDto {
  id: string;
  reason: string;
  delta: number;
  referenceType: string | null;
  referenceId: string | null;
  createdAt: string;
}

export interface WalletLedgerResponseDto {
  entries: WalletLedgerItemDto[];
}
