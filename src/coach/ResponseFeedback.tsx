import { useState } from 'react';
import {
  Check,
  Loader2,
  MessageSquareWarning,
  ThumbsDown,
  ThumbsUp,
  X,
} from 'lucide-react';
import type { ChatMessage } from './responseEngine';
import {
  submitCoachFeedback,
  type CoachFeedbackIssueType,
} from './feedback';

const ISSUE_OPTIONS: { id: CoachFeedbackIssueType; label: string }[] = [
  { id: 'wrong-answer', label: 'Wrong answer' },
  { id: 'wrong-screenshots', label: 'Wrong screenshots' },
  { id: 'missing-information', label: 'Missing information' },
  { id: 'other', label: 'Other' },
];

interface ResponseFeedbackProps {
  message: ChatMessage;
  query?: string;
  compact?: boolean;
}

export function ResponseFeedback({ message, query, compact = false }: ResponseFeedbackProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [issueType, setIssueType] = useState<CoachFeedbackIssueType>('wrong-answer');
  const [suggestedAnswer, setSuggestedAnswer] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedRating, setSavedRating] = useState<'helpful' | 'unhelpful'>();
  const [error, setError] = useState('');

  if (!query || message.role !== 'assistant' || message.type === 'error') return null;

  const save = async (rating: 'helpful' | 'unhelpful') => {
    setIsSaving(true);
    setError('');
    try {
      await submitCoachFeedback({
        responseId: message.id,
        query,
        answer: message.content,
        rating,
        ...(rating === 'unhelpful' ? { issueType } : {}),
        ...(suggestedAnswer.trim() ? { suggestedAnswer: suggestedAnswer.trim() } : {}),
        screenshotIds: message.metadata?.screenshots?.map(({ src }) => src) ?? [],
        retrievalDocumentIds: message.metadata?.retrievalDocumentIds ?? [],
        provider: message.metadata?.provider ?? message.metadata?.source ?? 'local',
        intentId: message.metadata?.intent?.id,
      });
      setSavedRating(rating);
      setIsOpen(false);
    } catch {
      setError('Feedback could not be saved.');
    } finally {
      setIsSaving(false);
    }
  };

  if (savedRating) {
    return (
      <div className={`flex items-center gap-1.5 text-emerald-600 ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
        <Check size={compact ? 10 : 12} />
        {savedRating === 'helpful' ? 'Marked helpful' : 'Added to review queue'}
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-1 text-gray-400">
        {!compact && <span className="mr-1 text-[10px]">Was this useful?</span>}
        <button
          type="button"
          onClick={() => save('helpful')}
          disabled={isSaving}
          className="rounded-md p-1 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50"
          aria-label="Mark answer helpful"
          title="Helpful"
        >
          <ThumbsUp size={compact ? 11 : 13} />
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          disabled={isSaving}
          className="rounded-md p-1 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
          aria-label="Report a problem with this answer"
          title="Needs improvement"
        >
          <ThumbsDown size={compact ? 11 : 13} />
        </button>
      </div>

      {isOpen && (
        <div className={`mt-2 rounded-xl border border-rose-100 bg-rose-50/70 p-3 text-left ${compact ? 'w-64' : 'w-full'}`}>
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-800">
              <MessageSquareWarning size={13} className="text-rose-500" />
              What needs improvement?
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded p-0.5 text-gray-400 hover:bg-white hover:text-gray-600"
              aria-label="Close feedback form"
            >
              <X size={12} />
            </button>
          </div>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {ISSUE_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setIssueType(option.id)}
                className={`rounded-full border px-2 py-1 text-[9px] font-medium ${
                  issueType === option.id
                    ? 'border-rose-300 bg-white text-rose-700'
                    : 'border-gray-200 bg-white/70 text-gray-500 hover:border-gray-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <textarea
            value={suggestedAnswer}
            onChange={(event) => setSuggestedAnswer(event.target.value)}
            rows={2}
            maxLength={4_000}
            placeholder="Optional: what should Coach have said or shown?"
            className="w-full resize-none rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-[10px] text-gray-700 outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
          />
          {error && <p className="mt-1 text-[9px] text-rose-600">{error}</p>}
          <button
            type="button"
            onClick={() => save('unhelpful')}
            disabled={isSaving}
            className="mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-[10px] font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {isSaving && <Loader2 size={10} className="animate-spin" />}
            Add to review queue
          </button>
        </div>
      )}
    </div>
  );
}
