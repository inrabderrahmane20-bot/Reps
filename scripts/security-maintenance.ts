import {loadEnvConfig} from '@next/env';
loadEnvConfig(process.cwd());
async function main(){
 const {updateDb,getDatabasePool}=await import('../src/lib/db');
 const now=Date.now();
 try{
  await updateDb(db=>{
   db.sessions=db.sessions.filter(s=>s.securityVersion===2&&Date.parse(s.expiresAt)>now&&Date.parse(s.lastSeenAt||s.createdAt)>now-60*60*1000);
   for(const user of db.users){
    if(Date.parse(user.resetTokenExpiresAt||'')<=now){delete user.resetTokenHash;delete user.resetTokenExpiresAt;}
    if(Date.parse(user.verifyTokenExpiresAt||'')<=now){delete user.verifyTokenHash;delete user.verifyTokenExpiresAt;}
   }
   db.notifications=db.notifications.filter(n=>!n.read||Date.parse(n.createdAt)>now-90*86400000);
  });
  const pool=getDatabasePool();
  if(pool){
   await pool.query('DELETE FROM public.security_rate_limits WHERE expires_at<now()');
   // Execute maintenance with a separate owner role; application service_role has no DELETE grant.
   await pool.query("DELETE FROM public.security_audit WHERE occurred_at<now()-interval '90 days'");
  }
  console.log('Expired security records and old read notifications removed.');
 }finally{await getDatabasePool()?.end();}
}
main().catch(()=>{console.error('Security maintenance failed. Check database connectivity and maintenance privileges.');process.exitCode=1;});
