import fs from 'node:fs';
import path from 'node:path';
import cp from 'node:child_process';
import {createRequire} from 'node:module';
const root='/workspace/advance-video-edior';
const require=createRequire(root+'/editor/apps/web/package.json');
const ts=require('typescript');
const moves=JSON.parse(fs.readFileSync('/workspace/recovery-baseline/functional-moves.json','utf8'));
const tracked=cp.execFileSync('git',['ls-files','-z'],{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024}).split('\0').filter(Boolean);
const active=tracked.filter(p=>!p.startsWith('AnalyseFuture/') && fs.statSync(root+'/'+p).isFile());
const sources=new Map(active.map(p=>[p,fs.readFileSync(root+'/'+p)]));
const changed=[];const references=[];
function existing(base){
 const candidates=[base];
 if(/\.(js|jsx|mjs)$/.test(base)) candidates.push(base.replace(/\.[^.]+$/,'.ts'),base.replace(/\.[^.]+$/,'.tsx'));
 for(const ext of ['.ts','.tsx','.d.ts','.js','.jsx','.mjs','.json','.css','.wgsl'])candidates.push(base+ext);
 for(const ext of ['.ts','.tsx','.js','.jsx'])candidates.push(base+'/index'+ext);
 return candidates.find(p=>sources.has(p));
}
function resolve(name,spec){
 const suffix=spec.match(/[?#].*$/)?.[0]??'';
 const pure=suffix?spec.slice(0,-suffix.length):spec;
 let base;
 if(pure.startsWith('.'))base=path.posix.normalize(path.posix.join(path.posix.dirname(name),pure));
 else if(pure.startsWith('@/')&&name.startsWith('editor/apps/web/'))base='editor/apps/web/src/'+pure.slice(2);
 else if(pure.startsWith('/src/')&&(name.startsWith('editor/apps/web/')||name.startsWith('editor/apps/studio/e2e-web/')))base='editor/apps/web'+pure;
 else return;
 const target=existing(base);if(!target)return;
 return {target,suffix,pure};
}
function rewrite(name,buffer){
 if(!/\.(?:[cm]?[jt]sx?|json)$/.test(name))return buffer;
 const text=buffer.toString('utf8');const nextName=moves[name]??name;
 if(nextName.startsWith('AnalyseFuture/'))return buffer;
 const tree=ts.createSourceFile(name,text,ts.ScriptTarget.Latest,true);
 const edits=[];
 function visit(node){
  if(ts.isStringLiteralLike(node)){
   const found=resolve(name,node.text);
   if(found){
    const nextTarget=moves[found.target]??found.target;
    let updated;
    if(found.pure.startsWith('@/'))updated='@/'+nextTarget.slice('editor/apps/web/src/'.length);
    else if(found.pure.startsWith('/src/'))updated='/src/'+nextTarget.slice('editor/apps/web/src/'.length);
    else{
     updated=path.posix.relative(path.posix.dirname(nextName),nextTarget);
     if(!updated.startsWith('.'))updated='./'+updated;
    }
    const originalHasExtension=/\.[a-zA-Z0-9]+$/.test(found.pure);
    if(!originalHasExtension){
     updated=updated.replace(/\.(?:d\.ts|tsx?|jsx?|mjs)$/,'');
     if(!found.pure.endsWith('/index')&&found.target.includes('/index.')&&updated.endsWith('/index'))updated=updated.slice(0,-6)||'.';
    }else if(found.pure.endsWith('.js')&&/\.tsx?$/.test(found.target))updated=updated.replace(/\.tsx?$/,'.js');
    updated+=found.suffix;
    references.push({from:name,to:nextName,before:node.text,after:updated,oldTarget:found.target,newTarget:nextTarget});
    if(updated!==node.text){
     const start=node.getStart(tree);const quote=text[start];
     const escaped=updated.replaceAll('\\','\\\\').replaceAll(quote,'\\'+quote);
     edits.push({start:start+1,end:node.getEnd()-1,value:escaped});
    }
   }
  }
  ts.forEachChild(node,visit);
 }
 visit(tree);
 let result=text;
 for(const e of edits.sort((a,b)=>b.start-a.start))result=result.slice(0,e.start)+e.value+result.slice(e.end);
 return Buffer.from(result);
}
for(const [name,buffer] of sources){
 let updated=rewrite(name,buffer);
 if(/\.(?:md|txt|py|yml|yaml|sh|html)$/.test(name)||name==='AGENTS.md'){
  let text=updated.toString('utf8');
  for(const old of ['scripts/check_media.py','scripts/check_edit_content.py','scripts/generate_fixtures.py','scripts/verify_repository_preservation.py','scripts/audit_repository.py'])text=text.replaceAll(old,moves[old]);
  text=text.replaceAll('from scripts.check_media import','from scripts.media.check_media import').replaceAll('from scripts.check_edit_content import','from scripts.media.check_edit_content import').replaceAll('from scripts.generate_fixtures import','from scripts.media.generate_fixtures import');
  // Repair real Markdown file links to moved source paths without rewriting preserved snapshots.
  if(name.endsWith('.md'))text=text.replace(/\]\(([^)\s]+)\)/g,(match,target)=>{
   if(target.includes('://')||target.startsWith('#'))return match;
   const [pure,...anchor]=target.split('#');const old=path.posix.normalize(path.posix.join(path.posix.dirname(name),pure));
   if(!moves[old])return match;
   let rel=path.posix.relative(path.posix.dirname(moves[name]??name),moves[old]);
   return ']('+rel+(anchor.length?'#'+anchor.join('#'):'')+')';
  });
  updated=Buffer.from(text);
 }
 if(name==='scripts/audit_repository.py'||name==='scripts/verify_repository_preservation.py')updated=Buffer.from(updated.toString().replace('Path(__file__).resolve().parents[1]','Path(__file__).resolve().parents[2]'));
 if(name==='scripts/verify_repository_preservation.py')updated=Buffer.from(updated.toString().replace('f"AnalyseFuture/recovery-originals/{name}"','f"AnalyseFuture/recovery-originals/{name}", f"AnalyseFuture/historical-implementations/restructure/{name}"'));
 const differs=!updated.equals(buffer);if(differs){
  const backup=root+'/AnalyseFuture/historical-implementations/restructure/'+name;
  if(fs.existsSync(backup))throw new Error('Backup exists: '+name);
  fs.mkdirSync(path.dirname(backup),{recursive:true});fs.writeFileSync(backup,buffer);changed.push(name);
 }
 const dest=moves[name]??name;
 if(dest!==name){fs.mkdirSync(path.dirname(root+'/'+dest),{recursive:true});fs.renameSync(root+'/'+name,root+'/'+dest);}
 if(differs)fs.writeFileSync(root+'/'+dest,updated);
}
const crypto=require('node:crypto');
const manifestPath=root+'/AnalyseFuture/manifests/relocations.json';
const prior=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
for(const [old,dest] of Object.entries(moves)){
 prior.moves.push({from:old,to:dest,reason:dest.startsWith('AnalyseFuture/')?'Disconnected Studio prototype preserved outside active application':'Functional ownership grouping; framework and public package entrypoints retained',original_sha256:crypto.createHash('sha256').update(sources.get(old)).digest('hex'),preserved_original:changed.includes(old)?'AnalyseFuture/historical-implementations/restructure/'+old:dest});
}
fs.writeFileSync(manifestPath,JSON.stringify(prior,null,2)+'\n');
fs.mkdirSync(root+'/AnalyseFuture/migration-records',{recursive:true});
fs.writeFileSync(root+'/AnalyseFuture/migration-records/functional-moves.json',JSON.stringify({moves,rewritten_files:changed,module_reference_rewrites:references},null,2)+'\n');
console.log(JSON.stringify({moved:Object.keys(moves).length,rewritten:changed.length,moduleReferences:references.length}));
