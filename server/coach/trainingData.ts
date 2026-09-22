import { createHash } from 'node:crypto';
import type { PoolClient } from 'pg';

export type TrainingDataRange = 30 | 90 | 365 | null;

interface TrainingFeedbackRow {
  id: string;
  query: string;
  answer: string;
  suggested_answer: string;
  rating: 'helpful' | 'unhelpful';
  status: 'recorded' | 'approved';
  issue_type: string | null;
  provider: string;
  intent_id: string;
  screenshot_ids_json: unknown;
  retrieval_document_ids_json: unknown;
}

export interface TrainingExample {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  metadata: {
    schema_version: 'commerce-coach.training.v1';
    example_id: string;
    source: 'approved_correction' | 'helpful_rating';
    quality: 'human_reviewed' | 'user_rated';
    review_status: 'approved' | 'recorded';
    language: 'bn' | 'en' | 'mixed' | 'other';
    split: 'train' | 'validation';
    provider?: string;
    intent_id?: string;
    issue_type?: string;
    screenshot_ids?: string[];
    retrieval_document_ids?: string[];
    redactions?: string[];
  };
}

export interface TrainingDataset {
  version: string;
  examples: TrainingExample[];
  sourceRows: number;
  duplicateRows: number;
  redactionCount: number;
  approvedCorrections: number;
  helpfulAnswers: number;
  trainExamples: number;
  validationExamples: number;
  truncated: boolean;
}

