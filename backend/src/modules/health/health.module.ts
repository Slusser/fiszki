import { Controller, Get, Injectable, Module } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DatabaseService } from '../../common/database/database.service';
import type { HealthResponseDto } from './dto/health-response.dto';
import type { ReadinessResponseDto } from './dto/readiness-response.dto';

@Injectable()
export class HealthRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async getChecks(): Promise<ReadinessResponseDto> {
    const hasSupabaseAuthConfig = Boolean(
      process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY,
    );
    const hasDatabaseConfig = Boolean(
      process.env.SUPABASE_DB_URL ?? process.env.DATABASE_URL,
    );

    let databaseStatus: ReadinessResponseDto['checks']['database'] =
      'not_configured';
    const details: ReadinessResponseDto['details'] = {};

    if (hasDatabaseConfig) {
      try {
        await this.databaseService.query<{ ok: number }>('select 1 as ok');
        databaseStatus = 'ok';
      } catch (error) {
        databaseStatus = 'error';
        details.database =
          error instanceof Error ? error.message : 'Database ping failed';
      }
    }

    const supabaseStatus: ReadinessResponseDto['checks']['supabase'] =
      hasSupabaseAuthConfig ? 'ok' : 'not_configured';

    const status: ReadinessResponseDto['status'] =
      databaseStatus === 'error' ? 'degraded' : 'ready';

    return {
      status,
      checks: {
        app: 'ok',
        database: databaseStatus,
        supabase: supabaseStatus,
      },
      ...(details.database ? { details } : {}),
      timestamp: new Date().toISOString(),
    };
  }
}

@Injectable()
export class HealthService {
  constructor(private readonly healthRepository: HealthRepository) {}

  getHealth(): HealthResponseDto {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }

  getReadiness(): Promise<ReadinessResponseDto> {
    return this.healthRepository.getChecks();
  }
}

@Controller('health')
@ApiTags('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Liveness probe endpoint' })
  @ApiOkResponse({ description: 'Service is alive' })
  getHealth(): HealthResponseDto {
    return this.healthService.getHealth();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe endpoint' })
  @ApiOkResponse({ description: 'Service is ready to serve traffic' })
  getReadiness(): Promise<ReadinessResponseDto> {
    return this.healthService.getReadiness();
  }
}

@Module({
  controllers: [HealthController],
  providers: [HealthService, HealthRepository],
  exports: [HealthService, HealthRepository],
})
export class HealthModule {}
