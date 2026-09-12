import type { PoolClient } from 'pg';

export type AnalyticsProvider = 'openrouter' | 'gemini';
export type GenerationFailureKind = 'not-configured' | 'provider-request' | 'invalid-answer';

export class PgAnalyticsStore {
  constructor(private readonly client: Pick<PoolClient, 'query'>) {}

  async recordGenerationFailure(provider: AnalyticsProvider, kind: GenerationFailureKind): Promise<void> {
    await this.client.query('SELECT public.coach_record_generation_failure($1,$2)', [provider, kind]);
  }

  async readDashboard(days: 7 | 30 | 90): Promise<unknown> {
    const result = await this.client.query('SELECT public.coach_admin_analytics($1) AS analytics', [days]);
    return result.rows[0]?.analytics;
  }
}
