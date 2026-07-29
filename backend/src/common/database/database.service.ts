import { Injectable, Logger, OnModuleDestroy, ServiceUnavailableException } from '@nestjs/common';
import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private readonly connectionString = process.env.SUPABASE_DB_URL ?? process.env.DATABASE_URL;
  private readonly slowQueryThresholdMs = Number(process.env.DB_SLOW_QUERY_MS ?? 150);
  private readonly pool = this.connectionString
    ? new Pool({ connectionString: this.connectionString })
    : null;

  async query<T extends QueryResultRow>(
    text: string,
    params: unknown[] = [],
  ): Promise<QueryResult<T>> {
    if (!this.pool) {
      throw new ServiceUnavailableException('Database connection is not configured');
    }

    const startedAt = Date.now();
    const result = await this.pool.query<T>(text, params);
    const elapsedMs = Date.now() - startedAt;

    if (elapsedMs >= this.slowQueryThresholdMs) {
      this.logger.warn(
        `Slow query detected (${elapsedMs}ms): ${this.formatSqlForLog(text)}`,
      );
    }

    return result;
  }

  async getClient(): Promise<PoolClient> {
    if (!this.pool) {
      throw new ServiceUnavailableException('Database connection is not configured');
    }

    return this.pool.connect();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
    }
  }

  private formatSqlForLog(sql: string): string {
    return sql.replace(/\s+/g, ' ').trim().slice(0, 220);
  }
}
