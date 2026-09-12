import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  EmbeddingDocument,
  EmbeddingImageInput,
  EmbeddingImageMimeType,
} from '../../src/coach/embeddings';
import { fingerprintEmbeddingDocuments } from './snapshotStore';

export const DEFAULT_COACH_SCREENSHOT_IMAGE_DIRECTORY = fileURLToPath(
  new URL('../../src/coach/screenshots/', import.meta.url),
);

const MIME_TYPES_BY_EXTENSION: Record<string, EmbeddingImageMimeType> = {
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

function getScreenshotFileName(document: EmbeddingDocument): string {
  const image = document.metadata.image;
  if (document.kind !== 'screenshot' || typeof image !== 'string' || !image.trim()) {
    throw new Error(`Screenshot document ${document.id} has no image filename.`);
  }
  if (path.basename(image) !== image) {
    throw new Error(`Screenshot document ${document.id} has an unsafe image filename.`);
  }
  return image;
}

function getImageMimeType(fileName: string): EmbeddingImageMimeType {
  const mimeType = MIME_TYPES_BY_EXTENSION[path.extname(fileName).toLowerCase()];
  if (!mimeType) throw new Error(`Unsupported screenshot image format: ${fileName}.`);
  return mimeType;
}

async function loadScreenshotFiles(
  documents: readonly EmbeddingDocument[],
  imageDirectory: string,
): Promise<Map<string, Buffer>> {
  const fileNames = [...new Set(documents.map(getScreenshotFileName))];
  const entries = await Promise.all(fileNames.map(async (fileName) => [
    fileName,
    await readFile(path.join(imageDirectory, fileName)),
  ] as const));
  return new Map(entries);
}

export async function loadCoachImageEmbeddingInputs(
  documents: readonly EmbeddingDocument[],
  imageDirectory: string = DEFAULT_COACH_SCREENSHOT_IMAGE_DIRECTORY,
): Promise<EmbeddingImageInput[]> {
  const screenshotDocuments = documents.filter((document) => document.kind === 'screenshot');
  const files = await loadScreenshotFiles(screenshotDocuments, imageDirectory);
  return screenshotDocuments.map((document) => {
    const fileName = getScreenshotFileName(document);
    const file = files.get(fileName);
    if (!file) throw new Error(`Screenshot image is missing: ${fileName}.`);
    return {
      text: document.text,
      image: {
        mimeType: getImageMimeType(fileName),
        base64: file.toString('base64'),
      },
    };
  });
}

export async function fingerprintCoachEmbeddingSources(
  documents: readonly EmbeddingDocument[],
  imageDirectory: string = DEFAULT_COACH_SCREENSHOT_IMAGE_DIRECTORY,
): Promise<string> {
  const documentFingerprint = fingerprintEmbeddingDocuments(documents);
  const screenshotDocuments = documents
    .filter((document) => document.kind === 'screenshot')
    .sort((left, right) => left.id.localeCompare(right.id));
  if (screenshotDocuments.length === 0) return documentFingerprint;

  const files = await loadScreenshotFiles(screenshotDocuments, imageDirectory);
  const imageFingerprints = screenshotDocuments.map((document) => {
    const fileName = getScreenshotFileName(document);
    const file = files.get(fileName);
    if (!file) throw new Error(`Screenshot image is missing: ${fileName}.`);
    return {
      documentId: document.id,
      fileName,
      sha256: createHash('sha256').update(file).digest('hex'),
    };
  });

  return createHash('sha256')
    .update(JSON.stringify({
      profile: 'coach-text-and-image-v1',
      documentFingerprint,
      imageFingerprints,
    }))
    .digest('hex');
}
