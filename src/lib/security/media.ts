export async function storePublicImage(id:string,data:Buffer,mime:string):Promise<string|null>{
 const endpoint=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!endpoint||!key){
  if(process.env.NODE_ENV==='production')throw Object.assign(new Error('Image storage is temporarily unavailable.'),{status:503,expose:true});
  return null;
 }
 const base=new URL(endpoint);if(base.protocol!=='https:')throw new Error('HTTPS media storage is required.');
 const bucket=encodeURIComponent(process.env.MEDIA_BUCKET||'public-images');
 const object=`${bucket}/${encodeURIComponent(id)}`;
 const response=await fetch(`${base.origin}/storage/v1/object/${object}`,{method:'POST',headers:{Authorization:`Bearer ${key}`,apikey:key,'Content-Type':mime,'Cache-Control':'max-age=31536000','x-upsert':'false'},body:new Uint8Array(data),signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw new Error('Object storage upload failed.');
 return `${base.origin}/storage/v1/object/public/${object}`;
}
