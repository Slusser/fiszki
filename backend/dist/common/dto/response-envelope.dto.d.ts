export interface ApiSuccessResponseDto<T> {
    success: true;
    data: T;
}
export interface ApiErrorResponseDto {
    success: false;
    error: {
        code: string;
        message: string;
        details?: unknown;
    };
    timestamp: string;
    path: string;
}
