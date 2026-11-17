export function validProfile(body:Record<string,unknown>):boolean{
 for(const [key,max] of Object.entries({firstName:100,lastName:100,city:100,neighborhood:100,bio:5000,zoneId:100}))if(body[key]!==undefined&&(typeof body[key]!=='string'||(body[key] as string).length>max))return false;
 for(const key of ['languages','interests'])if(body[key]!==undefined&&(!Array.isArray(body[key])||(body[key] as unknown[]).length>30||(body[key] as unknown[]).some(v=>typeof v!=='string'||v.length>100)))return false;
 if(body.avatar!==undefined){if(typeof body.avatar!=='string'||body.avatar.length>2048)return false;if(body.avatar!==''&&!/^\/(?!\/)[^\s]*$/.test(body.avatar)){try{const url=new URL(body.avatar);if(url.protocol!=='https:'||url.username||url.password)return false;}catch{return false;}}}
 for(const [key,max] of [['homeLat',90],['homeLng',180]] as const)if(body[key]!==undefined&&(typeof body[key]!=='number'||!Number.isFinite(body[key])||Math.abs(body[key] as number)>max))return false;
 return true;
}
