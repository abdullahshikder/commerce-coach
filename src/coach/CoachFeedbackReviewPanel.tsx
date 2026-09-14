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
import { processMessageLLM, type ChatMessage, type ConversationState } from './responseEngine';

const ISSUE_LABELS: Record<string, string> = {
  'wrong-answer': 'Wrong answer',
  'wrong-screenshots': 'Wrong screenshots',
  'missing-information': 'Missing information',
  other: 'Other',
};

type DiscussionMessage = Pick<ChatMessage, 'role' | 'content'>;
const freshState = (): ConversationState => ({ mode: 'normal', quizScore: { correct: 0, total: 0 }, quizHistory: [] });
function discussionPrompt(item: CoachFeedbackRecord, followUp = '') {
  return `Review this reported Pathao Commerce answer using the available documentation. Stay in the Learning correction workflow: do not claim to approve feedback or change knowledge. Return a concise corrected response for the merchant, in the merchant's language when apparent. Be precise about what was wrong and avoid unsupported claims.\n\nMerchant question: ${item.query}\nReported answer: ${item.answer}\nExisting suggested correction: ${item.suggestedAnswer || 'None'}${followUp ? `\n\nReviewer follow-up: ${followUp}` : ''}`;
}

export function CoachFeedbackReviewPanel({disabled=false}: {disabled?:boolean} = {}) {
  const { user } = useAuth();
  const isInternal = user.role === 'admin' || user.role === 'reviewer';
  const [items, setItems] = useState<CoachFeedbackRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string>();
  const [activeDiscussionId, setActiveDiscussionId] = useState<string>();
  const [discussingId, setDiscussingId] = useState<string>();
  const [discussionMessages, setDiscussionMessages] = useState<DiscussionMessage[]>([]);
  const [correction, setCorrection] = useState('');
  const [followUp, setFollowUp] = useState('');
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

  const discuss = async (item: CoachFeedbackRecord, reviewerFollowUp = '') => {
    setDiscussingId(item.id); setError('');
    if (reviewerFollowUp) setDiscussionMessages(current => [...current, { role: 'user', content: reviewerFollowUp }]);
    try {
      const result = await processMessageLLM(discussionPrompt(item, reviewerFollowUp), freshState());
      if (result.response.type === 'error') throw new Error(result.response.content);
      setDiscussionMessages(current => [...current, { role: 'assistant', content: result.response.content }]);
      setCorrection(result.response.content); setFollowUp('');
    } catch { setError('The correction discussion could not be generated. Please try again.'); }
    finally { setDiscussingId(undefined); }
  };

  const approveCorrection = async (item: CoachFeedbackRecord) => {
    if (!correction.trim()) return;
    setReviewingId(item.id); setError('');
    try {
      await reviewCoachFeedback(item.id, 'approved', undefined, correction);
      setItems(current => current.filter(({ id }) => id !== item.id));
      setDiscussingId(undefined); setActiveDiscussionId(undefined); setDiscussionMessages([]); setCorrection('');
    } catch { setError('The correction could not be approved and saved.'); }
    finally { setReviewingId(undefined); }
  };

  if (!isInternal) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <EmptyState title="Reviews are handled by your team" description="A reviewer or admin can review reported answers. To report an issue, use the feedback button below a Coach answer."/>
      </div>
    );
  }

  return (
    <div className="feedback-review flex-1 overflow-y-auto">
      <div className="feedback-review-content">
        <div className="feedback-review-header">
          <div>
            <div className="flex items-center gap-2">
              <Inbox size={18} className="text-red-700" />
              <h2>Coach feedback review</h2>
            </div>
            <p>
              Discuss a reported answer here, refine the proposed correction, then approve and save it.
              Saved corrections are reviewer-approved context for matching future Coach answers.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadQueue()}
            disabled={isLoading}
            className="review-refresh"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {error && items.length > 0 && (
          <div role="alert" className="review-error">
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
          <EmptyState
            className="feedback-empty-state"
            icon={<CheckCircle2 size={22}/>}
            title="No reports waiting for review"
            description="New reports appear here when a merchant marks a Coach answer as unhelpful."
          />
        ) : (
          <div className="feedback-review-list">
            {items.map((item) => (
              <article key={item.id} className="feedback-review-item">
                <div className="review-item-meta">
                  <span className="review-issue">
                    {ISSUE_LABELS[item.issueType ?? 'other']}
                  </span>
                  {item.provider && (
                    <span>
                      {item.provider}
                    </span>
                  )}
                  {item.intentId && (
                    <span>
                      {item.intentId}
                    </span>
                  )}
                  <time>
                    {new Date(item.createdAt).toLocaleString()}
                  </time>
                </div>

                <div className="review-evidence">
                  <div>
                    <h3>Merchant question</h3>
                    <p className="review-question">{item.query}</p>
                  </div>
                  <div>
                    <h3>Coach answered</h3>
                    <p className="review-answer">
                      {item.answer}
                    </p>
                  </div>
                  {item.suggestedAnswer && (
                    <div>
                      <h3>Suggested correction</h3>
                      <p className="review-suggestion">
                        {item.suggestedAnswer}
                      </p>
                    </div>
                  )}
                  <div className="review-screenshots">{item.screenshotIds.filter(id=>screenshotUrl(id)).map(id=><img key={id} src={screenshotUrl(id)} alt="Screenshot included in the reported answer" loading="lazy"/>)}</div>
                  <div className="review-details">
                    <p>
                      Screens shown: {item.screenshotIds.length ? item.screenshotIds.join(', ') : 'none'}
                    </p>
                    <p>
                      Retrieved: {item.retrievalDocumentIds.length ? item.retrievalDocumentIds.join(', ') : 'none'}
                    </p>
                  </div>
                </div>

                <div className="review-actions">
                  <button type="button" disabled={disabled||Boolean(reviewingId)||Boolean(discussingId)} onClick={()=>{setActiveDiscussionId(item.id);setDiscussionMessages([]);setCorrection(item.suggestedAnswer || '');void discuss(item);}} className="review-discuss">Discuss correction</button>
                  <button
                    type="button"
                    onClick={() => void handleReview(item, 'dismissed')}
                    disabled={Boolean(reviewingId)}
                    className="review-dismiss"
                  >
                    <XCircle size={13} />
                    Dismiss
                  </button>
                </div>
                {activeDiscussionId===item.id&&(
                  <section className="learning-correction" aria-label="Correction discussion">
                    <h3>Correction discussion</h3>
                    {discussionMessages.map((message,index)=><p key={index} className={message.role==='assistant'?'learning-correction-answer':'learning-correction-question'}>{message.content}</p>)}
                    {discussingId===item.id&&<p role="status"><Loader2 size={14} className="animate-spin"/>Preparing a corrected response…</p>}
                    <label htmlFor={`correction-${item.id}`}>Approved response</label>
                    <textarea id={`correction-${item.id}`} value={correction} maxLength={4000} onChange={event=>setCorrection(event.target.value)} placeholder="Discuss the report to draft a corrected response." />
                    <label htmlFor={`follow-up-${item.id}`}>Ask a follow-up</label>
                    <div className="learning-correction-follow-up"><input id={`follow-up-${item.id}`} value={followUp} maxLength={1000} onChange={event=>setFollowUp(event.target.value)} placeholder="Ask Coach to refine the correction"/><button type="button" disabled={!followUp.trim()||Boolean(discussingId)||Boolean(reviewingId)} onClick={()=>void discuss(item,followUp.trim())}>Discuss</button></div>
                    <div className="review-actions"><button type="button" className="review-approve" disabled={!correction.trim()||Boolean(discussingId)||Boolean(reviewingId)} onClick={()=>void approveCorrection(item)}>{reviewingId===item.id?<Loader2 size={13} className="animate-spin"/>:<CheckCircle2 size={13}/>}Approve &amp; save correction</button></div>
                  </section>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
