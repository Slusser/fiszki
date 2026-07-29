export interface ReadinessResponseDto {
  status: 'ready';
  checks: {
    app: 'ok';
    database: 'unknown';
    supabase: 'not_configured';
  };
  timestamp: string;
}
