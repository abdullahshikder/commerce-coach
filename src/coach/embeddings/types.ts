export type EmbeddingDocumentKind = 'knowledge' | 'screenshot';

export type EmbeddingMetadataValue = string | number | boolean | string[];

export interface EmbeddingDocument {
  id: string;
  kind: EmbeddingDocumentKind;
  text: string;
  metadata: Record<string, EmbeddingMetadataValue>;
}

export interface EmbeddedVectorEntry {
  document: EmbeddingDocument;
  vector: number[];
}

export interface EmbeddingProviderDescriptor {
  name: string;
  model: string;
}

export type EmbeddingTask = 'retrieval-document' | 'retrieval-query';

export interface EmbeddingRequestOptions {
  task?: EmbeddingTask;
}

export interface EmbeddingProvider extends EmbeddingProviderDescriptor {
  embed(texts: readonly string[], options?: EmbeddingRequestOptions): Promise<number[][]>;
}

export type EmbeddingImageMimeType =
  | 'image/gif'
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp';

export interface EmbeddingImageInput {
  text?: string;
  image: {
    mimeType: EmbeddingImageMimeType;
    base64: string;
  };
}

export interface MultimodalEmbeddingProvider extends EmbeddingProvider {
  embedImages(
    inputs: readonly EmbeddingImageInput[],
    options?: EmbeddingRequestOptions,
  ): Promise<number[][]>;
}

export interface VectorSearchResult {
  document: EmbeddingDocument;
  score: number;
}

export interface VectorSearchOptions {
  limit?: number;
  minScore?: number;
  filter?: (document: EmbeddingDocument) => boolean;
}

export interface VectorIndexSnapshot {
  version: 1;
  createdAt: string;
  provider: EmbeddingProviderDescriptor;
  dimensions: number;
  entries: EmbeddedVectorEntry[];
}
