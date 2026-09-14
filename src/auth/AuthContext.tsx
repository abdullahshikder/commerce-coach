import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, authFetch, setCsrfToken } from './client';
import { loadProviders } from '../coach/providerClient';
export interface User { id: string; organization_id: string; organization_name: string; organization_slug: string; name: string; email: string; role: 'admin' | 'reviewer' | 'member'; must_change_password: boolean; }
const AuthContext = createContext<{ user: User; logout: () => Promise<void> } | null>(null);
export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error('Sign-in is required.'); return context; }
export function PasswordForm({ done }: { done: () => void }) {
  const [error,setError]=useState(''); const [busy,setBusy]=useState(false);
  return <form className="mx-auto w-full max-w-sm space-y-4 rounded-2xl border border-gray-200 bg-white p-6" onSubmit={async event => {
    event.preventDefault();const data=new FormData(event.currentTarget);setBusy(true);setError('');
    if(data.get('newPassword')!==data.get('confirm')) {setError('New passwords must match.');setBusy(false);return;}
    try {await api('/api/auth/password',{currentPassword:data.get('currentPassword'),newPassword:data.get('newPassword')});done();}
    catch(e) {setError((e as Error).message);}finally {setBusy(false);}
  }}>
    <h1 className="text-xl font-semibold">Change password</h1><p className="text-sm text-gray-500">Choose at least 12 characters. You’ll sign in again afterward.</p>
    <label className="block text-sm">Current password<input required type="password" name="currentPassword" autoComplete="current-password" className="mt-1 w-full rounded-lg border p-2" /></label>
    <label className="block text-sm">New password<input required minLength={12} maxLength={256} type="password" name="newPassword" autoComplete="new-password" className="mt-1 w-full rounded-lg border p-2" /></label>
    <label className="block text-sm">Confirm new password<input required type="password" name="confirm" autoComplete="new-password" className="mt-1 w-full rounded-lg border p-2" /></label>
    {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
    <button disabled={busy} className="w-full rounded-lg bg-red-600 p-2 text-white disabled:opacity-50">{busy?'Saving…':'Save password'}</button>
  </form>;
}
export function AuthProvider({children}:{children:ReactNode}) {
  const [user,setUser]=useState<User|null>(null);const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [busy,setBusy]=useState(false);
  const [googleEnabled,setGoogleEnabled]=useState(false);
  useEffect(()=>{
    void api<{enabled:boolean}>('/api/auth/google/config').then(config=>setGoogleEnabled(config.enabled)).catch(()=>{});
    const url=new URL(window.location.href);const reason=url.searchParams.get('google_error');
    if(reason){
      const messages:Record<string,string>={account:'Your Google account has no linked access to this workspace. Contact your admin or sign in with your password.',expired:'Google sign-in expired. Please try again.',cancelled:'Google sign-in was cancelled.',unavailable:'Google sign-in is not configured.',busy:'Sign-in is busy. Please try again.',failed:'Google sign-in could not be verified. Please try again.'};
      setError(messages[reason] || messages.failed);url.searchParams.delete('google_error');window.history.replaceState(null,'',url);
    }
  },[]);
  const googleSignIn=async()=>{
    setBusy(true);setError('');
    try{const {url}=await api<{url:string}>('/api/auth/google/start',{});window.location.assign(url);}
    catch(e){setError((e as Error).message);setBusy(false);}
  };
  const clear=()=>{setUser(null);setCsrfToken('');};
  const refresh=async()=>{
    try {
      const response=await authFetch('/api/auth/me');
      if(response.status===401) {clear();return;}
      if(!response.ok) {clear();throw new Error('The server is unavailable. Please sign in again.');}
      const {user:next}=await response.json();setCsrfToken(next.csrf_token);
      if(!next.must_change_password) await loadProviders();
      setUser(next);setError('');
    } catch(e) {setError((e as Error).message);}finally {setLoading(false);}
  };
  useEffect(()=>{
    void refresh();
    const expired=()=>clear();const visible=()=>{if(document.visibilityState==='visible')void refresh();};
    window.addEventListener('coach-session-expired',expired);document.addEventListener('visibilitychange',visible);
    const timer=setInterval(()=>void refresh(),60000);
    return()=>{window.removeEventListener('coach-session-expired',expired);document.removeEventListener('visibilitychange',visible);clearInterval(timer);};
  },[]);
  const logout=async()=>{await api('/api/auth/logout',{});clear();};
  if(loading)return <div className="grid min-h-dvh place-items-center text-gray-500">Loading Commerce Coach…</div>;
  if(user?.must_change_password)return <div className="grid min-h-dvh place-items-center bg-gray-50 p-6"><div><p className="mb-4 text-center text-sm text-gray-600">Welcome, {user.name}. Set your own password to continue.</p><PasswordForm done={clear}/><button className="mt-4 text-sm text-red-700" onClick={()=>void logout().catch(e=>setError(e.message))}>Sign out</button>{error&&<p role="alert">{error}</p>}</div></div>;
  if(!user)return <div className="signin-layout"><aside className="signin-story"><div className="signin-wordmark">Commerce Coach</div><div><p>The Commerce playbook</p><h2>Know what to do next.</h2><span>Practical answers and step-by-step guides for running your store.</span></div><small>Made for your team. Ready for বাংলা and English.</small></aside><div className="signin-form-area"><form className="signin-form space-y-4" onSubmit={async event=>{
    event.preventDefault();const data=new FormData(event.currentTarget);setBusy(true);setError('');
    try{await api('/api/auth/login',{email:data.get('email'),password:data.get('password')});await refresh();}
    catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }}><div><div className="mb-2 text-sm font-semibold text-red-600">Commerce Coach</div><h1 className="text-2xl font-bold">Sign in to your workspace</h1><p className="mt-2 text-sm text-gray-500">Use the account provided by your organization’s admin.</p></div>
    <button type="button" disabled={busy||!googleEnabled} onClick={()=>void googleSignIn()} className="w-full rounded-lg border border-gray-300 bg-white p-2.5 font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-50">Continue with Google</button>
    {!googleEnabled&&<p className="text-xs text-gray-500">Google sign-in hasn’t been enabled by your administrator yet.</p>}
    <div className="text-center text-xs text-gray-400">or sign in with your password</div>
    <label className="block text-sm">Email<input required type="email" name="email" autoComplete="username" className="mt-1 w-full rounded-lg border p-2.5" /></label>
    <label className="block text-sm">Password<input required type="password" name="password" autoComplete="current-password" className="mt-1 w-full rounded-lg border p-2.5" /></label>
    {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}<button disabled={busy} className="w-full rounded-lg bg-red-600 p-2.5 font-semibold text-white disabled:opacity-50">{busy?'Signing in…':'Sign in'}</button>
  </form></div></div>;
  return <AuthContext.Provider value={{user,logout}}>{children}</AuthContext.Provider>;
}
