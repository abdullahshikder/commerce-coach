import type {
  EmbeddingImageInput,
  EmbeddingRequestOptions,
  MultimodalEmbeddingProvider,
} from '../../src/coach/embeddings';

export const DEFAULT_OPENROUTER_EMBEDDING_MODEL = 'google/gemini-embedding-2';
export const DEFAULT_OPENROUTER_EMBEDDING_DIMENSIONS = 768;
export const DEFAULT_OPENROUTER_EMBEDDING_BATCH_SIZE = 16;
export const DEFAULT_OPENROUTER_IMAGE_EMBEDDING_BATCH_SIZE = 4;

interface OpenRouterEmbeddingTextContent {
  type: 'text';
  text: string;
}

interface OpenRouterEmbeddingImageContent {
  type: 'image_url';
  image_url: { url: string };
}

interface OpenRouterMultimodalInput {
  content: Array<OpenRouterEmbeddingTextContent | OpenRouterEmbeddingImageContent>;
}

type OpenRouterEmbeddingInput = string | OpenRouterMultimodalInput;

interface OpenRouterEmbeddingData {
  embedding?: number[] | string;
  index?: number;
}

interface OpenRouterEmbeddingResponse {
  data?: OpenRouterEmbeddingData[];
  model?: string;
}

interface OpenRouterEmbeddingProviderOptions {
  apiKey: string;
  model?: string;
  dimensions?: number;
  batchSize?: number;
  imageBatchSize?: number;
  maxAttempts?: number;
  requestTimeoutMs?: number;
  baseUrl?: string;
  httpReferer?: string;
  appTitle?: string;
  fetchImpl?: typeof fetch;
  denyDataCollection?: boolean;
}

class OpenRouterEmbeddingHttpError extends Error {
  constructor(
    readonly status: number,
    readonly retryAfterMs?: number,
  ) {
    super(`OpenRouter embeddings request failed with status ${status}.`);
  }
}

function assertIntegerInRange(value: number, label: string, minimum: number, maximum: number): void {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new RangeError(`${label} must be an integer from ${minimum} to ${maximum}.`);
  }
}

function retryAfterMilliseconds(value: string | null): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1_000;

  const date = Date.parse(value);
  if (Number.isNaN(date)) return undefined;
  return Math.max(0, date - Date.now());
}

function normalizeVector(vector: readonly number[]): number[] {
  if (vector.length === 0 || vector.some((value) => !Number.isFinite(value))) {
    throw new TypeError('OpenRouter returned an empty or non-finite embedding vector.');
  }

  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value ** 2, 0));
  if (magnitude === 0) throw new TypeError('OpenRouter returned a zero-magnitude embedding vector.');
  return vector.map((value) => value / magnitude);
}

