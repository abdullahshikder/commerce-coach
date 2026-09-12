import 'dotenv/config';
import { Pool } from 'pg';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { hashPassword } from '../server/auth/password';
const [slug, name, email, passwordFile] = process.argv.slice(2);
if (!slug || !/^[a-z0-9-]{2,80}$/.test(slug) || !name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !passwordFile || !process.env.MIGRATION_DATABASE_URL) throw new Error('Usage: npm run admin:create -- organization-slug "Organization name" admin@example.com /private/password-file (set MIGRATION_DATABASE_URL)');
const hash = await hashPassword((await readFile(passwordFile,'utf8')).trim());
const pool = new Pool({ connectionString: process.env.MIGRATION_DATABASE_URL });
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query("SELECT pg_advisory_xact_lock(hashtext('commerce-coach-admin'))");
  const org = (await client.query(`INSERT INTO coach_private.organizations(id,slug,name) VALUES($1,$2,$3)
    ON CONFLICT(slug) DO UPDATE SET slug=excluded.slug RETURNING id`, [randomUUID(),slug,name])).rows[0];
  await client.query(`INSERT INTO coach_private.users(id,organization_id,email,name,password_hash,role,must_change_password)
    VALUES($1,$2,$3,'Administrator',$4,'admin',true)`,[randomUUID(),org.id,email.toLowerCase(),hash]);
  await client.query('COMMIT');
  console.log(`Administrator created for ${slug}. Sign in as ${email}; a password change is required.`);
} catch (error) { await client.query('ROLLBACK'); throw error; }
finally { client.release(); await pool.end(); }
