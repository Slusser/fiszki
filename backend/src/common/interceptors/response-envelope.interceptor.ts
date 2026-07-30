import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { ApiSuccessResponseDto } from '../dto/response-envelope.dto';

type MaybeEnvelope<T> = T | ApiSuccessResponseDto<T>;

@Injectable()
export class ResponseEnvelopeInterceptor<T> implements NestInterceptor<
  T,
  ApiSuccessResponseDto<T>
> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiSuccessResponseDto<T>> {
    return next.handle().pipe(
      map((data: MaybeEnvelope<T>) => {
        if (
          typeof data === 'object' &&
          data !== null &&
          'success' in data &&
          data.success === true &&
          'data' in data
        ) {
          return data;
        }

        return { success: true, data: data as T };
      }),
    );
  }
}
