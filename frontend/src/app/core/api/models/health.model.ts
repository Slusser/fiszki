export interface HealthResponse {
  status: 'ok';
  timestamp: string;
  uptimeSeconds: number;
}

export interface ReadinessResponse {
  status: 'ready';
  checks: {
    app: 'ok';
    database: 'unknown';
    supabase: 'not_configured';
  };
  timestamp: string;
}
