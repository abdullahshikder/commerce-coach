import type {
  EmbeddedVectorEntry,
  EmbeddingDocument,
  EmbeddingMetadataValue,
  EmbeddingProvider,
  EmbeddingProviderDescriptor,
  VectorIndexSnapshot,
  VectorSearchOptions,
  VectorSearchResult,
} from './types';

interface VectorIndexInput {
  provider: EmbeddingProviderDescriptor;
  entries: EmbeddedVectorEntry[];
  createdAt?: string;
}

function validateVector(vector: readonly number[], label: string): void {
  if (vector.length === 0) throw new RangeError(`${label} cannot be empty.`);
  if (vector.some((value) => !Number.isFinite(value))) {
    throw new TypeError(`${label} must contain only finite numbers.`);
  }
}

function cloneMetadata(
  metadata: Record<string, EmbeddingMetadataValue>,
): Record<string, EmbeddingMetadataValue> {
  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [key, Array.isArray(value) ? [...value] : value]),
  );
}

function cloneDocument(document: EmbeddingDocument): EmbeddingDocument {
  return {
    ...document,
    metadata: cloneMetadata(document.metadata),
  };
}

export function cosineSimilarity(left: readonly number[], right: readonly number[]): number {
  validateVector(left, 'Left vector');
  validateVector(right, 'Right vector');
  if (left.length !== right.length) {
    throw new RangeError(`Vector dimension mismatch: ${left.length} !== ${right.length}.`);
  }

  let dotProduct = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;
  for (let index = 0; index < left.length; index += 1) {
    dotProduct += left[index] * right[index];
    leftMagnitude += left[index] ** 2;
    rightMagnitude += right[index] ** 2;
  }

  if (leftMagnitude === 0 || rightMagnitude === 0) return 0;
  return dotProduct / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}

export class InMemoryVectorIndex {
  readonly provider: EmbeddingProviderDescriptor;
  readonly dimensions: number;
  readonly createdAt: string;
  private readonly entries: EmbeddedVectorEntry[];

  constructor({ provider, entries, createdAt = new Date().toISOString() }: VectorIndexInput) {
    const ids = new Set<string>();
    const dimensions = entries[0]?.vector.length ?? 0;

    for (const entry of entries) {
      if (!entry.document.id.trim()) throw new Error('Embedding document ID cannot be empty.');
      if (!entry.document.text.trim()) throw new Error(`Embedding document ${entry.document.id} has empty text.`);
      if (ids.has(entry.document.id)) throw new Error(`Duplicate embedding document ID: ${entry.document.id}.`);
      ids.add(entry.document.id);

      validateVector(entry.vector, `Embedding for ${entry.document.id}`);
      if (entry.vector.length !== dimensions) {
        throw new RangeError(
          `Vector dimension mismatch for ${entry.document.id}: ${entry.vector.length} !== ${dimensions}.`,
        );
      }
    }

    this.provider = { ...provider };
    this.dimensions = dimensions;
    this.createdAt = createdAt;
    this.entries = entries.map((entry) => ({
      document: cloneDocument(entry.document),
      vector: [...entry.vector],
    }));
  }

  get size(): number {
    return this.entries.length;
  }

  search(queryVector: readonly number[], options: VectorSearchOptions = {}): VectorSearchResult[] {
    if (this.entries.length === 0) return [];
    validateVector(queryVector, 'Query vector');
    if (queryVector.length !== this.dimensions) {
      throw new RangeError(
        `Query vector dimension mismatch: ${queryVector.length} !== ${this.dimensions}.`,
      );
    }

    const limit = Math.max(0, Math.floor(options.limit ?? 5));
    const minScore = options.minScore ?? -1;
    if (limit === 0) return [];

    return this.entries
      .filter((entry) => !options.filter || options.filter(entry.document))
      .map((entry) => ({
        document: cloneDocument(entry.document),
        score: cosineSimilarity(queryVector, entry.vector),
      }))
      .filter((result) => result.score >= minScore)
      .sort((left, right) => right.score - left.score || left.document.id.localeCompare(right.document.id))
      .slice(0, limit);
  }

  toSnapshot(): VectorIndexSnapshot {
    return {
      version: 1,
      createdAt: this.createdAt,
      provider: { ...this.provider },
      dimensions: this.dimensions,
      entries: this.entries.map((entry) => ({
        document: cloneDocument(entry.document),
        vector: [...entry.vector],
      })),
    };
  }

  static fromSnapshot(snapshot: VectorIndexSnapshot): InMemoryVectorIndex {
    if (snapshot.version !== 1) throw new Error(`Unsupported vector index version: ${snapshot.version}.`);
    const index = new InMemoryVectorIndex({
      provider: snapshot.provider,
      entries: snapshot.entries,
      createdAt: snapshot.createdAt,
    });
    if (index.dimensions !== snapshot.dimensions) {
      throw new RangeError(
        `Snapshot dimension mismatch: ${snapshot.dimensions} !== ${index.dimensions}.`,
      );
    }
    return index;
  }
}

export class EmbeddingRetriever {
  private constructor(
    private readonly provider: EmbeddingProvider,
    readonly index: InMemoryVectorIndex,
  ) {}

  static async create(
    documents: readonly EmbeddingDocument[],
    provider: EmbeddingProvider,
  ): Promise<EmbeddingRetriever> {
    const vectors = await provider.embed(
      documents.map((document) => document.text),
      { task: 'retrieval-document' },
    );
    if (vectors.length !== documents.length) {
      throw new Error(
        `Embedding provider returned ${vectors.length} vector${vectors.length === 1 ? '' : 's'} for ${documents.length} documents.`,
      );
    }

    const index = new InMemoryVectorIndex({
      provider: { name: provider.name, model: provider.model },
      entries: documents.map((document, index) => ({
        document,
        vector: vectors[index],
      })),
    });
    return new EmbeddingRetriever(provider, index);
  }

  async search(query: string, options: VectorSearchOptions = {}): Promise<VectorSearchResult[]> {
    if (!query.trim()) return [];
    const vectors = await this.provider.embed([query], { task: 'retrieval-query' });
    if (vectors.length !== 1) {
      throw new Error(`Embedding provider returned ${vectors.length} vectors for one query.`);
    }
    return this.index.search(vectors[0], options);
  }
}
