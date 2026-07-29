import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import type { AuthUserDto } from '../auth/dto/auth-user.dto';
import type { MeResponseDto } from './dto/me-response.dto';
import { UsersService } from './users.service';

@Controller()
@ApiTags('users')
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({ summary: 'Get current user profile and wallet snapshot' })
  @ApiOkResponse({ description: 'Current user profile returned' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  getMe(@CurrentUser() user: AuthUserDto): Promise<MeResponseDto> {
    return this.usersService.getMe(user);
  }
}
