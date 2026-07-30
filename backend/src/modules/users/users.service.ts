import { Injectable } from '@nestjs/common';
import { AuthUserDto } from '../auth/dto/auth-user.dto';
import { MeResponseDto } from './dto/me-response.dto';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async getMe(user: AuthUserDto): Promise<MeResponseDto> {
    const profileAndWallet = await this.usersRepository.getProfileAndWallet(
      user.userId,
    );

    return {
      ...profileAndWallet,
      email: user.email,
    };
  }
}
