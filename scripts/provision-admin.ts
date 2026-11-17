import {loadEnvConfig} from '@next/env';
loadEnvConfig(process.cwd());
async function main(){
 const email=(process.env.ADMIN_EMAIL||'admin@annabid.com').trim().toLowerCase(),password=process.env.ADMIN_PASSWORD;
 if(!email||!password||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD using your secret manager.');
 const {assertStrongPassword}=await import('../src/lib/security/password');await assertStrongPassword(password);
 const {hashPassword}=await import('../src/lib/security/crypto');const next=await hashPassword(password);
 const {updateDb,newId,getDatabasePool}=await import('../src/lib/db');
 try{
  await updateDb(db=>{
   let user=db.users.find(u=>u.email.toLowerCase()===email);
   if(!user){user={id:newId('u'),email,firstName:'Administrator',lastName:'',city:'Marrakech',neighborhood:'',avatar:'',languages:['French'],interests:[],bio:'',role:'admin',status:'active',providerStatus:'none',provider:null,blockedUserIds:[],createdAt:new Date().toISOString(),salt:next.salt,passwordHash:next.hash};db.users.push(user);}
   user.role='admin';user.status='active';user.salt=next.salt;user.passwordHash=next.hash;user.passwordResetRequired=false;user.credentialsRotatedAt=new Date().toISOString();
   delete user.resetTokenHash;delete user.resetTokenExpiresAt;db.sessions=db.sessions.filter(s=>s.userId!==user!.id);
   // Explicit operator recovery only; never silently remove an existing second factor.
   if(process.argv.includes('--reset-mfa')){delete user.mfaSecret;delete user.mfaLastCounter;}
  });
  console.log('Administrator provisioned. Verify the email address and enroll MFA at the next sign-in.');
 }finally{await getDatabasePool()?.end();}
}
main().catch(()=>{console.error('Administrator provisioning failed. Check input, password safety service and database configuration.');process.exitCode=1;});
