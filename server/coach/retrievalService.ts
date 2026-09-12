import { stat } from 'node:fs/promises';
import {
  buildCoachEmbeddingDocuments,
  type EmbeddingDocument,
  type EmbeddingDocumentKind,
  type EmbeddingProvider,
  type InMemoryVectorIndex,
  type VectorSearchResult,
} from '../../src/coach/embeddings';
import { searchKnowledge } from '../../src/coach/knowledgeBase';
import { searchScreenshots } from '../../src/coach/screenshots/manifest';
import {
  DEFAULT_COACH_EMBEDDING_SNAPSHOT_PATH,
  readCoachEmbeddingSnapshot,
  type LoadedCoachEmbeddingSnapshot,
} from './snapshotStore';
import { fingerprintCoachEmbeddingSources } from './imageEmbeddingSources';

export type CoachRetrievalKind = EmbeddingDocumentKind | 'all';
export type CoachRetrievalMode = 'hybrid' | 'lexical';

export interface CoachRetrievalResult {
  document: EmbeddingDocument;
  score: number;
  semanticScore?: number;
  semanticRank?: number;
  lexicalRank?: number;
}

export interface CoachRetrievalResponse {
  mode: CoachRetrievalMode;
  fallbackReason?: string;
  results: CoachRetrievalResult[];
}

export interface CoachEmbeddingStatus {
  providerConfigured: boolean;
  semanticReady: boolean;
  model?: string;
  snapshotExists: boolean;
  snapshotCurrent: boolean;
  documentCount: number;
  imageDocumentCount: number;
  dimensions?: number;
  createdAt?: string;
  reason?: string;
}

interface CoachRetrievalServiceOptions {
  provider?: EmbeddingProvider;
  snapshotPath?: string;
  documents?: readonly EmbeddingDocument[];
  queryCacheSize?: number;
  sourceFingerprint?: string;
}

interface SnapshotCache {
  modifiedAt: number;
  loaded: LoadedCoachEmbeddingSnapshot;
}

const RRF_CONSTANT = 60;
const SEMANTIC_WEIGHT = 0.65;
const LEXICAL_WEIGHT = 0.35;

function clampLimit(value: number | undefined): number {
  const parsed = Number.isFinite(value) ? Number(value) : 6;
  return Math.max(1, Math.min(Math.floor(parsed), 12));
}

function roundScore(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

export function fuseRetrievalRankings(
  semantic: readonly VectorSearchResult[],
  lexical: readonly EmbeddingDocument[],
  limit: number = 6,
): CoachRetrievalResult[] {
  const candidates = new Map<string, CoachRetrievalResult>();

  semantic.forEach((result, index) => {
    const rank = index + 1;
    candidates.set(result.document.id, {
      document: result.document,
      score: SEMANTIC_WEIGHT * (RRF_CONSTANT + 1) / (RRF_CONSTANT + rank),
      semanticScore: result.score,
      semanticRank: rank,
    });
  });

  lexical.forEach((document, index) => {
    const rank = index + 1;
    const existing = candidates.get(document.id);
    const lexicalScore = LEXICAL_WEIGHT * (RRF_CONSTANT + 1) / (RRF_CONSTANT + rank);
    candidates.set(document.id, {
      document: existing?.document ?? document,
      score: (existing?.score ?? 0) + lexicalScore,
      semanticScore: existing?.semanticScore,
      semanticRank: existing?.semanticRank,
      lexicalRank: rank,
    });
  });

  return [...candidates.values()]
    .map((candidate) => ({ ...candidate, score: roundScore(candidate.score) }))
    .sort((left, right) =>
      right.score - left.score
      || (right.semanticScore ?? -1) - (left.semanticScore ?? -1)
      || left.document.id.localeCompare(right.document.id),
    )
    .slice(0, clampLimit(limit));
}

function interleave<T>(left: readonly T[], right: readonly T[]): T[] {
  const result: T[] = [];
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    if (left[index]) result.push(left[index]);
    if (right[index]) result.push(right[index]);
  }
  return result;
}

export class CoachRetrievalService {
  private readonly documents: readonly EmbeddingDocument[];
  private readonly documentsById: Map<string, EmbeddingDocument>;
  private readonly configuredSourceFingerprint?: string;
  private sourceFingerprintPromise?: Promise<string>;
  private readonly provider?: EmbeddingProvider;
  private readonly snapshotPath: string;
  private readonly queryCacheSize: number;
  private readonly queryVectors = new Map<string, number[]>();
  private snapshotCache?: SnapshotCache;

  constructor(options: CoachRetrievalServiceOptions = {}) {
    this.documents = options.documents ?? buildCoachEmbeddingDocuments();
    this.documentsById = new Map(this.documents.map((document) => [document.id, document]));
    this.configuredSourceFingerprint = options.sourceFingerprint;
    this.provider = options.provider;
    this.snapshotPath = options.snapshotPath ?? DEFAULT_COACH_EMBEDDING_SNAPSHOT_PATH;
    this.queryCacheSize = Math.max(0, Math.floor(options.queryCacheSize ?? 200));
  }

