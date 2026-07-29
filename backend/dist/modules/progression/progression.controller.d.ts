import type { AuthUserDto } from '../auth/dto/auth-user.dto';
import type { ProgressOverviewResponseDto } from './dto/progress-overview.dto';
import { ProgressionService } from './progression.service';
export declare class ProgressionController {
    private readonly progressionService;
    constructor(progressionService: ProgressionService);
    getOverview(user: AuthUserDto): Promise<ProgressOverviewResponseDto>;
}
