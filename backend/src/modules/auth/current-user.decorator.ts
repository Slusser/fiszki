import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUserDto } from './dto/auth-user.dto';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUserDto => {
    const request = context.switchToHttp().getRequest<{ user: AuthUserDto }>();
    return request.user;
  },
);
