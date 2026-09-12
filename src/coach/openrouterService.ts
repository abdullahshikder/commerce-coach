import { generate, providers } from './providerClient';
import type { ScreenContext } from './screenContext';
import type { ChatMessage, ConversationState } from './responseEngine';
export const isOpenRouterAvailable = () => providers.openrouter;
export const generateOpenRouterResponse = (
  messages: ChatMessage[],
  state: ConversationState,
  retrievalContext?: string,
  screenContext?: ScreenContext,
  retrievalDocumentIds?: string[],
) => generate('openrouter', messages, state, retrievalContext, screenContext, retrievalDocumentIds);
