import path from 'node:path';
import {
  DEFAULT_OPENROUTER_EMBEDDING_BATCH_SIZE,
  DEFAULT_OPENROUTER_EMBEDDING_DIMENSIONS,
  DEFAULT_OPENROUTER_EMBEDDING_MODEL,
  DEFAULT_OPENROUTER_IMAGE_EMBEDDING_BATCH_SIZE,
} from './openrouterEmbeddingProvider';
import { DEFAULT_COACH_EMBEDDING_SNAPSHOT_PATH } from './snapshotStore';

function parseInteger(value: string | undefined, fallback: number, label: string): number {
  if (!value?.trim()) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) throw new Error(`${label} must be an integer.`);
  return parsed;
}

export interface CoachEmbeddingConfig {
  apiKey?: string;
  apiKeySource?: 'server' | 'vite-compatibility';
  model: string;
  dimensions: number;
  batchSize: number;
  imageBatchSize: number;
  snapshotPath: string;
}

export function getCoachEmbeddingConfig(
  environment: NodeJS.ProcessEnv = process.env,
): CoachEmbeddingConfig {
  const configuredPath = environment.COACH_EMBEDDING_SNAPSHOT?.trim();
  const serverApiKey = environment.OPENROUTER_API_KEY?.trim();
  const compatibilityApiKey = environment.VITE_OPENROUTER_API_KEY?.trim();
  return {
    apiKey: serverApiKey || compatibilityApiKey || undefined,
    apiKeySource: serverApiKey
      ? 'server'
      : compatibilityApiKey
        ? 'vite-compatibility'
        : undefined,
    model: environment.OPENROUTER_EMBEDDING_MODEL?.trim() || DEFAULT_OPENROUTER_EMBEDDING_MODEL,
    dimensions: parseInteger(
      environment.OPENROUTER_EMBEDDING_DIMENSIONS,
      DEFAULT_OPENROUTER_EMBEDDING_DIMENSIONS,
      'OPENROUTER_EMBEDDING_DIMENSIONS',
    ),
    batchSize: parseInteger(
      environment.OPENROUTER_EMBEDDING_BATCH_SIZE,
      DEFAULT_OPENROUTER_EMBEDDING_BATCH_SIZE,
      'OPENROUTER_EMBEDDING_BATCH_SIZE',
    ),
    imageBatchSize: parseInteger(
      environment.OPENROUTER_IMAGE_EMBEDDING_BATCH_SIZE,
      DEFAULT_OPENROUTER_IMAGE_EMBEDDING_BATCH_SIZE,
      'OPENROUTER_IMAGE_EMBEDDING_BATCH_SIZE',
    ),
    snapshotPath: configuredPath
      ? path.resolve(configuredPath)
      : DEFAULT_COACH_EMBEDDING_SNAPSHOT_PATH,
  };
}
