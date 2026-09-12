import { useEffect, useState, type ReactNode } from 'react';
import { BarChart3, CircleAlert, MessageSquareText, RefreshCw, ShieldCheck, ThumbsUp } from 'lucide-react';
import { api } from './client';

type RangeDays = 7 | 30 | 90;
interface NamedCount { name: string; count: number; }
interface DailyCount { date: string; queries: number; failures: number; feedback: number; }
interface AnalyticsData {
  range: { days: number; from: string; through: string };
  totals: { queries: number; failures: number; feedback: number; helpful: number; unhelpful: number; pendingFeedback: number };
  trend: DailyCount[];
  topics: NamedCount[];
  providers: NamedCount[];
  modes: NamedCount[];
  failureKinds: NamedCount[];
  issues: NamedCount[];
}

const LABELS: Record<string, string> = {
  gemini: 'Gemini', openrouter: 'OpenRouter', normal: 'Standard', training: 'Training', quiz: 'Quiz',
  troubleshoot: 'Troubleshooting', 'merchant-sim': 'Merchant simulation', 'not-configured': 'Provider not configured',
  'provider-request': 'Provider request failed', 'invalid-answer': 'Invalid provider answer',
  'wrong-answer': 'Wrong answer', 'wrong-screenshots': 'Wrong screenshots',
  'missing-information': 'Missing information', other: 'Other', unspecified: 'Unspecified',
};
const label = (value: string) => LABELS[value] ?? value;

function MetricCard({ icon, label: title, value, detail }: { icon: ReactNode; label: string; value: string | number; detail: string }) {
  return <article className="analytics-metric"><span className="analytics-metric-icon">{icon}</span><div><p>{title}</p><strong>{value}</strong><small>{detail}</small></div></article>;
}

function Breakdown({ title, items, empty }: { title: string; items: NamedCount[]; empty: string }) {
  const max = Math.max(1, ...items.map(item => item.count));
  return <section className="analytics-panel"><h2>{title}</h2>{items.length ? <div className="analytics-breakdown">{items.map(item => <div key={item.name} className="analytics-breakdown-row"><div><span>{label(item.name)}</span><strong>{item.count}</strong></div><div className="analytics-track"><span style={{ width: `${Math.max(4, item.count / max * 100)}%` }}/></div></div>)}</div> : <p>{empty}</p>}</section>;
}

export function AnalyticsPanel() {
  const [days, setDays] = useState<RangeDays>(30);
  const [data, setData] = useState<AnalyticsData>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = async (range = days) => {
    setLoading(true);
    try { setData(await api<AnalyticsData>(`/api/analytics?days=${range}`)); setError(''); }
    catch (caught) { setError((caught as Error).message); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(days); }, [days]);
  const helpfulRate = data?.totals.feedback ? `${Math.round(data.totals.helpful / data.totals.feedback * 100)}%` : '—';
  const maxDaily = Math.max(1, ...(data?.trend.map(day => day.queries) ?? []));
  return <div className="analytics-page"><div className="analytics-content">
    <header className="analytics-heading"><div><span>ADMIN WORKSPACE</span><h1>Analytics</h1><p>Understand Coach usage and answer quality without opening anyone’s private conversations.</p></div><div className="analytics-actions"><label>Range<select value={days} onChange={event => setDays(Number(event.target.value) as RangeDays)}><option value={7}>7 days</option><option value={30}>30 days</option><option value={90}>90 days</option></select></label><button onClick={() => void load()} disabled={loading}><RefreshCw size={15}/>{loading ? 'Refreshing…' : 'Refresh'}</button></div></header>
    <div className="analytics-privacy"><ShieldCheck size={18}/><p><strong>Privacy protected.</strong> This page uses anonymous daily facts only. Query text, answers, and user identities are not included.</p></div>
    {error && <p className="analytics-error" role="alert">{error}</p>}
    {!data && loading ? <p role="status">Loading analytics…</p> : data && <>
      <section className="analytics-metrics" aria-label="Summary metrics">
        <MetricCard icon={<MessageSquareText size={19}/>} label="Queries" value={data.totals.queries} detail={`Last ${data.range.days} days`}/>
        <MetricCard icon={<ThumbsUp size={19}/>} label="Helpful rate" value={helpfulRate} detail={`${data.totals.feedback} ratings received`}/>
        <MetricCard icon={<CircleAlert size={19}/>} label="Failed answers" value={data.totals.failures} detail="No usable answer returned"/>
        <MetricCard icon={<BarChart3 size={19}/>} label="Pending feedback" value={data.totals.pendingFeedback} detail="Waiting for review"/>
      </section>
      <section className="analytics-panel analytics-trend"><div className="analytics-panel-heading"><div><h2>Query activity</h2><p>{data.range.from} to {data.range.through}</p></div><strong>{data.totals.queries} total</strong></div>
        <div className="analytics-bars" role="img" aria-label={`Daily query volume over ${data.range.days} days`}>{data.trend.map((day, index) => <div key={day.date} className="analytics-bar-column" title={`${day.date}: ${day.queries} queries`}><span className="analytics-bar-value">{day.queries || ''}</span><span className="analytics-bar" style={{ height: `${Math.max(day.queries ? 8 : 2, day.queries / maxDaily * 100)}%` }}/>{(index === 0 || index === data.trend.length - 1) && <small>{day.date.slice(5)}</small>}</div>)}</div>
      </section>
      <div className="analytics-grid"><Breakdown title="Popular topics" items={data.topics} empty="Topics will appear after Coach answers use retrieved knowledge."/><Breakdown title="Assistant modes" items={data.modes} empty="No mode usage in this range."/><Breakdown title="Providers" items={data.providers} empty="No provider usage in this range."/><Breakdown title="Reported issues" items={data.issues} empty="No unhelpful feedback in this range."/><Breakdown title="Failure reasons" items={data.failureKinds} empty="No answer failures in this range."/></div>
    </>}
  </div></div>;
}
