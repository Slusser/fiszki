import type { HealthResponseDto } from './dto/health-response.dto';
import type { ReadinessResponseDto } from './dto/readiness-response.dto';
export declare class HealthRepository {
    getChecks(): ReadinessResponseDto['checks'];
}
export declare class HealthService {
    private readonly healthRepository;
    constructor(healthRepository: HealthRepository);
    getHealth(): HealthResponseDto;
    getReadiness(): ReadinessResponseDto;
}
export declare class HealthController {
    private readonly healthService;
    constructor(healthService: HealthService);
    getHealth(): HealthResponseDto;
    getReadiness(): ReadinessResponseDto;
}
export declare class HealthModule {
}
