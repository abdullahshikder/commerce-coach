import type { ScreenContext } from './screenContext';
import { authFetch } from '../auth/client';
import type { ChatMessage, ConversationState } from './responseEngine';
import type { generateOpenRouterResponse } from '../../server/coach/openrouterService';
export type ClientGenerationResponse = Awaited<ReturnType<typeof generateOpenRouterResponse>> & { responseId?: string };
export const providers = { openrouter: false, gemini: false };
export async function loadProviders() {
  try {
    const response = await authFetch('/api/config', { signal: AbortSignal.timeout(5000) });
    if (response.ok) Object.assign(providers, await response.json());
  } catch { /* Local knowledge remains usable when the API is unavailable. */ }
}
export async function generate(provider: 'openrouter' | 'gemini', messages: ChatMessage[], state: ConversationState, retrievalContext?: string, screenContext?: ScreenContext, retrievalDocumentIds: string[] = []): Promise<ClientGenerationResponse> {
  const response = await authFetch('/api/coach/generate', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, messages: messages.slice(-12), state, retrievalContext, screenContext, retrievalDocumentIds }),
    signal: AbortSignal.timeout(120000),
  });
  if (!response.ok) throw new Error('AI generation is unavailable.');
  return response.json();
}
