import { readFile } from 'node:fs/promises';
import { config } from 'dotenv';
import { Pool } from 'pg';
config({path:'data/admin.env',quiet:true});
const pool=new Pool({connectionString:process.env.MIGRATION_DATABASE_URL});
const client=await pool.connect();
try{await client.query('BEGIN');await client.query("SELECT pg_advisory_xact_lock(hashtext('commerce-coach-migrate'))");await client.query(await readFile(new URL('../server/migrations/004_hardening.sql',import.meta.url),'utf8'));await client.query('COMMIT');console.log('Hardening migration applied; no accounts or roles created.');}
catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();await pool.end();}
