import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import type { Actor } from '../auth/middleware';
import type { SaveCoachFeedbackInput, ReviewCoachFeedbackInput, CoachFeedbackRecord, CoachFeedbackStatus } from './feedbackStore';
function map(row: any): CoachFeedbackRecord {
  return { id: row.id, responseId: row.response_id, query: row.query, answer: row.answer, rating: row.rating,
    issueType: row.issue_type, comment: row.comment, suggestedAnswer: row.suggested_answer,
    screenshotIds: row.screenshot_ids_json, retrievalDocumentIds: row.retrieval_document_ids_json,
    provider: row.provider, intentId: row.intent_id, status: row.status, reviewerId: row.reviewer_id,
    reviewNote: row.review_note, createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString() };
}
export class PgFeedbackStore {
  constructor(private readonly client: PoolClient, private readonly actor: Actor) {}
  async save(input: SaveCoachFeedbackInput) {
    const result = await this.client.query(`INSERT INTO public.coach_feedback (
      id,organization_id,user_id,response_id,query,answer,rating,issue_type,comment,suggested_answer,
      screenshot_ids_json,retrieval_document_ids_json,provider,intent_id,status
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
    ON CONFLICT (organization_id,user_id,response_id) DO UPDATE SET
      query=excluded.query,answer=excluded.answer,rating=excluded.rating,issue_type=excluded.issue_type,
      comment=excluded.comment,suggested_answer=excluded.suggested_answer,screenshot_ids_json=excluded.screenshot_ids_json,
      retrieval_document_ids_json=excluded.retrieval_document_ids_json,provider=excluded.provider,intent_id=excluded.intent_id,
      status=excluded.status,reviewer_id=NULL,review_note='',updated_at=now() RETURNING *`,
      [randomUUID(),this.actor.organization_id,this.actor.id,input.responseId,input.query,input.answer,input.rating,
       input.issueType || null,input.comment || '',input.suggestedAnswer || '',JSON.stringify(input.screenshotIds || []),
       JSON.stringify(input.retrievalDocumentIds || []),input.provider || '',input.intentId || '',input.rating === 'helpful' ? 'recorded' : 'pending']);
    return map(result.rows[0]);
  }
  async list(options: { status?: CoachFeedbackStatus; limit?: number; mine?: boolean }) {
    const result = await this.client.query(`SELECT * FROM public.coach_feedback
      WHERE ($1::text IS NULL OR status=$1) AND ($2::uuid IS NULL OR user_id=$2)
      ORDER BY created_at DESC,id DESC LIMIT $3`, [options.status || null,options.mine ? this.actor.id : null,Math.max(1,Math.min(Math.floor(options.limit || 100),500))]);
    return result.rows.map(map);
  }
  async review(id: string, input: ReviewCoachFeedbackInput) {
    if (!/^[a-f0-9-]{36}$/i.test(id)) return undefined;
    const result = await this.client.query(`UPDATE public.coach_feedback SET status=$1,reviewer_id=$2,review_note=$3,updated_at=now()
      WHERE id=$4 AND status='pending' RETURNING *`, [input.status,this.actor.id,input.reviewNote || '',id]);
    return result.rows[0] ? map(result.rows[0]) : undefined;
  }
}
