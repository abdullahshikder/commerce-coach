import { authFetch } from '../auth/client';
import type { EmbeddingDocument, EmbeddingMetadataValue } from './embeddings';

interface RetrievalApiResult {
  document: EmbeddingDocument;
  score: number;
}

interface RetrievalApiResponse {
  mode: 'hybrid' | 'lexical';
  results: RetrievalApiResult[];
}

export interface RetrievedCoachContext {
  mode: RetrievalApiResponse['mode'];
  context: string;
  documentIds: string[];
  uploaded?: {text:string;source:string;id:string}[];
}

function metadataValue(metadata: Record<string, EmbeddingMetadataValue>, key: string): string {
  const value = metadata[key];
  return Array.isArray(value) ? value.join(', ') : value === undefined ? '' : String(value);
}

function isRetrievalResponse(value: unknown): value is RetrievalApiResponse {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<RetrievalApiResponse>;
  return (candidate.mode === 'hybrid' || candidate.mode === 'lexical')
    && Array.isArray(candidate.results)
    && candidate.results.every((result) =>
      Boolean(result?.document?.id)
      && typeof result.document.text === 'string'
      && Number.isFinite(result.score),
    );
}

export async function retrieveCoachContext(
  query: string,
  options: { limit?: number; timeoutMs?: number } = {},
): Promise<RetrievedCoachContext | undefined> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), options.timeoutMs ?? 20_000);

  try {
    const response = await authFetch('/api/coach/retrieve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, kind: 'knowledge', limit: options.limit ?? 6 }),
      signal: controller.signal,
    });
    if (!response.ok) return undefined;

    const payload: unknown = await response.json();
    if (!isRetrievalResponse(payload) || payload.results.length === 0) return undefined;

    const passages = payload.results.map(({ document }, index) => {
      const source = metadataValue(document.metadata, 'source');
      return [
        `[${index + 1}] ${document.id}${source ? ` (${source})` : ''}`,
        `Verification: ${['human-reviewed', 'machine-confirmed'].includes(metadataValue(document.metadata, 'trust')) ? metadataValue(document.metadata, 'trust') : 'unverified'}. This label describes source review, not proof of every claim.`,
        document.text,
      ].join('\n');
    });
    return {
      mode: payload.mode,
      context: passages.join('\n\n'),
      uploaded: payload.results.filter(({document})=>document.id.startsWith('upload:')).map(({document})=>({text:document.text,source:metadataValue(document.metadata,'source'),id:document.id})),
      documentIds: payload.results.map(({ document }) => document.id),
    };
  } catch {
    return undefined;
  } finally {
    globalThis.clearTimeout(timeout);
  }
}
