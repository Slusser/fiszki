import { DatabaseService } from '../../common/database/database.service';
import type { HealthResponseDto } from './dto/health-response.dto';
import type { ReadinessResponseDto } from './dto/readiness-response.dto';
export declare class HealthRepository {
    private readonly databaseService;
    constructor(databaseService: DatabaseService);
    getChecks(): Promise<ReadinessResponseDto>;
}
export declare class HealthService {
    private readonly healthRepository;
    constructor(healthRepository: HealthRepository);
    getHealth(): HealthResponseDto;
    getReadiness(): Promise<ReadinessResponseDto>;
}
export declare class HealthController {
    private readonly healthService;
    constructor(healthService: HealthService);
    getHealth(): HealthResponseDto;
    getReadiness(): Promise<ReadinessResponseDto>;
}
export declare class HealthModule {
}
