import { posix } from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { requireAuth, requireReady } from './server/auth/middleware';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return { build: { manifest: true }, plugins: [react(), tailwindcss(), {
    name: 'protect-workspace-source',
    configureServer(server) {
      const publicSource=new Set(['/src/main.tsx','/src/index.css','/src/auth/AuthContext.tsx','/src/auth/client.ts','/src/coach/providerClient.ts']);
      server.middlewares.use((req,res,next)=>{
        let path:string;try{path=posix.normalize(decodeURIComponent(new URL(req.url||'/', 'http://localhost').pathname));}catch{res.statusCode=400;res.end();return;}
        if(!/^\/(src|server|data|scripts|knowledge|@fs)\//.test(path)||publicSource.has(path))return next();
        // Vite uses Connect responses; the auth middleware expects Express helpers.
        const response=res as any;
        response.status=(status:number)=>{res.statusCode=status;return response;};
        response.json=(body:unknown)=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(body));};
        res.setHeader('Cache-Control','private, no-store');
        requireAuth(req as any,response,()=>requireReady(req as any,response,next));
      });
    },
  }], server: { strictPort: true, proxy: {
    '/api': { target: `http://127.0.0.1:${env.PORT || 4010}`, changeOrigin: true },
  } } };
});
