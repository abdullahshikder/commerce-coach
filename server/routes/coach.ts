import 'dotenv/config';
import { retrieveDocuments } from '../coach/documents';
import { Router, type Request, type Response } from 'express';
import { getCoachEmbeddingConfig } from '../coach/config';
import { OpenRouterEmbeddingProvider } from '../coach/openrouterEmbeddingProvider';
import {
  CoachRetrievalService,
  type CoachRetrievalKind,
} from '../coach/retrievalService';
import {
  type CoachFeedbackIssueType,
  type CoachFeedbackRating,
  type CoachFeedbackStatus,
} from '../coach/feedbackStore';
import { withSession } from '../db';
import { PgFeedbackStore } from '../coach/pgFeedbackStore';
import { asyncRoute, requireRole } from '../auth/middleware';

const router = Router();
const config = getCoachEmbeddingConfig();
const provider = config.apiKey
  ? new OpenRouterEmbeddingProvider({
      apiKey: config.apiKey,
      model: config.model,
      dimensions: config.dimensions,
      batchSize: config.batchSize,
      imageBatchSize: config.imageBatchSize,
    })
  : undefined;
const retrieval = new CoachRetrievalService({
  provider,
  snapshotPath: config.snapshotPath,
});

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_REQUESTS = 30;
const RETRIEVAL_KINDS = new Set<CoachRetrievalKind>(['knowledge', 'screenshot', 'all']);
const FEEDBACK_RATINGS = new Set<CoachFeedbackRating>(['helpful', 'unhelpful']);
const FEEDBACK_ISSUE_TYPES = new Set<CoachFeedbackIssueType>([
  'wrong-answer',
  'wrong-screenshots',
  'missing-information',
  'other',
]);
const FEEDBACK_STATUSES = new Set<CoachFeedbackStatus>([
  'recorded',
  'pending',
  'approved',
  'dismissed',
]);
const requestBuckets = new Map<string, { count: number; resetAt: number }>();

function store<T>(request: Request, action: (store: PgFeedbackStore) => Promise<T>) {
  return withSession(request.sessionHash!, client => action(new PgFeedbackStore(client, request.actor!)));
}

function readString(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed && trimmed.length <= maxLength ? trimmed : undefined;
}

function readStringArray(value: unknown, maxItems: number): string[] | undefined {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > maxItems) return undefined;
  const strings = value.map((item) => readString(item, 200));
  return strings.every((item): item is string => Boolean(item)) ? strings : undefined;
}

async function retrieveApprovedCorrections(sessionHash: string, query: string) {
  const terms = new Set(query.toLowerCase().match(/[\p{L}\p{N}\p{M}]+/gu) ?? []);
  if (!terms.size) return [];
  const rows = await withSession(sessionHash, async client => (await client.query(
    `SELECT id, query, suggested_answer FROM public.coach_feedback
      WHERE status='approved' AND suggested_answer<>'' ORDER BY updated_at DESC LIMIT 50`,
  )).rows as { id: string; query: string; suggested_answer: string }[]);
  return rows.flatMap(row => {
    const text = `${row.query}\n${row.suggested_answer}`.toLowerCase();
    const matched = [...terms].filter(term => text.includes(term)).length;
    if (!matched) return [];
    return [{
      score: 1 + matched / terms.size,
      document: {
        id: `correction:${row.id}`,
        kind: 'knowledge' as const,
        text: `APPROVED LEARNING CORRECTION\nMerchant question: ${row.query}\nCorrect response: ${row.suggested_answer}`,
        metadata: { source: 'Approved Learning correction', trust: 'human-reviewed', correction: 'approved' },
      },
    }];
  }).slice(0, 4);
}


function isRateLimited(request: Request): boolean {
  const now = Date.now();
  const key = request.ip || request.socket.remoteAddress || 'unknown';
  if (requestBuckets.size > 1_000) {
    for (const [bucketKey, bucketValue] of requestBuckets) {
      if (bucketValue.resetAt <= now) requestBuckets.delete(bucketKey);
    }
  }
  const bucket = requestBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    requestBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_LIMIT_REQUESTS;
}

router.get('/embeddings/status', asyncRoute(async (_request: Request, response: Response) => {
  response.json(await retrieval.getStatus());
}));

