import { Injectable } from '@nestjs/common';
import type { AuthUserDto } from '../auth/dto/auth-user.dto';
import type { ProgressOverviewResponseDto } from './dto/progress-overview.dto';
import { ProgressionRepository } from './progression.repository';

@Injectable()
export class ProgressionService {
  constructor(private readonly progressionRepository: ProgressionRepository) {}

  getOverview(user: AuthUserDto): Promise<ProgressOverviewResponseDto> {
    return this.progressionRepository.getOverview(user.userId);
  }
}
