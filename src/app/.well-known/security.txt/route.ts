import {NextResponse} from 'next/server';
export const dynamic='force-dynamic';
export function GET(){
 const contact=process.env.SECURITY_CONTACT;
 if(!contact||! /^(https:\/\/[^\s]+|mailto:[^\s@]+@[^\s@]+)$/.test(contact))return new NextResponse('Security contact is not configured.',{status:503});
 const expires=new Date(Date.now()+90*24*60*60*1000).toISOString();
 return new NextResponse(`Contact: ${contact}\nExpires: ${expires}\nPreferred-Languages: fr, en, ar\n`,{headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'public, max-age=3600'}});
}
