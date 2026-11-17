const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),crypto=require('node:crypto');
const {NextRequest}=require('next/server');
function harness(){
 const cache=new Map(),jar=new Map(),events=[],db={users:[],sessions:[],notifications:[]};let serial=0;
 const dbMock={readDb:async()=>structuredClone(db),updateDb:async fn=>fn(db),getDatabasePool:()=>null,newId:p=>`${p}_${++serial}`,readSessionUser:async token=>{const session=db.sessions.find(s=>s.token===token);return session?{session,user:db.users.find(u=>u.id===session.userId)}:null;}};
 function load(file){
  file=path.resolve(file);if(cache.has(file))return cache.get(file).exports;
  const module={exports:{}};cache.set(file,module);
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  function localRequire(name){
   if(name==='next/headers')return {cookies:async()=>({get:n=>jar.has(n)?{value:jar.get(n)}:undefined,set:(n,v)=>jar.set(n,v),delete:n=>jar.delete(n)})};
   if(!name.startsWith('.')&&!name.startsWith('@/'))return require(name);
   const target=name.startsWith('@/')?path.resolve('src',name.slice(2)):path.resolve(path.dirname(file),name);
   return load(path.extname(target)?target:target+'.ts');
  }
  new Function('require','module','exports',code)(localRequire,module,module.exports);return module.exports;
 }
 cache.set(path.resolve('src/lib/db.ts'),{exports:dbMock});
 cache.set(path.resolve('src/lib/security/email.ts'),{exports:{emailConfiguration:()=>({}),sendAccountEmail:async(user,kind)=>events.push({kind,userId:user.id})}});
 cache.set(path.resolve('src/lib/security/audit.ts'),{exports:{appendAudit:async(_pool,action,detail)=>events.push({action,detail})}});
 cache.set(path.resolve('src/lib/security/password.ts'),{exports:{assertStrongPassword:async value=>{if(typeof value!=='string'||value.length<12)throw Object.assign(new Error('Weak password'),{status:400,expose:true});}}});
 process.env.AUTH_SECRET=crypto.randomBytes(32).toString('hex');process.env.NEXT_PUBLIC_SITE_URL='https://app.example.test';
 delete process.env.VERCEL;delete process.env.TRUSTED_PROXY_IP_HEADER;
 async function user(id='test',role='user'){
  const auth=load('src/lib/auth.ts'),credentials=await auth.hashPassword('Unique fixture passphrase!');
  const u={id,email:`${id}@example.test`,salt:credentials.salt,passwordHash:credentials.hash,firstName:'Test',lastName:'Account',role,status:'active',emailVerifiedAt:new Date().toISOString(),city:'Marrakech',neighborhood:'',avatar:'',languages:[],interests:[],bio:'',provider:null,providerStatus:'none',blockedUserIds:[],createdAt:new Date().toISOString()};db.users.push(u);return u;
 }
 async function call(route,method,body,headers={origin:'https://app.example.test'}){
  const req=new NextRequest(`https://app.example.test/api/${route}`,{method,headers:{'Content-Type':'application/json',...headers},...(body!==undefined?{body:JSON.stringify(body)}:{})});
  const r=await load(`src/app/api/${route}/route.ts`)[method](req,{params:Promise.resolve({id:'test'})});
  return {status:r.status,headers:r.headers,body:await r.json()};
 }
 return {load,jar,events,db,user,call};
}
test('route guards enforce CSRF without relying on middleware',async()=>{
 const h=harness();
 for(const route of ['auth/login','auth/register','admin/users']){
  assert.equal((await h.call(route,'POST',{},{})).status,403);
  assert.equal((await h.call(route,'POST',{}, {origin:'https://evil.test'})).status,403);
 }
});
test('account throttling blocks brute force before the sixth password check',async()=>{
 const h=harness();await h.user();
 for(let i=0;i<5;i++)assert.equal((await h.call('auth/login','POST',{email:'test@example.test',password:'wrong'})).status,401);
 const limited=await h.call('auth/login','POST',{email:'test@example.test',password:'Unique fixture passphrase!'});
 assert.equal(limited.status,429);assert.equal(limited.headers.get('Retry-After'),'900');assert.equal(h.db.sessions.length,0);
});
test('sessions store only hashes, rotate, and revoke immediately',async()=>{
 const h=harness();await h.user();
 assert.equal((await h.call('auth/login','POST',{email:'test@example.test',password:'Unique fixture passphrase!'})).status,200);
 const raw=h.jar.get('medina_session');assert.notEqual(h.db.sessions[0].token,raw);assert.equal(h.db.sessions[0].token,crypto.createHash('sha256').update(raw).digest('hex'));
 const old=h.db.sessions[0].token;
 assert.equal((await h.call('auth/sessions','POST',{action:'refresh'})).status,200);
 assert(!h.db.sessions.some(s=>s.token===old));
 assert.equal((await h.call('auth/sessions','POST',{action:'revoke-all'})).status,200);
 assert.equal(await h.load('src/lib/auth.ts').getSessionUser(),null);
});
test('an unverified email cannot obtain a usable account session',async()=>{
 const h=harness(),user=await h.user();delete user.emailVerifiedAt;
 const r=await h.call('auth/login','POST',{email:user.email,password:'Unique fixture passphrase!'});
 assert.equal(r.body.nextStep,'verify-email');assert.equal(await h.load('src/lib/auth.ts').getSessionUser(),null);
 assert.equal((await h.call('auth/sessions','GET')).status,401);
});
test('admin password alone cannot access admin routes; enrollment needs a valid TOTP',async()=>{
 const h=harness(),user=await h.user('admin','admin');
 const r=await h.call('auth/login','POST',{email:user.email,password:'Unique fixture passphrase!'});
 assert.equal(r.body.nextStep,'mfa-setup');
 assert.equal((await h.call('admin/users','GET')).status,401);
 const setup=await h.call('auth/mfa','POST',{action:'setup'});assert.equal(setup.status,200);
 assert.equal((await h.call('auth/mfa','POST',{code:'invalid'})).status,401);
 const c=h.load('src/lib/security/crypto.ts'),code=c.totp(setup.body.secret,Math.floor(Date.now()/30000));
 assert.equal((await h.call('auth/mfa','POST',{code})).status,200);
 assert.equal((await h.call('admin/users','GET')).status,200);
 assert.notEqual(user.mfaSecret,setup.body.secret);
 await h.call('auth/login','POST',{email:user.email,password:'Unique fixture passphrase!'});
 assert.equal((await h.call('auth/mfa','POST',{code})).status,401);
});
test('reset tokens are one-use, time-limited and revoke sessions without removing MFA',async()=>{
 const h=harness(),user=await h.user();const token=crypto.randomBytes(32).toString('hex');
 user.resetTokenHash=crypto.createHash('sha256').update(token).digest('hex');user.resetTokenExpiresAt=new Date(Date.now()+60000).toISOString();user.mfaSecret='preserved';
 await h.load('src/lib/auth.ts').createSessionCookie(user.id);
 assert.equal((await h.call('auth/recovery','POST',{action:'reset',token,password:'Another unique passphrase!'})).status,200);
 assert.equal(h.db.sessions.length,0);assert.equal(user.mfaSecret,'preserved');assert.equal(user.resetTokenHash,undefined);
 assert.equal((await h.call('auth/recovery','POST',{action:'reset',token,password:'Another unique passphrase!'})).status,400);
});
test('inactive accounts and legacy plaintext sessions fail closed',async()=>{
 const h=harness(),user=await h.user();await h.load('src/lib/auth.ts').createSessionCookie(user.id);
 user.status='suspended';assert.equal(await h.load('src/lib/auth.ts').getSessionUser(),null);
 user.status='active';delete h.db.sessions[0].securityVersion;assert.equal(await h.load('src/lib/auth.ts').getSessionUser(),null);
});
test('production errors return correlation IDs without database diagnostics',async()=>{
 const h=harness(),helper=h.load('src/lib/api-helpers.ts');
 const r=await helper.withErrors(()=>{throw Object.assign(new Error('postgres://secret@host'),{code:'28P01',operation:'SELECT passwordHash'});});
 const body=await r.json();assert(body.requestId);assert(!JSON.stringify(body).includes('secret'));assert(!body.code);assert(!body.operation);
});
