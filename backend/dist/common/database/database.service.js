"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var DatabaseService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const common_1 = require("@nestjs/common");
const pg_1 = require("pg");
let DatabaseService = DatabaseService_1 = class DatabaseService {
    logger = new common_1.Logger(DatabaseService_1.name);
    connectionString = process.env.SUPABASE_DB_URL ?? process.env.DATABASE_URL;
    slowQueryThresholdMs = Number(process.env.DB_SLOW_QUERY_MS ?? 150);
    pool = this.connectionString
        ? new pg_1.Pool({ connectionString: this.connectionString })
        : null;
    async query(text, params = []) {
        if (!this.pool) {
            throw new common_1.ServiceUnavailableException('Database connection is not configured');
        }
        const startedAt = Date.now();
        const result = await this.pool.query(text, params);
        const elapsedMs = Date.now() - startedAt;
        if (elapsedMs >= this.slowQueryThresholdMs) {
            this.logger.warn(`Slow query detected (${elapsedMs}ms): ${this.formatSqlForLog(text)}`);
        }
        return result;
    }
    async getClient() {
        if (!this.pool) {
            throw new common_1.ServiceUnavailableException('Database connection is not configured');
        }
        return this.pool.connect();
    }
    async onModuleDestroy() {
        if (this.pool) {
            await this.pool.end();
        }
    }
    formatSqlForLog(sql) {
        return sql.replace(/\s+/g, ' ').trim().slice(0, 220);
    }
};
exports.DatabaseService = DatabaseService;
exports.DatabaseService = DatabaseService = DatabaseService_1 = __decorate([
    (0, common_1.Injectable)()
], DatabaseService);
//# sourceMappingURL=database.service.js.map