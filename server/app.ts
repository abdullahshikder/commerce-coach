import { isScreenContext, freshScreenContext } from '../src/coach/screenContext';
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import {requestLog} from './observability';
import {operationRoutes} from './routes/operations';
import {analyticsRoutes} from './routes/analytics';
import { libraryRoutes } from './routes/library';
import { documentRoutes } from './routes/documents';
import express from 'express';
import { posix } from 'node:path';
import { securityHeaders, publicAssets } from './security';
import { fileURLToPath } from 'node:url';
import { conversationRoutes } from './routes/conversations';
import coachRoutes from './routes/coach';
import { pool, withSession } from './db';
import { authRoutes, userRoutes } from './auth/routes';
import { asyncRoute, requireAuth, requireReady, sameOrigin } from './auth/middleware';
import { generateOpenRouterResponse, isOpenRouterAvailable } from './coach/openrouterService';
import { generateLLMResponse, isGeminiAvailable } from './coach/geminiService';
import { PgQueryStore } from './coach/pgQueryStore';
import { PgAnalyticsStore, type AnalyticsProvider, type GenerationFailureKind } from './coach/pgAnalyticsStore';
import type { ChatMessage, ConversationState } from '../src/coach/responseEngine';

export const app = express();
app.disable('x-powered-by');
// Explicit proxy addresses only; never trust arbitrary forwarded client IP headers.
if(process.env.TRUSTED_PROXIES)app.set('trust proxy',process.env.TRUSTED_PROXIES.split(',').map(value=>value.trim()).filter(Boolean));
app.use(securityHeaders);
app.use(requestLog);
const parseJson=express.json({ limit: '256kb' });
app.use((req,res,next)=>(req.path==='/api/documents/import'||/^\/api\/documents\/[0-9a-f-]{36}\/attachments$/i.test(req.path))?next():parseJson(req,res,next));
app.use('/api', (_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
app.use('/api', sameOrigin);
app.get('/api/health', asyncRoute(async (_req, res) => { await pool.query('SELECT 1'); res.json({ status: 'ok' }); }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api', requireAuth, requireReady);
app.use('/api/conversations', conversationRoutes);
app.use('/api/documents',documentRoutes);
app.use('/api/library',libraryRoutes);
app.use('/api/operations',operationRoutes);
app.use('/api/analytics',analyticsRoutes);
app.get('/api/config', (_req, res) => res.json({ openrouter: isOpenRouterAvailable(), gemini: isGeminiAvailable() }));
// Bound paid generation per client and globally; retrieval has its own limiter.
const calls = new Map<string, { count: number; until: number }>();
let active = 0;
async function recordGenerationFailure(sessionHash: string, provider: AnalyticsProvider, kind: GenerationFailureKind) {
  // Analytics is best-effort so a counter outage never replaces the useful provider error shown to the user.
  try { await withSession(sessionHash, client => new PgAnalyticsStore(client).recordGenerationFailure(provider, kind)); }
  catch { console.error(JSON.stringify({ event: 'analytics_write_failed', metric: 'generation_failure' })); }
}
app.post('/api/coach/generate', asyncRoute(async (req, res) => {
  const { provider, messages, state, retrievalContext, screenContext, retrievalDocumentIds = [] } = req.body ?? {};
  const latestUser = Array.isArray(messages) ? [...messages].reverse().find(message => message?.role === 'user') : undefined;
  if (!['openrouter', 'gemini'].includes(provider) || !Array.isArray(messages) || !messages.length || messages.length > 30
      || messages.some(m => !m || !['user', 'assistant'].includes(m.role) || typeof m.content !== 'string' || m.content.length > 12000)
      || !latestUser?.content.trim()
      || !state || !['normal', 'training', 'quiz', 'troubleshoot', 'merchant-sim'].includes(state.mode)
      || !state.quizScore || !Number.isFinite(state.quizScore.correct) || !Number.isFinite(state.quizScore.total)
      || (state.lastDomain !== undefined && typeof state.lastDomain !== 'string')
      || (screenContext !== undefined && !isScreenContext(screenContext))
      || !Array.isArray(retrievalDocumentIds) || retrievalDocumentIds.length > 20
      || retrievalDocumentIds.some(id => typeof id !== 'string' || !id || id.length > 200)
      || (retrievalContext !== undefined && (typeof retrievalContext !== 'string' || retrievalContext.length > 50000))) {
    res.status(400).json({ error: 'Invalid conversation.' }); return;
  }
  if (!(provider === 'openrouter' ? isOpenRouterAvailable() : isGeminiAvailable())) {
    await recordGenerationFailure(req.sessionHash!, provider, 'not-configured');
    res.status(503).json({ error: 'Provider is not configured.' }); return;
  }
  const now = Date.now();
  for (const [key, value] of calls) if (value.until <= now) calls.delete(key);
  const key = req.actor!.id;
  const bucket = calls.get(key) || { count: 0, until: now + 60000 };
  calls.set(key, bucket);
  if (++bucket.count > 10 || active >= 4) { res.status(429).json({ error: 'Please try again shortly.' }); return; }
  active++;
  let generated;
  try {
    const generate = provider === 'openrouter' ? generateOpenRouterResponse : generateLLMResponse;
    generated = await generate(messages as ChatMessage[], state as ConversationState, retrievalContext, freshScreenContext(screenContext));
  } catch {
    await recordGenerationFailure(req.sessionHash!, provider, 'provider-request');
    res.status(502).json({ error: 'AI provider request failed.' });
  }
  finally { active--; }
  if (!generated || res.headersSent) return;
  if (!generated.content?.trim() || generated.content.length > 50000) {
    await recordGenerationFailure(req.sessionHash!, provider, 'invalid-answer');
    res.status(502).json({ error: 'AI provider returned an invalid answer.' }); return;
  }
  // One server-issued ID ties the query row to the assistant message and any later feedback.
  const storedResponseId = randomUUID();
  await withSession(req.sessionHash!, client => new PgQueryStore(client, req.actor!).save({
    id: storedResponseId,
    query: latestUser.content.trim(),
    answer: generated.content.trim(),
    provider,
    mode: state.mode,
    retrievalDocumentIds,
    screenshotIds: generated.screenshots?.map(screenshot => screenshot.src) ?? [],
  }));
  res.json({ ...generated, responseId: storedResponseId });
}));
app.use('/api/coach', coachRoutes);
app.use('/api', (_req, res) => res.status(404).json({ error: 'Unknown API route.' }));
const dist = fileURLToPath(new URL('../dist/', import.meta.url));
let publicFiles: Set<string> | undefined;
app.use((req,res,next)=>{
  let path:string;try{path=posix.normalize(decodeURIComponent(req.path));}catch{res.sendStatus(400);return;}
  if(path==='/'||path==='/index.html')return next();
  try { publicFiles = publicAssets(`${dist}.vite/manifest.json`); }
  catch { res.status(503).send('Build the application before serving assets.');return; }
  if(publicFiles.has(path)||/^\/assets\/[^/]+\.woff2?$/.test(path))return next();
  res.setHeader('Cache-Control','private, no-store');
  requireAuth(req,res,()=>requireReady(req,res,next));
});
app.use('/.vite',(_req,res)=>{res.sendStatus(404);});
app.use(express.static(dist, {setHeaders(res,path){if(/\.(js|jpg|png)$/.test(path))res.setHeader('Cache-Control','private, no-store');}}));
app.get('*', (_req, res) => res.sendFile(`${dist}index.html`));
app.use((error: { status?: number; code?: string; message?: string }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const safeMessages:Record<string,string>={'Attachment quota reached':'Your workspace has reached its image limit (100 images or 50 MB).','Revision limit reached':'This document has reached 100 revisions. Archive it and start a new document.','Process a draft before review':'Wait for draft processing to finish before submitting for review.','Ready review required':'Submit a processed draft for review before publishing.','Concept is not current':'Update the OKF lifecycle or stale date before publishing.','Version unavailable':'That source revision is unavailable.'};
  const status = error.code === 'P0002' ? 429 : error.code === 'P0001' ? 429 : error.code === '23505' || error.code === '23514' ? 409 : error.code === '42501' ? 403 : error.code === '40001' ? 409 : error.code === '22023' || error.code === '22P02' ? 400 : error.status || 500;
  res.status(status).json({ error: error.code==='22023'&&safeMessages[error.message??'']?safeMessages[error.message!]:status === 429 ? (error.code==='P0002'?'Your workspace has reached the 50-document limit. Remove a document before uploading another.':'Conversation storage limit reached. Contact your administrator.') : status === 409 ? 'This record changed or conflicts with existing data. Refresh and try again.' : status === 403 ? 'Access denied.' : status === 413 ? 'Request too large.' : 'Request failed.' });
});
