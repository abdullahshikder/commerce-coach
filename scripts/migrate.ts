import { migrate } from '../server/migrate';
await migrate();
console.log('PostgreSQL schema, runtime role, and RLS policies are ready.');
