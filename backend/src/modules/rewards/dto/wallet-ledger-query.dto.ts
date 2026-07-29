import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class WalletLedgerQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit = 50;
}
