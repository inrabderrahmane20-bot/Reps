import createMiddleware from 'next-intl/middleware';
import {NextRequest,NextResponse} from 'next/server';
import {locales,defaultLocale} from './i18n/config';

const internationalize=createMiddleware({locales,defaultLocale,localePrefix:'always',localeDetection:true});
export default function middleware(request:NextRequest){
 const nonce=btoa(crypto.randomUUID());
 const dev=process.env.NODE_ENV==='development';
 const policy=["default-src 'self'",`script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev?" 'unsafe-eval'":''}`,"style-src 'self' 'unsafe-inline'","img-src 'self' https: data: blob:","font-src 'self' data:",`connect-src 'self'${dev?' ws: http:':''}`,"frame-src 'self' https://www.google.com https://maps.google.com","object-src 'none'","base-uri 'self'","form-action 'self'","frame-ancestors 'self'",...(dev?[]:['upgrade-insecure-requests'])].join('; ');
 const requestHeaders=new Headers(request.headers);
 requestHeaders.set('x-nonce',nonce);requestHeaders.set('Content-Security-Policy',policy);
 const secured=new NextRequest(request,{headers:requestHeaders});
 const response=request.nextUrl.pathname.startsWith('/admin')?NextResponse.next({request:{headers:requestHeaders}}):internationalize(secured);
 const overrides=new Set((response.headers.get('x-middleware-override-headers')||'').split(',').filter(Boolean));
 for(const key of ['x-nonce','content-security-policy']){overrides.add(key);response.headers.set(`x-middleware-request-${key}`,requestHeaders.get(key)!);}
 response.headers.set('x-middleware-override-headers',[...overrides].join(','));
 response.headers.set('Content-Security-Policy',policy);
 // A nonce belongs to exactly one HTML response; never reuse it through a CDN.
 response.headers.set('Cache-Control','private, no-store');
 return response;
}
export const config={matcher:['/((?!api|_next|.*\\..*).*)']};
