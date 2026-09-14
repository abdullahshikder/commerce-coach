export const MODEL_BUDGET = {
  conversationMessages: 12,
  conversationCharacters: 16_000,
  generationOutputTokens: 1_024,
  understandingOutputTokens: 600,
  answerReviewOutputTokens: 1_400,
  visualReviewOutputTokens: 400,
  visualCandidates: 8,
} as const;

export type ModelPhase = 'understanding' | 'generation' | 'answer-review' | 'visual-review';

export function recentConversation<T extends { content: string }>(messages: T[]): T[] {
  const selected: T[] = [];
  let characters = 0;

  for (let index = messages.length - 1; index >= 0 && selected.length < MODEL_BUDGET.conversationMessages; index--) {
    const message = messages[index];
    if (selected.length > 0 && characters + message.content.length > MODEL_BUDGET.conversationCharacters) break;
    selected.push(message);
    characters += message.content.length;
  }

  return selected.reverse();
}

export function structuredOutputBudget(instructions: string): number {
  if (instructions.includes('## FINAL VISUAL REVIEW')) return MODEL_BUDGET.visualReviewOutputTokens;
  if (instructions.includes('## FINAL ANSWER REVIEW')) return MODEL_BUDGET.answerReviewOutputTokens;
  return MODEL_BUDGET.understandingOutputTokens;
}

export function structuredModelPhase(instructions: string): ModelPhase {
  if (instructions.includes('## FINAL VISUAL REVIEW')) return 'visual-review';
  if (instructions.includes('## FINAL ANSWER REVIEW')) return 'answer-review';
  return 'understanding';
}
