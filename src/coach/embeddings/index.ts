export {
  buildCoachEmbeddingDocuments,
  buildKnowledgeEmbeddingDocuments,
  buildScreenshotEmbeddingDocuments,
} from './documents';
export {
  EmbeddingRetriever,
  InMemoryVectorIndex,
  cosineSimilarity,
} from './vectorIndex';
export type {
  EmbeddedVectorEntry,
  EmbeddingDocument,
  EmbeddingDocumentKind,
  EmbeddingImageInput,
  EmbeddingImageMimeType,
  EmbeddingMetadataValue,
  EmbeddingProvider,
  EmbeddingProviderDescriptor,
  EmbeddingRequestOptions,
  EmbeddingTask,
  MultimodalEmbeddingProvider,
  VectorIndexSnapshot,
  VectorSearchOptions,
  VectorSearchResult,
} from './types';