  async getStatus(): Promise<CoachEmbeddingStatus> {
    const base = {
      providerConfigured: Boolean(this.provider),
      semanticReady: false,
      model: this.provider?.model,
      snapshotExists: false,
      snapshotCurrent: false,
      documentCount: this.documents.length,
      imageDocumentCount: this.documents.filter((document) => document.kind === 'screenshot').length,
    };

    let loaded: LoadedCoachEmbeddingSnapshot | null;
    try {
      loaded = await this.loadSnapshot();
    } catch {
      return { ...base, snapshotExists: true, reason: 'invalid-snapshot' };
    }
    if (!loaded) return { ...base, reason: 'missing-snapshot' };

    let sourceFingerprint: string;
    try {
      sourceFingerprint = await this.getSourceFingerprint();
    } catch {
      return { ...base, snapshotExists: true, reason: 'source-assets-unavailable' };
    }
    const snapshotCurrent = loaded.file.sourceFingerprint === sourceFingerprint;
    const providerMatches = !this.provider || loaded.index.provider.model === this.provider.model;
    const reason = !snapshotCurrent
      ? 'stale-snapshot'
      : !this.provider
        ? 'missing-provider-key'
        : !providerMatches
          ? 'provider-mismatch'
          : undefined;

    return {
      ...base,
      semanticReady: snapshotCurrent && Boolean(this.provider) && providerMatches,
      model: loaded.index.provider.model,
      snapshotExists: true,
      snapshotCurrent,
      documentCount: loaded.index.size,
      dimensions: loaded.index.dimensions,
      createdAt: loaded.index.createdAt,
      reason,
    };
  }

  async retrieve(
    query: string,
    options: { kind?: CoachRetrievalKind; limit?: number } = {},
  ): Promise<CoachRetrievalResponse> {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return { mode: 'lexical', fallbackReason: 'empty-query', results: [] };

    const kind = options.kind ?? 'all';
    const limit = clampLimit(options.limit);
    const lexical = this.searchLexically(trimmedQuery, kind);
    const lexicalOnly = (fallbackReason: string): CoachRetrievalResponse => ({
      mode: 'lexical',
      fallbackReason,
      results: lexical.slice(0, limit).map((document, index) => ({
        document,
        score: roundScore(1 / (index + 1)),
        lexicalRank: index + 1,
      })),
    });

    if (!this.provider) return lexicalOnly('missing-provider-key');

    let loaded: LoadedCoachEmbeddingSnapshot | null;
    try {
      loaded = await this.loadSnapshot();
    } catch {
      return lexicalOnly('invalid-snapshot');
    }
    if (!loaded) return lexicalOnly('missing-snapshot');
    let sourceFingerprint: string;
    try {
      sourceFingerprint = await this.getSourceFingerprint();
    } catch {
      return lexicalOnly('source-assets-unavailable');
    }
    if (loaded.file.sourceFingerprint !== sourceFingerprint) return lexicalOnly('stale-snapshot');
    if (loaded.index.provider.model !== this.provider.model) return lexicalOnly('provider-mismatch');

    try {
      const queryVector = await this.getQueryVector(trimmedQuery);
      const candidateLimit = Math.max(20, limit * 4);
      const semantic = loaded.index.search(queryVector, {
        limit: candidateLimit,
        filter: kind === 'all' ? undefined : (document) => document.kind === kind,
      });
      return {
        mode: 'hybrid',
        results: fuseRetrievalRankings(semantic, lexical, limit),
      };
    } catch {
      return lexicalOnly('query-embedding-failed');
    }
  }

  private searchLexically(query: string, kind: CoachRetrievalKind): EmbeddingDocument[] {
    const knowledge = kind === 'screenshot'
      ? []
      : searchKnowledge(query)
        .map((item) => this.documentsById.get(`knowledge:${item.id}`))
        .filter((document): document is EmbeddingDocument => Boolean(document));
    const screenshots = kind === 'knowledge'
      ? []
      : searchScreenshots(query, { limit: 12 })
        .map((screenshot) => this.documentsById.get(
          `screenshot:${screenshot.featureId}:${screenshot.src}`,
        ))
        .filter((document): document is EmbeddingDocument => Boolean(document));

    return kind === 'all' ? interleave(knowledge, screenshots) : [...knowledge, ...screenshots];
  }

  private getSourceFingerprint(): Promise<string> {
    if (!this.sourceFingerprintPromise) {
      this.sourceFingerprintPromise = this.configuredSourceFingerprint
        ? Promise.resolve(this.configuredSourceFingerprint)
        : fingerprintCoachEmbeddingSources(this.documents);
    }
    return this.sourceFingerprintPromise;
  }

  private async loadSnapshot(): Promise<LoadedCoachEmbeddingSnapshot | null> {
    let modifiedAt: number;
    try {
      modifiedAt = (await stat(this.snapshotPath)).mtimeMs;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw error;
    }

    if (this.snapshotCache?.modifiedAt === modifiedAt) return this.snapshotCache.loaded;
    const loaded = await readCoachEmbeddingSnapshot(this.snapshotPath);
    if (loaded) this.snapshotCache = { modifiedAt, loaded };
    return loaded;
  }

  private async getQueryVector(query: string): Promise<number[]> {
    if (!this.provider) throw new Error('Embedding provider is unavailable.');
    const cacheKey = `${this.provider.model}:${query.toLocaleLowerCase()}`;
    const cached = this.queryVectors.get(cacheKey);
    if (cached) {
      this.queryVectors.delete(cacheKey);
      this.queryVectors.set(cacheKey, cached);
      return [...cached];
    }

    const vectors = await this.provider.embed([query], { task: 'retrieval-query' });
    if (vectors.length !== 1) {
      throw new Error(`Embedding provider returned ${vectors.length} vectors for one query.`);
    }
    if (this.queryCacheSize > 0) {
      this.queryVectors.set(cacheKey, [...vectors[0]]);
      while (this.queryVectors.size > this.queryCacheSize) {
        const oldest = this.queryVectors.keys().next().value as string | undefined;
        if (!oldest) break;
        this.queryVectors.delete(oldest);
      }
    }
    return vectors[0];
  }
}
