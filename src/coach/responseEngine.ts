import { freshScreenContext, type ScreenContext } from './screenContext';
import type { QuizQuestion } from './knowledgeBase';
import { SCREENSHOT_INDEX, type Screenshot } from './screenshots/manifest';
import { generateLLMResponse, isGeminiAvailable } from './geminiService';
import { generateOpenRouterResponse, isOpenRouterAvailable } from './openrouterService';
import { loadProviders } from './providerClient';
import { retrieveCoachContext } from './semanticRetrieval';
import type { CoachQueryIntent } from './queryIntent';

export { isGeminiAvailable } from './geminiService';
export { isOpenRouterAvailable } from './openrouterService';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  type?: 'text' | 'knowledge' | 'quiz' | 'training' | 'error';
  metadata?: {
    domain?: string;
    feature?: string;
    confidence?: 'high' | 'medium' | 'low';
    source?: string;
    status?: string;
    screenshots?: Screenshot[];
    retrievalDocumentIds?: string[];
    provider?: 'openrouter' | 'gemini' | 'local';
    intent?: Pick<
      CoachQueryIntent,
      'id' | 'kind' | 'label' | 'confidence' | 'inheritedContext'
      | 'language'
    >;
  };
}

export interface ConversationState {
  mode: 'normal' | 'training' | 'quiz' | 'troubleshoot' | 'merchant-sim';
  currentTrainingLevel?: number;
  currentQuiz?: QuizQuestion[];
  quizScore: { correct: number; total: number };
  quizHistory: { domain: string; correct: boolean }[];
  lastDomain?: string;
}

type CoachResult = { response: ChatMessage; newState: ConversationState };

function msg(content: string, type: ChatMessage['type'], metadata?: ChatMessage['metadata'], id: string = crypto.randomUUID()): ChatMessage {
  return { id, role: 'assistant', content, type, metadata, timestamp: new Date() };
}

export function generationError(state: ConversationState): CoachResult {
  return {
    response: msg("I couldn't generate an answer right now. Please try again in a moment. If this continues, ask your workspace admin to check the AI connection.", 'error'),
    newState: state,
  };
}

function conversationMessages(userMessage: string, history: ChatMessage[]): ChatMessage[] {
  // Operational errors and old local answers are not reliable topic or product evidence.
  const messages = history.filter(message =>
    (message.role === 'user' || message.role === 'assistant')
    && message.type !== 'error'
    && !(message.role === 'assistant' && message.metadata?.provider === 'local'),
  );
  const last = messages.at(-1);
  if (last?.role !== 'user' || last.content.trim() !== userMessage.trim()) {
    messages.push({ id: crypto.randomUUID(), role: 'user', content: userMessage, timestamp: new Date() });
  }
  return messages.slice(-30);
}

function selectedScreenshots(suggestions: Screenshot[] = []): Screenshot[] {
  const seen = new Set<string>();
  return suggestions.flatMap(suggestion => {
    const reference = SCREENSHOT_INDEX.find(screen => screen.src === suggestion?.src);
    if (!reference || seen.has(reference.src) || seen.size >= 4) return [];
    seen.add(reference.src);
    return [reference];
  });
}

export async function processMessageLLM(
  userMessage: string,
  state: ConversationState,
  messageHistory: ChatMessage[] = [],
  provider: 'openrouter' | 'gemini' = 'openrouter',
  screenContext?: ScreenContext,
): Promise<CoachResult> {
  if (!userMessage.trim()) {
    return { response: msg('Please type a message so I can help you.', 'error'), newState: state };
  }

  if (!isOpenRouterAvailable() && !isGeminiAvailable()) await loadProviders();
  const candidates = ([provider, provider === 'openrouter' ? 'gemini' : 'openrouter'] as const)
    .filter(candidate => candidate === 'openrouter' ? isOpenRouterAvailable() : isGeminiAvailable());
  if (!candidates.length) return generationError(state);

  const messages = conversationMessages(userMessage, messageHistory);
  // Retrieve the current question, not a canonical workflow that could restart an earlier task.
  // The model receives history and can search again using the context it understands.
  const retrieved = await retrieveCoachContext(userMessage);
  const grounding = retrieved?.context;
  // Persisted mode flags are legacy UI state; they must not override the latest user request.
  const nextState: ConversationState = {
    mode: 'normal', quizScore: { correct: 0, total: 0 }, quizHistory: [],
  };

  for (const candidate of candidates) {
    try {
      const generate = candidate === 'openrouter' ? generateOpenRouterResponse : generateLLMResponse;
      const generated = await generate(messages, nextState, grounding, freshScreenContext(screenContext), retrieved?.documentIds ?? []);
      if (!generated.content?.trim()) throw new Error('Empty generated answer');
      const screenshots = selectedScreenshots(generated.screenshots);
      return {
        response: msg(generated.content.trim(), 'knowledge', {
          provider: candidate,
          retrievalDocumentIds: retrieved?.documentIds ?? [],
          screenshots: screenshots.length ? screenshots : undefined,
        }, generated.responseId),
        newState: nextState,
      };
    } catch {
      // Another configured provider can answer; never substitute a stored product answer.
    }
  }
  return generationError(state);
}

export function getWelcomeMessage(): ChatMessage {
  return msg("Hi! Ask me about Pathao Commerce, or tell me which step you're on and what's confusing. I'll help you from there.", 'text');
}

export function getQuickActions(_state: ConversationState): string[] {
  return ['How do I create a product?', "I'm stuck on product variants", 'Help me find an order', 'How do I set up my store?'];
}
