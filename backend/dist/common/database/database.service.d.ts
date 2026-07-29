import { OnModuleDestroy } from '@nestjs/common';
import { type PoolClient, type QueryResult, type QueryResultRow } from 'pg';
export declare class DatabaseService implements OnModuleDestroy {
    private readonly logger;
    private readonly connectionString;
    private readonly slowQueryThresholdMs;
    private readonly pool;
    query<T extends QueryResultRow>(text: string, params?: unknown[]): Promise<QueryResult<T>>;
    getClient(): Promise<PoolClient>;
    onModuleDestroy(): Promise<void>;
    private formatSqlForLog;
}
