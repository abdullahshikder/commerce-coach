import { readFile } from 'node:fs/promises';
import { config } from 'dotenv';
import { Pool } from 'pg';
config({path:'data/admin.env',quiet:true});
const pool=new Pool({connectionString:process.env.MIGRATION_DATABASE_URL});const client=await pool.connect();
try{await client.query('BEGIN');await client.query("SELECT pg_advisory_xact_lock(hashtext('commerce-coach-migrate'))");await client.query(await readFile(new URL('../server/migrations/005_documents.sql',import.meta.url),'utf8'));await client.query('COMMIT');console.log('Document storage migration applied; no accounts or roles created.');}catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();await pool.end();}
