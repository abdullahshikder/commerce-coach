import { useEffect, useState, type ReactNode } from 'react';
import { Activity, BookOpenCheck, CircleAlert, Cpu, MessageSquareText, RefreshCw, ShieldCheck, ThumbsUp } from 'lucide-react';
import { api } from './client';

type RangeDays = 7 | 30 | 90;
interface NamedCount { name: string; count: number; }
interface DailyCount { date: string; queries: number; failures: number; feedback: number; }
interface AnalyticsTotals { queries: number; groundedQueries: number; failures: number; feedback: number; helpful: number; unhelpful: number; pendingFeedback: number; }
interface TokenTotals { inputTokens: number; outputTokens: number; totalTokens: number; }
interface TokenProviderUsage extends TokenTotals { name: string; }
interface AnalyticsData {
  range: { days: number; from: string; through: string; previousFrom: string; previousThrough: string };
  totals: AnalyticsTotals;
  previousTotals: AnalyticsTotals;
  trend: DailyCount[];
  topics: NamedCount[];
  providers: NamedCount[];
  modes: NamedCount[];
  failureKinds: NamedCount[];
  issues: NamedCount[];
  tokenUsage: { totals: TokenTotals; previousTotals: TokenTotals; providers: TokenProviderUsage[]; };
}

const LABELS: Record<string, string> = {
  gemini: 'Gemini', openrouter: 'OpenRouter', normal: 'Standard', training: 'Training', quiz: 'Quiz',
  troubleshoot: 'Troubleshooting', 'merchant-sim': 'Merchant simulation', 'not-configured': 'Provider not configured',
  'provider-request': 'Provider request failed', 'invalid-answer': 'Invalid provider answer',
  'wrong-answer': 'Wrong answer', 'wrong-screenshots': 'Wrong screenshots',
  'missing-information': 'Missing information', other: 'Other', unspecified: 'Unspecified',
};
const label = (value: string) => LABELS[value] ?? value;
const percentage = (value: number, total: number) => total ? `${Math.round(value / total * 100)}%` : '-';
const rate = (totals: AnalyticsTotals, numerator: 'helpful' | 'groundedQueries') => percentage(totals[numerator], numerator === 'helpful' ? totals.feedback : totals.queries);
const comparison = (current: number, previous: number) => {
  if (current === previous) return 'No change vs previous period';
  if (!previous) return `${current} new vs previous period`;
  const change = Math.round((current - previous) / previous * 100);
  return `${change > 0 ? '+' : ''}${change}% vs previous period`;
};
const rateComparison = (current: string, previous: string) => previous === '-' ? 'No previous-period baseline' : `${current} now · ${previous} previously`;
const dateLabel = (value: string) => value.slice(5, 10);
const formatTokens = (value: number) => new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);

function MetricCard({ icon, label: title, value, detail }: { icon: ReactNode; label: string; value: string | number; detail: string }) {
  return <article className="analytics-metric"><span className="analytics-metric-icon">{icon}</span><div><p>{title}</p><strong>{value}</strong><small>{detail}</small></div></article>;
}

function Breakdown({ title, items, empty }: { title: string; items: NamedCount[]; empty: string }) {
  const max = Math.max(1, ...items.map(item => item.count));
  return <section className="analytics-panel"><h2>{title}</h2>{items.length ? <div className="analytics-breakdown">{items.map(item => <div key={item.name} className="analytics-breakdown-row"><div><span>{label(item.name)}</span><strong>{item.count}</strong></div><div className="analytics-track"><span style={{ width: `${Math.max(4, item.count / max * 100)}%` }}/></div></div>)}</div> : <p>{empty}</p>}</section>;
}

