import 'dotenv/config';
import { buildCoachEmbeddingDocuments } from '../src/coach/embeddings';
import {
  evaluateCoachWorkflows,
  formatCoachWorkflowEvaluation,
} from '../src/coach/workflows/evaluate';
import { buildCoachMultimodalEmbeddingIndex } from '../server/coach/buildEmbeddingIndex';
import { getCoachEmbeddingConfig } from '../server/coach/config';
import { OpenRouterEmbeddingProvider } from '../server/coach/openrouterEmbeddingProvider';
import {
  createCoachEmbeddingSnapshot,
  writeCoachEmbeddingSnapshot,
} from '../server/coach/snapshotStore';

async function main(): Promise<void> {
  // Keep the gate ahead of config/provider creation so a broken workflow makes no paid API calls.
  const evaluation = evaluateCoachWorkflows();
  console.log(formatCoachWorkflowEvaluation(evaluation));
  if (!evaluation.passed) {
    throw new Error('Embedding rebuild blocked because Coach workflow evaluations failed.');
  }

  const config = getCoachEmbeddingConfig();
  if (!config.apiKey) {
    throw new Error(
      'OPENROUTER_API_KEY is not configured. Add the server-only key to .env before building embeddings.',
    );
  }
  if (config.apiKeySource === 'vite-compatibility') {
    console.warn(
      'Using VITE_OPENROUTER_API_KEY for compatibility. Set OPENROUTER_API_KEY before production deployment.',
    );
  }

  const documents = buildCoachEmbeddingDocuments();
  const provider = new OpenRouterEmbeddingProvider({
    apiKey: config.apiKey,
    model: config.model,
    dimensions: config.dimensions,
    batchSize: config.batchSize,
    imageBatchSize: config.imageBatchSize,
  });

  const textDocumentCount = documents.filter((document) => document.kind === 'knowledge').length;
  const imageDocumentCount = documents.length - textDocumentCount;
  console.log(
    `Embedding ${textDocumentCount} text passages and ${imageDocumentCount} screenshots with ${provider.model} (${provider.dimensions} dimensions)...`,
  );
  const built = await buildCoachMultimodalEmbeddingIndex(documents, provider);
  const snapshot = createCoachEmbeddingSnapshot(
    built.index,
    documents,
    built.sourceFingerprint,
  );
  await writeCoachEmbeddingSnapshot(snapshot, config.snapshotPath);
  console.log(
    `Saved ${built.index.size} vectors (${built.textDocumentCount} text, ${built.imageDocumentCount} image) to ${config.snapshotPath}.`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
