import type { AuthUserDto } from '../auth/dto/auth-user.dto';
import type { ProgressOverviewResponseDto } from './dto/progress-overview.dto';
import { ProgressionRepository } from './progression.repository';
export declare class ProgressionService {
    private readonly progressionRepository;
    constructor(progressionRepository: ProgressionRepository);
    getOverview(user: AuthUserDto): Promise<ProgressOverviewResponseDto>;
}
