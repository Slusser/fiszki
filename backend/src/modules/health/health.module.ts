import { Controller, Get, Injectable, Module } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { HealthResponseDto } from './dto/health-response.dto';
import type { ReadinessResponseDto } from './dto/readiness-response.dto';

@Injectable()
export class HealthRepository {
  getChecks(): ReadinessResponseDto['checks'] {
    return {
      app: 'ok',
      database: 'unknown',
      supabase: 'not_configured',
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

  getReadiness(): ReadinessResponseDto {
    return {
      status: 'ready',
      checks: this.healthRepository.getChecks(),
      timestamp: new Date().toISOString(),
    };
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
  getReadiness(): ReadinessResponseDto {
    return this.healthService.getReadiness();
  }
}

@Module({
  controllers: [HealthController],
  providers: [HealthService, HealthRepository],
  exports: [HealthService, HealthRepository],
})
export class HealthModule {}
