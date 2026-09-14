import { randomUUID } from 'node:crypto';
import Database from 'better-sqlite3';

export type CoachFeedbackRating = 'helpful' | 'unhelpful';
export type CoachFeedbackIssueType =
  | 'wrong-answer'
  | 'wrong-screenshots'
  | 'missing-information'
  | 'other';
export type CoachFeedbackStatus = 'recorded' | 'pending' | 'approved' | 'dismissed';

export interface SaveCoachFeedbackInput {
  responseId: string;
  query: string;
  answer: string;
  rating: CoachFeedbackRating;
  issueType?: CoachFeedbackIssueType;
  comment?: string;
  suggestedAnswer?: string;
  screenshotIds?: string[];
  retrievalDocumentIds?: string[];
  provider?: string;
  intentId?: string;
}

export interface ReviewCoachFeedbackInput {
  status: 'approved' | 'dismissed';
  reviewerId: string;
  reviewNote?: string;
  suggestedAnswer?: string;
}

export interface CoachFeedbackRecord extends SaveCoachFeedbackInput {
  id: string;
  status: CoachFeedbackStatus;
  screenshotIds: string[];
  retrievalDocumentIds: string[];
  reviewerId?: string;
  reviewNote?: string;
  createdAt: string;
  updatedAt: string;
}

interface CoachFeedbackRow {
  id: string;
  response_id: string;
  query: string;
  answer: string;
  rating: CoachFeedbackRating;
  issue_type: CoachFeedbackIssueType | null;
  comment: string;
  suggested_answer: string;
  screenshot_ids_json: string;
  retrieval_document_ids_json: string;
  provider: string;
  intent_id: string;
  status: CoachFeedbackStatus;
  reviewer_id: string | null;
  review_note: string;
  created_at: string;
  updated_at: string;
}

export function initializeCoachFeedbackSchema(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS coach_feedback (
      id TEXT PRIMARY KEY,
      response_id TEXT NOT NULL UNIQUE,
      query TEXT NOT NULL,
      answer TEXT NOT NULL,
      rating TEXT NOT NULL CHECK(rating IN ('helpful','unhelpful')),
      issue_type TEXT DEFAULT NULL CHECK(issue_type IS NULL OR issue_type IN ('wrong-answer','wrong-screenshots','missing-information','other')),
      comment TEXT NOT NULL DEFAULT '',
      suggested_answer TEXT NOT NULL DEFAULT '',
      screenshot_ids_json TEXT NOT NULL DEFAULT '[]',
      retrieval_document_ids_json TEXT NOT NULL DEFAULT '[]',
      provider TEXT NOT NULL DEFAULT '',
      intent_id TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL CHECK(status IN ('recorded','pending','approved','dismissed')),
      reviewer_id TEXT DEFAULT NULL,
      review_note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_coach_feedback_status_created
      ON coach_feedback(status, created_at DESC);
  `);

  // Existing local databases predate intent auditing, so keep startup migration additive.
  const columns = database.prepare('PRAGMA table_info(coach_feedback)').all() as { name: string }[];
  if (!columns.some(({ name }) => name === 'intent_id')) {
    database.exec("ALTER TABLE coach_feedback ADD COLUMN intent_id TEXT NOT NULL DEFAULT ''");
  }
}

function parseStringArray(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function mapRow(row: CoachFeedbackRow): CoachFeedbackRecord {
  return {
    id: row.id,
    responseId: row.response_id,
    query: row.query,
    answer: row.answer,
    rating: row.rating,
    ...(row.issue_type ? { issueType: row.issue_type } : {}),
    ...(row.comment ? { comment: row.comment } : {}),
    ...(row.suggested_answer ? { suggestedAnswer: row.suggested_answer } : {}),
    screenshotIds: parseStringArray(row.screenshot_ids_json),
    retrievalDocumentIds: parseStringArray(row.retrieval_document_ids_json),
    ...(row.provider ? { provider: row.provider } : {}),
    ...(row.intent_id ? { intentId: row.intent_id } : {}),
    status: row.status,
    ...(row.reviewer_id ? { reviewerId: row.reviewer_id } : {}),
    ...(row.review_note ? { reviewNote: row.review_note } : {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class CoachFeedbackStore {
  constructor(private readonly database: Database.Database) {}

  save(input: SaveCoachFeedbackInput): CoachFeedbackRecord {
    const status: CoachFeedbackStatus = input.rating === 'helpful' ? 'recorded' : 'pending';
    this.database.prepare(`
      INSERT INTO coach_feedback (
        id, response_id, query, answer, rating, issue_type, comment, suggested_answer,
        screenshot_ids_json, retrieval_document_ids_json, provider, intent_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(response_id) DO UPDATE SET
        query = excluded.query,
        answer = excluded.answer,
        rating = excluded.rating,
        issue_type = excluded.issue_type,
        comment = excluded.comment,
        suggested_answer = excluded.suggested_answer,
        screenshot_ids_json = excluded.screenshot_ids_json,
        retrieval_document_ids_json = excluded.retrieval_document_ids_json,
        provider = excluded.provider,
        intent_id = excluded.intent_id,
        status = excluded.status,
        reviewer_id = NULL,
        review_note = '',
        updated_at = datetime('now')
    `).run(
      randomUUID(),
      input.responseId,
      input.query,
      input.answer,
      input.rating,
      input.issueType ?? null,
      input.comment ?? '',
      input.suggestedAnswer ?? '',
      JSON.stringify(input.screenshotIds ?? []),
      JSON.stringify(input.retrievalDocumentIds ?? []),
      input.provider ?? '',
      input.intentId ?? '',
      status,
    );

    const saved = this.database.prepare(
      'SELECT * FROM coach_feedback WHERE response_id = ?',
    ).get(input.responseId) as CoachFeedbackRow | undefined;
    if (!saved) throw new Error('Coach feedback was not saved.');
    return mapRow(saved);
  }

  list(options: { status?: CoachFeedbackStatus; limit?: number }): CoachFeedbackRecord[] {
    const limit = Math.max(1, Math.min(options.limit ?? 100, 500));
    const rows = options.status
      ? this.database.prepare(
          'SELECT * FROM coach_feedback WHERE status = ? ORDER BY created_at DESC, id DESC LIMIT ?',
        ).all(options.status, limit)
      : this.database.prepare(
          'SELECT * FROM coach_feedback ORDER BY created_at DESC, id DESC LIMIT ?',
        ).all(limit);
    return (rows as CoachFeedbackRow[]).map(mapRow);
  }

  review(id: string, input: ReviewCoachFeedbackInput): CoachFeedbackRecord | undefined {
    this.database.prepare(`
      UPDATE coach_feedback
      SET status = ?, reviewer_id = ?, review_note = ?,
          suggested_answer = COALESCE(?, suggested_answer), updated_at = datetime('now')
      WHERE id = ? AND status = 'pending'
    `).run(input.status, input.reviewerId, input.reviewNote ?? '', input.suggestedAnswer ?? null, id);

    const row = this.database.prepare(
      'SELECT * FROM coach_feedback WHERE id = ?',
    ).get(id) as CoachFeedbackRow | undefined;
    return row ? mapRow(row) : undefined;
  }
}