router.post('/feedback', asyncRoute(async (request: Request, response: Response) => {
  if (isRateLimited(request)) {
    response.status(429).json({ error: 'Too many Coach requests. Please try again shortly.' });
    return;
  }

  const responseId = readString(request.body?.responseId, 200);
  const query = readString(request.body?.query, 2_000);
  const answer = readString(request.body?.answer, 12_000);
  const rating = request.body?.rating as CoachFeedbackRating | undefined;
  const issueType = request.body?.issueType as CoachFeedbackIssueType | undefined;
  const screenshotIds = readStringArray(request.body?.screenshotIds, 12);
  const retrievalDocumentIds = readStringArray(request.body?.retrievalDocumentIds, 20);

  if (!responseId || !query || !answer || !rating || !FEEDBACK_RATINGS.has(rating)) {
    response.status(400).json({ error: 'responseId, query, answer, and a valid rating are required.' });
    return;
  }
  if (rating === 'unhelpful' && (!issueType || !FEEDBACK_ISSUE_TYPES.has(issueType))) {
    response.status(400).json({ error: 'Unhelpful feedback requires a valid issueType.' });
    return;
  }
  if (!screenshotIds || !retrievalDocumentIds) {
    response.status(400).json({ error: 'Screenshot and retrieval document IDs must be string arrays.' });
    return;
  }

  const feedback = await store(request, feedbackStore => feedbackStore.save({
    responseId,
    query,
    answer,
    rating,
    ...(issueType ? { issueType } : {}),
    ...(readString(request.body?.comment, 2_000) ? { comment: request.body.comment.trim() } : {}),
    ...(readString(request.body?.suggestedAnswer, 4_000)
      ? { suggestedAnswer: request.body.suggestedAnswer.trim() }
      : {}),
    screenshotIds,
    retrievalDocumentIds,
    ...(readString(request.body?.provider, 100) ? { provider: request.body.provider.trim() } : {}),
    ...(readString(request.body?.intentId, 200) ? { intentId: request.body.intentId.trim() } : {}),
  }));
  response.status(201).json({ feedback });
}));

router.get('/feedback/mine', asyncRoute(async (request, response) => {
  response.json({ items: await store(request, feedbackStore => feedbackStore.list({ mine: true })) });
}));

router.get('/feedback', requireRole('reviewer', 'admin'), asyncRoute(async (request: Request, response: Response) => {
  const requestedStatus = request.query.status;
  const status = typeof requestedStatus === 'string'
    ? requestedStatus as CoachFeedbackStatus
    : 'pending';
  if (!FEEDBACK_STATUSES.has(status)) {
    response.status(400).json({ error: 'Invalid feedback status.' });
    return;
  }
  const requestedLimit = Number(request.query.limit);
  const items = await store(request, feedbackStore => feedbackStore.list({
    status,
    limit: Number.isFinite(requestedLimit) ? requestedLimit : undefined,
  }));
  response.json({ items });
}));

router.patch('/feedback/:id', requireRole('reviewer', 'admin'), asyncRoute(async (request: Request, response: Response) => {
  const reviewerId = request.actor!.id;
  const status = request.body?.status;
  if (status !== 'approved' && status !== 'dismissed') {
    response.status(400).json({ error: 'status must be approved or dismissed.' });
    return;
  }
  const suggestedAnswer = readString(request.body?.suggestedAnswer, 4_000);
  if (request.body?.suggestedAnswer !== undefined && !suggestedAnswer) {
    response.status(400).json({ error: 'suggestedAnswer must be a non-empty response of up to 4,000 characters.' });
    return;
  }
  const feedback = await store(request, feedbackStore => feedbackStore.review(request.params.id, {
    status,
    reviewerId,
    ...(readString(request.body?.reviewNote, 2_000) ? { reviewNote: request.body.reviewNote.trim() } : {}),
    ...(suggestedAnswer ? { suggestedAnswer } : {}),
  }));
  if (!feedback) {
    response.status(404).json({ error: 'Feedback not found.' });
    return;
  }
  response.json({ feedback });
}));

router.post('/retrieve', asyncRoute(async (request: Request, response: Response) => {
  if (isRateLimited(request)) {
    response.status(429).json({ error: 'Too many Coach retrieval requests. Please try again shortly.' });
    return;
  }

  const query = request.body?.query;
  if (typeof query !== 'string' || !query.trim()) {
    response.status(400).json({ error: 'query must be a non-empty string.' });
    return;
  }
  if (query.length > 2_000) {
    response.status(413).json({ error: 'query must be 2,000 characters or fewer.' });
    return;
  }

  const requestedKind = request.body?.kind;
  if (requestedKind !== undefined && !RETRIEVAL_KINDS.has(requestedKind)) {
    response.status(400).json({ error: 'kind must be knowledge, screenshot, or all.' });
    return;
  }

  const requestedLimit = Number(request.body?.limit);
  const [result,uploaded] = await Promise.all([
    retrieval.retrieve(query, {kind: requestedKind as CoachRetrievalKind | undefined,limit: Number.isFinite(requestedLimit) ? requestedLimit : undefined}),
    requestedKind==='screenshot'?Promise.resolve([]):retrieveDocuments(request.sessionHash!,query,4),
  ]);
  const corrections = requestedKind === 'screenshot' ? [] : await retrieveApprovedCorrections(request.sessionHash!, query);
  result.results=[...corrections,...uploaded,...result.results].slice(0,12);
  response.json(result);
}));

export default router;
