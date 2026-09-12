import { screenshotUrl } from './screenshotAssets';
import { EmptyState } from '../components/EmptyState';
import { useAuth } from '../auth/AuthContext';
import { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  Inbox,
  Loader2,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import {
  listCoachFeedback,
  reviewCoachFeedback,
  type CoachFeedbackRecord,
} from './feedback';

const ISSUE_LABELS: Record<string, string> = {
  'wrong-answer': 'Wrong answer',
  'wrong-screenshots': 'Wrong screenshots',
  'missing-information': 'Missing information',
  other: 'Other',
};

export function CoachFeedbackReviewPanel({onDiscuss, disabled=false}: {onDiscuss?: (item: CoachFeedbackRecord)=>void; disabled?:boolean} = {}) {
  const { user } = useAuth();
  const isInternal = user.role === 'admin' || user.role === 'reviewer';
  const [items, setItems] = useState<CoachFeedbackRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string>();
  const [error, setError] = useState('');

  const loadQueue = useCallback(async () => {
    if (!isInternal) return;
    setIsLoading(true);
    setError('');
    try {
      setItems(await listCoachFeedback());
    } catch {
      setError('The feedback queue could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  }, [user.id, user.role]);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  const handleReview = async (item: CoachFeedbackRecord, status: 'approved' | 'dismissed') => {
    if (!isInternal) return;
    setReviewingId(item.id);
    setError('');
    try {
      await reviewCoachFeedback(item.id, status);
      setItems((current) => current.filter(({ id }) => id !== item.id));
    } catch {
      setError('The review decision could not be saved.');
    } finally {
      setReviewingId(undefined);
    }
  };

  if (!isInternal) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <EmptyState title="Reviews are handled by your team" description="A reviewer or admin can review reported answers. To report an issue, use the feedback button below a Coach answer."/>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Inbox size={19} className="text-violet-600" />
              <h2 className="text-lg font-bold text-gray-900">Coach feedback review</h2>
            </div>
            <p className="mt-1 text-xs leading-5 text-gray-500">
              Approve valid evidence or dismiss noise. Approval records the decision; workflow content
              remains versioned and must pass regression checks before embeddings can be rebuilt.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadQueue()}
            disabled={isLoading}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {error && items.length > 0 && (
          <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
            {error}
          </div>
        )}

        {isLoading && items.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500">
            <Loader2 size={16} className="animate-spin" />
            Loading feedback…
          </div>
        ) : error && items.length === 0 ? (
          <EmptyState title="Feedback couldn’t be loaded" description="Try again to see reports waiting for review." action={<button type="button" onClick={()=>void loadQueue()}>Try again</button>}/>
        ) : items.length === 0 ? (
          <EmptyState title="You’re all caught up" description="There are no answers waiting for review. Reports from your team will appear here."/>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <article key={item.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-rose-700">
                    {ISSUE_LABELS[item.issueType ?? 'other']}
                  </span>
                  {item.provider && (
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-medium text-gray-500">
                      {item.provider}
                    </span>
                  )}
                  {item.intentId && (
                    <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-medium text-violet-700">
                      {item.intentId}
                    </span>
                  )}
                  <span className="ml-auto text-[10px] text-gray-400">
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="mb-1 font-semibold text-gray-500">Merchant question</div>
                    <div className="rounded-lg bg-gray-50 px-3 py-2 leading-5 text-gray-800">{item.query}</div>
                  </div>
                  <div>
                    <div className="mb-1 font-semibold text-gray-500">Coach answered</div>
                    <div className="max-h-28 overflow-y-auto rounded-lg border border-gray-100 px-3 py-2 leading-5 text-gray-600">
                      {item.answer}
                    </div>
                  </div>
                  {item.suggestedAnswer && (
                    <div>
                      <div className="mb-1 font-semibold text-gray-500">Suggested correction</div>
                      <div className="rounded-lg border border-violet-100 bg-violet-50 px-3 py-2 leading-5 text-violet-900">
                        {item.suggestedAnswer}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-3 overflow-x-auto">{item.screenshotIds.filter(id=>screenshotUrl(id)).map(id=><img key={id} src={screenshotUrl(id)} alt="Screenshot included in the reported answer" className="w-64 shrink-0 rounded-lg border object-contain" loading="lazy"/>)}</div>
                  <div className="grid gap-2 text-[10px] text-gray-500 sm:grid-cols-2">
                    <div className="rounded-lg bg-gray-50 px-3 py-2">
                      Screens shown: {item.screenshotIds.length ? item.screenshotIds.join(', ') : 'none'}
                    </div>
                    <div className="rounded-lg bg-gray-50 px-3 py-2">
                      Retrieved: {item.retrievalDocumentIds.length ? item.retrievalDocumentIds.join(', ') : 'none'}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4">
                  {onDiscuss&&<button type="button" disabled={disabled||Boolean(reviewingId)} onClick={()=>onDiscuss(item)} className="rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-50">Discuss with Coach ↗</button>}
                  <button
                    type="button"
                    onClick={() => void handleReview(item, 'dismissed')}
                    disabled={Boolean(reviewingId)}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <XCircle size={13} />
                    Dismiss
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleReview(item, 'approved')}
                    disabled={Boolean(reviewingId)}
                    className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
                  >
                    {reviewingId === item.id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                    Approve evidence
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
