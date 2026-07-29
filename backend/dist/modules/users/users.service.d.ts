import { AuthUserDto } from '../auth/dto/auth-user.dto';
import { MeResponseDto } from './dto/me-response.dto';
import { UsersRepository } from './users.repository';
export declare class UsersService {
    private readonly usersRepository;
    constructor(usersRepository: UsersRepository);
    getMe(user: AuthUserDto): Promise<MeResponseDto>;
}
