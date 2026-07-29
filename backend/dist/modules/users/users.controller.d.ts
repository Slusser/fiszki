import type { AuthUserDto } from '../auth/dto/auth-user.dto';
import type { MeResponseDto } from './dto/me-response.dto';
import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getMe(user: AuthUserDto): Promise<MeResponseDto>;
}
