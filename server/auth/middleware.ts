import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { withSession } from '../db';
import { digest } from './password';
export type Role = 'member' | 'reviewer' | 'admin';
export interface Actor { id: string; organization_id: string; email: string; name: string; role: Role; organization_name: string; organization_slug: string; must_change_password: boolean; csrf_token: string; }
declare global { namespace Express { interface Request { actor?: Actor; sessionHash?: string; } } }
export const asyncRoute = (fn: (req: Request, res: Response) => Promise<unknown>): RequestHandler => (req, res, next) => { Promise.resolve(fn(req, res)).catch(next); };
export function cookieName() { return process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production' ? '__Host-coach_session' : 'coach_session'; }
export function readSession(req: Request) {
  const raw = req.headers.cookie?.split(';').map(c => c.trim()).find(c => c.startsWith(`${cookieName()}=`))?.slice(cookieName().length + 1);
  return raw && /^[\w-]{43}$/.test(raw) ? digest(raw) : '';
}
export function setSessionCookie(res: Response, token: string) {
  res.cookie(cookieName(), token, { httpOnly: true, secure: cookieName().startsWith('__Host-'), sameSite: 'strict', path: '/', maxAge: 12 * 60 * 60 * 1000 });
}
export function clearSessionCookie(res: Response) { res.clearCookie(cookieName(), { httpOnly: true, secure: cookieName().startsWith('__Host-'), sameSite: 'strict', path: '/' }); }
export function sameOrigin(req: Request, res: Response, next: NextFunction) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) { next(); return; }
  // Explicit custom header plus JSON blocks cross-site form posts, including login CSRF.
  // DELETE endpoints are bodyless; the custom header and session CSRF token still make them non-form-submitable.
  const invalidContentType = req.method !== 'DELETE' && !req.is('application/json');
  if (req.headers['x-coach-request'] !== '1' || invalidContentType || req.headers['sec-fetch-site'] === 'cross-site') {
    res.status(403).json({ error: 'Request origin could not be verified.' }); return;
  }
  const origin = req.headers.origin;
  const allowed = (process.env.APP_ORIGINS || 'http://localhost:4010,http://localhost:8010,http://127.0.0.1:4010,http://127.0.0.1:8010').split(',');
  if (origin && !allowed.includes(origin)) { res.status(403).json({ error: 'Origin is not allowed.' }); return; }
  next();
}
export const requireAuth: RequestHandler = (req, res, next) => {
  Promise.resolve((async () => {
    const hash = readSession(req);
    const actor = hash ? await withSession(hash, async client => (await client.query<Actor>('SELECT * FROM public.coach_actor()')).rows[0]) : undefined;
    if (!actor) { res.status(401).json({ error: 'Sign in to continue.' }); return; }
    req.actor = actor; req.sessionHash = hash;
    if (!['GET','HEAD','OPTIONS'].includes(req.method)) {
      const csrf = req.headers['x-csrf-token'];
      if (typeof csrf !== 'string' || Buffer.byteLength(csrf) !== Buffer.byteLength(actor.csrf_token) || !timingSafeEqual(Buffer.from(csrf), Buffer.from(actor.csrf_token))) {
        res.status(403).json({ error: 'Invalid CSRF token.' }); return;
      }
    }
    next();
  })()).catch(next);
};
export const requireReady: RequestHandler = (req, res, next) => {
  if (req.actor?.must_change_password) { res.status(403).json({ error: 'Change your temporary password first.' }); return; }
  next();
};
export const requireRole = (...roles: Role[]): RequestHandler => (req, res, next) => {
  if (!req.actor || !roles.includes(req.actor.role)) { res.status(403).json({ error: 'You do not have permission for this action.' }); return; }
  next();
};
