import fs from 'node:fs';
import path from 'node:path';
import {loadEnvConfig} from '@next/env';
loadEnvConfig(process.cwd());
async function main(){
 const {getDatabasePool}=await import('../src/lib/db');
 const pool=getDatabasePool();if(!pool)throw new Error('Configure the target database before migrating.');
 try{await pool.query(fs.readFileSync(path.join(process.cwd(),'supabase/migrations/202611170001_security.sql'),'utf8'));console.log('Security schema installed; legacy sessions and seeded admin credentials invalidated.');}
 finally{await pool.end();}
}
main().catch(()=>{console.error('Security migration failed. Check the target database and migration privileges.');process.exitCode=1;});
