const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict'),http=require('http'),https=require('https'),{spawn,execFileSync}=require('child_process');
const {chromium}=require('playwright');
const root=process.cwd(),dir=path.join(root,'.local-data',`security-browser-${crypto.randomUUID()}`);
// Exercise the production HTTPS policy through a local TLS proxy, including
// redirects. The fixture certificate is ephemeral and never leaves this test.
const port=Number(process.env.SECURITY_TEST_PORT||3197),origin=`https://localhost:${port+1}`;
const env={...process.env,NODE_ENV:'production',ALLOW_LOCAL_DB:'true',LOCAL_DATA_DIR:dir,NEXT_PUBLIC_SITE_URL:origin,AUTH_SECRET:crypto.randomBytes(32).toString('hex'),SECURITY_CONTACT:'mailto:security@example.test'};
for(const key of ['POSTGRES_PRISMA_URL','POSTGRES_URL','POSTGRES_URL_NON_POOLING','DATABASE_URL','RESEND_API_KEY','SUPABASE_SERVICE_ROLE_KEY','SECURITY_ALERT_WEBHOOK_URL','VERCEL','VERCEL_URL'])delete env[key];
const password=crypto.randomBytes(20).toString('hex');
const salt=crypto.randomBytes(16).toString('hex');
const seed=JSON.parse(fs.readFileSync(path.join(root,'src/data/db.seed.json'),'utf8'));
for(const key of Object.keys(seed))if(Array.isArray(seed[key])&&key!=='categories')seed[key]=[];
seed.users=[{id:'security-admin',email:'security-admin@example.test',passwordHash:crypto.scryptSync(password,salt,64).toString('hex'),salt,firstName:'Security',lastName:'Fixture',role:'admin',status:'active',emailVerifiedAt:new Date().toISOString(),providerStatus:'none',provider:null,city:'Marrakech',neighborhood:'',avatar:'',languages:[],interests:[],bio:'',blockedUserIds:[],createdAt:new Date().toISOString()}];
fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'db.json'),JSON.stringify(seed));
const openssl=process.env.OPENSSL_PATH||(process.platform==='win32'?'C:/Program Files/Git/usr/bin/openssl.exe':'openssl');
execFileSync(openssl,['req','-x509','-newkey','rsa:2048','-nodes','-keyout',path.join(dir,'key.pem'),'-out',path.join(dir,'cert.pem'),'-days','1','-subj','/CN=localhost','-addext','subjectAltName=DNS:localhost'],{windowsHide:true,stdio:'ignore'});
const proxy=https.createServer({key:fs.readFileSync(path.join(dir,'key.pem')),cert:fs.readFileSync(path.join(dir,'cert.pem'))},(req,res)=>{
 const upstream=http.request({hostname:'127.0.0.1',port,path:req.url,method:req.method,headers:{...req.headers,'x-forwarded-proto':'https','x-forwarded-host':`localhost:${port+1}`}},incoming=>{
  const headers={...incoming.headers};
  if(headers.location&&/^https?:/.test(headers.location)){const target=new URL(headers.location);if(['localhost','127.0.0.1'].includes(target.hostname))headers.location=origin+target.pathname+target.search;}
  res.writeHead(incoming.statusCode,headers);incoming.pipe(res);
 });upstream.on('error',()=>{if(!res.headersSent)res.writeHead(502);res.end();});req.pipe(upstream);
});
const child=spawn(process.execPath,[require.resolve('next/dist/bin/next'),'start','--hostname','127.0.0.1','--port',String(port)],{cwd:root,env,windowsHide:true,stdio:['ignore','pipe','pipe']});
let output='';child.stdout.on('data',d=>output+=d);child.stderr.on('data',d=>output+=d);
let browser;
function code(secret){const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567',bits=[...secret].map(c=>alphabet.indexOf(c).toString(2).padStart(5,'0')).join('');const key=Buffer.from(bits.match(/.{8}/g).map(b=>parseInt(b,2)));const counter=Buffer.alloc(8);counter.writeBigUInt64BE(BigInt(Math.floor(Date.now()/30000)));const digest=crypto.createHmac('sha1',key).update(counter).digest(),offset=digest.at(-1)&15;return String((digest.readUInt32BE(offset)&0x7fffffff)%1000000).padStart(6,'0');}
(async()=>{
 for(let i=0;i<100;i++){try{if((await fetch(`http://127.0.0.1:${port}/api/health/`)).ok)break;}catch{}if(i===99)throw Error('Server did not start.');await new Promise(r=>setTimeout(r,200));}
 await new Promise(resolve=>proxy.listen(port+1,'localhost',resolve));
 const fallback=process.env.LOCALAPPDATA&&path.join(process.env.LOCALAPPDATA,'ms-playwright/chromium-1223/chrome-win64/chrome.exe');
 browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:fallback&&fs.existsSync(fallback)?{executablePath:fallback}:{})});
 const page=await browser.newPage({ignoreHTTPSErrors:true});const cspErrors=[],runtimeErrors=[];
 await page.addInitScript(()=>{localStorage.setItem('medina.languageSelected','1');window.addEventListener('securitypolicyviolation',e=>{console.error('CSP_VIOLATION '+e.violatedDirective+' '+e.blockedURI);});});
 page.on('console',m=>{if(m.text().includes('CSP_VIOLATION')||m.text().includes('Content Security Policy'))cspErrors.push(m.text());});
 page.on('pageerror',e=>runtimeErrors.push(e.message));
 const res=await page.goto(`${origin}/admin/`);assert.equal(res.status(),200);
 for(const locale of ['fr','en','ar']) {
  for(const suffix of ['/admin/','/admin/login/','/admin/users/?view=active']) {
   const alias=await page.request.get(`${origin}/${locale}${suffix}`,{maxRedirects:0});
   assert.equal(alias.status(),308);
   const target=new URL(alias.headers().location,origin);assert.equal(target.pathname+target.search,suffix==='/admin/login/'?'/admin/':suffix);assert.equal(target.origin,origin);
  }
 }
 const legacyLogin=await page.request.get(`${origin}/admin/login/`,{maxRedirects:0});assert.equal(legacyLogin.status(),308);assert.equal(new URL(legacyLogin.headers().location,origin).pathname,'/admin/');
 const csp=res.headers()['content-security-policy'];assert(csp.includes("'nonce-"));assert(!csp.includes("script-src 'unsafe-inline'"));
 const firstNonce=csp.match(/'nonce-([^']+)'/)[1];
 const res2=await page.reload();assert.notEqual(res2.headers()['content-security-policy'].match(/'nonce-([^']+)'/)[1],firstNonce);
 await page.locator('input[type=email]').fill('security-admin@example.test');await page.locator('input[type=password]').fill(password);
 await page.getByRole('button',{name:'Sign in',exact:true}).click();
 try { await page.waitForURL('**/en/account-security/**'); }
 catch(error) { console.error('Login page state:',await page.locator('body').innerText());console.error('CSP/runtime errors:',cspErrors,runtimeErrors);throw error; }
 await page.getByRole('button',{name:'Set up my authenticator',exact:true}).click();
 const secret=await page.locator('code').textContent();assert(secret&&secret.length>=32);
 const denied=await page.request.get(`${origin}/api/admin/users/`);assert.equal(denied.status(),401);
 await page.getByLabel('Six-digit code').fill(code(secret));await page.getByRole('button',{name:'Confirm',exact:true}).click();
 await page.waitForURL('**/admin/');await page.getByRole('link',{name:'Users',exact:true}).waitFor();
 assert.equal((await page.request.get(`${origin}/api/admin/users/`)).status(),200);
 await page.goto(`${origin}/admin/visual-editor/home/?locale=fr`);await page.waitForTimeout(1200);
 assert.equal((await page.request.post(`${origin}/api/admin/users/`,{headers:{origin:'https://evil.test'},data:{}})).status(),403);
 assert.equal((await page.request.get(`${origin}/_next/image/?url=${encodeURIComponent('https://evil.test/a.png')}&w=640&q=75`)).status(),400);
 await page.goto(`${origin}/fr/services/`);await page.waitForTimeout(500);
 await page.goto(`${origin}/ar/account-security/`);await page.waitForTimeout(300);assert.equal(await page.locator('html').getAttribute('dir'),'rtl');
 assert.deepEqual(cspErrors,[]);assert.deepEqual(runtimeErrors,[]);
 const stored=JSON.parse(fs.readFileSync(path.join(dir,'db.json'),'utf8'));assert(stored.users[0].mfaSecret);assert(!stored.users[0].mfaSecret.includes(secret));
 const cookie=(await page.context().cookies()).find(c=>c.name==='medina_session');assert(cookie.httpOnly);assert(cookie.secure);assert(cookie.sameSite==='Lax');
 assert(stored.sessions.every(s=>s.token!==cookie.value));
 console.log('Browser security checks passed: canonical admin redirects, nonce CSP/hydration, MFA enrollment/admin gates, RTL, editor, CSRF, image allowlist and protected cookies.');
})().catch(e=>{console.error(e);console.error(output.slice(-3500));process.exitCode=1;}).finally(async()=>{
 if(browser)await browser.close();proxy.closeAllConnections();await new Promise(r=>proxy.close(r));child.kill();await new Promise(r=>child.once('exit',r));
 // Only delete the uniquely named fixture directory we created, inside the workspace.
 const resolved=path.resolve(dir),parent=path.join(root,'.local-data')+path.sep;
 if(!resolved.startsWith(parent)||!path.basename(resolved).startsWith('security-browser-'))throw Error('Unsafe test cleanup path.');
 fs.rmSync(resolved,{recursive:true,force:true});
});
