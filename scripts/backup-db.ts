import 'dotenv/config';
import { spawn } from 'node:child_process';
const destination=process.argv[2];
if(!destination || !process.env.MIGRATION_DATABASE_URL) throw new Error('Usage: npm run db:backup -- /path/to/coach.dump (set MIGRATION_DATABASE_URL)');
const url=new URL(process.env.MIGRATION_DATABASE_URL);
const child=spawn('pg_dump',['--format=custom','--file',destination],{stdio:'inherit',env:{...process.env,PGHOST:url.hostname,PGPORT:url.port || '5432',PGDATABASE:url.pathname.slice(1),PGUSER:decodeURIComponent(url.username),PGPASSWORD:decodeURIComponent(url.password)}});
child.on('error',error=>{console.error(error.message);process.exitCode=1;});
child.on('exit',code=>{process.exitCode=code || 0;});
