import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { AuthUserDto } from './dto/auth-user.dto';

type RequestWithUser = Request & { user?: AuthUserDto };

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    request.user = await this.authService.verifyAccessToken(token);
    return true;
  }

  private extractBearerToken(request: Request): string | null {
    const rawHeader = request.headers.authorization;
    if (!rawHeader) {
      return null;
    }

    const [type, token] = rawHeader.split(' ');
    if (type?.toLowerCase() !== 'bearer' || !token) {
      return null;
    }

    return token;
  }
}
