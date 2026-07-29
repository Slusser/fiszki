import type { AuthUserDto } from './dto/auth-user.dto';
export declare class AuthController {
    logout(user: AuthUserDto): {
        loggedOut: true;
        userId: string;
    };
}
