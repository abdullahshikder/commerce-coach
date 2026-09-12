import { checkDatabase,closeDb } from '../server/db';
try { await checkDatabase(); console.log('PostgreSQL connection and RLS runtime role verified.'); } finally { await closeDb(); }
