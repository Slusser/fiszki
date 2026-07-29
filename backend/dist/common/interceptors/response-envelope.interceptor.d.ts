import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ApiSuccessResponseDto } from '../dto/response-envelope.dto';
export declare class ResponseEnvelopeInterceptor<T> implements NestInterceptor<T, ApiSuccessResponseDto<T>> {
    intercept(_context: ExecutionContext, next: CallHandler): Observable<ApiSuccessResponseDto<T>>;
}
