import type { PoolClient } from 'pg';
import type { Actor } from '../auth/middleware';
import type { ConversationState } from '../../src/coach/responseEngine';

export interface SaveCoachQueryInput {
  id: string;
  query: string;
  answer: string;
  provider: 'openrouter' | 'gemini';
  mode: ConversationState['mode'];
  retrievalDocumentIds?: string[];
  screenshotIds?: string[];
}

export class PgQueryStore {
  constructor(private readonly client: Pick<PoolClient, 'query'>, private readonly actor: Actor) {}

  async save(input: SaveCoachQueryInput): Promise<string> {
    const result = await this.client.query(
      `INSERT INTO public.coach_query_logs (
        id,organization_id,user_id,query,answer,provider,mode,retrieval_document_ids,screenshot_ids
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      ON CONFLICT(id) DO NOTHING RETURNING id`,
      [
        input.id,
        this.actor.organization_id,
        this.actor.id,
        input.query,
        input.answer,
        input.provider,
        input.mode,
        JSON.stringify(input.retrievalDocumentIds ?? []),
        JSON.stringify(input.screenshotIds ?? []),
      ],
    );
    return result.rows[0]?.id ?? input.id;
  }
}
