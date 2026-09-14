import { Router } from 'express';
import { createHash } from 'node:crypto';
import { OAuth2Client, CodeChallengeMethod, type TokenPayload } from 'google-auth-library';
import { authPool } from '../db';
import { digest, randomToken } from './password';
import { asyncRoute, cookieName, setSessionCookie } from './middleware';
import { WORKSPACE_ORGANIZATION_SLUG } from './workspace';

export function googleConfig(environment: NodeJS.ProcessEnv = process.env) {
  const clientId = environment.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = environment.GOOGLE_CLIENT_SECRET?.trim();
  const redirectUri = environment.GOOGLE_REDIRECT_URI?.trim();
  if (!clientId || !clientSecret || !redirectUri) return undefined;
  try {
    const url = new URL(redirectUri);
    if (url.pathname !== '/api/auth/google/callback' || url.search || url.hash || url.username || url.password) return undefined;
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost','127.0.0.1'].includes(url.hostname))) return undefined;
    return { clientId, clientSecret, redirectUri };
  } catch { return undefined; }
}
export function verifiedGoogleIdentity(payload: TokenPayload | undefined, nonce: string) {
  if (!payload || typeof payload.sub !== 'string' || !payload.sub || payload.sub.length > 255 || payload.email_verified !== true
      || typeof payload.email !== 'string' || payload.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)
      || (payload as TokenPayload & { nonce?: string }).nonce !== nonce) throw new Error('Invalid Google identity.');
  const email = payload.email.toLowerCase();
  return { subject: payload.sub, email, authoritative: email.endsWith('@gmail.com') || (typeof payload.hd === 'string' && Boolean(payload.hd)) };
}
export interface GoogleExchange {
  (code: string, verifier: string, config: NonNullable<ReturnType<typeof googleConfig>>): Promise<TokenPayload | undefined>;
}
export const exchangeGoogleCode: GoogleExchange = async (code, verifier, config) => {
  const client = new OAuth2Client(config.clientId, config.clientSecret, config.redirectUri);
  const { tokens } = await client.getToken({ code, codeVerifier: verifier, redirect_uri: config.redirectUri });
  if (!tokens.id_token) throw new Error('No Google ID token returned.');
  // Google's SDK verifies signature, issuer, audience, and expiry. Our flow checks nonce separately.
  const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: config.clientId });
  return ticket.getPayload();
};
export function createGoogleRouter(exchange: GoogleExchange = exchangeGoogleCode) {
  const router = Router();
  const attempts = new Map<string, { count: number; until: number }>();
  let active = 0;
  router.get('/config', (_req,res) => res.json({ enabled: Boolean(googleConfig()) }));
  router.post('/start', asyncRoute(async (req,res) => {
    const config = googleConfig();
    if (!config) { res.status(503).json({ error: 'Google sign-in is not configured. Ask your administrator to enable it.' }); return; }
    const now = Date.now();
    for (const [key,bucket] of attempts) if (bucket.until<=now) attempts.delete(key);
    const key=req.ip || 'unknown';const bucket=attempts.get(key) || {count:0,until:now+600000};attempts.set(key,bucket);
    if (++bucket.count>20) {res.status(429).json({error:'Too many Google sign-in attempts. Try again later.'});return;}
    const allowed = (process.env.APP_ORIGINS || 'http://localhost:4010,http://localhost:8010,http://127.0.0.1:4010,http://127.0.0.1:8010').split(',');
    const origin = req.headers.origin || new URL(config.redirectUri).origin;
    if (!allowed.includes(origin)) {res.status(403).json({error:'Origin is not allowed.'});return;}
    const state=randomToken(), browser=randomToken(), nonce=randomToken(), verifier=randomToken();
    await authPool.query('SELECT public.coach_google_begin($1,$2,$3,$4,$5,$6)',[digest(state),digest(browser),WORKSPACE_ORGANIZATION_SLUG,verifier,nonce,origin]);
    const secure=cookieName().startsWith('__Host-');
    // This short-lived cookie must survive Google's top-level cross-site GET callback.
    res.cookie(secure?'__Host-coach_google':'coach_google',browser,{httpOnly:true,secure,sameSite:'lax',path:'/',maxAge:600000});
    const client=new OAuth2Client(config.clientId,config.clientSecret,config.redirectUri);
    const url=client.generateAuthUrl({scope:['openid','email'],state,nonce,prompt:'select_account',
      code_challenge:createHash('sha256').update(verifier).digest('base64url'),code_challenge_method:CodeChallengeMethod.S256});
    res.json({url});
  }));
  router.get('/callback', asyncRoute(async (req,res) => {
    res.setHeader('Referrer-Policy','no-referrer');
    const config=googleConfig();
    if (!config) {res.redirect('/?google_error=unavailable');return;}
    const secure=cookieName().startsWith('__Host-');const name=secure?'__Host-coach_google':'coach_google';
    const browser=req.headers.cookie?.split(';').map(c=>c.trim()).find(c=>c.startsWith(`${name}=`))?.slice(name.length+1);
    const state=typeof req.query.state==='string'?req.query.state:'';
    res.clearCookie(name,{httpOnly:true,secure,sameSite:'lax',path:'/'});
    if(!browser || !/^[\w-]{43}$/.test(browser) || !/^[\w-]{43}$/.test(state)) {res.redirect('/?google_error=expired');return;}
    const flow=(await authPool.query('SELECT * FROM public.coach_google_consume($1,$2)',[digest(state),digest(browser)])).rows[0];
    if(!flow) {res.redirect('/?google_error=expired');return;}
    const destination=new URL('/',flow.return_origin);
    const fail=(reason:string)=>{destination.searchParams.set('google_error',reason);res.redirect(destination.toString());};
    if(req.query.error) {fail('cancelled');return;}
    const code=typeof req.query.code==='string'?req.query.code:'';
    if(!code || code.length>4096) {fail('failed');return;}
    if(active>=4) {fail('busy');return;}
    active++;
    try {
      const identity=verifiedGoogleIdentity(await exchange(code,flow.verifier,config),flow.nonce);
      const token=randomToken();
      const result=await authPool.query('SELECT public.coach_google_open_session($1,$2,$3,$4,$5,$6) AS ok',
        [flow.organization,identity.email,identity.subject,identity.authoritative,digest(token),randomToken()]);
      if(!result.rows[0].ok) {fail('account');return;}
      setSessionCookie(res,token);res.redirect(destination.toString());
    } catch {fail('failed');} finally {active--;}
  }));
  return router;
}
