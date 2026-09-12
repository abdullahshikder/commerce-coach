import type { RequestHandler } from 'express';
import { readFileSync } from 'node:fs';
import { authPool } from './db';
import { digest } from './auth/password';

export const securityHeaders: RequestHandler = (_req,res,next) => {
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; object-src 'none'; form-action 'self'");
  res.setHeader('X-Frame-Options','DENY');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
  if(process.env.NODE_ENV==='production')res.setHeader('Strict-Transport-Security','max-age=31536000');
  next();
};
export async function takeBudget(key:string,maximum:number,seconds:number) {
  return (await authPool.query('SELECT public.coach_take_budget($1,$2,$3) AS allowed',[digest(key),maximum,seconds])).rows[0].allowed as boolean;
}

// Only the static dependency closure of the sign-in entry is public. Lazy workspace
// chunks and documentation images require a ready session, even with a guessed URL.
export function publicAssets(manifestPath:string): Set<string> {
  type Entry={file:string;imports?:string[];css?:string[];isEntry?:boolean};
  const manifest=JSON.parse(readFileSync(manifestPath,'utf8')) as Record<string,Entry>;
  const allowed=new Set<string>();const visited=new Set<string>();
  function visit(key:string) {if(visited.has(key))return;visited.add(key);const entry=manifest[key];if(!entry)return;
    allowed.add('/'+entry.file);for(const css of entry.css??[])allowed.add('/'+css);for(const child of entry.imports??[])visit(child);
  }
  for(const [key,entry] of Object.entries(manifest))if(entry.isEntry)visit(key);
  return allowed;
}
