import 'dotenv/config';
import {readFileSync} from 'node:fs';
// Explicit keys support container secret mounts without exposing values in logs.
for(const key of ['DATABASE_URL','AUTH_DATABASE_URL','MIGRATION_DATABASE_URL','OPENROUTER_API_KEY','GEMINI_API_KEY','GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET']){
 const file=process.env[`${key}_FILE`];if(file){if(process.env[key])throw new Error(`Set ${key} or ${key}_FILE, not both.`);process.env[key]=readFileSync(file,'utf8').trim();}
}
