import type { ChatMessage, ConversationState } from './responseEngine';
import { TRAINING_MODULES, type QuizQuestion } from './knowledgeBase';
import { getScreenshotsForFeatures } from './screenshots/manifest';

export function isQuizHelp(text: string) {
  return /\b(hint|explain|help|example|why|clarify)\b|বুঝিয়ে|ব্যাখ্যা|ইঙ্গিত/i.test(text);
}

export function trainingScreenshots(level: number) {
  const lesson = TRAINING_MODULES.find(item => item.level === level);
  if (!lesson) return [];
  // Curated lesson-to-screen mapping prevents broad lesson text from selecting unrelated UI.
  if (level === 1 || level === 8) return getScreenshotsForFeatures(['signup-001']).filter(screen=>screen.src==='image87.jpg');
  const features:Record<number,string[]>={2:['warehouse-001','signup-002'],3:['product-001'],4:['store-001','channels-001'],5:['checkout-001','chats-002'],6:['orders-001'],7:['finance-001','inventory-001']};
  return getScreenshotsForFeatures(features[level] ?? []).slice(0,3);
}

export function modeVisuals(response: ChatMessage, state: ConversationState): ChatMessage {
  if (response.metadata?.screenshots?.length) return response;
  const screenshots = response.type === 'training'
    ? trainingScreenshots(state.currentTrainingLevel ?? 1)
    : response.type === 'quiz'
      // Show neutral navigation during questions rather than screenshots that reveal an answer.
      ? getScreenshotsForFeatures(['signup-001']).filter(screen => screen.src === 'image87.jpg')
      : [];
  return { ...response, metadata: { ...response.metadata, screenshots } };
}

export function quizOptions(question: QuizQuestion): string[] {
  return question.options ?? (question.type === 'true-false' ? ['True', 'False'] : []);
}