const SYSTEM_MESSAGE = 'You are Commerce Coach, a bilingual Pathao Commerce support assistant. Give accurate, concise, step-by-step guidance grounded in approved product documentation.';
const SENSITIVE_URL_KEYS = /(?:^|[_-])(token|secret|password|passwd|authorization|auth|code|key|api[_-]?key|session|signature|credential)(?:$|[_-])/i;
const URL_PATTERN = /https?:\/\/[^\s<>"')\]]+/gi;

function hash(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

function redactUrls(value: string, categories: Set<string>) {
  return value.replace(URL_PATTERN, raw => {
    const trailing = raw.match(/[.,!?;:]+$/)?.[0] ?? '';
    const candidate = trailing ? raw.slice(0, -trailing.length) : raw;
    try {
      const url = new URL(candidate);
      let changed = false;
      if (url.username || url.password) {
        url.username = '';
        url.password = '';
        changed = true;
      }
      for (const key of [...url.searchParams.keys()]) {
        if (!SENSITIVE_URL_KEYS.test(key)) continue;
        url.searchParams.set(key, '[REDACTED]');
        changed = true;
      }
      if (SENSITIVE_URL_KEYS.test(url.hash.slice(1))) {
        url.hash = '#[REDACTED]';
        changed = true;
      }
      if (!changed) return raw;
      categories.add('secret_url');
      return `${url.toString().replaceAll('%5BREDACTED%5D', '[REDACTED]')}${trailing}`;
    } catch {
      return raw;
    }
  });
}

export function redactTrainingText(value: string): { text: string; categories: string[]; count: number } {
  const categories = new Set<string>();
  let count = 0;
  const replace = (pattern: RegExp, category: string, replacement: string | ((match: string, ...groups: string[]) => string)) => {
    value = value.replace(pattern, (...args) => {
      count += 1;
      categories.add(category);
      return typeof replacement === 'string' ? replacement : replacement(args[0], ...args.slice(1, -2));
    });
  };

  const beforeUrls = value;
  value = redactUrls(value, categories);
  if (value !== beforeUrls) count += 1;
  replace(/\b(?:Bearer\s+)[A-Za-z0-9\-._~+/]+=*/gi, 'access_token', '[REDACTED_ACCESS_TOKEN]');
  replace(/\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g, 'access_token', '[REDACTED_ACCESS_TOKEN]');
  replace(/\b(?:sk-[A-Za-z0-9_-]{16,}|AIza[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9_]{20,})\b/g, 'access_token', '[REDACTED_ACCESS_TOKEN]');
  replace(/\b(api[_-]?key|token|access[_-]?token|refresh[_-]?token|client[_-]?secret|password|passwd|session(?:[_-]?id)?)\s*[:=]\s*(?!\[REDACTED\])([^\s,;&]+?)(?=[.,!?](?:\s|$)|[\s,;&]|$)/gi, 'credential', (_match, label) => `${label}=[REDACTED]`);
  replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, 'email', '[REDACTED_EMAIL]');
  replace(/(?<!\d)(?:\+?88[-\s]?)?01[3-9](?:[-\s]?\d){8}(?!\d)/g, 'phone', '[REDACTED_PHONE]');
  replace(/\b((?:order|consignment|tracking|invoice)\s*(?:(?:id|number|no\.?)\s*(?::|#|-|is)?|(?::|#|-))\s*)[A-Z0-9][A-Z0-9-]{3,}\b/gi, 'transaction_id', (_match, label) => `${label}[REDACTED_ID]`);
  replace(/((?:অর্ডার|কনসাইনমেন্ট|ট্র্যাকিং|ইনভয়েস)\s*(?:আইডি|নম্বর)\s*[:#-]?\s*)[০-৯A-Za-z][০-৯A-Za-z-]{3,}/gu, 'transaction_id', (_match, label) => `${label}[REDACTED_ID]`);
  return { text: value, categories: [...categories].sort(), count };
}

function languageOf(value: string): TrainingExample['metadata']['language'] {
  const bangla = /[\u0980-\u09ff]/u.test(value);
  const english = /[A-Za-z]/.test(value);
  if (bangla && english) return 'mixed';
  if (bangla) return 'bn';
  if (english) return 'en';
  return 'other';
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())).slice(0, 20);
}

function optionalMetadata(value: string) {
  const redacted = redactTrainingText(value.trim());
  return redacted.text || undefined;
}

export function buildTrainingDataset(rows: TrainingFeedbackRow[], truncated = false): TrainingDataset {
  const examples: TrainingExample[] = [];
  const seen = new Set<string>();
  let duplicateRows = 0;
  let redactionCount = 0;

  for (const row of [...rows].sort((left, right) => left.id.localeCompare(right.id))) {
    const source = row.status === 'approved' && row.suggested_answer.trim()
      ? 'approved_correction' as const
      : row.status === 'recorded' && row.rating === 'helpful'
        ? 'helpful_rating' as const
        : undefined;
    if (!source) continue;
    const query = redactTrainingText(row.query.trim());
    const answer = redactTrainingText((source === 'approved_correction' ? row.suggested_answer : row.answer).trim());
    if (!query.text || !answer.text) continue;
    const contentHash = hash(`${query.text}\u0000${answer.text}`);
    if (seen.has(contentHash)) {
      duplicateRows += 1;
      continue;
    }
    seen.add(contentHash);
    const redactions = [...new Set([...query.categories, ...answer.categories])].sort();
    redactionCount += query.count + answer.count;
    const screenshotIds = stringArray(row.screenshot_ids_json).map(value => redactTrainingText(value).text);
    const retrievalDocumentIds = stringArray(row.retrieval_document_ids_json).map(value => redactTrainingText(value).text);
    const provider = optionalMetadata(row.provider);
    const intentId = optionalMetadata(row.intent_id);
    // Stable hashes avoid exporting database IDs or storing a second table just to preserve the holdout split.
    const exampleId = `example_${hash(row.id).slice(0, 20)}`;
    const split = Number.parseInt(contentHash.slice(0, 8), 16) % 10 === 0 ? 'validation' as const : 'train' as const;
    examples.push({
      messages: [
        { role: 'system', content: SYSTEM_MESSAGE },
        { role: 'user', content: query.text },
        { role: 'assistant', content: answer.text },
      ],
      metadata: {
        schema_version: 'commerce-coach.training.v1',
        example_id: exampleId,
        source,
        quality: source === 'approved_correction' ? 'human_reviewed' : 'user_rated',
        review_status: row.status,
        language: languageOf(`${query.text}\n${answer.text}`),
        split,
        ...(provider ? { provider } : {}),
        ...(intentId ? { intent_id: intentId } : {}),
        ...(row.issue_type ? { issue_type: row.issue_type } : {}),
        ...(screenshotIds.length ? { screenshot_ids: screenshotIds } : {}),
        ...(retrievalDocumentIds.length ? { retrieval_document_ids: retrievalDocumentIds } : {}),
        ...(redactions.length ? { redactions } : {}),
      },
    });
  }

  examples.sort((left, right) => left.metadata.example_id.localeCompare(right.metadata.example_id));
  const versionHash = hash(examples.map(example => JSON.stringify(example)).join('\n')).slice(0, 16);
  return {
    version: `cc-training-v1-${versionHash}`,
    examples,
    sourceRows: rows.length,
    duplicateRows,
    redactionCount,
    approvedCorrections: examples.filter(example => example.metadata.source === 'approved_correction').length,
    helpfulAnswers: examples.filter(example => example.metadata.source === 'helpful_rating').length,
    trainExamples: examples.filter(example => example.metadata.split === 'train').length,
    validationExamples: examples.filter(example => example.metadata.split === 'validation').length,
    truncated,
  };
}

export function trainingDatasetJsonl(dataset: TrainingDataset) {
  return dataset.examples.length ? `${dataset.examples.map(example => JSON.stringify(example)).join('\n')}\n` : '';
}

export class PgTrainingDataStore {
  constructor(private readonly client: Pick<PoolClient, 'query'>) {}

  async build(days: TrainingDataRange, limit = 5_000) {
    const boundedLimit = Math.max(1, Math.min(Math.floor(limit), 5_000));
    const result = await this.client.query(`SELECT id,query,answer,suggested_answer,rating,status,issue_type,provider,intent_id,
      screenshot_ids_json,retrieval_document_ids_json
      FROM public.coach_feedback
      WHERE ((status='approved' AND suggested_answer<>'') OR (status='recorded' AND rating='helpful'))
        AND ($1::integer IS NULL OR updated_at >= now() - ($1::integer * interval '1 day'))
      ORDER BY updated_at,id LIMIT $2`, [days, boundedLimit + 1]);
    const truncated = result.rows.length > boundedLimit;
    return buildTrainingDataset(result.rows.slice(0, boundedLimit) as TrainingFeedbackRow[], truncated);
  }
}
