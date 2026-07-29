import { Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from './current-user.decorator';
import type { AuthUserDto } from './dto/auth-user.dto';
import { SupabaseAuthGuard } from './auth.guard';

@Controller('auth')
@ApiTags('auth')
@ApiBearerAuth()
export class AuthController {
  @Post('logout')
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({ summary: 'Logout (backend auth check endpoint)' })
  @ApiOkResponse({ description: 'User token accepted and logout acknowledged' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  logout(@CurrentUser() user: AuthUserDto): { loggedOut: true; userId: string } {
    return { loggedOut: true, userId: user.userId };
  }
}
