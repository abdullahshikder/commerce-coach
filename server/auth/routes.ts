import { takeBudget } from '../security';
import { createGoogleRouter } from './google';
import { Router, type RequestHandler } from 'express';
import { randomUUID } from 'node:crypto';
import { authPool, withSession } from '../db';
import { digest, randomToken, hashPassword, verifyPassword, dummyHash, validPassword } from './password';
import { asyncRoute, requireAuth, requireReady, requireRole, setSessionCookie, clearSessionCookie } from './middleware';
export const authRoutes = Router();
authRoutes.use('/google', createGoogleRouter());
let passwordWork = 0;
const passwordChanges = new Map<string, { count: number; until: number }>();
const passwordBudget: RequestHandler = (req, res, next) => {
  const now = Date.now();
  for (const [key, bucket] of passwordChanges) if (bucket.until <= now) passwordChanges.delete(key);
  const key = req.actor!.id;
  const bucket = passwordChanges.get(key) || { count: 0, until: now + 15 * 60000 };
  passwordChanges.set(key, bucket);
  if (++bucket.count > 20 || passwordWork >= 4) { res.status(429).json({ error: 'Too many credential changes. Try again later.' }); return; }
  passwordWork++;
  res.once('finish', () => { passwordWork--; });
  next();
};
authRoutes.post('/login', asyncRoute(async (req, res) => {
  const { organization, email, password } = req.body || {};
  if (typeof organization !== 'string' || organization.length > 80 || typeof email !== 'string' || email.length > 254 || typeof password !== 'string' || Buffer.byteLength(password) > 256) {
    res.status(400).json({ error: 'Organization, email, and password are required.' }); return;
  }
  const ipAllowed=await takeBudget(`login-ip:${req.ip}`,20,900);
  if(!ipAllowed){res.status(429).json({error:'Too many sign-in attempts. Try again later.'});return;}
  const accountAllowed=await takeBudget(`login-account:${organization.trim().toLowerCase()}:${email.trim().toLowerCase()}`,20,900);
  if(!accountAllowed||passwordWork>=4){res.status(429).json({error:'Too many sign-in attempts. Try again later.'});return;}
  passwordWork++;
  try {
    const found = (await authPool.query('SELECT * FROM public.coach_login_lookup($1,$2)', [organization.trim().toLowerCase(), email.trim().toLowerCase()])).rows[0];
    const matches = await verifyPassword(password, found?.password_hash || dummyHash);
    if (!found || !matches) { res.status(401).json({ error: 'Invalid organization, email, or password.' }); return; }
    const token = randomToken();
    const created = await authPool.query('SELECT public.coach_open_session($1,$2,$3,$4) AS ok', [found.id, found.password_hash, digest(token), randomToken()]);
    if (!created.rows[0].ok) { res.status(401).json({ error: 'Please sign in again.' }); return; }
    setSessionCookie(res, token);
    res.json({ ok: true });
  } finally { passwordWork--; }
}));
authRoutes.use(requireAuth);
authRoutes.get('/me', (req, res) => { res.setHeader('Cache-Control', 'no-store'); res.json({ user: req.actor }); });
authRoutes.post('/logout', asyncRoute(async (req, res) => {
  await withSession(req.sessionHash!, client => client.query('SELECT public.coach_logout()'));
  clearSessionCookie(res); res.json({ ok: true });
}));
authRoutes.post('/password', passwordBudget, asyncRoute(async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (typeof currentPassword !== 'string' || Buffer.byteLength(currentPassword) > 256 || !validPassword(newPassword) || currentPassword === newPassword) {
    res.status(400).json({ error: 'Choose a new password of at least 12 characters (maximum 256 bytes).' }); return;
  }
  const hash = await withSession(req.sessionHash!, async client => (await client.query('SELECT public.coach_password_hash() AS hash')).rows[0].hash);
  if (!hash || !await verifyPassword(currentPassword, hash)) { res.status(403).json({ error: 'Current password is incorrect.' }); return; }
  const nextHash = await hashPassword(newPassword);
  const changed = await withSession(req.sessionHash!, async client => (await client.query('SELECT public.coach_change_password($1,$2) AS ok', [hash, nextHash])).rows[0].ok);
  if (!changed) { res.status(409).json({ error: 'Credentials changed. Sign in again.' }); return; }
  clearSessionCookie(res); res.json({ ok: true });
}));
export const userRoutes = Router();
userRoutes.use(requireAuth, requireReady, requireRole('admin'));
userRoutes.get('/', asyncRoute(async (req, res) => {
  res.json({ users: await withSession(req.sessionHash!, async client => (await client.query('SELECT * FROM public.coach_list_users()')).rows) });
}));
userRoutes.post('/', passwordBudget, asyncRoute(async (req, res) => {
  const { email, name, role, password } = req.body || {};
  if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof name !== 'string' || !name.trim() || name.length > 100 || !['admin','reviewer','member'].includes(role) || !validPassword(password)) {
    res.status(400).json({ error: 'Enter a name, valid email, role, and temporary password of at least 12 characters.' }); return;
  }
  const hash = await hashPassword(password);
  await withSession(req.sessionHash!, client => client.query('SELECT public.coach_create_user($1,$2,$3,$4,$5)', [randomUUID(), email.trim().toLowerCase(), name.trim(), hash, role]));
  res.status(201).json({ ok: true });
}));
userRoutes.patch('/:id', passwordBudget, asyncRoute(async (req, res) => {
  const { role, active, password } = req.body || {};
  if (!/^[a-f0-9-]{36}$/i.test(req.params.id) || !['admin','reviewer','member'].includes(role) || typeof active !== 'boolean' || (password !== undefined && !validPassword(password))) {
    res.status(400).json({ error: 'Invalid user update.' }); return;
  }
  const hash = password ? await hashPassword(password) : null;
  const changed = await withSession(req.sessionHash!, async client => (await client.query('SELECT public.coach_update_user($1,$2,$3,$4) AS ok', [req.params.id, role, active, hash])).rows[0].ok);
  res.status(changed ? 200 : 404).json(changed ? { ok: true } : { error: 'User not found.' });
}));
