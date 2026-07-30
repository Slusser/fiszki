export interface ReadinessResponseDto {
    status: 'ready' | 'degraded';
    checks: {
        app: 'ok';
        database: 'ok' | 'error' | 'not_configured';
        supabase: 'ok' | 'not_configured';
    };
    details?: {
        database?: string;
    };
    timestamp: string;
}
