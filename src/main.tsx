import React from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './auth/AuthContext';
const AppShell = React.lazy(() => import('./auth/AppShell').then(module => ({ default: module.AppShell })));
import '@fontsource-variable/outfit/wght.css';
import '@fontsource-variable/noto-sans-bengali/wght.css';
import './index.css';
try{const saved=localStorage.getItem('coach-appearance');if(saved==='light'||saved==='dark')document.documentElement.dataset.appearance=saved;}catch{}
createRoot(document.getElementById('root')!).render(<React.StrictMode><AuthProvider><React.Suspense fallback={<div role="status">Loading workspace…</div>}><AppShell /></React.Suspense></AuthProvider></React.StrictMode>);
