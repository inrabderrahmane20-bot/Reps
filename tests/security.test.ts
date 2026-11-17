import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomBytes} from 'node:crypto';
import sharp from 'sharp';
import {hashPassword,verifyPassword,seal,unseal,totp,verifyTotp,tokenHash} from '../src/lib/security/crypto';
import {assertRequestOrigin,boundedBody} from '../src/lib/security/request';
import {assertStrongPassword} from '../src/lib/security/password';
import {sanitizeUpload} from '../src/lib/security/image';
import {redact} from '../src/lib/security/audit';
import {validProfile} from '../src/lib/security/profile';

test('password hashing uses independent salts and rejects invalid credentials',async()=>{
 const a=await hashPassword('A unique long passphrase!'),b=await hashPassword('A unique long passphrase!');
 assert.notEqual(a.salt,b.salt);assert.notEqual(a.hash,b.hash);
 assert(await verifyPassword('A unique long passphrase!',a.salt,a.hash));
 assert(!await verifyPassword('wrong',a.salt,a.hash));assert(!await verifyPassword('x','bad','bad'));
});
test('TOTP matches the RFC 6238 test vector and rejects replay',()=>{
 const key='GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
 assert.equal(totp(key,1),'287082');
 assert.equal(verifyTotp(key,'287082',-1,59000),1);
 assert.equal(verifyTotp(key,'287082',1,59000),null);
 assert.equal(verifyTotp(key,'000000',-1,59000),null);
});
test('MFA encryption authenticates ciphertext and requires a strong deployment key',()=>{
 process.env.AUTH_SECRET=randomBytes(32).toString('hex');
 const value=seal('MFA secret');assert.equal(unseal(value),'MFA secret');
 const tampered=Buffer.from(value,'base64url');tampered[30]^=1;
 assert.throws(()=>unseal(tampered.toString('base64url')));
 process.env.AUTH_SECRET='weak';assert.throws(()=>seal('secret'));
});
test('mutations reject absent, null, sibling and cross-site origins',()=>{
 process.env.NEXT_PUBLIC_SITE_URL='https://app.example.test';
 const req=(origin?:string,site?:string)=>new Request('https://app.example.test/api/auth/login',{method:'POST',headers:{...(origin?{origin}:{}),...(site?{'sec-fetch-site':site}:{})}});
 assert.doesNotThrow(()=>assertRequestOrigin(req('https://app.example.test','same-origin')));
 for(const origin of [undefined,'null','https://evil.test','https://sub.app.example.test'])assert.throws(()=>assertRequestOrigin(req(origin)));
 assert.throws(()=>assertRequestOrigin(req('https://app.example.test','cross-site')));
});
test('streamed request size limits do not trust Content-Length',async()=>{
 const r=new Request('https://example.test',{method:'POST',body:'a'.repeat(100)});
 await assert.rejects(boundedBody(r,50));
 const good=await boundedBody(new Request('https://example.test',{method:'POST',body:'abc'}),3);
 assert.equal(new TextDecoder().decode(good),'abc');
});
test('password screening sends only a hash prefix, blocks breached passwords and fails closed',async()=>{
 const original=globalThis.fetch;const password='Long unique test passphrase!';const hash=createHash('sha1').update(password).digest('hex').toUpperCase();
 try{
  globalThis.fetch=async(input,init)=>{assert.equal(String(input),`https://api.pwnedpasswords.com/range/${hash.slice(0,5)}`);assert.equal((init?.headers as Record<string,string>)['Add-Padding'],'true');return new Response(`${hash.slice(5)}:12`);};
  await assert.rejects(assertStrongPassword(password),/data breach/);
  globalThis.fetch=async()=>new Response('00000000000000000000000000000000000:0');
  await assertStrongPassword(password);await assert.rejects(assertStrongPassword('short'));
  globalThis.fetch=async()=>new Response('',{status:503});await assert.rejects(assertStrongPassword(password));
 }finally{globalThis.fetch=original;}
});
test('uploads reject fake MIME, corrupted data and excessive pixels and strip EXIF',async()=>{
 await assert.rejects(sanitizeUpload(Buffer.from('<svg onload="alert(1)"></svg>'),'image/png'));
 await assert.rejects(sanitizeUpload(Buffer.from([137,80,78,71,13,10,26,10]),'image/png'));
 const source=await sharp({create:{width:16,height:16,channels:3,background:'#ffffff'}}).jpeg().withMetadata({exif:{IFD0:{Artist:'private author'}}}).toBuffer();
 const result=await sanitizeUpload(source,'image/jpeg');
 const metadata=await sharp(result.data).metadata();
 assert.equal(metadata.format,'webp');assert.equal(metadata.exif,undefined);
 const huge=await sharp({create:{width:5000,height:4000,channels:3,background:'#ffffff'}}).png().toBuffer();
 await assert.rejects(sanitizeUpload(huge,'image/png'));
});
test('audit redaction and public profile validation keep secrets out',()=>{
 const result=JSON.stringify(redact({passwordHash:'secret',mfaSecret:'secret',nested:{resetTokenHash:'secret'},role:'admin'}));
 assert(!result.includes(':"secret"'));assert(result.includes('admin'));
 assert(!validProfile({avatar:'javascript:alert(1)'}));assert(!validProfile({languages:{bad:true}}));assert(!validProfile({homeLat:999}));
 assert(validProfile({firstName:'Test',avatar:'/avatar.png',homeLat:31.5}));
 assert.equal(tokenHash('token').length,64);
});