function isRetryable(error: unknown): boolean {
  const status = typeof error === 'object' && error !== null && 'status' in error
    ? Number((error as { status?: unknown }).status)
    : undefined;
  if ([408, 429, 500, 502, 503, 524, 529].includes(status ?? 0)) return true;

  const message = error instanceof Error ? error.message : String(error);
  return /rate limit|timed? out|network|fetch failed|aborted/i.test(message);
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function orderEmbeddingData(
  data: readonly OpenRouterEmbeddingData[],
  expectedCount: number,
): OpenRouterEmbeddingData[] {
  if (data.length !== expectedCount) {
    throw new Error(
      `OpenRouter returned ${data.length} vector${data.length === 1 ? '' : 's'} for ${expectedCount} inputs.`,
    );
  }

  const indexedCount = data.filter((entry) => Number.isInteger(entry.index)).length;
  if (indexedCount === 0) return [...data];
  if (indexedCount !== data.length) throw new Error('OpenRouter returned incomplete embedding indexes.');

  const ordered = [...data].sort((left, right) => Number(left.index) - Number(right.index));
  if (ordered.some((entry, index) => entry.index !== index)) {
    throw new Error('OpenRouter returned duplicate or out-of-range embedding indexes.');
  }
  return ordered;
}

export class OpenRouterEmbeddingProvider implements MultimodalEmbeddingProvider {
  readonly name = 'openrouter';
  readonly model: string;
  readonly dimensions: number;
  private readonly apiKey: string;
  private readonly batchSize: number;
  private readonly imageBatchSize: number;
  private readonly maxAttempts: number;
  private readonly requestTimeoutMs: number;
  private readonly endpoint: string;
  private readonly httpReferer: string;
  private readonly appTitle: string;
  private readonly fetchImpl: typeof fetch;
  private readonly denyDataCollection: boolean;

  constructor(options: OpenRouterEmbeddingProviderOptions) {
    this.apiKey = options.apiKey.trim();
    if (!this.apiKey) throw new Error('OPENROUTER_API_KEY is required for semantic retrieval.');

    this.model = options.model?.trim() || DEFAULT_OPENROUTER_EMBEDDING_MODEL;
    this.dimensions = options.dimensions ?? DEFAULT_OPENROUTER_EMBEDDING_DIMENSIONS;
    this.batchSize = options.batchSize ?? DEFAULT_OPENROUTER_EMBEDDING_BATCH_SIZE;
    this.imageBatchSize = options.imageBatchSize ?? DEFAULT_OPENROUTER_IMAGE_EMBEDDING_BATCH_SIZE;
    this.maxAttempts = options.maxAttempts ?? 3;
    this.requestTimeoutMs = options.requestTimeoutMs ?? 60_000;
    this.endpoint = `${(options.baseUrl ?? 'https://openrouter.ai/api/v1').replace(/\/$/, '')}/embeddings`;
    this.httpReferer = options.httpReferer ?? 'https://commerce.pathao.com';
    this.appTitle = options.appTitle ?? 'Pathao Commerce Coach';
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.denyDataCollection = options.denyDataCollection ?? true;

    assertIntegerInRange(this.dimensions, 'Embedding dimensions', 1, 3072);
    assertIntegerInRange(this.batchSize, 'Embedding batch size', 1, 100);
    assertIntegerInRange(this.imageBatchSize, 'Image embedding batch size', 1, 20);
    assertIntegerInRange(this.maxAttempts, 'Embedding attempts', 1, 5);
    assertIntegerInRange(this.requestTimeoutMs, 'Embedding timeout', 1_000, 120_000);
  }

  async embed(
    texts: readonly string[],
    options: EmbeddingRequestOptions = {},
  ): Promise<number[][]> {
    if (texts.length === 0) return [];
    if (texts.some((text) => !text.trim())) throw new Error('Embedding text cannot be empty.');

    return this.embedInputs(texts.map((text) => text.trim()), this.batchSize, options);
  }

  async embedImages(
    inputs: readonly EmbeddingImageInput[],
    options: EmbeddingRequestOptions = {},
  ): Promise<number[][]> {
    if (inputs.length === 0) return [];

    const multimodalInputs = inputs.map((input): OpenRouterMultimodalInput => {
      if (!input.image.base64.trim()) throw new Error('Embedding image data cannot be empty.');
      const content: OpenRouterMultimodalInput['content'] = [];
      // Keep descriptive text first so multimodal providers interpret the image in its workflow context.
      if (input.text?.trim()) content.push({ type: 'text', text: input.text.trim() });
      content.push({
        type: 'image_url',
        image_url: {
          url: `data:${input.image.mimeType};base64,${input.image.base64}`,
        },
      });
      return { content };
    });

    return this.embedInputs(multimodalInputs, this.imageBatchSize, options);
  }

  private async embedInputs(
    inputs: readonly OpenRouterEmbeddingInput[],
    batchSize: number,
    options: EmbeddingRequestOptions,
  ): Promise<number[][]> {
    const vectors: number[][] = [];
    for (let start = 0; start < inputs.length; start += batchSize) {
      const batch = inputs.slice(start, start + batchSize);
      const payload = await this.embedBatch(batch, options);
      const ordered = orderEmbeddingData(payload.data ?? [], batch.length);

      for (const entry of ordered) {
        if (!Array.isArray(entry.embedding)) {
          throw new TypeError('OpenRouter returned a non-float embedding.');
        }
        const vector = normalizeVector(entry.embedding);
        if (vector.length !== this.dimensions) {
          throw new RangeError(
            `OpenRouter returned ${vector.length} dimensions; expected ${this.dimensions}.`,
          );
        }
        vectors.push(vector);
      }
    }
    return vectors;
  }

  private async embedBatch(
    inputs: readonly OpenRouterEmbeddingInput[],
    options: EmbeddingRequestOptions,
  ): Promise<OpenRouterEmbeddingResponse> {
    const body = {
      model: this.model,
      input: inputs,
      dimensions: this.dimensions,
      encoding_format: 'float',
      ...(options.task
        ? { input_type: options.task === 'retrieval-query' ? 'search_query' : 'search_document' }
        : {}),
      ...(this.denyDataCollection
        ? { provider: { data_collection: 'deny', allow_fallbacks: true } }
        : {}),
    };

    let lastError: unknown;
    for (let attempt = 1; attempt <= this.maxAttempts; attempt += 1) {
      const controller = new AbortController();
      const timeout = globalThis.setTimeout(() => controller.abort(), this.requestTimeoutMs);
      try {
        const response = await this.fetchImpl(this.endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': this.httpReferer,
            'X-OpenRouter-Title': this.appTitle,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new OpenRouterEmbeddingHttpError(
            response.status,
            retryAfterMilliseconds(response.headers.get('Retry-After')),
          );
        }

        const payload: unknown = await response.json();
        if (!payload || typeof payload !== 'object') {
          throw new TypeError('OpenRouter returned an invalid embedding response.');
        }
        return payload as OpenRouterEmbeddingResponse;
      } catch (error) {
        lastError = error;
        if (attempt === this.maxAttempts || !isRetryable(error)) throw error;
        const retryAfterMs = error instanceof OpenRouterEmbeddingHttpError
          ? error.retryAfterMs
          : undefined;
        const backoffMs = 250 * 2 ** (attempt - 1) + Math.floor(Math.random() * 100);
        await wait(Math.min(5_000, retryAfterMs ?? backoffMs));
      } finally {
        globalThis.clearTimeout(timeout);
      }
    }
    throw lastError;
  }
}
