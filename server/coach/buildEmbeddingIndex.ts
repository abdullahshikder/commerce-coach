import {
  InMemoryVectorIndex,
  type EmbeddingDocument,
  type MultimodalEmbeddingProvider,
} from '../../src/coach/embeddings';
import {
  DEFAULT_COACH_SCREENSHOT_IMAGE_DIRECTORY,
  fingerprintCoachEmbeddingSources,
  loadCoachImageEmbeddingInputs,
} from './imageEmbeddingSources';

function assertVectorCount(label: string, expected: number, actual: number): void {
  if (actual !== expected) {
    throw new Error(`${label} returned ${actual} vectors for ${expected} documents.`);
  }
}

export interface BuiltCoachEmbeddingIndex {
  index: InMemoryVectorIndex;
  sourceFingerprint: string;
  textDocumentCount: number;
  imageDocumentCount: number;
}

export async function buildCoachMultimodalEmbeddingIndex(
  documents: readonly EmbeddingDocument[],
  provider: MultimodalEmbeddingProvider,
  imageDirectory: string = DEFAULT_COACH_SCREENSHOT_IMAGE_DIRECTORY,
): Promise<BuiltCoachEmbeddingIndex> {
  const textDocuments = documents.filter((document) => document.kind === 'knowledge');
  const imageDocuments = documents.filter((document) => document.kind === 'screenshot');
  const imageInputs = await loadCoachImageEmbeddingInputs(imageDocuments, imageDirectory);

  const textVectors = await provider.embed(
    textDocuments.map((document) => document.text),
    { task: 'retrieval-document' },
  );
  assertVectorCount('Text embedding provider', textDocuments.length, textVectors.length);

  const imageVectors = await provider.embedImages(imageInputs, { task: 'retrieval-document' });
  assertVectorCount('Image embedding provider', imageDocuments.length, imageVectors.length);

  const vectorsByDocumentId = new Map<string, number[]>([
    ...textDocuments.map((document, index) => [document.id, textVectors[index]] as const),
    ...imageDocuments.map((document, index) => [document.id, imageVectors[index]] as const),
  ]);
  const index = new InMemoryVectorIndex({
    provider: { name: provider.name, model: provider.model },
    entries: documents.map((document) => {
      const vector = vectorsByDocumentId.get(document.id);
      if (!vector) throw new Error(`No embedding was generated for ${document.id}.`);
      return { document, vector };
    }),
  });

  return {
    index,
    sourceFingerprint: await fingerprintCoachEmbeddingSources(documents, imageDirectory),
    textDocumentCount: textDocuments.length,
    imageDocumentCount: imageDocuments.length,
  };
}
