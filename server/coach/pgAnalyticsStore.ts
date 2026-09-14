import type { PoolClient } from 'pg';

export type AnalyticsProvider = 'openrouter' | 'gemini';
export type GenerationFailureKind = 'not-configured' | 'provider-request' | 'invalid-answer';
export type TokenUsagePhase = 'understanding' | 'generation' | 'answer-review' | 'visual-review';

export class PgAnalyticsStore {
  constructor(private readonly client: Pick<PoolClient, 'query'>) {}

  async recordGenerationFailure(provider: AnalyticsProvider, kind: GenerationFailureKind): Promise<void> {
    await this.client.query('SELECT public.coach_record_generation_failure($1,$2)', [provider, kind]);
  }

  async recordTokenUsage(provider: AnalyticsProvider, phase: TokenUsagePhase, inputTokens: number, outputTokens: number): Promise<void> {
    await this.client.query('SELECT public.coach_record_token_usage($1,$2,$3,$4)', [provider, phase, inputTokens, outputTokens]);
  }

  async readDashboard(days: 7 | 30 | 90): Promise<unknown> {
    const [analyticsResult, tokenUsageResult] = await Promise.all([
      this.client.query('SELECT public.coach_admin_analytics($1) AS analytics', [days]),
      this.client.query('SELECT public.coach_admin_token_usage($1) AS token_usage', [days]),
    ]);
    return { ...analyticsResult.rows[0]?.analytics, tokenUsage: tokenUsageResult.rows[0]?.token_usage };
  }
}
