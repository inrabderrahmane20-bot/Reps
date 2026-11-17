// One-off migration helper; removed after applying the route guards.
const fs=require('fs'),path=require('path');
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
for(const file of walk('src/app/api').filter(f=>f.endsWith('route.ts'))){
 let source=fs.readFileSync(file,'utf8');
 if(source.includes('secureRoute'))continue;
 const methods=[];
 source=source.replace(/export async function (GET|POST|PATCH|PUT|DELETE|HEAD|OPTIONS)\(/g,(_,method)=>{methods.push(method);return `async function handle${method}(`;});
 if(!methods.length)throw Error(`No handlers: ${file}`);
 source=source.replace(/\{ params \}: \{ params: \{([^}]+)\} \}/g,(_,fields)=>`context: { params: Promise<{${fields}}> }`);
 // Async route params are required by the patched Next.js release.
 if(source.includes('context: { params: Promise<'))source=source.replace(/(async function handle\w+\([^\n]+\) \{)/g,match=>match.includes('context:')?match+'\n  const params = await context.params;':match);
 source=`import { secureRoute } from '@/lib/security/route';\n`+source+'\n'+methods.map(m=>`export const ${m} = secureRoute(handle${m});`).join('\n')+'\n';
 fs.writeFileSync(file,source);
}
