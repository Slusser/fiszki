import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUserDto } from '../auth/dto/auth-user.dto';
import type { ProgressOverviewResponseDto } from './dto/progress-overview.dto';
import { ProgressionService } from './progression.service';

@Controller('progress')
@UseGuards(SupabaseAuthGuard)
@ApiTags('progress')
@ApiBearerAuth()
export class ProgressionController {
  constructor(private readonly progressionService: ProgressionService) {}

  @Get('overview')
  @ApiOperation({
    summary: 'Get user progression overview across categories and tiers',
  })
  @ApiOkResponse({ description: 'Progress overview returned' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  getOverview(
    @CurrentUser() user: AuthUserDto,
  ): Promise<ProgressOverviewResponseDto> {
    return this.progressionService.getOverview(user);
  }
}
