import { authFetch } from '../auth/client';
import type { ChatMessage } from './responseEngine';

export type CoachFeedbackRating = 'helpful' | 'unhelpful';
export type CoachFeedbackIssueType =
  | 'wrong-answer'
  | 'wrong-screenshots'
  | 'missing-information'
  | 'other';

export interface SubmitCoachFeedbackInput {
  responseId: string;
  query: string;
  answer: string;
  rating: CoachFeedbackRating;
  issueType?: CoachFeedbackIssueType;
  comment?: string;
  suggestedAnswer?: string;
  screenshotIds?: string[];
  retrievalDocumentIds?: string[];
  provider?: string;
  intentId?: string;
}

export type CoachFeedbackStatus = 'recorded' | 'pending' | 'approved' | 'dismissed';

export interface CoachFeedbackRecord extends SubmitCoachFeedbackInput {
  id: string;
  status: CoachFeedbackStatus;
  screenshotIds: string[];
  retrievalDocumentIds: string[];
  reviewerId?: string;
  reviewNote?: string;
  createdAt: string;
  updatedAt: string;
}

export function findFeedbackQuery(messages: ChatMessage[], responseId: string): string | undefined {
  const responseIndex = messages.findIndex(({ id }) => id === responseId);
  for (let index = responseIndex - 1; index >= 0; index -= 1) {
    if (messages[index].role === 'user') return messages[index].content;
  }
  return undefined;
}

export async function submitCoachFeedback(input: SubmitCoachFeedbackInput): Promise<void> {
  const response = await authFetch('/api/coach/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error('Could not save Coach feedback.');
}

export async function listCoachFeedback(
  status: CoachFeedbackStatus = 'pending',
): Promise<CoachFeedbackRecord[]> {
  const response = await authFetch(`/api/coach/feedback?status=${encodeURIComponent(status)}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error('Could not load the Coach feedback queue.');
  const body = await response.json() as { items?: CoachFeedbackRecord[] };
  return body.items ?? [];
}

export async function reviewCoachFeedback(
  id: string,
  status: 'approved' | 'dismissed',
  reviewNote?: string,
): Promise<CoachFeedbackRecord> {
  const response = await authFetch(`/api/coach/feedback/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, ...(reviewNote?.trim() ? { reviewNote: reviewNote.trim() } : {}) }),
  });
  if (!response.ok) throw new Error('Could not update this Coach feedback item.');
  const body = await response.json() as { feedback: CoachFeedbackRecord };
  return body.feedback;
}
