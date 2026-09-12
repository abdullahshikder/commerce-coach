import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  InMemoryVectorIndex,
  type EmbeddingDocument,
  type VectorIndexSnapshot,
} from '../../src/coach/embeddings';

export const DEFAULT_COACH_EMBEDDING_SNAPSHOT_PATH = fileURLToPath(
  new URL('../../data/coach-embeddings.json', import.meta.url),
);

export interface CoachEmbeddingSnapshotFile {
  schemaVersion: 1;
  sourceFingerprint: string;
  documentCount: number;
  index: VectorIndexSnapshot;
}

export interface LoadedCoachEmbeddingSnapshot {
  file: CoachEmbeddingSnapshotFile;
  index: InMemoryVectorIndex;
}

export function fingerprintEmbeddingDocuments(documents: readonly EmbeddingDocument[]): string {
  const source = [...documents]
    .sort((left, right) => left.id.localeCompare(right.id))
    .map(({ id, kind, text, metadata }) => ({ id, kind, text, metadata }));
  return createHash('sha256').update(JSON.stringify(source)).digest('hex');
}

export function createCoachEmbeddingSnapshot(
  index: InMemoryVectorIndex,
  documents: readonly EmbeddingDocument[],
  sourceFingerprint: string = fingerprintEmbeddingDocuments(documents),
): CoachEmbeddingSnapshotFile {
  if (index.size !== documents.length) {
    throw new Error(`Cannot persist ${index.size} vectors for ${documents.length} documents.`);
  }
  return {
    schemaVersion: 1,
    sourceFingerprint,
    documentCount: documents.length,
    index: index.toSnapshot(),
  };
}

export async function writeCoachEmbeddingSnapshot(
  snapshot: CoachEmbeddingSnapshotFile,
  filePath: string = DEFAULT_COACH_EMBEDDING_SNAPSHOT_PATH,
): Promise<void> {
  const directory = path.dirname(filePath);
  const temporaryPath = path.join(directory, `.${path.basename(filePath)}.${randomUUID()}.tmp`);
  await mkdir(directory, { recursive: true });

  try {
    await writeFile(temporaryPath, `${JSON.stringify(snapshot)}\n`, {
      encoding: 'utf8',
      mode: 0o600,
    });
    await rename(temporaryPath, filePath);
  } catch (error) {
    await rm(temporaryPath, { force: true });
    throw error;
  }
}

function parseSnapshot(raw: string): LoadedCoachEmbeddingSnapshot {
  const candidate = JSON.parse(raw) as Partial<CoachEmbeddingSnapshotFile>;
  if (candidate.schemaVersion !== 1) {
    throw new Error(`Unsupported Coach embedding snapshot version: ${candidate.schemaVersion}.`);
  }
  if (typeof candidate.sourceFingerprint !== 'string' || !candidate.sourceFingerprint) {
    throw new Error('Coach embedding snapshot has no source fingerprint.');
  }
  if (!Number.isInteger(candidate.documentCount) || !candidate.index) {
    throw new Error('Coach embedding snapshot metadata is incomplete.');
  }

  const index = InMemoryVectorIndex.fromSnapshot(candidate.index);
  if (candidate.documentCount !== index.size) {
    throw new Error(
      `Coach embedding snapshot declares ${candidate.documentCount} documents but contains ${index.size}.`,
    );
  }
  return { file: candidate as CoachEmbeddingSnapshotFile, index };
}

export async function readCoachEmbeddingSnapshot(
  filePath: string = DEFAULT_COACH_EMBEDDING_SNAPSHOT_PATH,
): Promise<LoadedCoachEmbeddingSnapshot | null> {
  try {
    return parseSnapshot(await readFile(filePath, 'utf8'));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}
