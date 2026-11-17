import { updateDb } from '../db';
import { randomToken, tokenHash } from './crypto';
import type { User } from '../types';

export function emailConfiguration() {
  const origin=new URL(process.env.NEXT_PUBLIC_SITE_URL||'');
  if(origin.protocol!=='https:'||!process.env.RESEND_API_KEY||!process.env.AUTH_EMAIL_FROM) {
    throw Object.assign(new Error('Account email delivery is temporarily unavailable.'),{status:503,expose:true});
  }
  return {origin:origin.origin,key:process.env.RESEND_API_KEY,from:process.env.AUTH_EMAIL_FROM};
}
export async function sendAccountEmail(user: User, kind: 'verify'|'reset') {
  const config=emailConfiguration(),token=randomToken();
  const hash=tokenHash(token),expires=new Date(Date.now()+(kind==='reset'?30:60)*60*1000).toISOString();
  await updateDb(db=>{
    const current=db.users.find(u=>u.id===user.id);
    if(!current||current.email!==user.email)return;
    if(kind==='reset'){current.resetTokenHash=hash;current.resetTokenExpiresAt=expires;}
    else{current.verifyTokenHash=hash;current.verifyTokenExpiresAt=expires;}
  });
  // Fragment tokens are never sent in a page URL or Referer header. The form POST consumes them.
  const url=`${config.origin}/fr/account-security/#${kind}=${token}`;
  const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${config.key}`,'Content-Type':'application/json'},body:JSON.stringify({from:config.from,to:[user.email],subject:kind==='reset'?'Annabid — Réinitialiser votre mot de passe':'Annabid — Confirmer votre adresse e-mail',text:`${kind==='reset'?'Réinitialisez votre mot de passe':'Confirmez votre adresse e-mail'} : ${url}\nCe lien est à usage unique et expire dans ${kind==='reset'?30:60} minutes. Si vous n’avez pas demandé ce message, ignorez-le.`}),signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw Object.assign(new Error('Account email delivery is temporarily unavailable.'),{status:503,expose:true});
}
