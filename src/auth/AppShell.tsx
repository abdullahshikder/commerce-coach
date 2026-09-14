import {OperationsPanel} from './OperationsPanel';
import { OKFReader } from '../coach/OKFReader';
import { useState } from 'react';
import { ArrowUpRight, ChevronDown, LogOut, MessageSquare, ShieldCheck, KeyRound, Moon, Sun } from 'lucide-react';
import CommerceCoachPage from '../pages/CommerceCoachPage';
import { useAuth,PasswordForm } from './AuthContext';
import { KnowledgePanel } from './KnowledgePanel';
import { UsersPanel } from './UsersPanel';
import { AnalyticsPanel } from './AnalyticsPanel';
export function AppShell(){
  const {user,logout}=useAuth();const [page,setPage]=useState('coach');const [error,setError]=useState('');const [dark,setDark]=useState(()=>document.documentElement.dataset.appearance==='dark'||(!document.documentElement.dataset.appearance&&window.matchMedia('(prefers-color-scheme: dark)').matches));
  return <div className="app-shell"><header className="workspace-header">
    <a href="/" className="workspace-brand" aria-label="Commerce Coach home"><span className="brand-symbol" aria-hidden="true">c</span><strong>Pathao<span>Commerce</span></strong></a>
    <span className="workspace-divider"/><span className="workspace-name">Commerce Coach</span>
    <nav className="workspace-nav" aria-label="Workspace"><button aria-current={page==='coach'?'page':undefined} onClick={()=>setPage('coach')}><MessageSquare size={15}/>Coach</button><button aria-current={page==='library'?'page':undefined} onClick={()=>setPage('library')}>Library</button>{['admin','reviewer'].includes(user.role)&&<><button aria-current={page==='knowledge'?'page':undefined} onClick={()=>setPage('knowledge')}>Knowledge</button>{user.role==='admin'&&<><button aria-current={page==='analytics'?'page':undefined} onClick={()=>setPage('analytics')}>Analytics</button><button aria-current={page==='operations'?'page':undefined} onClick={()=>setPage('operations')}>Operations</button><button aria-current={page==='users'?'page':undefined} onClick={()=>setPage('users')}><ShieldCheck size={15}/>Team access</button></>}</>}</nav>
    <button className="appearance-toggle" aria-label={dark?'Use light appearance':'Use dark appearance'} onClick={()=>{const next=!dark;setDark(next);document.documentElement.dataset.appearance=next?'dark':'light';try{localStorage.setItem('coach-appearance',next?'dark':'light');}catch{}}}>{dark?<Sun size={17}/>:<Moon size={17}/>}</button>
    <details className="account-menu"><summary aria-label={`Account menu for ${user.name}`}><span className="account-avatar">{user.name.slice(0,1)}</span><span className="account-name">{user.name}<small>{user.role}</small></span><ChevronDown size={14}/></summary><div className="account-popover"><p>{user.email}</p><button onClick={event=>{setPage('password');event.currentTarget.closest('details')?.removeAttribute('open');}}><KeyRound size={15}/>Change password</button><button onClick={()=>void logout().catch(e=>setError(e.message))}><LogOut size={15}/>Sign out</button></div></details>
  </header>{error&&<p role="alert" className="bg-red-50 p-3 text-red-700">{error}</p>}
  <main className="min-h-0 flex-1">{page==='analytics'&&user.role==='admin'?<AnalyticsPanel/>:page==='operations'&&user.role==='admin'?<OperationsPanel/>:page==='library'?<OKFReader/>:page==='knowledge'&&['admin','reviewer'].includes(user.role)?<KnowledgePanel/>:page==='users'&&user.role==='admin'?<UsersPanel/>:page==='password'?<div className="grid h-full place-items-center bg-gray-50 p-6"><PasswordForm done={()=>window.dispatchEvent(new Event('coach-session-expired'))}/></div>:<CommerceCoachPage/>}</main></div>;
}
