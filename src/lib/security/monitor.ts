export async function reportSecurityEvent(event:Record<string,unknown>){
 const endpoint=process.env.SECURITY_ALERT_WEBHOOK_URL;if(!endpoint)return;
 try{
  if(new URL(endpoint).protocol!=='https:')throw new Error('HTTPS is required.');
  const result=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',...(process.env.SECURITY_ALERT_WEBHOOK_TOKEN?{Authorization:`Bearer ${process.env.SECURITY_ALERT_WEBHOOK_TOKEN}`}:{})},body:JSON.stringify(event),signal:AbortSignal.timeout(2000)});
  if(!result.ok)throw new Error('Alert rejected.');
 }catch{console.error(JSON.stringify({event:'security_alert_delivery_failed',requestId:event.requestId}));}
}
