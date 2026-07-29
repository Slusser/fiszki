import { AuthRepository } from './auth.repository';
import { AuthUserDto } from './dto/auth-user.dto';
export declare class AuthService {
    private readonly authRepository;
    constructor(authRepository: AuthRepository);
    verifyAccessToken(accessToken: string): Promise<AuthUserDto>;
}
