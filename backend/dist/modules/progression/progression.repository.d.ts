import { DatabaseService } from '../../common/database/database.service';
import type { ProgressOverviewResponseDto } from './dto/progress-overview.dto';
export declare class ProgressionRepository {
    private readonly databaseService;
    constructor(databaseService: DatabaseService);
    getOverview(userId: string): Promise<ProgressOverviewResponseDto>;
}
