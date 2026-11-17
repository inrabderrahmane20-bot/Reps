const fs=require('fs'),path=require('path'),ts=require('typescript');
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
for(const file of walk('src/app').filter(f=>/page\.tsx$/.test(f))){
 const text=fs.readFileSync(file,'utf8'),source=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),edits=new Map();
 const aliases=new Map(source.statements.filter(ts.isTypeAliasDeclaration).map(n=>[n.name.text,n.type]));
 function edit(start,end,value){edits.set(start+':'+end,{start,end,value});}
 for(const node of source.statements){
  if(!ts.isFunctionDeclaration(node)||!node.body)continue;
  const arg=node.parameters[0];if(!arg||!ts.isObjectBindingPattern(arg.name))continue;
  const type=arg.type&&ts.isTypeReferenceNode(arg.type)?aliases.get(arg.type.typeName.getText(source)):arg.type;
  if(!type||!ts.isTypeLiteralNode(type))continue;
  const changes=[];
  for(const binding of arg.name.elements){
   const name=binding.name.getText(source);if(!['params','searchParams'].includes(name))continue;
   const member=type.members.find(m=>m.name?.getText(source)===name);
   if(!member?.type||member.type.getText(source).startsWith('Promise<'))continue;
   edit(member.type.getStart(source),member.type.end,`Promise<${member.type.getText(source)}>`);
   edit(binding.getStart(source),binding.end,`${name}: pending${name}`);
   changes.push(`const ${name} = await pending${name};`);
  }
  if(changes.length){
   edit(node.body.getStart(source)+1,node.body.getStart(source)+1,'\n  '+changes.join('\n  ')+'\n');
   if(!node.modifiers?.some(m=>m.kind===ts.SyntaxKind.AsyncKeyword)){
    const start=text.indexOf('function',node.getStart(source));edit(start,start,'async ');
   }
  }
 }
 if(edits.size){let result=text;for(const e of [...edits.values()].sort((a,b)=>b.start-a.start))result=result.slice(0,e.start)+e.value+result.slice(e.end);fs.writeFileSync(file,result);}
}
