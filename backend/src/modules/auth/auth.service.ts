import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthRepository } from './auth.repository';
import { AuthUserDto } from './dto/auth-user.dto';

@Injectable()
export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  async verifyAccessToken(accessToken: string): Promise<AuthUserDto> {
    const user = await this.authRepository.getUserByAccessToken(accessToken);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    return {
      userId: user.id,
      email: user.email ?? null,
    };
  }
}
