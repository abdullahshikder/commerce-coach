import { generate, providers } from './providerClient';
import type { ScreenContext } from './screenContext';
import type { ChatMessage, ConversationState } from './responseEngine';
export const isGeminiAvailable = () => providers.gemini;
export const generateLLMResponse = (
  messages: ChatMessage[],
  state: ConversationState,
  retrievalContext?: string,
  screenContext?: ScreenContext,
  retrievalDocumentIds?: string[],
) => generate('gemini', messages, state, retrievalContext, screenContext, retrievalDocumentIds);
