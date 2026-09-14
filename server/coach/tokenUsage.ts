import { AsyncLocalStorage } from 'node:async_hooks';
import { providerUsage } from '../observability';
import type { AnalyticsProvider } from './pgAnalyticsStore';
import type { ModelPhase } from './modelBudget';

export interface TokenUsage {
  provider: AnalyticsProvider;
  phase: ModelPhase;
  inputTokens: number;
  outputTokens: number;
}

type TokenUsageRecorder = (usage: TokenUsage) => Promise<void>;
const tokenUsageContext = new AsyncLocalStorage<TokenUsageRecorder>();

const tokenCount = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
  ? value
  : undefined;

export function withTokenUsage<T>(recorder: TokenUsageRecorder, action: () => Promise<T>): Promise<T> {
  return tokenUsageContext.run(recorder, action);
}

export async function recordTokenUsage(provider: AnalyticsProvider, usage: {
  phase: ModelPhase;
  inputTokens?: unknown;
  outputTokens?: unknown;
  costUsd?: unknown;
}): Promise<void> {
  providerUsage(provider, usage);
  const inputTokens = tokenCount(usage.inputTokens);
  const outputTokens = tokenCount(usage.outputTokens);
  if (inputTokens === undefined && outputTokens === undefined) return;
  const recorder = tokenUsageContext.getStore();
  if (!recorder) return;
  try {
    await recorder({ provider, phase: usage.phase, inputTokens: inputTokens ?? 0, outputTokens: outputTokens ?? 0 });
  } catch {
    console.error(JSON.stringify({ event: 'token_usage_write_failed', provider }));
  }
}