function TokenUsageBreakdown({ items }: { items: TokenProviderUsage[] }) {
  return <section className="analytics-panel analytics-token-usage"><h2>Token usage by provider</h2>{items.length ? <div className="analytics-token-list">{items.map(item => <div key={item.name}><span>{label(item.name)}</span><strong>{formatTokens(item.totalTokens)}</strong><small>{formatTokens(item.inputTokens)} input · {formatTokens(item.outputTokens)} output</small></div>)}</div> : <p>Token totals will appear after the next provider response.</p>}</section>;
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
  const helpfulRate = data ? rate(data.totals, 'helpful') : '-';
  const previousHelpfulRate = data ? rate(data.previousTotals, 'helpful') : '-';
  const groundedRate = data ? rate(data.totals, 'groundedQueries') : '-';
  const previousGroundedRate = data ? rate(data.previousTotals, 'groundedQueries') : '-';
  const tokenUsage = data?.tokenUsage;
  // Failures are provider events and can precede a successful fallback, so describe this as recorded outcomes rather than unique requests.
  const successfulOutcomes = data ? data.totals.queries : 0;
  const generationOutcomes = data ? data.totals.queries + data.totals.failures : 0;
  const successRate = percentage(successfulOutcomes, generationOutcomes);
  const activeDays = data?.trend.filter(day => day.queries > 0).length ?? 0;
  const averageQueries = data ? (data.totals.queries / data.range.days).toFixed(1) : '0.0';
  const busiestDay = data?.trend.reduce<DailyCount | undefined>((best, day) => !best || day.queries > best.queries ? day : best, undefined);
  const maxDaily = Math.max(1, ...(data?.trend.flatMap(day => [day.queries, day.feedback, day.failures]) ?? []));
  return <div className="analytics-page"><div className="analytics-content">
    <header className="analytics-heading"><div><h1>Analytics</h1><p>Understand Coach usage and answer quality without opening anyone’s private conversations.</p></div><div className="analytics-actions"><label>Range<select value={days} onChange={event => setDays(Number(event.target.value) as RangeDays)}><option value={7}>7 days</option><option value={30}>30 days</option><option value={90}>90 days</option></select></label><button onClick={() => void load()} disabled={loading}><RefreshCw size={15}/>{loading ? 'Refreshing…' : 'Refresh'}</button></div></header>
    <div className="analytics-privacy"><ShieldCheck size={18}/><p><strong>Privacy protected.</strong> This page uses anonymous daily facts only. Query text, answers, and user identities are not included.</p></div>
    {error && <p className="analytics-error" role="alert">{error}</p>}
    {!data && loading ? <p role="status">Loading analytics…</p> : data && <>
      <section className="analytics-metrics" aria-label="Summary metrics">
        <MetricCard icon={<MessageSquareText size={19}/>} label="Queries" value={data.totals.queries} detail={comparison(data.totals.queries, data.previousTotals.queries)}/>
        <MetricCard icon={<Cpu size={19}/>} label="Tokens used" value={formatTokens(tokenUsage?.totals.totalTokens ?? 0)} detail={`${formatTokens(tokenUsage?.totals.inputTokens ?? 0)} input · ${formatTokens(tokenUsage?.totals.outputTokens ?? 0)} output`}/>
        <MetricCard icon={<Activity size={19}/>} label="Recorded success" value={successRate} detail={`${successfulOutcomes} of ${generationOutcomes} success/failure events`}/>
        <MetricCard icon={<BookOpenCheck size={19}/>} label="Knowledge-grounded" value={groundedRate} detail={rateComparison(groundedRate, previousGroundedRate)}/>
        <MetricCard icon={<ThumbsUp size={19}/>} label="Helpful rate" value={helpfulRate} detail={rateComparison(helpfulRate, previousHelpfulRate)}/>
        <MetricCard icon={<CircleAlert size={19}/>} label="Pending reviews" value={data.totals.pendingFeedback} detail={`${data.totals.unhelpful} unhelpful ratings in range`}/>
      </section>
      <section className="analytics-panel analytics-trend"><div className="analytics-panel-heading"><div><h2>Daily activity</h2><p>{data.range.from} to {data.range.through}</p></div><strong>{data.totals.queries} queries</strong></div>
        <div className="analytics-legend" aria-label="Chart legend"><span><i className="is-query"/>Queries</span><span><i className="is-feedback"/>Feedback</span><span><i className="is-failure"/>Failures</span></div>
        <div className="analytics-bars" role="list" aria-label={`Daily queries, feedback, and failures over ${data.range.days} days`}>{data.trend.map((day, index) => <div key={day.date} className="analytics-bar-column" role="listitem" aria-label={`${day.date}: ${day.queries} queries, ${day.feedback} feedback, ${day.failures} failures`} title={`${day.date}: ${day.queries} queries · ${day.feedback} feedback · ${day.failures} failures`}><div className="analytics-bar-cluster" aria-hidden="true"><span className="analytics-bar is-query" style={{ height: `${Math.max(day.queries ? 7 : 2, day.queries / maxDaily * 100)}%` }}/><span className="analytics-bar is-feedback" style={{ height: `${Math.max(day.feedback ? 7 : 2, day.feedback / maxDaily * 100)}%` }}/><span className="analytics-bar is-failure" style={{ height: `${Math.max(day.failures ? 7 : 2, day.failures / maxDaily * 100)}%` }}/></div>{(index === 0 || index === data.trend.length - 1) && <small>{dateLabel(day.date)}</small>}</div>)}</div>
      </section>
      <section className="analytics-panel analytics-pulse"><div className="analytics-panel-heading"><div><h2>Operational pulse</h2><p>Current range compared with the immediately preceding {data.range.days} days.</p></div><small>{data.range.previousFrom} to {data.range.previousThrough}</small></div><div className="analytics-pulse-grid"><div><span>Active days</span><strong>{activeDays} <small>of {data.range.days}</small></strong></div><div><span>Average queries</span><strong>{averageQueries} <small>per day</small></strong></div><div><span>Busiest day</span><strong>{busiestDay?.queries ? busiestDay.queries : '-'} <small>{busiestDay?.queries ? `on ${dateLabel(busiestDay.date)}` : 'no activity'}</small></strong></div><div><span>Generation failures</span><strong>{data.totals.failures} <small>{comparison(data.totals.failures, data.previousTotals.failures)}</small></strong></div></div></section>
      <div className="analytics-grid"><TokenUsageBreakdown items={tokenUsage?.providers ?? []}/><Breakdown title="Popular topics" items={data.topics} empty="Topics will appear after Coach answers use retrieved knowledge."/><Breakdown title="Assistant modes" items={data.modes} empty="No mode usage in this range."/><Breakdown title="Providers" items={data.providers} empty="No provider usage in this range."/><Breakdown title="Reported issues" items={data.issues} empty="No unhelpful feedback in this range."/><Breakdown title="Failure reasons" items={data.failureKinds} empty="No answer failures in this range."/></div>
    </>}
  </div></div>;
}
